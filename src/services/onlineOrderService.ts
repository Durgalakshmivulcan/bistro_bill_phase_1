import { api } from './api';

/**
 * Online Order Service
 * Handles all online order-related API calls for aggregator integration
 */

// ============================================
// Type Definitions
// ============================================

/**
 * Order Aggregator Enum
 */
export enum OrderAggregator {
  BISTRO_BILL = 'BistroBill',
  SWIGGY = 'Swiggy',
  ZOMATO = 'Zomato',
  UBER_EATS = 'UberEats',
}

/**
 * Online Order Status Enum
 */
export enum OnlineOrderStatus {
  PENDING = 'Pending',
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected',
  PREPARING = 'Preparing',
  READY = 'Ready',
  COMPLETED = 'Completed',
}

/**
 * Online Order Item Interface
 */
export interface OnlineOrderItem {
  productId?: string;
  productName: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

/**
 * Online Order Interface
 */
export interface OnlineOrder {
  id: string;
  branchId: string;
  aggregator: OrderAggregator;
  externalOrderId?: string;
  status: OnlineOrderStatus;
  customerName: string;
  customerPhone: string;
  items: OnlineOrderItem[];
  amount: number;
  deliveryTime?: string;
  prepTime?: number;
  receivedAt: string;
  acceptedAt?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Online Order List Response
 */
export interface OnlineOrderListResponse {
  orders: OnlineOrder[];
  total: number;
}

/**
 * Generic API Response
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  message?: string;
}

// ============================================
// Online Order Functions
// ============================================

/**
 * Get Pending Online Orders
 * GET /api/v1/pos/online-orders?status=Pending
 *
 * @param status - Optional filter by order status (defaults to Pending)
 * @returns Promise with online order list response
 */
export async function getPendingOnlineOrders(
  status: OnlineOrderStatus = OnlineOrderStatus.PENDING
): Promise<ApiResponse<OnlineOrderListResponse>> {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('status', status);

    const query = queryParams.toString();
    const url = `/pos/online-orders${query ? `?${query}` : ''}`;

    const response = await api.get<ApiResponse<OnlineOrderListResponse>>(url);
    return response;
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: error.code || 'FETCH_ONLINE_ORDERS_FAILED',
        message: error.message || 'Failed to fetch online orders',
      },
    };
  }
}

/**
 * Accept Online Order
 * POST /api/v1/pos/online-orders/:id/accept
 *
 * @param orderId - The ID of the order to accept
 * @param deliveryTime - The delivery time for the order
 * @param prepTime - The preparation time in minutes
 * @returns Promise with accepted order response
 */
export async function acceptOnlineOrder(
  orderId: string,
  deliveryTime: string,
  prepTime: number
): Promise<ApiResponse<{ order: OnlineOrder }>> {
  try {
    const response = await api.post<ApiResponse<{ order: OnlineOrder }>>(
      `/pos/online-orders/${orderId}/accept`,
      { deliveryTime, prepTime }
    );
    return response;
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: error.code || 'ACCEPT_ORDER_FAILED',
        message: error.message || 'Failed to accept online order',
      },
    };
  }
}

/**
 * Reject Online Order
 * POST /api/v1/pos/online-orders/:id/reject
 *
 * @param orderId - The ID of the order to reject
 * @param reason - The reason for rejection
 * @returns Promise with rejected order response
 */
export async function rejectOnlineOrder(
  orderId: string,
  reason: string
): Promise<ApiResponse<{ order: OnlineOrder }>> {
  try {
    const response = await api.post<ApiResponse<{ order: OnlineOrder }>>(
      `/pos/online-orders/${orderId}/reject`,
      { reason }
    );
    return response;
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: error.code || 'REJECT_ORDER_FAILED',
        message: error.message || 'Failed to reject online order',
      },
    };
  }
}
