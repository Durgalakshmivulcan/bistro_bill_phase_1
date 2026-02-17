/**
 * Purchase Order API Service
 * Handles all purchase order-related API calls to the backend
 */

import { api } from './api';
import apiClient from './api';
import { ApiResponse, PaginationMeta, SearchParams } from '../types/api';

// ============================================
// Purchase Order Types
// ============================================

/**
 * Purchase order status enum matching backend
 */
export type PurchaseOrderStatus = 'Pending' | 'Approved' | 'Declined' | 'Received';

/**
 * Recurrence frequency for recurring purchase orders
 */
export type RecurrenceFrequency = 'Weekly' | 'Biweekly' | 'Monthly';

/**
 * Recurrence status for recurring purchase orders
 */
export type RecurrenceStatus = 'Active' | 'Paused';

/**
 * Branch info for purchase order
 */
export interface BranchInfo {
  id: string;
  name: string;
  code: string | null;
}

/**
 * Supplier info for purchase order
 */
export interface SupplierInfo {
  id: string;
  code: string | null;
  name: string;
}

/**
 * Purchase Order (list view)
 */
export interface PurchaseOrder {
  id: string;
  invoiceNumber: string | null;
  amountPaid: number;
  grandTotal: number;
  status: PurchaseOrderStatus;
  notes: string | null;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  branch: BranchInfo;
  supplier: SupplierInfo;
  itemCount: number;
  // Recurrence fields
  isRecurring?: boolean;
  recurrenceFrequency?: RecurrenceFrequency | null;
  recurrenceStatus?: RecurrenceStatus | null;
  recurrenceStartDate?: string | null; // ISO date string
  recurrenceEndDate?: string | null; // ISO date string
  nextScheduledDate?: string | null; // ISO date string
  parentPurchaseOrderId?: string | null; // ID of the template PO for auto-generated POs
}

/**
 * Inventory Product Info for purchase order items
 */
export interface InventoryProductInfo {
  id: string;
  name: string;
  image: string | null;
  unit: string | null;
  costPrice: number;
  sellingPrice: number;
}

/**
 * Purchase Order Item
 */
export interface PurchaseOrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  inventoryProduct: InventoryProductInfo;
}

/**
 * Purchase Order Detail (includes items)
 */
export interface PurchaseOrderDetail extends Omit<PurchaseOrder, 'itemCount'> {
  items: PurchaseOrderItem[];
}

/**
 * Search params for listing purchase orders
 */
export interface PurchaseOrderSearchParams extends SearchParams {
  branchId?: string;
  supplierId?: string;
  status?: PurchaseOrderStatus;
}

/**
 * Create Purchase Order Input
 */
export interface CreatePurchaseOrderData {
  branchId: string;
  supplierId: string;
  notes?: string;
  isRecurring?: boolean;
  recurrenceFrequency?: RecurrenceFrequency;
  recurrenceStartDate?: string;
  recurrenceEndDate?: string;
}

/**
 * Update Purchase Order Input (currently only notes can be updated)
 */
export interface UpdatePurchaseOrderData {
  notes?: string;
  isRecurring?: boolean;
  recurrenceFrequency?: RecurrenceFrequency;
  recurrenceStartDate?: string;
  recurrenceEndDate?: string;
  recurrenceStatus?: RecurrenceStatus;
}

/**
 * Add Item to Purchase Order Input
 */
export interface AddPurchaseOrderItemData {
  inventoryProductId: string;
  quantity: number;
  unitPrice: number;
}

/**
 * Update Purchase Order Item Input
 */
export interface UpdatePurchaseOrderItemData {
  quantity?: number;
  unitPrice?: number;
}

/**
 * Purchase Order Item Operation Response
 */
export interface POItemOperationResponse {
  item: PurchaseOrderItem;
  purchaseOrder: {
    id: string;
    grandTotal: number;
    itemCount: number;
  };
}

/**
 * Update Purchase Order Status Input
 */
export interface UpdatePurchaseOrderStatusData {
  status: 'Approved' | 'Declined' | 'Received';
}

/**
 * Purchase Order Status Update Response
 */
export interface PurchaseOrderStatusUpdateResponse extends PurchaseOrder {
  stockUpdated?: boolean; // Only set when status is 'Received'
}

// ============================================
// API Functions
// ============================================

/**
 * GET /api/v1/inventory/purchase-orders
 * List all purchase orders with optional filters
 * Supports pagination, search, and filters
 */
