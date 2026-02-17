import { api } from './api';
import { ApiResponse, PaginatedResponse, SearchParams } from '../types/api';

/**
 * Inventory Product Interface
 */
export interface InventoryProduct {
  id: string;
  name: string;
  image: string | null;
  inStock: number;
  quantitySold: number;
  restockAlert: number | null;
  costPrice: number;
  sellingPrice: number;
  expiryDate: Date | null;
  unit: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  branch: BranchInfo;
  supplier: SupplierInfo | null;
  // Auto-reorder fields
  enableAutoReorder?: boolean;
  reorderLevel?: number | null;
  reorderQuantity?: number | null;
  autoReorderSupplierId?: string | null;
}

/**
 * Branch Info Interface
 */
export interface BranchInfo {
  id: string;
  name: string;
  code: string | null;
}

/**
 * Supplier Info Interface
 */
export interface SupplierInfo {
  id: string;
  code: string | null;
  name: string;
}

/**
 * Create Inventory Product Input
 */
export interface CreateInventoryProductData {
  name: string;
  branchId: string;
  unit: string;
  image?: string;
  supplierId?: string;
  inStock?: number;
  restockAlert?: number;
  costPrice?: number;
  sellingPrice?: number;
  expiryDate?: string;
  status?: 'active' | 'inactive';
  enableAutoReorder?: boolean;
  reorderLevel?: number;
  reorderQuantity?: number;
  autoReorderSupplierId?: string;
}

/**
 * Update Inventory Product Input
 */
export interface UpdateInventoryProductData {
  name?: string;
  branchId?: string;
  unit?: string;
  image?: string;
  supplierId?: string | null;
  inStock?: number;
  restockAlert?: number | null;
  costPrice?: number;
  sellingPrice?: number;
  expiryDate?: string | null;
  status?: 'active' | 'inactive';
  enableAutoReorder?: boolean;
  reorderLevel?: number | null;
  reorderQuantity?: number | null;
  autoReorderSupplierId?: string | null;
}

/**
 * Stock Adjustment Input
 */
export interface StockAdjustmentData {
  adjustment: number;
  reason?: string;
}

/**
 * Stock Adjustment Response
 */
export interface StockAdjustmentResponse {
  id: string;
  name: string;
  oldStock: number;
  newStock: number;
  adjustment: number;
  reason: string | null;
  updatedAt: Date;
  branch: BranchInfo;
  supplier: SupplierInfo | null;
}

/**
 * Low Stock Item Response
 */
export interface LowStockItem {
  id: string;
  name: string;
  image: string | null;
  inStock: number;
  restockAlert: number;
  shortage: number;
  unit: string | null;
  costPrice: number;
  sellingPrice: number;
  expiryDate: Date | null;
  status: string;
  supplier: SupplierInfo | null;
}

/**
 * Low Stock By Branch
 */
export interface LowStockByBranch {
  branch: BranchInfo;
  itemCount: number;
  items: LowStockItem[];
}

/**
 * Low Stock Alert Response
 */
export interface LowStockAlertResponse {
  totalItems: number;
  branches: LowStockByBranch[];
}

/**
 * Inventory Products Search Params
 */
export interface InventorySearchParams extends SearchParams {
  branchId?: string;
  supplierId?: string;
  status?: 'active' | 'inactive';
  lowStock?: boolean;
}

// =====================================// Inventory Product CRUD Functions
// =====================================
/**
 * Get all inventory products with pagination and filters
 * GET /api/v1/inventory/products
 */
export async function getInventoryProducts(
  params?: InventorySearchParams
): Promise<ApiResponse<{ inventoryProducts: InventoryProduct[] }> & { pagination?: PaginatedResponse<InventoryProduct>['pagination'] }> {
  const queryParams = new URLSearchParams();

  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));
  if (params?.search) queryParams.append('search', params.search);
  if (params?.branchId) queryParams.append('branchId', params.branchId);
  if (params?.supplierId) queryParams.append('supplierId', params.supplierId);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.lowStock) queryParams.append('lowStock', 'true');

  return api.get<ApiResponse<{ inventoryProducts: InventoryProduct[] }> & { pagination?: PaginatedResponse<InventoryProduct>['pagination'] }>(
    `/inventory/products?${queryParams.toString()}`
  );
}

/**
 * Get a single inventory product by ID
 * GET /api/v1/inventory/products/:id
 */
export async function getInventoryProduct(id: string): Promise<ApiResponse<InventoryProduct>> {
  return api.get<ApiResponse<InventoryProduct>>(`/inventory/products/${id}`);
}

/**
 * Create a new inventory product
 * POST /api/v1/inventory/products
 * Supports optional image upload via FormData
 */
