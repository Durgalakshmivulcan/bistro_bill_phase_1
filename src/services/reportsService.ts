import { api } from './api';
import { ApiResponse, PaginatedResponse } from '../types/api';

/**
 * Reports Service
 *
 * Provides API functions for analytics and reports including:
 * - Sales Reports (summary, by period, by type, by payment method)
 * - Product Reports (top products, product sales)
 * - Customer Reports
 * - Staff Performance Reports
 * - Inventory Reports
 * - GST Reports (B2B, B2C, HSN)
 * - Discount Usage Reports
 * - Audit Logs
 * - Report Export (CSV, PDF)
 *
 * All endpoints are under /reports base path
 */

// ============================================
// Type Definitions
// ============================================

// Sales Reports
export interface SalesSummary {
  currentPeriod: {
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
    totalDiscounts: number;
    totalTax: number;
  };
  previousPeriod: {
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
  };
  comparison: {
    ordersChange: number;
    revenueChange: number;
    avgOrderValueChange: number;
  };
}

export interface SalesByPeriodBreakdown {
  period: string;
  orderCount: number;
  revenue: number;
}

export interface SalesByPeriod {
  groupBy: 'day' | 'week' | 'month';
  breakdown: SalesByPeriodBreakdown[];
}

export interface SalesByTypeBreakdown {
  type: string;
  orderCount: number;
  revenue: number;
  percentage: number;
}

export interface SalesByType {
  breakdown: SalesByTypeBreakdown[];
  total: {
    orderCount: number;
    revenue: number;
  };
}

export interface SalesByPaymentBreakdown {
  method: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface SalesByPayment {
  breakdown: SalesByPaymentBreakdown[];
  total: {
    count: number;
    amount: number;
  };
}

// Product Reports
export interface TopProduct {
  ranking: number;
  product: {
    id: string;
    name: string;
    sku: string | null;
    categoryName: string | null;
    imageUrl: string | null;
  };
  quantitySold: number;
  revenue: number;
}

export interface TopProducts {
  topProducts: TopProduct[];
  total: number;
}

export interface ProductSale {
  product: {
    id: string;
    name: string;
    sku: string | null;
    categoryName: string | null;
    imageUrl: string | null;
  };
  quantitySold: number;
  revenue: number;
  avgPrice: number;
}

// Customer Reports
export interface TopCustomer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  type: string;
  totalSpent: number;
  orderCount: number;
}

export interface CustomerReport {
  newCustomers: number;
  returningCustomers: number;
  topCustomers: TopCustomer[];
  avgOrdersPerCustomer: number;
  avgSpendPerCustomer: number;
  totalCustomersWithOrders: number;
}

// Staff Reports
export interface StaffPerformance {
  staff: {
    id: string;
    name: string;
    email: string;
    branch: string;
    role: string;
  };
  ordersProcessed: number;
  totalSales: number;
  avgOrderValue: number;
}

const mapAnalyticsLeaderboardToStaffPerformance = (
  data: StaffPerformanceAnalyticsResponse
): StaffPerformance[] =>
  data.leaderboard.map((entry) => ({
    staff: {
      id: entry.staffId,
      name: entry.name,
      email: entry.email,
      branch: entry.branch,
      role: entry.role,
    },
    ordersProcessed: entry.ordersProcessed,
    totalSales: entry.totalRevenue,
    avgOrderValue: entry.avgOrderValue,
  }));

// Enhanced Staff Performance Analytics
export interface StaffMetrics {
  staffId: string;
  name: string;
  email: string;
  branch: string;
  role: string;
  ordersProcessed: number;
  totalRevenue: number;
  avgOrderValue: number;
  customerRating: number;
  avgCompletionTimeMinutes: number;
  ordersPerHour: number;
  efficiencyScore: number;
  compositeScore: number;
  trend: {
    ordersChange: number;
    revenueChange: number;
    avgOrderValueChange: number;
    ratingChange: number;
    efficiencyChange: number;
  };
}

