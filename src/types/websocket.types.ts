/**
 * WebSocket Event Types and Payload Interfaces
 * Shared between server and client
 */

// --- WebSocket Event Types ---

export enum WebSocketEventType {
  // Order events
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_UPDATED = 'ORDER_UPDATED',

  // KDS events
  KOT_STATUS_CHANGED = 'KOT_STATUS_CHANGED',

  // Table events
  TABLE_STATUS_CHANGED = 'TABLE_STATUS_CHANGED',

  // Payment events
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',

  // Dashboard events
  DASHBOARD_METRICS_UPDATED = 'DASHBOARD_METRICS_UPDATED',

  // Authentication events
  WS_AUTH = 'WS_AUTH',
  WS_AUTH_SUCCESS = 'WS_AUTH_SUCCESS',
  WS_AUTH_FAILED = 'WS_AUTH_FAILED',
}

// --- Event Payload Interfaces ---

export interface OrderCreatedPayload {
  orderId: string;
  orderNumber: string;
  tableId?: string;
  tableName?: string;
  kitchenId?: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    notes?: string;
  }>;
  orderType: string;
  createdAt: string;
}

export interface OrderUpdatedPayload {
  orderId: string;
  orderNumber: string;
  status: string;
  previousStatus: string;
  updatedAt: string;
}

export interface KotStatusChangedPayload {
  kotId: string;
  orderId: string;
  orderNumber: string;
  status: string;
  previousStatus: string;
  kitchenId?: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
  }>;
  updatedAt: string;
}

export interface TableStatusChangedPayload {
  tableId: string;
  tableName: string;
  status: string;
  previousStatus: string;
  floorId: string;
  floorName: string;
  updatedAt: string;
}

export interface PaymentReceivedPayload {
  paymentId: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  paymentMode: string;
  todayRevenue: number;
  todayOrderCount: number;
  receivedAt: string;
}

export interface DashboardMetricsUpdatedPayload {
  totalRevenue: number;
  orderCount: number;
  averageOrderValue: number;
  updatedAt: string;
}

export interface WsAuthPayload {
  token: string;
}

export interface WsAuthSuccessPayload {
  userId: string;
  userType: string;
  businessOwnerId?: string;
  branchId?: string;
}

export interface WsAuthFailedPayload {
  reason: string;
}

// --- WebSocket Message Envelope ---

export interface WebSocketMessage<T = unknown> {
  event: WebSocketEventType;
  data: T;
  timestamp: string;
}

// --- Connection Metadata ---

export interface ConnectionMetadata {
  userId: string;
  userType: 'SuperAdmin' | 'BusinessOwner' | 'Staff';
  businessOwnerId?: string;
  branchId?: string;
  email: string;
  connectedAt: string;
}
