import { Prisma } from '@prisma/client';
import { prisma } from '../db.service';

/**
 * Loyalty Points Integration Service
 *
 * Integrates with external loyalty platforms to award and redeem points.
 * Config stored in Integration model determines the external platform API details.
 *
 * Points are tracked locally via IntegrationLog and synced with the external platform.
 * Each point has a monetary value configured per business (e.g., 1 point = ₹0.50).
 */

interface LoyaltyConfig {
  provider: 'generic' | 'custom';
  apiBaseUrl: string;
  apiKey: string;
  merchantId: string;
  pointsPerRupee: number; // e.g., 1 = 1 point per ₹1 spent
  pointValue: number; // monetary value of 1 point in rupees, e.g., 0.5 = ₹0.50 per point
  minRedeemPoints: number; // minimum points required to redeem
  maxRedeemPercentage: number; // max % of order value that can be paid with points (e.g., 50 = 50%)
}

export interface LoyaltyResult {
  success: boolean;
  message: string;
  points?: number;
  balance?: number;
  transactionId?: string;
}

/**
 * Award loyalty points to a customer for a completed order.
 * Points = order total * pointsPerRupee (from config).
 */
export async function awardPoints(
  customerId: string,
  orderId: string,
  orderTotal: number,
  businessOwnerId: string
): Promise<LoyaltyResult> {
  const integration = await findIntegration(businessOwnerId);
  if (!integration) {
    return { success: false, message: 'Loyalty points integration is not configured or inactive' };
  }

  const config = integration.config as unknown as LoyaltyConfig;
  const pointsToAward = Math.floor(orderTotal * config.pointsPerRupee);

  if (pointsToAward <= 0) {
    return { success: false, message: 'Order total too low to award points' };
  }

  let result: LoyaltyResult;

  try {
    // Call external loyalty platform API
    const response = await fetch(`${config.apiBaseUrl}/points/award`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchantId: config.merchantId,
        customerId,
        orderId,
        points: pointsToAward,
        orderTotal,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      result = { success: false, message: `Loyalty API error (${response.status}): ${errorText}` };
    } else {
      const data = (await response.json()) as { transactionId: string; balance: number };
      result = {
        success: true,
        message: `Awarded ${pointsToAward} points for order`,
        points: pointsToAward,
        balance: data.balance,
        transactionId: data.transactionId,
      };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error awarding points';
    result = { success: false, message: msg };
  }

  await logAction(
    integration.id,
    'award_points',
    result.success ? 'success' : 'failure',
    { customerId, orderId, pointsToAward, orderTotal },
    result.transactionId ? { transactionId: result.transactionId, balance: result.balance } : null,
    result.success ? null : result.message
  );

  if (result.success) {
    await prisma.integration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() },
    });
  }

  return result;
}

/**
 * Redeem loyalty points for a customer to apply as a discount.
 * Returns the discount amount in rupees based on points redeemed.
 */
export async function redeemPoints(
  customerId: string,
  points: number,
  businessOwnerId: string
): Promise<LoyaltyResult> {
  const integration = await findIntegration(businessOwnerId);
  if (!integration) {
    return { success: false, message: 'Loyalty points integration is not configured or inactive' };
  }

  const config = integration.config as unknown as LoyaltyConfig;

  if (points < config.minRedeemPoints) {
    return {
      success: false,
      message: `Minimum ${config.minRedeemPoints} points required to redeem`,
    };
  }

  let result: LoyaltyResult;

  try {
    const response = await fetch(`${config.apiBaseUrl}/points/redeem`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchantId: config.merchantId,
        customerId,
        points,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      result = { success: false, message: `Loyalty API error (${response.status}): ${errorText}` };
    } else {
      const data = (await response.json()) as { transactionId: string; balance: number; redeemedValue: number };
      result = {
        success: true,
        message: `Redeemed ${points} points (₹${data.redeemedValue} discount)`,
        points,
        balance: data.balance,
        transactionId: data.transactionId,
      };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error redeeming points';
    result = { success: false, message: msg };
  }

  await logAction(
    integration.id,
    'redeem_points',
    result.success ? 'success' : 'failure',
    { customerId, points, pointValue: config.pointValue },
    result.transactionId ? { transactionId: result.transactionId, balance: result.balance } : null,
    result.success ? null : result.message
  );

  if (result.success) {
    await prisma.integration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() },
    });
  }

  return result;
}

/**
 * Fetch the current loyalty points balance for a customer from the external platform.
 */
export async function getCustomerBalance(
  customerId: string,
  businessOwnerId: string
): Promise<LoyaltyResult> {
  const integration = await findIntegration(businessOwnerId);
  if (!integration) {
    return { success: false, message: 'Loyalty points integration is not configured or inactive' };
  }

  const config = integration.config as unknown as LoyaltyConfig;

  let result: LoyaltyResult;

  try {
    const response = await fetch(
      `${config.apiBaseUrl}/points/balance?merchantId=${config.merchantId}&customerId=${customerId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      result = { success: false, message: `Loyalty API error (${response.status}): ${errorText}` };
    } else {
      const data = (await response.json()) as { balance: number };
      result = {
        success: true,
        message: `Customer balance: ${data.balance} points`,
        balance: data.balance,
      };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error fetching balance';
    result = { success: false, message: msg };
  }

  await logAction(
    integration.id,
    'get_balance',
    result.success ? 'success' : 'failure',
    { customerId },
    result.balance !== undefined ? { balance: result.balance } : null,
    result.success ? null : result.message
  );

  return result;
}

/**
 * Calculate how many points a customer can redeem for an order.
 * Enforces maxRedeemPercentage cap.
 */
export async function calculateRedeemablePoints(
  customerBalance: number,
  orderTotal: number,
  businessOwnerId: string
): Promise<{ maxPoints: number; maxDiscount: number; pointValue: number } | null> {
  const integration = await findIntegration(businessOwnerId);
  if (!integration) return null;

  const config = integration.config as unknown as LoyaltyConfig;

  const maxDiscountByPercentage = (orderTotal * config.maxRedeemPercentage) / 100;
  const maxDiscountByBalance = customerBalance * config.pointValue;
  const maxDiscount = Math.min(maxDiscountByPercentage, maxDiscountByBalance);
  const maxPoints = Math.floor(maxDiscount / config.pointValue);

  return {
    maxPoints,
    maxDiscount: Math.round(maxDiscount * 100) / 100,
    pointValue: config.pointValue,
  };
}

// ============================================
// Private Helper Functions
// ============================================

/**
 * Find the loyalty points integration for a business owner.
 */
async function findIntegration(businessOwnerId: string) {
  const integration = await prisma.integration.findUnique({
    where: {
      businessOwnerId_provider: {
        businessOwnerId,
        provider: 'loyalty_points',
      },
    },
  });

  if (!integration || integration.status !== 'active') {
    return null;
  }

  return integration;
}

/**
 * Log a loyalty points action to IntegrationLog.
 */
async function logAction(
  integrationId: string,
  action: string,
  status: string,
  requestData: unknown,
  responseData: unknown,
  errorMessage: string | null
): Promise<void> {
  await prisma.integrationLog.create({
    data: {
      integrationId,
      action,
      status,
      requestPayload: JSON.parse(JSON.stringify(requestData)),
      responsePayload: responseData
        ? JSON.parse(JSON.stringify(responseData))
        : Prisma.JsonNull,
      errorMessage,
    },
  });
}