export interface StaffPerformanceAnalyticsResponse {
  leaderboard: StaffMetrics[];
  summary: {
    totalStaff: number;
    totalOrders: number;
    totalRevenue: number;
    avgOrdersPerStaff: number;
    avgRevenuePerStaff: number;
    topPerformer: string | null;
  };
  modelInfo: {
    dataPointsUsed: number;
    method: string;
    periodDays: number;
  };
}

// Inventory Reports
export interface InventorySupplierBreakdown {
  supplierId: string;
  supplierName: string;
  itemCount: number;
  totalValue: number;
}

export interface InventoryMovement {
  id: string;
  inventoryProductId: string;
  inventoryProductName: string;
  oldStock: number;
  newStock: number;
  change: number;
  changeType: 'increase' | 'decrease';
  timestamp: string;
}

export interface InventoryReport {
  totalItems: number;
  lowStockCount: number;
  totalValue: number;
  itemsBySupplier: InventorySupplierBreakdown[];
  recentMovements: InventoryMovement[];
}

// GST Reports
export interface GstB2bTransaction {
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  customerGSTIN: string;
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
}

export interface GstB2bReport {
  period: {
    month: number;
    year: number;
  };
  summary: {
    totalTransactions: number;
    totalTaxableAmount: number;
    totalTaxAmount: number;
    totalAmount: number;
  };
  transactions: GstB2bTransaction[];
}

export interface GstB2cStateWise {
  state: string;
  orderCount: number;
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
}

export interface GstB2cReport {
  period: {
    month: number;
    year: number;
  };
  summary: {
    totalOrders: number;
    totalTaxableAmount: number;
    totalTaxAmount: number;
    totalAmount: number;
  };
  stateWiseSummary: GstB2cStateWise[];
}

export interface GstHsnSummaryItem {
  hsnCode: string;
  description: string;
  quantity: number;
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
}

export interface GstHsnReport {
  period: {
    month: number;
    year: number;
  };
  summary: {
    totalQuantity: number;
    totalTaxableAmount: number;
    totalTaxAmount: number;
    totalAmount: number;
  };
  hsnSummary: GstHsnSummaryItem[];
}

// Discount Reports
export interface DiscountAnalytics {
  id: string;
  code: string;
  name: string;
  type: string;
  valueType: string;
  value: number;
  status: string;
  usageCount: number;
  totalDiscountGiven: number;
  ordersAffected: number;
  usageLimit: number | null;
  remainingUses: number | null;
}

export interface DiscountUsageReport {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalDiscounts: number;
    activeDiscounts: number;
    totalUsageCount: number;
    totalDiscountGiven: number;
    totalOrdersAffected: number;
  };
  discounts: DiscountAnalytics[];
}

// Audit Logs
export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userType: string;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValue: any;
  newValue: any;
  ipAddress: string | null;
  timestamp: string;
}

// Export Reports
export interface ReportExportInput {
  reportType: 'sales' | 'products' | 'customers' | 'gst' | 'location-comparison';
  format: 'csv' | 'pdf' | 'excel';
  filters?: {
    startDate?: string;
    endDate?: string;
    branchId?: string;
    categoryId?: string;
    month?: string;
    year?: string;
    gstType?: 'b2b' | 'b2c';
  };
}

export interface ReportExportResult {
  downloadUrl: string;
  filename: string;
  format: string;
  reportType: string;
  recordCount: number;
}

// ============================================
// Sales Reports API Functions
// ============================================

/**
 * Get sales summary report with comparison to previous period
 */
export const getSalesSummary = async (
  startDate: string,
  endDate: string,
  branchId?: string
): Promise<ApiResponse<SalesSummary>> => {
  const params: any = { startDate, endDate };
  if (branchId) params.branchId = branchId;
  return api.get<ApiResponse<SalesSummary>>('/reports/sales/summary', { params });
};

/**
 * Get sales breakdown by time period (day/week/month)
 */
