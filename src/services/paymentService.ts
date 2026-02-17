import { api } from './api';
import { ApiResponse } from '../types/api';

/**
 * Payment Service
 *
 * Provides API functions for online payment operations including:
 * - Creating payment gateway orders
 * - Verifying payments after completion
 * - Fetching payment details
 *
 * All endpoints are under /payments base path
 */

// ============================================
// Type Definitions
// ============================================

export type GatewayProvider = 'Razorpay' | 'Stripe' | 'PayU';

export type OnlinePaymentStatus =
  | 'Created'
  | 'Processing'
  | 'Completed'
  | 'Failed'
  | 'Refunded'
  | 'PartiallyRefunded';

export interface CreatePaymentOrderInput {
  orderId: string;
  provider: GatewayProvider;
  currency?: string;
}

export interface CreatePaymentOrderResponse {
  paymentId: string;
  gatewayOrderId: string;
  amount: number;
  currency: string;
  provider: GatewayProvider;
  providerData: Record<string, unknown>;
}

export interface VerifyPaymentInput {
  paymentId: string;
  orderId: string;
  signature: string;
  provider: GatewayProvider;
}

export interface VerifyPaymentResponse {
  verified: boolean;
  paymentId: string;
  gatewayTransactionId: string;
}

export interface OnlinePayment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  gatewayProvider: GatewayProvider;
  gatewayTransactionId?: string;
  gatewayOrderId: string;
  status: OnlinePaymentStatus;
  paymentMethod?: string;
  failureReason?: string;
  paidAt?: string;
  createdAt: string;
  order?: {
    id: string;
    orderNumber: string;
    total: number;
  };
  refunds?: Array<{
    id: string;
    amount: number;
    reason?: string;
    status: string;
    gatewayRefundId?: string;
    processedAt?: string;
  }>;
}

export interface SplitPaymentInput {
  provider: string; // 'Cash' | 'Razorpay' | 'Stripe' | 'PayU'
  amount: number;
  paymentMethod: string; // 'cash' | 'card' | 'upi' | 'wallet' | 'netbanking'
}

export interface ProcessSplitPaymentInput {
  orderId: string;
  splits: SplitPaymentInput[];
}

export interface SplitPaymentResult {
  id: string;
  provider: string;
  amount: number;
  paymentMethod: string;
  gatewayOrderId?: string;
  gatewayTransactionId?: string;
  status: string;
}

export interface ProcessSplitPaymentResponse {
  orderId: string;
  splitPayments: SplitPaymentResult[];
  allCompleted: boolean;
  orderTotal: number;
}

export interface RefundRecord {
  id: string;
  onlinePaymentId: string;
  amount: number;
  reason?: string;
  status: 'Processing' | 'Completed' | 'Failed';
  gatewayRefundId?: string;
  processedAt?: string;
  createdAt: string;
  onlinePayment?: OnlinePayment;
}

export interface RefundFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface InitiateRefundInput {
  paymentId: string;
  amount: number;
  reason?: string;
}

export interface InitiateRefundResponse {
  refundId: string;
  gatewayRefundId: string;
  amount: number;
  status: string;
}

export type ReconciliationStatus = 'Reconciled' | 'Disputed' | 'Settled';

export interface ReconciliationRecord {
  id: string;
  businessOwnerId: string;
  settlementDate: string;
  gatewayProvider: GatewayProvider;
  totalAmount: number;
  settledAmount: number;
  fees: number;
  transactionCount: number;
  status: ReconciliationStatus;
  reconciledAt: string | null;
}

export interface ReconciliationFilters {
  provider?: GatewayProvider;
  status?: ReconciliationStatus;
  startDate?: string;
  endDate?: string;
}

export interface RunReconciliationInput {
  provider: GatewayProvider;
  settlementDate: string;
}

export interface ReconciliationReport extends ReconciliationRecord {
  discrepancies: Array<{
    type: 'missing_in_gateway' | 'missing_in_local' | 'amount_mismatch';
    gatewayTransactionId?: string;
    localPaymentId?: string;
    gatewayAmount?: number;
    localAmount?: number;
    details: string;
  }>;
}

// ============================================
// Subscription / AutoPay Type Definitions
// ============================================

export type AutoPayStatus = 'Created' | 'Active' | 'Cancelled' | 'Failed';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration: number;
  features?: string;
}

export interface UPIAutoPaySubscription {
  id: string;
  businessOwnerId: string;
  planId: string;
  customerId?: string;
  gatewaySubscriptionId: string;
  gatewayProvider: GatewayProvider;
  upiId?: string;
  amount: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  status: AutoPayStatus;
  totalCount?: number;
  paidCount: number;
  lastPaymentAt?: string;
  lastPaymentId?: string;
  currentStart?: string;
  currentEnd?: string;
  nextBillingDate?: string;
  failureReason?: string;
  createdAt: string;
  cancelledAt?: string;
  plan?: SubscriptionPlan;
}

