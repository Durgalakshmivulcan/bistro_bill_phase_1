import { prisma } from './db.service';

// ============================================
// Type Definitions
// ============================================

export interface DailyForecast {
  date: string;
  dayOfWeek: string;
  predictedRevenue: number;
  predictedOrders: number;
  lowEstimate: number;
  highEstimate: number;
}

export interface ForecastResult {
  forecasts: DailyForecast[];
  accuracy: number;
  lastMonthComparison: {
    currentPeriodRevenue: number;
    lastMonthRevenue: number;
    changePercent: number;
  };
  modelInfo: {
    dataPointsUsed: number;
    method: string;
  };
}

interface DailySalesData {
  date: Date;
  dayOfWeek: number;
  revenue: number;
  orderCount: number;
}

// ============================================
// Linear Regression Helpers
// ============================================

function linearRegression(xs: number[], ys: number[]): { slope: number; intercept: number; rSquared: number } {
  const n = xs.length;
  if (n === 0) return { slope: 0, intercept: 0, rSquared: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += xs[i];
    sumY += ys[i];
    sumXY += xs[i] * ys[i];
    sumX2 += xs[i] * xs[i];
    sumY2 += ys[i] * ys[i];
  }

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n, rSquared: 0 };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  // R-squared calculation
  const yMean = sumY / n;
  let ssRes = 0, ssTot = 0;
  for (let i = 0; i < n; i++) {
    const predicted = slope * xs[i] + intercept;
    ssRes += (ys[i] - predicted) ** 2;
    ssTot += (ys[i] - yMean) ** 2;
  }
  const rSquared = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

  return { slope, intercept, rSquared };
}

