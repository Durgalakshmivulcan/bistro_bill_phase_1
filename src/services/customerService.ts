import { api } from './api';
import { ApiResponse, SearchParams } from '../types/api';

/**
 * Customer Type Enum
 */
export type CustomerType = 'Regular' | 'VIP' | 'Corporate' | 'Wholesale';

/**
 * Customer Tag Info
 */
export interface CustomerTag {
  id: string;
  name: string;
  color: string | null;
}

/**
 * Tag Entity (shared between products and customers)
 */
export interface Tag {
  id: string;
  name: string;
  color: string | null;
  status: string;
  productCount: number;
  customerCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Customer Entity from Backend
 */
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  gender: string | null;
  dob: Date | null;
  type: CustomerType;
  gstin?: string | null;
  amountDue?: number;
  totalSpent: number;
  customerGroupId: string | null;
  customerGroupName: string | null;
  notes: string | null;
  orderCount: number;
  tags: CustomerTag[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Customer Detail with Order History
 */
export interface CustomerDetail extends Customer {
  visitCount: number;
  recentOrders: CustomerOrder[];
}

/**
 * Customer Order Info
 */
export interface CustomerOrder {
  id: string;
  orderNumber: string | null;
  type: string;
  total: number;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
}

/**
 * Rule condition for auto-assignment
 */
export interface RuleCondition {
  field: 'totalSpent' | 'orderCount' | 'type' | 'gender';
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';
  value: string | number;
}

/**
 * Auto-assignment rules configuration
 */
export interface GroupRules {
  logic: 'AND' | 'OR';
  conditions: RuleCondition[];
}

/**
 * Customer Group Entity
 */
export interface CustomerGroup {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  color: string; // Hex color code for badge background
  rules: GroupRules | null;
  customerCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Preview customer match result
 */
export interface PreviewCustomer {
  id: string;
  name: string;
  phone: string;
  type: string;
  totalSpent: number;
  orderCount: number;
}

/**
 * Recalculate result
 */
export interface RecalculateResult {
  assigned: number;
  groups: number;
  totalCustomers: number;
}

/**
 * Customer Search Parameters
 */
export interface CustomerSearchParams extends SearchParams {
  customerGroupId?: string;
  type?: CustomerType;
  tagId?: string;
}

/**
 * Create Customer Data
 */
export interface CreateCustomerData {
  name: string;
  phone: string;
  email?: string;
  gender?: string;
  dob?: string; // ISO date string
  type?: CustomerType;
  gstin?: string;
  customerGroupId?: string;
  notes?: string;
  tagIds?: string[];
}

/**
 * Update Customer Data
 */
export interface UpdateCustomerData {
  name?: string;
  phone?: string;
  email?: string;
  gender?: string;
  dob?: string; // ISO date string
  type?: CustomerType;
  gstin?: string;
  customerGroupId?: string;
  notes?: string;
  tagIds?: string[];
}

/**
 * Create Customer Group Data
 */
export interface CreateCustomerGroupData {
  name: string;
  status?: 'active' | 'inactive';
  color?: string; // Hex color code for badge background
  rules?: GroupRules | null;
}

/**
 * Update Customer Group Data
 */
export interface UpdateCustomerGroupData {
  name?: string;
  status?: 'active' | 'inactive';
  color?: string; // Hex color code for badge background
  rules?: GroupRules | null;
}

// ============================================
// Customer API Functions
// ============================================

/**
 * Get paginated list of customers
 */
export async function getCustomers(
  params?: CustomerSearchParams
): Promise<ApiResponse<{ customers: Customer[] }> & { pagination?: any }> {
  const queryParams = new URLSearchParams();

  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.search) queryParams.append('search', params.search);
  if (params?.customerGroupId) queryParams.append('customerGroupId', params.customerGroupId);
  if (params?.type) queryParams.append('type', params.type);
  if (params?.tagId) queryParams.append('tagId', params.tagId);

  const query = queryParams.toString();
  const url = `/customers${query ? `?${query}` : ''}`;

  return api.get<ApiResponse<{ customers: Customer[] }> & { pagination?: any }>(url);
}

/**
 * Get single customer by ID with order history
 */
export async function getCustomer(id: string): Promise<ApiResponse<CustomerDetail>> {
  return api.get<ApiResponse<CustomerDetail>>(`/customers/${id}`);
}

/**
 * Create a new customer
 */
export async function createCustomer(
  data: CreateCustomerData
): Promise<ApiResponse<Customer>> {
  return api.post<ApiResponse<Customer>>('/customers', data);
}

/**
 * Update an existing customer
 */
export async function updateCustomer(
  id: string,
  data: UpdateCustomerData
): Promise<ApiResponse<Customer>> {
  return api.put<ApiResponse<Customer>>(`/customers/${id}`, data);
}

/**
 * Delete a customer
 */
export async function deleteCustomer(id: string): Promise<ApiResponse<void>> {
  return api.delete<ApiResponse<void>>(`/customers/${id}`);
}

/**
 * Import Result Interface
 */
export interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
    data: any;
  }>;
}