export const getSalesByTimePeriod = async (
  startDate: string,
  endDate: string,
  groupBy: 'day' | 'week' | 'month' = 'day',
  branchId?: string
): Promise<ApiResponse<SalesByPeriod>> => {
  const params: any = { startDate, endDate, groupBy };
  if (branchId) params.branchId = branchId;
  return api.get<ApiResponse<SalesByPeriod>>('/reports/sales/by-period', { params });
};

/**
 * Get sales breakdown by order type
 */
export const getSalesByOrderType = async (
  startDate: string,
  endDate: string,
  branchId?: string
): Promise<ApiResponse<SalesByType>> => {
  const params: any = { startDate, endDate };
  if (branchId) params.branchId = branchId;
  return api.get<ApiResponse<SalesByType>>('/reports/sales/by-type', { params });
};

/**
 * Get sales breakdown by payment method
 */
export const getSalesByPaymentMethod = async (
  startDate: string,
  endDate: string,
  branchId?: string
): Promise<ApiResponse<SalesByPayment>> => {
  const params: any = { startDate, endDate };
  if (branchId) params.branchId = branchId;
  return api.get<ApiResponse<SalesByPayment>>('/reports/sales/by-payment', { params });
};

// ============================================
// Product Reports API Functions
// ============================================

/**
 * Get top selling products report
 */
export const getTopProducts = async (
  startDate: string,
  endDate: string,
  limit: number = 10,
  branchId?: string
): Promise<ApiResponse<TopProducts>> => {
  const params: any = { startDate, endDate, limit };
  if (branchId) params.branchId = branchId;
  return api.get<ApiResponse<TopProducts>>('/reports/products/top', { params });
};

/**
 * Get least selling products report
 */
export const getLeastProducts = async (
  startDate: string,
  endDate: string,
  limit: number = 10,
  branchId?: string
): Promise<ApiResponse<{ leastProducts: TopProduct[]; total: number }>> => {
  const params: any = { startDate, endDate, limit };
  if (branchId) params.branchId = branchId;
  return api.get<ApiResponse<{ leastProducts: TopProduct[]; total: number }>>('/reports/products/least', { params });
};

/**
 * Get detailed product sales report with pagination
 */
export const getProductSales = async (
  startDate: string,
  endDate: string,
  categoryId?: string,
  page: number = 1,
  limit: number = 20,
  branchId?: string
): Promise<PaginatedResponse<ProductSale>> => {
  const params: any = { startDate, endDate, page, limit };
  if (categoryId) params.categoryId = categoryId;
  if (branchId) params.branchId = branchId;
  return api.get<PaginatedResponse<ProductSale>>('/reports/products/sales', { params });
};

// ============================================
// Customer Reports API Functions
// ============================================

/**
 * Get customer analytics report
 */
export const getCustomerReport = async (
  startDate: string,
  endDate: string,
  branchId?: string
): Promise<ApiResponse<CustomerReport>> => {
  const params: any = { startDate, endDate };
  if (branchId) params.branchId = branchId;
  return api.get<ApiResponse<CustomerReport>>('/reports/customers', { params });
};

// ============================================
// Staff Reports API Functions
// ============================================

/**
 * Get staff performance metrics
 */
export const getStaffPerformance = async (
  startDate: string,
  endDate: string,
  branchId?: string
): Promise<ApiResponse<StaffPerformance[]>> => {
  const params: any = { startDate, endDate };
  if (branchId) params.branchId = branchId;
  const response = await api.get<
    ApiResponse<StaffPerformance[] | StaffPerformanceAnalyticsResponse>
  >('/reports/staff/performance', { params });

  const normalizedData = Array.isArray(response.data)
    ? response.data
    : response.data?.leaderboard
      ? mapAnalyticsLeaderboardToStaffPerformance(response.data)
      : [];

  return {
    ...response,
    data: normalizedData,
  };
};

/**
 * Get enhanced staff performance analytics with leaderboard
 */
