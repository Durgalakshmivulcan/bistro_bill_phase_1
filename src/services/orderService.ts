import { api } from './api';
import { ApiResponse } from '../types/api';

/**
 * Order Service
 *
 * Provides API functions for POS order management including:
 * - Order CRUD operations
 * - Order item management
 * - Discount application
 * - Payment processing
 * - KOT generation
 * - Table status overview
 *
 * All endpoints are under /pos base path
 */

// ============================================
// Type Definitions
// ============================================

export type OrderType = 'DineIn' | 'Takeaway' | 'Delivery' | 'Online';
export type OrderStatus = 'Draft' | 'Placed' | 'InProgress' | 'Ready' | 'Completed' | 'Cancelled' | 'OnHold';
export type PaymentStatus = 'Unpaid' | 'PartiallyPaid' | 'Paid' | 'Refunded';
export type OrderItemStatus = 'Pending' | 'Preparing' | 'Ready' | 'Served' | 'Cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  branchId: string;
  type: OrderType;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  staffId: string;
  tableId?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  dueAmount: number;
  items?: OrderItem[];
  payments?: OrderPayment[];
  discount?: OrderDiscount;
  timeline?: OrderTimeline[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxAmount: number;
  status: OrderItemStatus;
  notes?: string;
  addons?: OrderItemAddon[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemAddon {
  id: string;
  addonId: string;
  addonName: string;
  price: number;
  quantity: number;
}

export interface OrderPayment {
  id: string;
  orderId: string;
  paymentOptionId: string;
  amount: number;
  reference?: string;
  createdAt: string;
  paymentOption?: {
    id: string;
    name: string;
    type: string;
  };
}

export interface OrderDiscount {
  id: string;
  discountId?: string;
  discountName?: string;
  reason?: string;
  amount: number;
  appliedAt: string;
  appliedBy: string;
}

export interface OrderTimeline {
  id: string;
  orderId: string;
  eventType: string;
  eventData?: Record<string, any>;
  createdAt: string;
  createdBy: string;
}

export interface TableStatus {
  id: string;
  name: string;
  capacity: number;
  currentStatus: 'available' | 'occupied' | 'reserved';
  floorId: string;
  floorName: string;
  currentOrder?: {
    id: string;
    orderNumber: string;
    customerName?: string;
    total: number;
    paidAmount: number;
    dueAmount: number;
    status: OrderStatus;
    createdAt: string;
  };
}

export interface FloorWithTables {
  floorId: string;
  floorName: string;
  tables: TableStatus[];
}

// ============================================
// Request Types
// ============================================

export interface CreateOrderRequest {
  branchId: string;
  type: OrderType;
  staffId: string;
  tableId?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
}

export interface AddOrderItemRequest {
  productId: string;
  quantity: number;
  variantId?: string;
  notes?: string;
  addons?: {
    addonId: string;
    quantity: number;
  }[];
}

export interface UpdateOrderItemRequest {
  quantity?: number;
  notes?: string;
  addons?: {
    addonId: string;
    quantity: number;
  }[];
}

export interface UpdateOrderItemStatusRequest {
  status: OrderItemStatus;
}

export interface ApplyDiscountRequest {
  discountId?: string;
  reason?: string;
  amount?: number;
}

export interface AddPaymentRequest {
  paymentOptionId: string;
  amount: number;
  reference?: string;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  reason?: string;
}

export interface GenerateKOTRequest {
  kitchenId: string;
}

// ============================================
// Response Types
// ============================================

export interface OrderResponse {
  order: Order;
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
}

export interface OrderItemResponse {
  orderItem: OrderItem;
  order: Order;
}

export interface TableStatusResponse {
  floors: FloorWithTables[];
}

export interface KOTResponse {
  kotId: string;
  kotNumber: string;
  items: OrderItem[];
}

// ============================================
// Query Parameters
// ============================================

export interface GetOrdersParams {
  branchId?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  type?: OrderType;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface GetActiveOrdersParams {
  branchId?: string;
}

// ============================================
// API Functions
// ============================================

/**
 * Create a new order
 * POST /pos/orders
 */
export const createOrder = async (
  data: CreateOrderRequest
): Promise<ApiResponse<OrderResponse>> => {
  return api.post<ApiResponse<OrderResponse>>('/pos/orders', data);
};

/**
 * Get paginated orders with filters
 * GET /pos/orders
 */
export const getOrders = async (
  params?: GetOrdersParams
): Promise<ApiResponse<OrderListResponse>> => {
  const queryString = params
    ? '?' + new URLSearchParams(params as Record<string, string>).toString()
    : '';
  return api.get<ApiResponse<OrderListResponse>>(`/pos/orders${queryString}`);
};

/**
 * Get all currently active orders (not Completed or Cancelled)
 * GET /pos/orders/active
 */
export const getActiveOrders = async (
  params?: GetActiveOrdersParams
): Promise<ApiResponse<OrderListResponse>> => {
  const queryString = params
    ? '?' + new URLSearchParams(params as Record<string, string>).toString()
    : '';
  return api.get<ApiResponse<OrderListResponse>>(`/pos/orders/active${queryString}`);
};

/**
 * Get complete order details with timeline and breakdowns
 * GET /pos/orders/:orderId
 */
export const getOrder = async (orderId: string): Promise<ApiResponse<OrderResponse>> => {
  return api.get<ApiResponse<OrderResponse>>(`/pos/orders/${orderId}`);
};

/**
 * Update overall order status
 * PATCH /pos/orders/:orderId/status
 */
export const updateOrderStatus = async (
  orderId: string,
  data: UpdateOrderStatusRequest
): Promise<ApiResponse<OrderResponse>> => {
  return api.patch<ApiResponse<OrderResponse>>(`/pos/orders/${orderId}/status`, data);
};

// ============================================
// Order Item Functions
// ============================================

/**
 * Add item to an order
 * POST /pos/orders/:orderId/items
 */
export const addOrderItem = async (
  orderId: string,
  data: AddOrderItemRequest
): Promise<ApiResponse<OrderItemResponse>> => {
  return api.post<ApiResponse<OrderItemResponse>>(`/pos/orders/${orderId}/items`, data);
};

/**
 * Update an order item
 * PUT /pos/orders/:orderId/items/:itemId
 */
export const updateOrderItem = async (
  orderId: string,
  itemId: string,
  data: UpdateOrderItemRequest
): Promise<ApiResponse<OrderItemResponse>> => {
  return api.put<ApiResponse<OrderItemResponse>>(
    `/pos/orders/${orderId}/items/${itemId}`,
    data
  );
};

/**
 * Remove an order item
 * DELETE /pos/orders/:orderId/items/:itemId
 */
export const removeOrderItem = async (
  orderId: string,
  itemId: string
): Promise<ApiResponse<{ message: string }>> => {
  return api.delete<ApiResponse<{ message: string }>>(`/pos/orders/${orderId}/items/${itemId}`);
};

/**
 * Update order item status
 * PATCH /pos/orders/:orderId/items/:itemId/status
 */
export const updateOrderItemStatus = async (
  orderId: string,
  itemId: string,
  data: UpdateOrderItemStatusRequest
): Promise<ApiResponse<OrderItemResponse>> => {
  return api.patch<ApiResponse<OrderItemResponse>>(
    `/pos/orders/${orderId}/items/${itemId}/status`,
    data
  );
};

// ============================================
// Discount Functions
// ============================================

/**
 * Apply a discount to an order
 * POST /pos/orders/:orderId/discount
 */
export const applyDiscount = async (
  orderId: string,
  data: ApplyDiscountRequest
): Promise<ApiResponse<OrderResponse>> => {
  return api.post<ApiResponse<OrderResponse>>(`/pos/orders/${orderId}/discount`, data);
};

/**
 * Remove discount from an order
 * DELETE /pos/orders/:orderId/discount
 */
export const removeDiscount = async (
  orderId: string
): Promise<ApiResponse<OrderResponse>> => {
  return api.delete<ApiResponse<OrderResponse>>(`/pos/orders/${orderId}/discount`);
};

// ============================================
// Payment Functions
// ============================================

/**
 * Record a payment for an order
 * POST /pos/orders/:orderId/payments
 */
export const addPayment = async (
  orderId: string,
  data: AddPaymentRequest
): Promise<ApiResponse<OrderResponse>> => {
  return api.post<ApiResponse<OrderResponse>>(`/pos/orders/${orderId}/payments`, data);
};

// ============================================
// KOT Functions
// ============================================

/**
 * Generate Kitchen Order Ticket (KOT) for an order
 * POST /pos/orders/:orderId/kot
 */
export const generateKOT = async (
  orderId: string,
  data: GenerateKOTRequest
): Promise<ApiResponse<KOTResponse>> => {
  return api.post<ApiResponse<KOTResponse>>(`/pos/orders/${orderId}/kot`, data);
};

// ============================================
// Table Status Functions
// ============================================

/**
 * Get table status overview for a branch, grouped by floor
 * GET /pos/tables/:branchId
 */
export const getTableStatusOverview = async (
  branchId: string
): Promise<ApiResponse<TableStatusResponse>> => {
  return api.get<ApiResponse<TableStatusResponse>>(`/pos/tables/${branchId}`);
};

// ============================================
// Order Management Functions
// ============================================

/**
 * Reset/Delete a draft order (clears all items and order data)
 * DELETE /pos/orders/:orderId
 * Use this when user wants to start fresh with a new order
 */
export const resetOrder = async (
  orderId: string
): Promise<ApiResponse<{ message: string }>> => {
  return api.delete<ApiResponse<{ message: string }>>(`/pos/orders/${orderId}`);
};

/**
 * Hold an order (saves current order with status "OnHold")
 * PATCH /pos/orders/:orderId/status
 * Returns the order with a hold ticket ID
 */
export const holdOrder = async (
  orderId: string
): Promise<ApiResponse<OrderResponse>> => {
  return updateOrderStatus(orderId, {
    status: 'OnHold',
    reason: 'Order placed on hold by user'
  });
};

/**
 * Get all held orders for a branch
 * GET /pos/orders?status=OnHold&branchId=:branchId
 */
export const getHeldOrders = async (
  branchId: string
): Promise<ApiResponse<OrderListResponse>> => {
  return api.get<ApiResponse<OrderListResponse>>(`/pos/orders`, {
    params: {
      status: 'OnHold',
      branchId
    }
  });
};

/**
 * Retrieve a held order (change status back to Draft)
 * PATCH /pos/orders/:orderId/status
 */
export const retrieveHeldOrder = async (
  orderId: string
): Promise<ApiResponse<OrderResponse>> => {
  return updateOrderStatus(orderId, {
    status: 'Draft',
    reason: 'Order retrieved from hold'
  });
};

/**
 * Cancel an order (marks order as cancelled)
 * PATCH /pos/orders/:orderId/status
 */
export const cancelOrder = async (
  orderId: string,
  reason: string,
  remarks?: string
): Promise<ApiResponse<OrderResponse>> => {
  return updateOrderStatus(orderId, {
    status: 'Cancelled',
    reason: remarks ? `${reason} - ${remarks}` : reason
  });
};

/**
 * Save an order as draft (keeps order with status "Draft")
 * PATCH /pos/orders/:orderId/status
 * Returns the order with a draft ID
 */
export const saveOrderDraft = async (
  orderId: string
): Promise<ApiResponse<OrderResponse>> => {
  return updateOrderStatus(orderId, {
    status: 'Draft',
    reason: 'Order saved as draft by user'
  });
};

/**
 * Get all draft orders for a branch
 * GET /pos/orders?status=Draft&branchId=:branchId
 */
export const getDraftOrders = async (
  branchId: string
): Promise<ApiResponse<OrderListResponse>> => {
  return api.get<ApiResponse<OrderListResponse>>(`/pos/orders`, {
    params: {
      status: 'Draft',
      branchId
    }
  });
};

/**
 * Load a draft order (retrieve draft order by ID)
 * GET /pos/orders/:orderId
 */
export const loadDraftOrder = async (
  orderId: string
): Promise<ApiResponse<OrderResponse>> => {
  return getOrder(orderId);
};

// ============================================
// Table Transfer Functions
// ============================================

/**
 * Transfer an order from one table to another
 * PATCH /pos/orders/:orderId/transfer-table
 */
export const transferTable = async (
  orderId: string,
  newTableId: string
): Promise<ApiResponse<OrderResponse>> => {
  return api.patch<ApiResponse<OrderResponse>>(
    `/pos/orders/${orderId}/transfer-table`,
    { newTableId }
  );
};

// ============================================
// Delivery Dispatch Types
// ============================================

export type DeliveryProvider = 'dunzo' | 'porter' | 'internal';
export type DeliveryStatus = 'Pending' | 'Assigned' | 'PickedUp' | 'InTransit' | 'Delivered' | 'Cancelled';

export interface DeliveryDispatchRequest {
  provider: DeliveryProvider;
}

export interface DeliveryInfo {
  provider: DeliveryProvider;
  status: DeliveryStatus;
  trackingUrl?: string;
  estimatedDeliveryTime?: string;
  estimatedCost?: number;
  deliveryTaskId?: string;
}

export interface DeliveryEstimate {
  provider: DeliveryProvider;
  estimatedCost: number;
  estimatedTime: string;
  available: boolean;
}

/**
 * Dispatch an order for delivery via a provider
 * POST /pos/orders/:orderId/dispatch-delivery
 */
export const dispatchDelivery = async (
  orderId: string,
  data: DeliveryDispatchRequest
): Promise<ApiResponse<{ delivery: DeliveryInfo }>> => {
  return api.post<ApiResponse<{ delivery: DeliveryInfo }>>(
    `/pos/orders/${orderId}/dispatch-delivery`,
    data
  );
};

/**
 * Get delivery estimates for available providers
 * GET /pos/orders/:orderId/delivery-estimates
 */
export const getDeliveryEstimates = async (
  orderId: string
): Promise<ApiResponse<{ estimates: DeliveryEstimate[] }>> => {
  return api.get<ApiResponse<{ estimates: DeliveryEstimate[] }>>(
    `/pos/orders/${orderId}/delivery-estimates`
  );
};

/**
 * Get delivery status for an order
 * GET /pos/orders/:orderId/delivery-status
 */
export const getDeliveryStatus = async (
  orderId: string
): Promise<ApiResponse<{ delivery: DeliveryInfo }>> => {
  return api.get<ApiResponse<{ delivery: DeliveryInfo }>>(
    `/pos/orders/${orderId}/delivery-status`
  );
};

export const syncOrderToAccounting = async (
  orderId: string
): Promise<ApiResponse<{ results: Array<{ provider: string; success: boolean; message: string }> }>> => {
  return api.post<ApiResponse<{ results: Array<{ provider: string; success: boolean; message: string }> }>>(
    `/pos/orders/${orderId}/sync-accounting`,
    {}
  );
};