export async function getPurchaseOrders(
  params?: PurchaseOrderSearchParams
): Promise<ApiResponse<{ purchaseOrders: PurchaseOrder[] }> & { pagination?: PaginationMeta }> {
  const queryParams = new URLSearchParams();

  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));
  if (params?.search) queryParams.append('search', params.search);
  if (params?.branchId) queryParams.append('branchId', params.branchId);
  if (params?.supplierId) queryParams.append('supplierId', params.supplierId);
  if (params?.status) queryParams.append('status', params.status);

  const queryString = queryParams.toString();
  const url = `/inventory/purchase-orders${queryString ? `?${queryString}` : ''}`;

  return api.get<ApiResponse<{ purchaseOrders: PurchaseOrder[] }> & { pagination?: PaginationMeta }>(url);
}

/**
 * GET /api/v1/inventory/purchase-orders/:id
 * Get full details of a specific purchase order
 * Includes all items with inventory product details
 */
export async function getPurchaseOrder(id: string): Promise<ApiResponse<PurchaseOrderDetail>> {
  return api.get<ApiResponse<PurchaseOrderDetail>>(`/inventory/purchase-orders/${id}`);
}

/**
 * POST /api/v1/inventory/purchase-orders
 * Create a new purchase order
 * Required: branchId, supplierId
 * Generates unique invoice number (format: PO-YYYYMMDD-XXXX)
 * Default status: 'Pending'
 */
export async function createPurchaseOrder(
  data: CreatePurchaseOrderData
): Promise<ApiResponse<PurchaseOrder>> {
  return api.post<ApiResponse<PurchaseOrder>>('/inventory/purchase-orders', data);
}

/**
 * PUT /api/v1/inventory/purchase-orders/:id
 * Update a purchase order
 * Currently only allows updating notes field
 * Branch and supplier cannot be changed after creation
 */
export async function updatePurchaseOrder(
  id: string,
  data: UpdatePurchaseOrderData
): Promise<ApiResponse<PurchaseOrder>> {
  return api.put<ApiResponse<PurchaseOrder>>(`/inventory/purchase-orders/${id}`, data);
}

/**
 * DELETE /api/v1/inventory/purchase-orders/:id
 * Delete a purchase order
 * Only allows deletion of 'Pending' status POs
 * Deletes all associated items
 */
export async function deletePurchaseOrder(id: string): Promise<ApiResponse<void>> {
  return api.delete<ApiResponse<void>>(`/inventory/purchase-orders/${id}`);
}

/**
 * PATCH /api/v1/inventory/purchase-orders/:id/status
 * Update purchase order status
 * Accept: status ('Approved', 'Declined', 'Received')
 * When 'Received': automatically updates inventory stock for all items
 * Logs status change to audit log
 */
export async function updatePOStatus(
  id: string,
  data: UpdatePurchaseOrderStatusData
): Promise<ApiResponse<PurchaseOrderStatusUpdateResponse>> {
  return api.patch<ApiResponse<PurchaseOrderStatusUpdateResponse>>(
    `/inventory/purchase-orders/${id}/status`,
    data
  );
}

/**
 * POST /api/v1/inventory/purchase-orders/:id/items
 * Add an item to a purchase order
 * Required: inventoryProductId, quantity, unitPrice
 * Calculates totalPrice = quantity * unitPrice
 * Recalculates PO grandTotal after adding
 * Only allowed when PO status is 'Pending'
 */
export async function addPOItem(
  purchaseOrderId: string,
  data: AddPurchaseOrderItemData
): Promise<ApiResponse<POItemOperationResponse>> {
  return api.post<ApiResponse<POItemOperationResponse>>(
    `/inventory/purchase-orders/${purchaseOrderId}/items`,
    data
  );
}

/**
 * PUT /api/v1/inventory/purchase-orders/:id/items/:itemId
 * Update an item in a purchase order
 * Optional: quantity, unitPrice
 * Recalculates totalPrice and PO grandTotal after update
 * Only allowed when PO status is 'Pending'
 */
export async function updatePOItem(
  purchaseOrderId: string,
  itemId: string,
  data: UpdatePurchaseOrderItemData
): Promise<ApiResponse<POItemOperationResponse>> {
  return api.put<ApiResponse<POItemOperationResponse>>(
    `/inventory/purchase-orders/${purchaseOrderId}/items/${itemId}`,
    data
  );
}

/**
 * DELETE /api/v1/inventory/purchase-orders/:id/items/:itemId
 * Remove an item from a purchase order
 * Recalculates PO grandTotal after deletion
 * Only allowed when PO status is 'Pending'
 */
