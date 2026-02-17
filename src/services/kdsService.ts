import { api } from './api';
import { ApiResponse } from '../types/api';

// ============================
// Type Definitions
// ============================

export type KOTStatus = 'New' | 'Preparing' | 'Ready' | 'Served';
export type OrderItemStatus = 'Pending' | 'Preparing' | 'Ready' | 'Served' | 'Cancelled';

export interface ProductAddon {
  id: string;
  name: string;
  price: number;
}

export interface OrderItemAddon {
  id: string;
  orderItemId: string;
  addonId: string;
  quantity: number;
  price: number;
  addon: ProductAddon | null;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string | null;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string | null;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId: string | null;
  name: string;
  quantity: number;
  price: number;
  status: OrderItemStatus;
  product: Product | null;
  variant: ProductVariant | null;
  addons: OrderItemAddon[];
}

export interface Floor {
  id: string;
  name: string;
  branchId: string;
}

export interface Table {
  id: string;
  label: string;
  capacity: number;
  floorId: string;
  floor: Floor | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  type: string;
  tableId: string | null;
  table: Table | null;
  items: OrderItem[];
}

export interface OrderKOT {
  id: string;
  kotNumber: string;
  orderId: string;
  kitchenId: string;
  status: KOTStatus;
  createdAt: string;
  updatedAt: string;
  order: Order;
  elapsedMinutes?: number;
  tableNumber?: string | null;
  floorName?: string | null;
  itemCount?: number;
}

export interface Kitchen {
  id: string;
  name: string;
  branchId: string;
  branchName: string;
}

export interface KOTGroupedByStatus {
  New: OrderKOT[];
  Preparing: OrderKOT[];
  Ready: OrderKOT[];
  Served: OrderKOT[];
  Cancelled: OrderKOT[];
}

export interface KDSBoardResponse {
  kitchen: Kitchen;
  kots: OrderKOT[];
  groupedByStatus: KOTGroupedByStatus;
  summary: {
    totalNew: number;
    totalPreparing: number;
    totalReady: number;
    totalServed: number;
    totalCancelled: number;
    totalKots: number;
  };
}

export interface KitchenStats {
  kitchen: Kitchen;
  stats: {
    avgPreparationTime: number;
    ordersCompletedToday: number;
    pendingOrders: number;
    totalItemsPrepared: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
}

export interface UpdateItemStatusRequest {
  status: 'Preparing' | 'Ready';
}

export interface UpdateKOTStatusRequest {
  status: 'Preparing' | 'Ready' | 'Served';
}

export interface KDSStatsParams {
  startDate?: string;
  endDate?: string;
}

// ============================
// API Functions
// ============================

/**
 * GET /api/v1/kds/:kitchenId/orders
 * Get kitchen order board with all active KOTs
 */
export const getKDSBoard = async (kitchenId: string): Promise<ApiResponse<KDSBoardResponse>> => {
  return api.get<ApiResponse<KDSBoardResponse>>(`/kds/${kitchenId}/orders`);
};

/**
 * PATCH /api/v1/kds/items/:orderItemId/status
 * Update order item status (Preparing, Ready)
 */
export const updateItemStatus = async (
  orderItemId: string,
  data: UpdateItemStatusRequest
): Promise<ApiResponse<OrderItem>> => {
  return api.patch<ApiResponse<OrderItem>>(`/kds/items/${orderItemId}/status`, data);
};

/**
 * PATCH /api/v1/kds/kot/:kotId/status
 * Update KOT status (Preparing, Ready, Served)
 */
export const updateKOTStatus = async (
  kotId: string,
  data: UpdateKOTStatusRequest
): Promise<ApiResponse<OrderKOT>> => {
  return api.patch<ApiResponse<OrderKOT>>(`/kds/kot/${kotId}/status`, data);
};

/**
 * GET /api/v1/kds/:kitchenId/stats
 * Get kitchen performance statistics
 */
export const getKDSStats = async (
  kitchenId: string,
  params?: KDSStatsParams
): Promise<ApiResponse<KitchenStats>> => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);

  const queryString = queryParams.toString();
  const url = `/kds/${kitchenId}/stats${queryString ? `?${queryString}` : ''}`;

  return api.get<ApiResponse<KitchenStats>>(url);
};
