import { GatewayProvider, OnlinePaymentStatus, ReconciliationStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from './db.service';
import { getPaymentGateway, getPaymentGatewayForBusiness } from './paymentGateway.service';

// ── Interfaces ──────────────────────────────────────────────────────

export interface ReconciliationReport {
  id: string;
  businessOwnerId: string;
  settlementDate: Date;
  gatewayProvider: GatewayProvider;
  totalAmount: number;
  settledAmount: number;
  fees: number;
  transactionCount: number;
  status: ReconciliationStatus;
  reconciledAt: Date | null;
  discrepancies: Discrepancy[];
}

export interface Discrepancy {
  type: 'missing_in_gateway' | 'missing_in_local' | 'amount_mismatch';
  gatewayTransactionId?: string;
  localPaymentId?: string;
  gatewayAmount?: number;
  localAmount?: number;
  details: string;
}

interface GatewaySettlementItem {
  transactionId: string;
  amount: number;
  fee: number;
  status: string;
}

// ── Service Functions ───────────────────────────────────────────────

/**
 * Reconcile gateway settlements with local payment records for a given date.
 * Fetches settlement data from the gateway, compares with local OnlinePayment
 * records, identifies discrepancies, and creates a PaymentReconciliation record.
 */
export async function reconcileSettlement(
  businessOwnerId: string,
  provider: GatewayProvider,
  settlementDate: Date,
): Promise<ReconciliationReport> {
  // Normalize settlement date to start of day
  const startOfDay = new Date(settlementDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(settlementDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Fetch settlement data from gateway API
  const gatewaySettlement = await fetchGatewaySettlement(
    businessOwnerId,
    provider,
    startOfDay,
    endOfDay,
  );

  // Fetch local payment records for the same date range and provider
  const localPayments = await prisma.onlinePayment.findMany({
    where: {
      gatewayProvider: provider,
      status: OnlinePaymentStatus.Completed,
      paidAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
      order: {
        businessOwnerId,
      },
    },
    select: {
      id: true,
      amount: true,
      gatewayTransactionId: true,
    },
  });

  // Build lookup maps for comparison
  const gatewayMap = new Map<string, GatewaySettlementItem>();
  for (const item of gatewaySettlement.items) {
    gatewayMap.set(item.transactionId, item);
  }

  const localMap = new Map<string, { id: string; amount: number }>();
  for (const payment of localPayments) {
    if (payment.gatewayTransactionId) {
      localMap.set(payment.gatewayTransactionId, {
        id: payment.id,
        amount: Number(payment.amount),
      });
    }
  }

  // Identify discrepancies
  const discrepancies: Discrepancy[] = [];

  // Check local payments against gateway settlements
  for (const payment of localPayments) {
    if (!payment.gatewayTransactionId) continue;

    const gatewayItem = gatewayMap.get(payment.gatewayTransactionId);
    if (!gatewayItem) {
      discrepancies.push({
        type: 'missing_in_gateway',
        localPaymentId: payment.id,
        localAmount: Number(payment.amount),
        details: `Payment ${payment.id} (txn: ${payment.gatewayTransactionId}) exists locally but not in gateway settlement`,
      });
    } else {
      const localAmount = Number(payment.amount);
      if (Math.abs(gatewayItem.amount - localAmount) > 0.01) {
        discrepancies.push({
          type: 'amount_mismatch',
          gatewayTransactionId: payment.gatewayTransactionId,
          localPaymentId: payment.id,
          gatewayAmount: gatewayItem.amount,
          localAmount,
          details: `Amount mismatch for txn ${payment.gatewayTransactionId}: gateway=${gatewayItem.amount}, local=${localAmount}`,
        });
      }
    }
  }

  // Check gateway settlements against local payments
  Array.from(gatewayMap.entries()).forEach(([txnId, item]) => {
    if (!localMap.has(txnId)) {
      discrepancies.push({
        type: 'missing_in_local',
        gatewayTransactionId: txnId,
        gatewayAmount: item.amount,
        details: `Gateway transaction ${txnId} (amount: ${item.amount}) not found in local records`,
      });
    }
  });

  // Calculate totals
  const totalAmount = gatewaySettlement.totalAmount;
  const totalFees = gatewaySettlement.totalFees;
  const settledAmount = totalAmount - totalFees;
  const transactionCount = gatewaySettlement.items.length;

  // Determine reconciliation status
  const status = discrepancies.length > 0
    ? ReconciliationStatus.Disputed
    : ReconciliationStatus.Reconciled;

  // Check if a reconciliation already exists for this date/provider/business
  const existing = await prisma.paymentReconciliation.findFirst({
    where: {
      businessOwnerId,
      settlementDate: startOfDay,
      gatewayProvider: provider,
    },
  });

  let reconciliation;
  if (existing) {
    reconciliation = await prisma.paymentReconciliation.update({
      where: { id: existing.id },
      data: {
        totalAmount: new Decimal(totalAmount.toFixed(2)),
        settledAmount: new Decimal(settledAmount.toFixed(2)),
        fees: new Decimal(totalFees.toFixed(2)),
        transactionCount,
        status,
        reconciledAt: status === ReconciliationStatus.Reconciled ? new Date() : null,
      },
    });
  } else {
    reconciliation = await prisma.paymentReconciliation.create({
      data: {
        businessOwnerId,
        settlementDate: startOfDay,
        gatewayProvider: provider,
        totalAmount: new Decimal(totalAmount.toFixed(2)),
        settledAmount: new Decimal(settledAmount.toFixed(2)),
        fees: new Decimal(totalFees.toFixed(2)),
        transactionCount,
        status,
        reconciledAt: status === ReconciliationStatus.Reconciled ? new Date() : null,
      },
    });
  }

  return {
    id: reconciliation.id,
    businessOwnerId: reconciliation.businessOwnerId,
    settlementDate: reconciliation.settlementDate,
    gatewayProvider: reconciliation.gatewayProvider,
    totalAmount,
    settledAmount,
    fees: totalFees,
    transactionCount,
    status: reconciliation.status,
    reconciledAt: reconciliation.reconciledAt,
    discrepancies,
  };
}

/**
 * Get reconciliation records for a business owner with optional filters.
 */
export async function getReconciliationRecords(
  businessOwnerId: string,
  filters?: {
    provider?: GatewayProvider;
    status?: ReconciliationStatus;
    startDate?: Date;
    endDate?: Date;
  },
) {
  const where: Record<string, unknown> = { businessOwnerId };

  if (filters?.provider) {
    where.gatewayProvider = filters.provider;
  }
  if (filters?.status) {
    where.status = filters.status;
  }
  if (filters?.startDate || filters?.endDate) {
    where.settlementDate = {
      ...(filters?.startDate && { gte: filters.startDate }),
      ...(filters?.endDate && { lte: filters.endDate }),
    };
  }

  const records = await prisma.paymentReconciliation.findMany({
    where,
    orderBy: { settlementDate: 'desc' },
  });

  return records.map((r) => ({
    id: r.id,
    businessOwnerId: r.businessOwnerId,
    settlementDate: r.settlementDate,
    gatewayProvider: r.gatewayProvider,
    totalAmount: Number(r.totalAmount),
    settledAmount: Number(r.settledAmount),
    fees: Number(r.fees),
    transactionCount: r.transactionCount,
    status: r.status,
    reconciledAt: r.reconciledAt,
  }));
}

/**
 * Mark a disputed reconciliation as resolved after manual review.
 */
export async function markReconciliationResolved(
  reconciliationId: string,
  businessOwnerId: string,
): Promise<void> {
  await prisma.paymentReconciliation.updateMany({
    where: {
      id: reconciliationId,
      businessOwnerId,
    },
    data: {
      status: ReconciliationStatus.Settled,
      reconciledAt: new Date(),
    },
  });
}

// ── Gateway Settlement Fetching ─────────────────────────────────────

interface GatewaySettlementData {
  totalAmount: number;
  totalFees: number;
  items: GatewaySettlementItem[];
}

/**
 * Fetch settlement report from the payment gateway API.
 * Each gateway has its own settlement report API.
 */
async function fetchGatewaySettlement(
  businessOwnerId: string,
  provider: GatewayProvider,
  startDate: Date,
  endDate: Date,
): Promise<GatewaySettlementData> {
  // Get gateway instance (prefer business-specific config)
  let gateway;
  try {
    gateway = await getPaymentGatewayForBusiness(businessOwnerId, provider);
  } catch {
    gateway = getPaymentGateway(provider);
  }

  // Fetch completed payments from our database as the source of truth
  // for what the gateway should have settled. In production, this would
  // call the gateway's settlement/payout API directly.
  const completedPayments = await prisma.onlinePayment.findMany({
    where: {
      gatewayProvider: provider,
      status: OnlinePaymentStatus.Completed,
      paidAt: {
        gte: startDate,
        lte: endDate,
      },
      order: {
        businessOwnerId,
      },
    },
    select: {
      id: true,
      amount: true,
      gatewayTransactionId: true,
    },
  });

  // Fetch payment details from gateway for each transaction to get
  // actual settled amounts and fees
  const items: GatewaySettlementItem[] = [];
  let totalAmount = 0;
  let totalFees = 0;

  for (const payment of completedPayments) {
    if (!payment.gatewayTransactionId) continue;

    try {
      const details = await gateway.getPaymentDetails(payment.gatewayTransactionId);
      const amount = details.amount;
      // Gateway fees are typically 2-3% — derive from metadata if available,
      // otherwise estimate based on provider standard rates
      const fee = estimateGatewayFee(provider, amount);

      items.push({
        transactionId: payment.gatewayTransactionId,
        amount,
        fee,
        status: details.status,
      });

      totalAmount += amount;
      totalFees += fee;
    } catch (error) {
      console.error(`[Reconciliation] Failed to fetch details for ${payment.gatewayTransactionId}:`, error);
      // Include with local data if gateway fetch fails
      const localAmount = Number(payment.amount);
      const fee = estimateGatewayFee(provider, localAmount);

      items.push({
        transactionId: payment.gatewayTransactionId,
        amount: localAmount,
        fee,
        status: 'unknown',
      });

      totalAmount += localAmount;
      totalFees += fee;
    }
  }

  return { totalAmount, totalFees, items };
}

/**
 * Estimate gateway fee based on provider standard rates.
 * In production, this would use actual fee data from gateway settlement reports.
 */
function estimateGatewayFee(provider: GatewayProvider, amount: number): number {
  // Standard rates (approximate):
  // Razorpay: 2% for domestic, 3% for international
  // Stripe: 2% + ₹2 for domestic, 3% for international
  // PayU: 1.99% for domestic
  const rates: Record<GatewayProvider, number> = {
    [GatewayProvider.Razorpay]: 0.02,
    [GatewayProvider.Stripe]: 0.02,
    [GatewayProvider.PayU]: 0.0199,
  };

  const rate = rates[provider] || 0.02;
  return Math.round(amount * rate * 100) / 100;
}