export async function removePOItem(
  purchaseOrderId: string,
  itemId: string
): Promise<ApiResponse<{ deletedItemId: string; purchaseOrder: { id: string; grandTotal: number; itemCount: number } }>> {
  return api.delete<ApiResponse<{ deletedItemId: string; purchaseOrder: { id: string; grandTotal: number; itemCount: number } }>>(
    `/inventory/purchase-orders/${purchaseOrderId}/items/${itemId}`
  );
}

/**
 * Import Purchase Orders Response
 */
export interface ImportPurchaseOrdersResponse {
  imported: number;
  failed: number;
  errors?: string[];
}

/**
 * POST /api/v1/inventory/purchase-orders/import
 * Import purchase orders from CSV file
 * CSV Format: Supplier, Branch, Item Name, Quantity, Unit Price, Notes, Invoice Number
 * Required columns: Supplier, Branch, Item Name, Quantity, Unit Price
 */
export async function importPurchaseOrders(
  file: File,
  duplicateAction: 'skip' | 'update' = 'skip'
): Promise<ApiResponse<ImportPurchaseOrdersResponse>> {
  const formData = new FormData();
  formData.append('file', file);

  return api.post<ApiResponse<ImportPurchaseOrdersResponse>>(
    `/inventory/purchase-orders/import?duplicateAction=${duplicateAction}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
}

/**
 * Resend Email Response
 */
export interface ResendEmailResponse {
  purchaseOrderId: string;
  invoiceNumber: string | null;
  supplierName: string;
  supplierEmail: string | null;
  sentAt: string;
}

/**
 * POST /api/v1/inventory/purchase-orders/:id/resend-email
 * Resend purchase order email to supplier
 * Logs email send activity in audit trail
 */
export async function resendPOEmail(
  id: string
): Promise<ApiResponse<ResendEmailResponse>> {
  return api.post<ApiResponse<ResendEmailResponse>>(
    `/inventory/purchase-orders/${id}/resend-email`
  );
}

/**
 * GET /api/v1/inventory/purchase-orders/:id/download
 * Download purchase order as PDF
 * Returns a Blob that can be used to trigger a file download
 */
export async function downloadPOPdf(id: string): Promise<Blob> {
  const response = await apiClient.get(`/inventory/purchase-orders/${id}/download`, {
    responseType: 'blob',
  });
  return response.data;
}

/**
 * Stock Assignment History Item
 */
export interface StockAssignmentHistory {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
  purchaseOrder: {
    id: string;
    invoiceNumber: string | null;
    status: PurchaseOrderStatus;
    branch: BranchInfo;
  };
}

/**
 * GET /api/v1/inventory/products/:productId/stock-history
 * Get stock assignment history for a specific inventory product
 * Returns all purchase order items for this product
 */
export async function getStockAssignmentHistory(
  inventoryProductId: string
): Promise<ApiResponse<{ assignments: StockAssignmentHistory[] }>> {
  return api.get<ApiResponse<{ assignments: StockAssignmentHistory[] }>>(
    `/inventory/products/${inventoryProductId}/stock-history`
  );
}

// ============================================
// Recurring Purchase Order Functions
// ============================================

/**
 * PATCH /api/v1/inventory/purchase-orders/:id/recurrence
 * Update the recurrence settings for a purchase order
 */
export async function updatePORecurrence(
  id: string,
  data: {
    recurrenceFrequency?: RecurrenceFrequency;
    recurrenceStartDate?: string;
    recurrenceEndDate?: string | null;
    recurrenceStatus?: RecurrenceStatus;
  }
): Promise<ApiResponse<PurchaseOrder>> {
  return api.patch<ApiResponse<PurchaseOrder>>(
    `/inventory/purchase-orders/${id}/recurrence`,
    data
  );
}

/**
 * PATCH /api/v1/inventory/purchase-orders/:id/pause-recurrence
 * Pause a recurring purchase order
 */
export async function pausePORecurrence(
  id: string
): Promise<ApiResponse<PurchaseOrder>> {
  return api.patch<ApiResponse<PurchaseOrder>>(
    `/inventory/purchase-orders/${id}/recurrence`,
    { recurrenceStatus: 'Paused' }
  );
}

/**
 * PATCH /api/v1/inventory/purchase-orders/:id/resume-recurrence
 * Resume a paused recurring purchase order
 */
export async function resumePORecurrence(
  id: string
): Promise<ApiResponse<PurchaseOrder>> {
  return api.patch<ApiResponse<PurchaseOrder>>(
    `/inventory/purchase-orders/${id}/recurrence`,
    { recurrenceStatus: 'Active' }
  );
}
