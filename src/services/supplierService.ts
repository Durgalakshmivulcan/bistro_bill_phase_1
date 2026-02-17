/**
 * Supplier Service
 * API functions for managing suppliers (CRUD operations)
 */

import { api } from './api';
import { ApiResponse, PaginationMeta, SearchParams } from '../types/api';

/**
 * Supplier Entity Interface
 */
export interface Supplier {
  id: string;
  code: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  gstNumber: string | null;
  tinNumber: string | null;
  taxStateCode: string | null;
  bankAccount: string | null;
  bankName: string | null;
  bankBranch: string | null;
  ifscCode: string | null;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  purchaseOrderCount: number;
  totalAmountSpent: number;
}

/**
 * Supplier Search Parameters Interface
 */
export interface SupplierSearchParams extends SearchParams {
  status?: 'active' | 'inactive';
}

/**
 * Create Supplier Data Interface
 */
export interface CreateSupplierData {
  name: string;
  phone: string;
  code?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  tinNumber?: string;
  taxStateCode?: string;
  bankAccount?: string;
  bankName?: string;
  bankBranch?: string;
  ifscCode?: string;
  status?: 'active' | 'inactive';
}

/**
 * Update Supplier Data Interface
 */
export interface UpdateSupplierData {
  name?: string;
  phone?: string;
  code?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  tinNumber?: string;
  taxStateCode?: string;
  bankAccount?: string;
  bankName?: string;
  bankBranch?: string;
  ifscCode?: string;
  status?: 'active' | 'inactive';
}

/**
 * Get all suppliers with optional filtering and pagination
 * GET /api/v1/inventory/suppliers
 */
export async function getSuppliers(
  params?: SupplierSearchParams
): Promise<ApiResponse<{ suppliers: Supplier[] }> & { pagination?: PaginationMeta }> {
  const queryParams = new URLSearchParams();

  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.search) queryParams.append('search', params.search);
  if (params?.status) queryParams.append('status', params.status);

  const query = queryParams.toString();
  const url = `/inventory/suppliers${query ? `?${query}` : ''}`;

  return api.get(url);
}

/**
 * Get a single supplier by ID
 * GET /api/v1/inventory/suppliers/:id
 * Note: This endpoint needs to be added to backend
 */
export async function getSupplier(id: string): Promise<ApiResponse<Supplier>> {
  return api.get(`/inventory/suppliers/${id}`);
}

/**
 * Create a new supplier
 * POST /api/v1/inventory/suppliers
 * Required: name, phone
 * Optional: code, email, address, status
 */
export async function createSupplier(
  data: CreateSupplierData
): Promise<ApiResponse<Supplier>> {
  return api.post('/inventory/suppliers', data);
}

/**
 * Update an existing supplier
 * PUT /api/v1/inventory/suppliers/:id
 * All fields optional
 */
export async function updateSupplier(
  id: string,
  data: UpdateSupplierData
): Promise<ApiResponse<Supplier>> {
  return api.put(`/inventory/suppliers/${id}`, data);
}

/**
 * Delete a supplier
 * DELETE /api/v1/inventory/suppliers/:id
 * Prevents deletion if supplier has pending purchase orders
 */
export async function deleteSupplier(
  id: string
): Promise<ApiResponse<void>> {
  return api.delete(`/inventory/suppliers/${id}`);
}

/**
 * Supplier Contact Entity Interface
 */
export interface SupplierContact {
  id: string;
  supplierId: string;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create Supplier Contact Data Interface
 */
export interface CreateSupplierContactData {
  name: string;
  email?: string;
  phone?: string;
}

/**
 * Update Supplier Contact Data Interface
 */
export interface UpdateSupplierContactData {
  name?: string;
  email?: string;
  phone?: string;
}

/**
 * Get all contacts for a supplier
 * GET /api/v1/inventory/suppliers/:supplierId/contacts
 */
export async function getSupplierContacts(
  supplierId: string
): Promise<ApiResponse<{ contacts: SupplierContact[] }>> {
  return api.get(`/inventory/suppliers/${supplierId}/contacts`);
}

/**
 * Create a new supplier contact
 * POST /api/v1/inventory/suppliers/:supplierId/contacts
 * Required: name
 * Optional: email, phone
 */
export async function createSupplierContact(
  supplierId: string,
  data: CreateSupplierContactData
): Promise<ApiResponse<SupplierContact>> {
  return api.post(`/inventory/suppliers/${supplierId}/contacts`, data);
}

/**
 * Update a supplier contact
 * PUT /api/v1/inventory/suppliers/:supplierId/contacts/:id
 * All fields optional
 */
export async function updateSupplierContact(
  supplierId: string,
  contactId: string,
  data: UpdateSupplierContactData
): Promise<ApiResponse<SupplierContact>> {
  return api.put(`/inventory/suppliers/${supplierId}/contacts/${contactId}`, data);
}

/**
 * Delete a supplier contact
 * DELETE /api/v1/inventory/suppliers/:supplierId/contacts/:id
 */
export async function deleteSupplierContact(
  supplierId: string,
  contactId: string
): Promise<ApiResponse<void>> {
  return api.delete(`/inventory/suppliers/${supplierId}/contacts/${contactId}`);
}

// ============================================
// Supplier Performance Analytics (US-185)
// ============================================

/**
 * Supplier Performance Metrics Interface
 */
export interface SupplierPerformance {
  supplierId: string;
  supplierName: string;
  supplierCode: string | null;
  status: 'active' | 'inactive';
  totalOrders: number;
  totalAmountSpent: number;
  onTimeDeliveryRate: number;
  averageDeliveryDays: number;
  rating: number;
  performanceNotes: string | null;
  lastOrderDate: string | null;
}

/**
 * Supplier Performance Search Parameters
 */
export interface SupplierPerformanceParams extends SearchParams {
  minRating?: number;
  sortBy?: 'rating' | 'totalOrders' | 'onTimeDeliveryRate' | 'totalAmountSpent';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Get supplier performance analytics
 * GET /api/v1/inventory/suppliers/performance
 */
export async function getSupplierPerformance(
  params?: SupplierPerformanceParams
): Promise<ApiResponse<{ suppliers: SupplierPerformance[] }> & { pagination?: PaginationMeta }> {
  const queryParams = new URLSearchParams();

  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.search) queryParams.append('search', params.search);
  if (params?.minRating) queryParams.append('minRating', params.minRating.toString());
  if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  const query = queryParams.toString();
  const url = `/inventory/suppliers/performance${query ? `?${query}` : ''}`;

  return api.get(url);
}

/**
 * Update supplier rating and performance notes
 * PATCH /api/v1/inventory/suppliers/:id/rating
 */
export async function updateSupplierRating(
  supplierId: string,
  data: { rating: number; performanceNotes?: string }
): Promise<ApiResponse<SupplierPerformance>> {
  return api.patch(`/inventory/suppliers/${supplierId}/rating`, data);
}