export async function createInventoryProduct(
  data: CreateInventoryProductData,
  imageFile?: File
): Promise<ApiResponse<InventoryProduct>> {
  if (imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);
    // Append all other fields to FormData
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    return api.post<ApiResponse<InventoryProduct>>('/inventory/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
  return api.post<ApiResponse<InventoryProduct>>('/inventory/products', data);
}

/**
 * Update an existing inventory product
 * PUT /api/v1/inventory/products/:id
 * Supports optional image upload via FormData
 */
export async function updateInventoryProduct(
  id: string,
  data: UpdateInventoryProductData,
  imageFile?: File
): Promise<ApiResponse<InventoryProduct>> {
  if (imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);
    // Append all other fields to FormData
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    return api.put<ApiResponse<InventoryProduct>>(`/inventory/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
  return api.put<ApiResponse<InventoryProduct>>(`/inventory/products/${id}`, data);
}

/**
 * Delete an inventory product
 * DELETE /api/v1/inventory/products/:id
 */
export async function deleteInventoryProduct(id: string): Promise<ApiResponse<{ id: string; name: string }>> {
  return api.delete<ApiResponse<{ id: string; name: string }>>(`/inventory/products/${id}`);
}

/**
 * Adjust inventory stock levels
 * PATCH /api/v1/inventory/products/:id/stock
 */
export async function adjustStock(
  id: string,
  data: StockAdjustmentData
): Promise<ApiResponse<StockAdjustmentResponse>> {
  return api.patch<ApiResponse<StockAdjustmentResponse>>(`/inventory/products/${id}/stock`, data);
}

/**
 * Get low stock alerts grouped by branch
 * GET /api/v1/inventory/low-stock
 */
export async function getLowStockAlerts(): Promise<ApiResponse<LowStockAlertResponse>> {
  return api.get<ApiResponse<LowStockAlertResponse>>('/inventory/low-stock');
}

/**
 * Import Inventory Products Response
 */
export interface ImportInventoryProductsResponse {
  imported: number;
  failed: number;
  errors?: string[];
}

/**
 * Import inventory products from CSV file
 * POST /api/v1/inventory/products/import
 */
export async function importInventoryProducts(file: File): Promise<ApiResponse<ImportInventoryProductsResponse>> {
  const formData = new FormData();
  formData.append('file', file);

  return api.post<ApiResponse<ImportInventoryProductsResponse>>('/inventory/products/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

// =====================================// Bulk Operations
// =====================================
/**
 * Bulk delete inventory products
 * DELETE /api/v1/inventory/products/bulk
 */
export async function bulkDeleteInventoryProducts(
  productIds: string[]
): Promise<ApiResponse<{ deletedCount: number; failedCount: number; errors?: string[] }>> {
  return api.delete<ApiResponse<{ deletedCount: number; failedCount: number; errors?: string[] }>>('/inventory/products/bulk', {
    data: { productIds },
  });
}

/**
 * Bulk adjust stock for inventory products
 * PATCH /api/v1/inventory/products/bulk/stock
 */
export interface BulkStockAdjustmentData {
  productIds: string[];
  adjustment: number;
  reason?: string;
}

export interface BulkStockAdjustmentResponse {
  adjustedCount: number;
  failedCount: number;
  errors?: string[];
}

export async function bulkAdjustStock(
  data: BulkStockAdjustmentData
): Promise<ApiResponse<BulkStockAdjustmentResponse>> {
  return api.patch<ApiResponse<BulkStockAdjustmentResponse>>('/inventory/products/bulk/stock', data);
}

// =====================================// Stock Adjustment History & Undo
// =====================================
/**
 * Stock Adjustment History Item
 */
export interface StockAdjustmentHistoryItem {
  id: string;
  oldStock: number;
  newStock: number;
  adjustment: number;
  reason: string | null;
  undone: boolean;
  undoneAt: string | null;
  undoneBy: string | null;
  createdAt: string;
  userId: string;
  userType: string;
}

/**
 * Get stock adjustment history for an inventory product
 * GET /api/v1/inventory/products/:id/adjustments
 * Returns last 10 adjustments, most recent first
 */
export async function getStockAdjustmentHistory(
  productId: string
): Promise<ApiResponse<{ adjustments: StockAdjustmentHistoryItem[] }>> {
  return api.get<ApiResponse<{ adjustments: StockAdjustmentHistoryItem[] }>>(
    `/inventory/products/${productId}/adjustments`
  );
}

/**
 * Undo a stock adjustment
 * POST /api/v1/inventory/adjustments/:adjustmentId/undo
 */
export async function undoStockAdjustment(
  adjustmentId: string
): Promise<ApiResponse<StockAdjustmentResponse>> {
  return api.post<ApiResponse<StockAdjustmentResponse>>(
    `/inventory/adjustments/${adjustmentId}/undo`
  );
}


// Auto-Reorder Functions
// =====================================
/**
 * Auto-Reorder PO Creation Response
 */
export interface AutoReorderResponse {
  purchaseOrderId: string;
  invoiceNumber: string | null;
  supplierId: string;
  supplierName: string;
  itemCount: number;
  grandTotal: number;
}

/**
 * POST /api/v1/inventory/auto-reorder
 * Create a purchase order for low stock items with auto-reorder enabled
 */
export async function createAutoReorderPO(
  productIds: string[]
): Promise<ApiResponse<AutoReorderResponse>> {
  return api.post<ApiResponse<AutoReorderResponse>>('/inventory/auto-reorder', { productIds });
}

/**
 * PATCH /api/v1/inventory/products/:id/auto-reorder
 * Update auto-reorder settings for a product
 */
export async function updateAutoReorderSettings(
  id: string,
  data: {
    enableAutoReorder?: boolean;
    reorderLevel?: number | null;
    reorderQuantity?: number | null;
    autoReorderSupplierId?: string | null;
  }
): Promise<ApiResponse<InventoryProduct>> {
  return api.patch<ApiResponse<InventoryProduct>>(`/inventory/products/${id}/auto-reorder`, data);
}