export interface AutoPayFilters {
  status?: string;
  planId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

// ============================================
// Gateway Configuration Type Definitions
// ============================================

export interface GatewayConfig {
  id: string;
  provider: GatewayProvider;
  apiKey: string; // Masked from server
  apiSecret: string; // Masked from server
  webhookSecret: string | null;
  isActive: boolean;
  isTestMode: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertGatewayConfigInput {
  provider: GatewayProvider;
  apiKey: string;
  apiSecret: string;
  webhookSecret?: string;
  isActive?: boolean;
  isTestMode?: boolean;
}

export interface TestConnectionResult {
  connected: boolean;
  message: string;
}

// ============================================
// API Functions
// ============================================

/**
 * Create a payment order on the gateway
 */
export async function createPaymentOrder(
  input: CreatePaymentOrderInput
): Promise<ApiResponse<CreatePaymentOrderResponse>> {
  return api.post<ApiResponse<CreatePaymentOrderResponse>>('/payments/create-order', input);
}

/**
 * Verify a payment after completion (signature verification)
 */
export async function verifyPayment(
  input: VerifyPaymentInput
): Promise<ApiResponse<VerifyPaymentResponse>> {
  return api.post<ApiResponse<VerifyPaymentResponse>>('/payments/verify', input);
}

/**
 * Get payment details by ID
 */
export async function getPaymentDetails(
  paymentId: string
): Promise<ApiResponse<OnlinePayment>> {
  return api.get<ApiResponse<OnlinePayment>>(`/payments/${paymentId}`);
}

/**
 * Process a split payment across multiple methods for a single order
 */
export async function processSplitPayment(
  input: ProcessSplitPaymentInput
): Promise<ApiResponse<ProcessSplitPaymentResponse>> {
  return api.post<ApiResponse<ProcessSplitPaymentResponse>>('/payments/split', input);
}

/**
 * Get payment details by Order ID
 */
export async function getPaymentByOrderId(
  orderId: string
): Promise<ApiResponse<OnlinePayment>> {
  return api.get<ApiResponse<OnlinePayment>>(`/payments/order/${orderId}`);
}

/**
 * List all payments with optional filters and pagination
 */
export async function listPayments(
  filters: RefundFilters = {},
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<{ payments: OnlinePayment[]; total: number }>> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (filters.status) params.append('status', filters.status);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.search) params.append('search', filters.search);
  return api.get<ApiResponse<{ payments: OnlinePayment[]; total: number }>>(`/payments?${params.toString()}`);
}

/**
 * Initiate a refund for a payment
 */
export async function initiateRefund(
  input: InitiateRefundInput
): Promise<ApiResponse<InitiateRefundResponse>> {
  return api.post<ApiResponse<InitiateRefundResponse>>('/payments/refund', input);
}

/**
 * List reconciliation records with optional filters
 */
export async function listReconciliations(
  filters: ReconciliationFilters = {}
): Promise<ApiResponse<ReconciliationRecord[]>> {
  const params = new URLSearchParams();
  if (filters.provider) params.append('provider', filters.provider);
  if (filters.status) params.append('status', filters.status);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  return api.get<ApiResponse<ReconciliationRecord[]>>(`/payments/reconciliation?${params.toString()}`);
}

/**
 * Run reconciliation for a specific provider and settlement date
 */
export async function runReconciliation(
  input: RunReconciliationInput
): Promise<ApiResponse<ReconciliationReport>> {
  return api.post<ApiResponse<ReconciliationReport>>('/payments/reconciliation/run', input);
}

/**
 * Mark a disputed reconciliation as resolved
 */
export async function resolveReconciliation(
  reconciliationId: string
): Promise<ApiResponse<{ message: string }>> {
  return api.patch<ApiResponse<{ message: string }>>(`/payments/reconciliation/${reconciliationId}/resolve`, {});
}

/**
 * List UPI AutoPay subscriptions with optional filters and pagination
 */
export async function listSubscriptions(
  filters: AutoPayFilters = {},
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<{ subscriptions: UPIAutoPaySubscription[]; total: number }>> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (filters.status) params.append('status', filters.status);
  if (filters.planId) params.append('planId', filters.planId);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.search) params.append('search', filters.search);
  return api.get<ApiResponse<{ subscriptions: UPIAutoPaySubscription[]; total: number }>>(`/payments/subscriptions?${params.toString()}`);
}

/**
 * Cancel a UPI AutoPay subscription
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<ApiResponse<{ message: string }>> {
  return api.post<ApiResponse<{ message: string }>>(`/payments/subscriptions/${subscriptionId}/cancel`, {});
}

/**
 * Retry a failed subscription charge
 */
export async function retrySubscriptionCharge(
  subscriptionId: string
): Promise<ApiResponse<{ message: string }>> {
  return api.post<ApiResponse<{ message: string }>>(`/payments/subscriptions/${subscriptionId}/retry`, {});
}

// ============================================
// Gateway Configuration API Functions
// ============================================

/**
 * List all gateway configurations for the business
 */
export async function listGatewayConfigs(): Promise<ApiResponse<GatewayConfig[]>> {
  return api.get<ApiResponse<GatewayConfig[]>>('/payments/gateway-config');
}

/**
 * Create or update a gateway configuration
 */
export async function upsertGatewayConfig(
  input: UpsertGatewayConfigInput
): Promise<ApiResponse<GatewayConfig>> {
  return api.post<ApiResponse<GatewayConfig>>('/payments/gateway-config', input);
}

/**
 * Toggle gateway active status
 */
export async function toggleGatewayConfig(
  configId: string
): Promise<ApiResponse<{ id: string; provider: GatewayProvider; isActive: boolean }>> {
  return api.patch<ApiResponse<{ id: string; provider: GatewayProvider; isActive: boolean }>>(
    `/payments/gateway-config/${configId}/toggle`,
    {}
  );
}

/**
 * Test connection for a gateway configuration
 */
export async function testGatewayConnection(
  configId: string
): Promise<ApiResponse<TestConnectionResult>> {
  return api.post<ApiResponse<TestConnectionResult>>(
    `/payments/gateway-config/${configId}/test`,
    {}
  );
}
