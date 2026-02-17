import { api } from './api';
import { ApiResponse } from '../types/api';

/**
 * Dashboard Service
 *
 * Provides API functions for dashboard data including:
 * - Revenue Summary (total revenue, discounts, charges, etc.)
 * - Revenue by Order Type (takeaway, dine-in, delivery, etc.)
 * - Top Products Rankings
 * - Top Brands Rankings
 * - Branch Performance
 * - Revenue by Payment Method
 * - Average Order Values
 *
 * All endpoints are under /dashboard base path
 */

// ============================================
// Type Definitions
// ============================================

/**
 * Revenue Summary Response
 * Contains all revenue-related KPIs for the dashboard
 */
export interface RevenueSummaryResponse {
  totalRevenue: number;
  discountAmount: number;
  chargesCollected: number;
  nonChargeableRevenue: number;
  cancelledRevenue: number;
}

/**
 * Revenue by Order Type Response
 * Contains revenue breakdown by different order types
 */
export interface RevenueByTypeResponse {
  takeAwayRevenue: number;
  dineInRevenue: number;
  deliveryRevenue: number;
  subscriptionRevenue: number;
  cateringRevenue: number;
}

/**
 * Top Product
 * Represents a single product in the top products ranking
 */
export interface TopProduct {
  productId: string;
  productName: string;
  salesCount: number;
  revenue: number;
}

/**
 * Top Brand
 * Represents a single brand in the top brands ranking
 */
export interface TopBrand {
  brandId: string;
  brandName: string;
  productCount: number;
  revenue: number;
}

/**
 * Branch Performance
 * Represents a single branch's performance metrics
 */
export interface BranchPerformance {
  branchId: string;
  branchName: string;
  orderCount: number;
  revenue: number;
}

/**
 * Payment Method Revenue
 * Represents revenue breakdown by payment method
 */
export interface PaymentMethodRevenue {
  paymentMethod: string;
  revenue: number;
  percentage: number;
}

/**
 * Average Values Response
 * Contains average order values for different order types and categories
 */
export interface AverageValuesResponse {
  avgOnline: number;
  avgOffline: number;
  avgDelivery: number;
  avgDiscount: number;
  avgTax: number;
}

// ============================================
// Dashboard API Functions
// ============================================

/**
 * Get revenue summary for the dashboard
 * @param startDate - Start date for the report (ISO format: YYYY-MM-DD)
 * @param endDate - End date for the report (ISO format: YYYY-MM-DD)
 * @param branchId - Optional branch ID to filter by specific branch
 * @returns Revenue summary data with all revenue metrics
 */
export const getRevenueSummary = async (
  startDate?: string,
  endDate?: string,
  branchId?: string
): Promise<ApiResponse<RevenueSummaryResponse>> => {
  const params: any = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  if (branchId) params.branchId = branchId;

  return api.get<ApiResponse<RevenueSummaryResponse>>('/dashboard/revenue-summary', { params });
};

/**
 * Get revenue breakdown by order type
 * @param startDate - Start date for the report (ISO format: YYYY-MM-DD)
 * @param endDate - End date for the report (ISO format: YYYY-MM-DD)
 * @param branchId - Optional branch ID to filter by specific branch
 * @returns Revenue breakdown by order type (takeaway, dine-in, delivery, etc.)
 */
export const getRevenueByType = async (
  startDate?: string,
  endDate?: string,
  branchId?: string
): Promise<ApiResponse<RevenueByTypeResponse>> => {
  const params: any = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  if (branchId) params.branchId = branchId;

  return api.get<ApiResponse<RevenueByTypeResponse>>('/dashboard/revenue-by-type', { params });
};

/**
 * Get top-selling products by revenue
 * @param startDate - Start date for the report (ISO format: YYYY-MM-DD)
 * @param endDate - End date for the report (ISO format: YYYY-MM-DD)
 * @param branchId - Optional branch ID to filter by specific branch
 * @param limit - Optional limit for number of results (default 5)
 * @returns List of top products with sales count and revenue
 */
export const getTopProducts = async (
  startDate?: string,
  endDate?: string,
  branchId?: string,
  limit?: number
): Promise<ApiResponse<TopProduct[]>> => {
  const params: any = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  if (branchId) params.branchId = branchId;
  if (limit) params.limit = limit;

  return api.get<ApiResponse<TopProduct[]>>('/dashboard/top-products', { params });
};

/**
 * Get top-performing brands by revenue
 * @param startDate - Start date for the report (ISO format: YYYY-MM-DD)
 * @param endDate - End date for the report (ISO format: YYYY-MM-DD)
 * @param branchId - Optional branch ID to filter by specific branch
 * @param limit - Optional limit for number of results (default 5)
 * @returns List of top brands with product count and revenue
 */
export const getTopBrands = async (
  startDate?: string,
  endDate?: string,
  branchId?: string,
  limit?: number
): Promise<ApiResponse<TopBrand[]>> => {
  const params: any = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  if (branchId) params.branchId = branchId;
  if (limit) params.limit = limit;

  return api.get<ApiResponse<TopBrand[]>>('/dashboard/top-brands', { params });
};

/**
 * Get branch performance rankings by revenue
 * @param startDate - Start date for the report (ISO format: YYYY-MM-DD)
 * @param endDate - End date for the report (ISO format: YYYY-MM-DD)
 * @param limit - Optional limit for number of results (default 5)
 * @returns List of branches with order count and revenue
 */
export const getBranchPerformance = async (
  startDate?: string,
  endDate?: string,
  limit?: number
): Promise<ApiResponse<BranchPerformance[]>> => {
  const params: any = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  if (limit) params.limit = limit;

  return api.get<ApiResponse<BranchPerformance[]>>('/dashboard/branch-performance', { params });
};

/**
 * Get revenue breakdown by payment method
 * @param startDate - Start date for the report (ISO format: YYYY-MM-DD)
 * @param endDate - End date for the report (ISO format: YYYY-MM-DD)
 * @param branchId - Optional branch ID to filter by specific branch
 * @returns List of payment methods with revenue and percentage
 */
export const getRevenueByPayment = async (
  startDate?: string,
  endDate?: string,
  branchId?: string
): Promise<ApiResponse<PaymentMethodRevenue[]>> => {
  const params: any = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  if (branchId) params.branchId = branchId;

  return api.get<ApiResponse<PaymentMethodRevenue[]>>('/dashboard/revenue-by-payment', { params });
};

/**
 * Get average order values for different categories
 * @param startDate - Start date for the report (ISO format: YYYY-MM-DD)
 * @param endDate - End date for the report (ISO format: YYYY-MM-DD)
 * @param branchId - Optional branch ID to filter by specific branch
 * @returns Average values for online/offline orders, delivery, discount, and tax
 */
export const getAverageValues = async (
  startDate?: string,
  endDate?: string,
  branchId?: string
): Promise<ApiResponse<AverageValuesResponse>> => {
  const params: any = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  if (branchId) params.branchId = branchId;

  return api.get<ApiResponse<AverageValuesResponse>>('/dashboard/average-values', { params });
};
