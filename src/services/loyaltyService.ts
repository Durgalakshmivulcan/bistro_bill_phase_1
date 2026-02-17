import { api } from './api';

/**
 * Loyalty Points Service
 * API functions for managing customer loyalty points integration
 */

export interface LoyaltyBalance {
  customerId: string;
  balance: number;
  pointValue: number; // monetary value of 1 point in rupees
  minRedeemPoints: number;
  maxRedeemPercentage: number;
}

export interface LoyaltyRedeemResult {
  success: boolean;
  message: string;
  pointsRedeemed: number;
  discountAmount: number;
  remainingBalance: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

/**
 * Fetch loyalty points balance for a customer
 */
export async function getLoyaltyBalance(
  customerId: string
): Promise<ApiResponse<LoyaltyBalance>> {
  try {
    const response = await api.get<any>(`/loyalty/balance/${customerId}`);
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'FETCH_BALANCE_FAILED',
        message: error?.response?.data?.message || error?.message || 'Failed to fetch loyalty balance',
      },
    };
  }
}

/**
 * Redeem loyalty points for a discount on an order
 */
export async function redeemLoyaltyPoints(
  customerId: string,
  points: number,
  orderId: string
): Promise<ApiResponse<LoyaltyRedeemResult>> {
  try {
    const response = await api.post<any>('/loyalty/redeem', { customerId, points, orderId });
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'REDEEM_FAILED',
        message: error?.response?.data?.message || error?.message || 'Failed to redeem loyalty points',
      },
    };
  }
}

/**
 * Award loyalty points to a customer after order completion
 */
export async function awardLoyaltyPoints(
  customerId: string,
  orderId: string,
  orderTotal: number
): Promise<ApiResponse<{ pointsAwarded: number; newBalance: number }>> {
  try {
    const response = await api.post<any>('/loyalty/award', { customerId, orderId, orderTotal });
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'AWARD_FAILED',
        message: error?.response?.data?.message || error?.message || 'Failed to award loyalty points',
      },
    };
  }
}