export const getStaffPerformanceAnalytics = async (
  startDate?: string,
  endDate?: string,
  branchId?: string
): Promise<ApiResponse<StaffPerformanceAnalyticsResponse>> => {
  const params: any = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  if (branchId) params.branchId = branchId;
  return api.get<ApiResponse<StaffPerformanceAnalyticsResponse>>('/reports/staff/performance', { params });
};

// ============================================
// Inventory Reports API Functions
// ============================================

/**
 * Get inventory status report
 */
export const getInventoryReport = async (branchId?: string): Promise<ApiResponse<InventoryReport>> => {
  const params = branchId ? { branchId } : {};
  return api.get<ApiResponse<InventoryReport>>('/reports/inventory', { params });
};

// ============================================
// GST Reports API Functions
// ============================================

/**
 * Get GST B2B report (transactions with registered customers)
 */
export const getGSTB2B = async (
  month: number,
  year: number,
  branchId?: string
): Promise<ApiResponse<GstB2bReport>> => {
  const params: any = { month, year };
  if (branchId) params.branchId = branchId;
  return api.get<ApiResponse<GstB2bReport>>('/reports/gst/b2b', { params });
};

/**
 * Get GST B2C report (transactions without GSTIN, aggregated by state)
 */
export const getGSTB2C = async (
  month: number,
  year: number,
  branchId?: string
): Promise<ApiResponse<GstB2cReport>> => {
  const params: any = { month, year };
  if (branchId) params.branchId = branchId;
  return api.get<ApiResponse<GstB2cReport>>('/reports/gst/b2c', { params });
};

/**
 * Get GST HSN report (HSN-wise summary for GST filing)
 */
export const getGSTHSN = async (
  month: number,
  year: number,
  branchId?: string
): Promise<ApiResponse<GstHsnReport>> => {
  const params: any = { month, year };
  if (branchId) params.branchId = branchId;
  return api.get<ApiResponse<GstHsnReport>>('/reports/gst/hsn', { params });
};

// ============================================
// Discount Reports API Functions
// ============================================

/**
 * Get discount usage report
 */
export const getDiscountUsage = async (
  startDate: string,
  endDate: string
): Promise<ApiResponse<DiscountUsageReport>> => {
  return api.get<ApiResponse<DiscountUsageReport>>('/reports/discounts', {
    params: { startDate, endDate },
  });
};

// ============================================
// Audit Log API Functions
// ============================================

/**
 * Get audit logs with filtering and pagination
 */
export const getAuditLog = async (
  filters?: {
    userId?: string;
    action?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
  },
  page: number = 1,
  limit: number = 50
): Promise<PaginatedResponse<AuditLog>> => {
  const params: any = { page, limit };
  if (filters) {
    if (filters.userId) params.userId = filters.userId;
    if (filters.action) params.action = filters.action;
    if (filters.entityType) params.entityType = filters.entityType;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
  }
  return api.get<PaginatedResponse<AuditLog>>('/reports/audit-logs', { params });
};

// ============================================
// Report Export API Functions
// ============================================

/**
 * Export report to CSV or PDF
 */
export const exportReport = async (
  input: ReportExportInput
): Promise<ApiResponse<ReportExportResult>> => {
  return api.post<ApiResponse<ReportExportResult>>('/reports/export', input);
};

// ============================================
// Sales Transaction Reports API Functions
// ============================================

export interface ChannelSummaryData {
  grossSales: number;
  salesReturn: number;
  discounts: number;
  netSales: number;
  taxes: number;
  totalGrossRevenue: number;
  transactionCount: number;
  avgSalePerTransaction: number;
}

export interface SalesSummaryByChannelResponse {
  total: ChannelSummaryData;
  byChannel: (ChannelSummaryData & { channel: string })[];
  paymentSummary: { method: string; amount: number }[];
  taxSummary: { cgst: number; sgst: number; igst: number };
  categorySummary: { category: string; amount: number }[];
}

export interface SalesTrendRow {
  branchName: string;
  branchCode: string;
  branchLabel: string;
  currentMonthSale: number;
  currentYearSale: number;
  momPercent: number;
  yoyPercent: number;
}