/**
 * Import customers from CSV file
 */
export async function importCustomers(
  file: File,
  duplicateAction: 'skip' | 'update' = 'skip'
): Promise<ApiResponse<ImportResult>> {
  const formData = new FormData();
  formData.append('file', file);

  const queryParams = new URLSearchParams();
  queryParams.append('duplicateAction', duplicateAction);

  const url = `/customers/import?${queryParams.toString()}`;

  return api.post<ApiResponse<ImportResult>>(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

// ============================================
// Customer Group API Functions
// ============================================

/**
 * Get all customer groups
 */
export async function getCustomerGroups(): Promise<ApiResponse<CustomerGroup[]>> {
  return api.get<ApiResponse<CustomerGroup[]>>('/customers/groups');
}

/**
 * Create a new customer group
 */
export async function createCustomerGroup(
  data: CreateCustomerGroupData
): Promise<ApiResponse<CustomerGroup>> {
  return api.post<ApiResponse<CustomerGroup>>('/customers/groups', data);
}

/**
 * Update an existing customer group
 */
export async function updateCustomerGroup(
  id: string,
  data: UpdateCustomerGroupData
): Promise<ApiResponse<CustomerGroup>> {
  return api.put<ApiResponse<CustomerGroup>>(`/customers/groups/${id}`, data);
}

/**
 * Delete a customer group
 */
export async function deleteCustomerGroup(id: string): Promise<ApiResponse<void>> {
  return api.delete<ApiResponse<void>>(`/customers/groups/${id}`);
}

/**
 * Preview which customers match a set of rules
 */
export async function previewGroupRules(
  rules: GroupRules
): Promise<ApiResponse<{ matchCount: number; customers: PreviewCustomer[] }>> {
  return api.post<ApiResponse<{ matchCount: number; customers: PreviewCustomer[] }>>(
    '/customers/groups/preview-rules',
    { rules }
  );
}

/**
 * Recalculate all auto-assignment rules for all customers
 */
export async function recalculateCustomerGroups(): Promise<ApiResponse<RecalculateResult>> {
  return api.post<ApiResponse<RecalculateResult>>('/customers/groups/recalculate', {});
}

// ============================================
// Tag API Functions (shared tag model)
// ============================================

/**
 * Get all tags for the business
 */
export async function getTags(status?: string): Promise<ApiResponse<{ tags: Tag[]; total: number }>> {
  const queryParams = new URLSearchParams();
  if (status) queryParams.append('status', status);
  const query = queryParams.toString();
  return api.get<ApiResponse<{ tags: Tag[]; total: number }>>(`/catalog/tags${query ? `?${query}` : ''}`);
}

/**
 * Create a new tag
 */
export async function createTag(data: { name: string; color: string; status?: string }): Promise<ApiResponse<{ tag: Tag }>> {
  return api.post<ApiResponse<{ tag: Tag }>>('/catalog/tags', data);
}

/**
 * Update an existing tag
 */
export async function updateTag(id: string, data: { name?: string; color?: string; status?: string }): Promise<ApiResponse<{ tag: Tag }>> {
  return api.put<ApiResponse<{ tag: Tag }>>(`/catalog/tags/${id}`, data);
}

/**
 * Delete a tag
 */
export async function deleteTag(id: string): Promise<ApiResponse<void>> {
  return api.delete<ApiResponse<void>>(`/catalog/tags/${id}`);
}

/**
 * Bulk assign tags to multiple customers
 */
export async function bulkAssignTags(customerIds: string[], tagIds: string[]): Promise<ApiResponse<{ assignedCount: number }>> {
  return api.post<ApiResponse<{ assignedCount: number }>>('/customers/bulk-tags', { customerIds, tagIds });
}
