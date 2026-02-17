import { prisma } from './db.service';

// ============================================
// Type Definitions
// ============================================

export type AnomalyType = 'high' | 'low';

export interface SalesAnomaly {
  id: string;
  date: string;
  type: AnomalyType;
  actualValue: number;
  expectedValue: number;
  deviation: number; // percentage deviation from mean
  standardDeviations: number; // how many SDs from mean
  resolved: boolean;
  resolvedAt: string | null;
}

export interface AnomalyDetectionResult {
  anomalies: SalesAnomaly[];
  summary: {
    totalAnomalies: number;
    highAnomalies: number;
    lowAnomalies: number;
    resolvedCount: number;
    unresolvedCount: number;
  };
  stats: {
    dailyAverage: number;
    standardDeviation: number;
    analysisWindowDays: number;
    dataPointsUsed: number;
  };
  modelInfo: {
    method: string;
    threshold: number; // standard deviations threshold
  };
}

// ============================================
// Helper Functions
// ============================================

function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function calculateStdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const squaredDiffs = values.map(v => (v - mean) ** 2);
  const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

// ============================================
// Main Anomaly Detection Function
// ============================================

export async function detectSalesAnomalies(
  businessOwnerId: string,
  branchId?: string,
  days: number = 30
): Promise<AnomalyDetectionResult> {
  // Fetch 90 days of historical data for calculating baseline statistics
  const analysisWindow = 90;
  const end = new Date();
  const analysisStart = new Date(end.getTime() - analysisWindow * 24 * 60 * 60 * 1000);

  const where: any = {
    businessOwnerId,
    orderStatus: { in: ['Completed', 'Served'] },
    createdAt: { gte: analysisStart, lte: end },
  };
  if (branchId) {
    where.branchId = branchId;
  }

  const orders = await prisma.order.findMany({
    where,
    select: {
      total: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Aggregate daily sales
  const dailySales: Map<string, number> = new Map();
  for (const order of orders) {
    const dateKey = order.createdAt.toISOString().split('T')[0];
    const revenue = parseFloat(order.total.toString());
    dailySales.set(dateKey, (dailySales.get(dateKey) || 0) + revenue);
  }

  // Fill in zero-sales days in the analysis window
  const allDays: string[] = [];
  const current = new Date(analysisStart);
  while (current <= end) {
    const key = current.toISOString().split('T')[0];
    allDays.push(key);
    if (!dailySales.has(key)) {
      dailySales.set(key, 0);
    }
    current.setDate(current.getDate() + 1);
  }

  const salesValues = allDays.map(day => dailySales.get(day) || 0);

  // Calculate statistics
  const mean = calculateMean(salesValues);
  const stdDev = calculateStdDev(salesValues, mean);

  // Detect anomalies in the requested window (last N days)
  const anomalyWindowStart = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  const threshold = 2; // 2 standard deviations

  const anomalies: SalesAnomaly[] = [];
  const recentDays = allDays.filter(day => new Date(day) >= anomalyWindowStart);

  for (const day of recentDays) {
    const value = dailySales.get(day) || 0;

    // Skip if stdDev is 0 (all days have same sales - no anomaly possible)
    if (stdDev === 0) continue;

    const deviationFromMean = (value - mean) / stdDev;

    if (Math.abs(deviationFromMean) > threshold) {
      const anomalyType: AnomalyType = value > mean ? 'high' : 'low';
      const percentDeviation = mean !== 0
        ? Math.round(((value - mean) / mean) * 100 * 100) / 100
        : 0;

      // Upsert anomaly record
      const record = await prisma.salesAnomaly.upsert({
        where: {
          businessOwnerId_branchId_date: {
            businessOwnerId,
            branchId: branchId || '',
            date: new Date(day),
          },
        },
        create: {
          businessOwnerId,
          branchId: branchId || '',
          date: new Date(day),
          type: anomalyType,
          actualValue: Math.round(value * 100) / 100,
          expectedValue: Math.round(mean * 100) / 100,
          deviation: percentDeviation,
          standardDeviations: Math.round(Math.abs(deviationFromMean) * 100) / 100,
          resolved: false,
        },
        update: {
          type: anomalyType,
          actualValue: Math.round(value * 100) / 100,
          expectedValue: Math.round(mean * 100) / 100,
          deviation: percentDeviation,
          standardDeviations: Math.round(Math.abs(deviationFromMean) * 100) / 100,
        },
      });

      anomalies.push({
        id: record.id,
        date: day,
        type: anomalyType,
        actualValue: Math.round(value * 100) / 100,
        expectedValue: Math.round(mean * 100) / 100,
        deviation: percentDeviation,
        standardDeviations: Math.round(Math.abs(deviationFromMean) * 100) / 100,
        resolved: record.resolved,
        resolvedAt: record.resolvedAt ? record.resolvedAt.toISOString() : null,
      });
    }
  }

  // Sort by date descending (most recent first)
  anomalies.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const resolvedCount = anomalies.filter(a => a.resolved).length;

  return {
    anomalies,
    summary: {
      totalAnomalies: anomalies.length,
      highAnomalies: anomalies.filter(a => a.type === 'high').length,
      lowAnomalies: anomalies.filter(a => a.type === 'low').length,
      resolvedCount,
      unresolvedCount: anomalies.length - resolvedCount,
    },
    stats: {
      dailyAverage: Math.round(mean * 100) / 100,
      standardDeviation: Math.round(stdDev * 100) / 100,
      analysisWindowDays: analysisWindow,
      dataPointsUsed: salesValues.length,
    },
    modelInfo: {
      method: 'Statistical Anomaly Detection (Mean ± 2σ)',
      threshold,
    },
  };
}

// ============================================
// Resolve Anomaly
// ============================================

export async function resolveAnomaly(
  anomalyId: string,
  businessOwnerId: string
): Promise<SalesAnomaly | null> {
  const anomaly = await prisma.salesAnomaly.findFirst({
    where: { id: anomalyId, businessOwnerId },
  });

  if (!anomaly) return null;

  const updated = await prisma.salesAnomaly.update({
    where: { id: anomalyId },
    data: { resolved: true, resolvedAt: new Date() },
  });

  return {
    id: updated.id,
    date: updated.date.toISOString().split('T')[0],
    type: updated.type as AnomalyType,
    actualValue: parseFloat(updated.actualValue.toString()),
    expectedValue: parseFloat(updated.expectedValue.toString()),
    deviation: parseFloat(updated.deviation.toString()),
    standardDeviations: parseFloat(updated.standardDeviations.toString()),
    resolved: updated.resolved,
    resolvedAt: updated.resolvedAt ? updated.resolvedAt.toISOString() : null,
  };
}