export interface SalesTrendResponse {
  trends: SalesTrendRow[];
  total: number;
  page: number;
  limit: number;
}

export interface SalesTransactionRow {
  [key: string]: string | number;
}

export interface SalesTransactionResponse {
  transactions: SalesTransactionRow[];
  total: number;
  page: number;
  limit: number;
}

export interface CancelledTransactionRow {
  branchName: string;
  branchCode: string;
  brand: string;
  date: string;
  invoiceNumber: string;
  offlineNumber: string;
  transferredToOrder: string;
  orderNo: string;
  orderSource: string;
  sourceOrderNumber: string;
  sourceOutletId: string;
}

export interface CancelledTransactionResponse {
  transactions: CancelledTransactionRow[];
  total: number;
  page: number;
  limit: number;
}

export interface PaymentRow {
  [key: string]: string | number;
}

export interface PaymentTransactionResponse {
  payments: PaymentRow[];
  total: number;
  page: number;
  limit: number;
}

export interface SalesTargetRow {
  branchName: string;
  branchCode: string;
  channel: string;
  date: string;
  targetSalesAmount: number;
  actualSalesAmount: number;
  varianceAmount: number;
  targetSalesTransactions: number;
  actualSalesTransactions: number;
  varianceTransactions: number;
}

export interface SalesTargetResponse {
  targets: SalesTargetRow[];
  total: number;
  page: number;
  limit: number;
}

export const getSalesSummaryByChannel = async (
  startDate: string,
  endDate: string,
  branchId?: string,
  channel?: string
): Promise<ApiResponse<SalesSummaryByChannelResponse>> => {
  const params: any = { startDate, endDate };
  if (branchId) params.branchId = branchId;
  if (channel) params.channel = channel;
  return api.get<ApiResponse<SalesSummaryByChannelResponse>>('/reports/sales/summary-by-channel', { params });
};