function calculateStdDev(values: number[], mean: number): number {
  if (values.length === 0) return 0;
  const squaredDiffs = values.map(v => (v - mean) ** 2);
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ============================================
// Main Forecasting Function
// ============================================

export async function forecastSales(
  businessOwnerId: string,
  branchId: string,
  days: number = 7
): Promise<ForecastResult> {
  // Fetch last 90 days of order data
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90);

  const orders = await prisma.order.findMany({
    where: {
      businessOwnerId,
      branchId,
      orderStatus: { in: ['Completed', 'Served'] },
      createdAt: { gte: startDate, lte: endDate },
    },
    select: {
      total: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Aggregate orders by day
  const dailyMap = new Map<string, DailySalesData>();
  for (const order of orders) {
    const dateKey = order.createdAt.toISOString().split('T')[0];
    const existing = dailyMap.get(dateKey);
    const revenue = parseFloat(order.total.toString());
    if (existing) {
      existing.revenue += revenue;
      existing.orderCount += 1;
    } else {
      dailyMap.set(dateKey, {
        date: new Date(dateKey),
        dayOfWeek: new Date(dateKey).getDay(),
        revenue,
        orderCount: 1,
      });
    }
  }

  const dailyData = Array.from(dailyMap.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  const dataPointsUsed = dailyData.length;

  // Calculate day-of-week averages for pattern adjustment
  const dayOfWeekRevenue: number[][] = [[], [], [], [], [], [], []];
  const dayOfWeekOrders: number[][] = [[], [], [], [], [], [], []];
  for (const d of dailyData) {
    dayOfWeekRevenue[d.dayOfWeek].push(d.revenue);
    dayOfWeekOrders[d.dayOfWeek].push(d.orderCount);
  }

  const overallAvgRevenue = dailyData.length > 0
    ? dailyData.reduce((s, d) => s + d.revenue, 0) / dailyData.length
    : 0;
  const overallAvgOrders = dailyData.length > 0
    ? dailyData.reduce((s, d) => s + d.orderCount, 0) / dailyData.length
    : 0;

  // Day-of-week multipliers (weekend vs weekday adjustment)
  const dayMultiplierRevenue = dayOfWeekRevenue.map(dayValues => {
    if (dayValues.length === 0 || overallAvgRevenue === 0) return 1;
    const dayAvg = dayValues.reduce((a, b) => a + b, 0) / dayValues.length;
    return dayAvg / overallAvgRevenue;
  });

  const dayMultiplierOrders = dayOfWeekOrders.map(dayValues => {
    if (dayValues.length === 0 || overallAvgOrders === 0) return 1;
    const dayAvg = dayValues.reduce((a, b) => a + b, 0) / dayValues.length;
    return dayAvg / overallAvgOrders;
  });

  // Linear regression on daily revenue and order counts
  const xs = dailyData.map((_, i) => i);
  const revenueYs = dailyData.map(d => d.revenue);
  const orderYs = dailyData.map(d => d.orderCount);

  const revReg = linearRegression(xs, revenueYs);
  const ordReg = linearRegression(xs, orderYs);

  // Calculate standard deviation of residuals for confidence intervals
  const revenueResiduals = dailyData.map((d, i) => d.revenue - (revReg.slope * i + revReg.intercept));
  const revStdDev = calculateStdDev(revenueResiduals, 0);

  // Generate forecasts for next N days
  const forecasts: DailyForecast[] = [];
  const baseX = dailyData.length;

  for (let i = 0; i < days; i++) {
    const forecastDate = new Date();
    forecastDate.setDate(forecastDate.getDate() + i + 1);
    const dayOfWeek = forecastDate.getDay();

    // Base prediction from linear regression
    const baseRevenue = revReg.slope * (baseX + i) + revReg.intercept;
    const baseOrders = ordReg.slope * (baseX + i) + ordReg.intercept;

    // Adjust for day-of-week pattern
    const predictedRevenue = Math.max(0, Math.round(baseRevenue * dayMultiplierRevenue[dayOfWeek] * 100) / 100);
    const predictedOrders = Math.max(0, Math.round(baseOrders * dayMultiplierOrders[dayOfWeek]));

    // Confidence interval (±1.5 standard deviations)
    const margin = revStdDev * 1.5 * dayMultiplierRevenue[dayOfWeek];
    const lowEstimate = Math.max(0, Math.round((predictedRevenue - margin) * 100) / 100);
    const highEstimate = Math.round((predictedRevenue + margin) * 100) / 100;

    forecasts.push({
      date: forecastDate.toISOString().split('T')[0],
      dayOfWeek: DAY_NAMES[dayOfWeek],
      predictedRevenue,
      predictedOrders,
      lowEstimate,
      highEstimate,
    });
  }

  // Calculate accuracy by comparing last 7 days actual vs what model would have predicted
  let accuracy = 0;
  if (dailyData.length >= 14) {
    const testDays = dailyData.slice(-7);
    const trainLength = dailyData.length - 7;
    const trainXs = dailyData.slice(0, trainLength).map((_, i) => i);
    const trainYs = dailyData.slice(0, trainLength).map(d => d.revenue);
    const trainReg = linearRegression(trainXs, trainYs);

    let totalError = 0;
    let totalActual = 0;
    for (let i = 0; i < testDays.length; i++) {
      const predicted = Math.max(0, trainReg.slope * (trainLength + i) + trainReg.intercept);
      const actual = testDays[i].revenue;
      totalError += Math.abs(predicted - actual);
      totalActual += actual;
    }
    accuracy = totalActual > 0 ? Math.round((1 - totalError / totalActual) * 100) : 0;
    accuracy = Math.max(0, Math.min(100, accuracy));
  }

  // Last month comparison
  const today = new Date();
  const lastMonthStart = new Date(today);
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
  lastMonthStart.setDate(lastMonthStart.getDate() - days);
  const lastMonthEnd = new Date(today);
  lastMonthEnd.setMonth(lastMonthEnd.getMonth() - 1);

  const currentPeriodRevenue = forecasts.reduce((s, f) => s + f.predictedRevenue, 0);

  const lastMonthOrders = await prisma.order.aggregate({
    where: {
      businessOwnerId,
      branchId,
      orderStatus: { in: ['Completed', 'Served'] },
      createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
    },
    _sum: { total: true },
  });

  const lastMonthRevenue = lastMonthOrders._sum?.total
    ? parseFloat(lastMonthOrders._sum.total.toString())
    : 0;

  const changePercent = lastMonthRevenue > 0
    ? Math.round(((currentPeriodRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
    : 0;

  return {
    forecasts,
    accuracy,
    lastMonthComparison: {
      currentPeriodRevenue: Math.round(currentPeriodRevenue * 100) / 100,
      lastMonthRevenue: Math.round(lastMonthRevenue * 100) / 100,
      changePercent,
    },
    modelInfo: {
      dataPointsUsed,
      method: 'Linear Regression with Day-of-Week Adjustment',
    },
  };
}