export const getSalesTrend = async (
  startDate: string,
  endDate: string,
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<SalesTrendResponse>> => {
  const params: any = { startDate, endDate, page, limit };
  return api.get<ApiResponse<SalesTrendResponse>>('/reports/sales/trend', { params });
};

export const getSalesTransactions = async (
  startDate: string,
  endDate: string,
  branchId?: string,
  channel?: string,
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<SalesTransactionResponse>> => {
  const params: any = { startDate, endDate, page, limit };
  if (branchId) params.branchId = branchId;
  if (channel) params.channel = channel;
  return api.get<ApiResponse<SalesTransactionResponse>>('/reports/sales/transactions', { params });
};

export const getCancelledTransactions = async (
  startDate: string,
  endDate: string,
  branchId?: string,
  channel?: string,
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<CancelledTransactionResponse>> => {
  const params: any = { startDate, endDate, page, limit };
  if (branchId) params.branchId = branchId;
  if (channel) params.channel = channel;
  return api.get<ApiResponse<CancelledTransactionResponse>>('/reports/sales/cancelled', { params });
};

export const getSalesAuditTransactions = async (
  startDate: string,
  endDate: string,
  branchId?: string,
  channel?: string,
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<SalesTransactionResponse>> => {
  const params: any = { startDate, endDate, page, limit };
  if (branchId) params.branchId = branchId;
  if (channel) params.channel = channel;
  return api.get<ApiResponse<SalesTransactionResponse>>('/reports/sales/audit', { params });
};

export const getPaymentTransactions = async (
  startDate: string,
  endDate: string,
  branchId?: string,
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<PaymentTransactionResponse>> => {
  const params: any = { startDate, endDate, page, limit };
  if (branchId) params.branchId = branchId;
  return api.get<ApiResponse<PaymentTransactionResponse>>('/reports/payments', { params });
};

export const getSalesTargets = async (
  startDate: string,
  endDate: string,
  branchId?: string,
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<SalesTargetResponse>> => {
  const params: any = { startDate, endDate, page, limit };
  if (branchId) params.branchId = branchId;
  return api.get<ApiResponse<SalesTargetResponse>>('/reports/sales/targets', { params });
};

// Sales Forecasting
export interface DailyForecast {
  date: string;
  dayOfWeek: string;
  predictedRevenue: number;
  predictedOrders: number;
  lowEstimate: number;
  highEstimate: number;
}

export interface SalesForecastResponse {
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

export const getSalesForecast = async (
  branchId: string,
  days: number = 7
): Promise<ApiResponse<SalesForecastResponse>> => {
  const params: any = { branchId, days };
  return api.get<ApiResponse<SalesForecastResponse>>('/reports/sales/forecast', { params });
};

// Inventory Stockout Predictions
export interface StockoutPrediction {
  productId: string;
  productName: string;
  currentStock: number;
  unit: string | null;
  dailyUsageRate: number;
  daysUntilStockout: number;
  suggestedReorderQty: number;
  status: 'Critical' | 'Low' | 'Safe';
  supplierName: string | null;
  supplierId: string | null;
  restockAlert: number | null;
}

export interface StockoutPredictionResponse {
  predictions: StockoutPrediction[];
  summary: {
    criticalCount: number;
    lowCount: number;
    safeCount: number;
    totalProducts: number;
  };
  modelInfo: {
    dataPointsUsed: number;
    method: string;
    lookbackDays: number;
  };
}

export const getStockoutPredictions = async (
  branchId: string
): Promise<ApiResponse<StockoutPredictionResponse>> => {
  const params: any = { branchId };
  return api.get<ApiResponse<StockoutPredictionResponse>>('/reports/inventory/stockout-predictions', { params });
};

// Customer Cohort Analysis
export interface CohortSegment {
  cohortMonth: string;
  cohortSize: number;
  revenue: number;
  retention: number[];
  absoluteCounts: number[];
}

export interface CohortAnalysisResponse {
  cohorts: CohortSegment[];
  maxMonthsTracked: number;
  summary: {
    totalCustomers: number;
    averageRetentionMonth1: number;
    averageRetentionMonth3: number;
    bestCohort: string;
    worstCohort: string;
  };
  modelInfo: {
    dataPointsUsed: number;
    method: string;
  };
}

export const getCohortAnalysis = async (
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<CohortAnalysisResponse>> => {
  const params: any = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  return api.get<ApiResponse<CohortAnalysisResponse>>('/reports/customers/cohort-analysis', { params });
};

// Sales Heatmap
export interface HeatmapCell {
  orderCount: number;
  revenue: number;
  avgOrderValue: number;
  percentile: number;
}

export interface SalesHeatmapResponse {
  heatmap: HeatmapCell[][];
  dayLabels: string[];
  hourLabels: string[];
  summary: {
    peakDay: string;
    peakHour: number;
    peakRevenue: number;
    totalOrders: number;
    totalRevenue: number;
  };
  modelInfo: {
    dataPointsUsed: number;
    method: string;
  };
}

export const getSalesHeatmap = async (
  branchId?: string,
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<SalesHeatmapResponse>> => {
  const params: any = {};
  if (branchId) params.branchId = branchId;
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  return api.get<ApiResponse<SalesHeatmapResponse>>('/reports/sales/heatmap', { params });
};

// Product Performance Trends
export interface ProductTrend {
  productId: string;
  productName: string;
  categoryName: string | null;
  growthPercent: number;
  trend: 'up' | 'stable' | 'down';
  velocity7d: number;
  velocity30d: number;
  velocity90d: number;
  totalRevenue: number;
  totalQuantity: number;
  sparkline: number[];
}

export interface ProductTrendsResponse {
  trendingUp: ProductTrend[];
  trendingDown: ProductTrend[];
  summary: {
    totalProductsAnalyzed: number;
    trendingUpCount: number;
    stableCount: number;
    trendingDownCount: number;
    topGrower: string | null;
    topDecliner: string | null;
  };
  modelInfo: {
    dataPointsUsed: number;
    method: string;
    periodDays: number;
  };
}

export const getProductTrends = async (
  branchId?: string,
  days?: number
): Promise<ApiResponse<ProductTrendsResponse>> => {
  const params: any = {};
  if (branchId) params.branchId = branchId;
  if (days) params.days = days;
  return api.get<ApiResponse<ProductTrendsResponse>>('/reports/products/trends', { params });
};

// Customer Lifetime Value Analysis
export interface CustomerLTV {
  customerId: string;
  name: string;
  phone: string;
  email: string | null;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  ordersPerMonth: number;
  predictedAnnualValue: number;
  segment: 'High' | 'Medium' | 'Low';
  lastOrderDate: string | null;
  firstOrderDate: string | null;
  isAtRisk: boolean;
}

export interface CustomerLTVResponse {
  customers: CustomerLTV[];
  summary: {
    totalCustomersAnalyzed: number;
    highValueCount: number;
    mediumValueCount: number;
    lowValueCount: number;
    atRiskCount: number;
    averageLTV: number;
  };
  modelInfo: {
    dataPointsUsed: number;
    method: string;
  };
}

export const getCustomerLTVReport = async (): Promise<ApiResponse<CustomerLTVResponse>> => {
  return api.get<ApiResponse<CustomerLTVResponse>>('/reports/customers/ltv');
};

// Predictive Customer Churn Analysis
export interface ChurnCustomer {
  customerId: string;
  name: string;
  phone: string;
  email: string | null;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  daysSinceLastOrder: number;
  orderFrequencyDecline: number;
  avgOrderValueDecline: number;
  churnRiskScore: number;
  riskLevel: 'High' | 'Medium' | 'Low';
  recommendedAction: string;
  lastOrderDate: string;
  firstOrderDate: string;
}

export interface ChurnPredictionResponse {
  atRiskCustomers: ChurnCustomer[];
  summary: {
    totalAnalyzed: number;
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
    averageChurnScore: number;
  };
  modelInfo: {
    dataPointsUsed: number;
    method: string;
  };
}

export const getChurnPrediction = async (): Promise<ApiResponse<ChurnPredictionResponse>> => {
  return api.get<ApiResponse<ChurnPredictionResponse>>('/reports/customers/churn-prediction');
};

// Menu Engineering Matrix
export type MenuQuadrant = 'Star' | 'Plow' | 'Puzzle' | 'Dog';

export interface MenuEngineeringItem {
  productId: string;
  productName: string;
  categoryName: string | null;
  quantitySold: number;
  totalRevenue: number;
  costPerUnit: number;
  pricePerUnit: number;
  profitMargin: number;
  popularityScore: number;
  profitabilityScore: number;
  quadrant: MenuQuadrant;
  recommendation: string;
}

export interface MenuEngineeringResponse {
  items: MenuEngineeringItem[];
  summary: {
    totalProductsAnalyzed: number;
    stars: number;
    plows: number;
    puzzles: number;
    dogs: number;
    avgPopularity: number;
    avgProfitMargin: number;
  };
  modelInfo: {
    dataPointsUsed: number;
    method: string;
    periodDays: number;
  };
}

export const getMenuEngineering = async (
  branchId?: string,
  days?: number
): Promise<ApiResponse<MenuEngineeringResponse>> => {
  const params: any = {};
  if (branchId) params.branchId = branchId;
  if (days) params.days = days;
  return api.get<ApiResponse<MenuEngineeringResponse>>('/reports/products/menu-engineering', { params });
};

// ============================================
// Sales Anomaly Detection
// ============================================

export type AnomalyType = 'high' | 'low';

export interface SalesAnomaly {
  id: string;
  date: string;
  type: AnomalyType;
  actualValue: number;
  expectedValue: number;
  deviation: number;
  standardDeviations: number;
  resolved: boolean;
  resolvedAt: string | null;
}

export interface AnomalyDetectionResponse {
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
    threshold: number;
  };
}

export const getSalesAnomalies = async (
  branchId?: string,
  days?: number
): Promise<ApiResponse<AnomalyDetectionResponse>> => {
  const params: any = {};
  if (branchId) params.branchId = branchId;
  if (days) params.days = days;
  return api.get<ApiResponse<AnomalyDetectionResponse>>('/reports/sales/anomalies', { params });
};

export const resolveAnomaly = async (
  anomalyId: string
): Promise<ApiResponse<SalesAnomaly>> => {
  return api.post<ApiResponse<SalesAnomaly>>(`/reports/sales/anomalies/${anomalyId}/resolve`);
};

// ============================================
// Report Sharing (US-219)
// ============================================

export interface ReportShareInput {
  reportType: string;
  reportConfig: Record<string, any>;
  reportData: Record<string, any>;
  password?: string;
  expiresInDays?: number; // 7, 30, 90, or 0 for never
}

export interface ReportShareResult {
  id: string;
  shareToken: string;
  expiresAt: string | null;
  hasPassword: boolean;
  createdAt: string;
}

export interface ReportShareListItem {
  id: string;
  reportType: string;
  shareToken: string;
  hasPassword: boolean;
  expiresAt: string | null;
  viewCount: number;
  createdAt: string;
}

export interface SharedReportData {
  requiresPassword: boolean;
  reportType: string;
  reportConfig?: Record<string, any>;
  reportData?: Record<string, any>;
  restaurantName: string;
  viewCount?: number;
  createdAt?: string;
  expiresAt?: string | null;
}

export const createReportShare = async (
  input: ReportShareInput
): Promise<ApiResponse<ReportShareResult>> => {
  return api.post<ApiResponse<ReportShareResult>>('/reports/share', input);
};

export const getReportShares = async (): Promise<ApiResponse<{ shares: ReportShareListItem[]; total: number }>> => {
  return api.get<ApiResponse<{ shares: ReportShareListItem[]; total: number }>>('/reports/share');
};

export const deleteReportShare = async (
  id: string
): Promise<ApiResponse<{ message: string }>> => {
  return api.delete<ApiResponse<{ message: string }>>(`/reports/share/${id}`);
};

export const viewSharedReport = async (
  token: string,
  password?: string
): Promise<ApiResponse<SharedReportData>> => {
  const params: any = {};
  if (password) params.password = password;
  return api.get<ApiResponse<SharedReportData>>(`/public/shared-reports/${token}`, { params });
};

// ============================================
// Report Comments (US-220)
// ============================================

export interface ReportComment {
  id: string;
  businessOwnerId: string;
  reportType: string;
  reportConfig: Record<string, any>;
  userId: string;
  userName: string;
  comment: string;
  mentions: Array<{ userId: string; userName: string }> | null;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportCommentInput {
  reportType: string;
  reportConfig: Record<string, any>;
  comment: string;
  mentions?: Array<{ userId: string; userName: string }>;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
}

export const createReportComment = async (
  input: CreateReportCommentInput
): Promise<ApiResponse<ReportComment>> => {
  return api.post<ApiResponse<ReportComment>>('/reports/comments', input);
};

export const getReportComments = async (
  reportType: string
): Promise<ApiResponse<{ comments: ReportComment[]; total: number }>> => {
  return api.get<ApiResponse<{ comments: ReportComment[]; total: number }>>('/reports/comments', {
    params: { reportType },
  });
};

export const updateReportComment = async (
  id: string,
  comment: string,
  mentions?: Array<{ userId: string; userName: string }>
): Promise<ApiResponse<ReportComment>> => {
  return api.put<ApiResponse<ReportComment>>(`/reports/comments/${id}`, { comment, mentions });
};

export const deleteReportComment = async (
  id: string
): Promise<ApiResponse<{ message: string }>> => {
  return api.delete<ApiResponse<{ message: string }>>(`/reports/comments/${id}`);
};

export const getTeamMembers = async (): Promise<ApiResponse<{ members: TeamMember[] }>> => {
  return api.get<ApiResponse<{ members: TeamMember[] }>>('/reports/comments/team');
};
