import { api } from './api';
import { ApiResponse, SearchParams } from '../types/api';

/**
 * Staff Entity from Backend
 */
export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  status: string;
  branchId: string;
  branchName: string;
  roleId: string;
  roleName: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Staff List Response
 */
export interface StaffListResponse {
  staff: Staff[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Role Entity from Backend
 */
export interface Role {
  id: string;
  name: string;
  permissions: Record<string, unknown>;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Role Response with staff count
 */
export interface RoleResponse extends Role {
  staffCount: number;
}

/**
 * Role List Response
 */
export interface RoleListResponse {
  roles: RoleResponse[];
  total: number;
}

/**
 * Staff Search Parameters
 */
export interface StaffSearchParams extends SearchParams {
  branchId?: string;
  roleId?: string;
  status?: string;
}

/**
 * Create Staff Data
 */
export interface CreateStaffData {
  branchId: string;
  roleId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  avatar?: string;
  status?: string;
}

/**
 * Update Staff Data
 */
export interface UpdateStaffData {
  branchId?: string;
  roleId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  phone?: string;
  avatar?: string;
  status?: string;
}

/**
 * Create Role Data
 */
export interface CreateRoleData {
  name: string;
  permissions: Record<string, unknown>;
  status?: string;
}

/**
 * Update Role Data
 */
export interface UpdateRoleData {
  name?: string;
  permissions?: Record<string, unknown>;
  status?: string;
}

// ============================================
// Staff API Functions
// ============================================

/**
 * Get paginated list of staff members
 * Supports filtering by branchId, roleId, status
 */
export async function getStaff(
  params?: StaffSearchParams
): Promise<ApiResponse<StaffListResponse>> {
  const queryParams = new URLSearchParams();

  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.branchId) queryParams.append('branchId', params.branchId);
  if (params?.roleId) queryParams.append('roleId', params.roleId);
  if (params?.status) queryParams.append('status', params.status);

  const query = queryParams.toString();
  const url = `/resources/staff${query ? `?${query}` : ''}`;

  return api.get<ApiResponse<StaffListResponse>>(url);
}

/**
 * Get single staff member by ID
 * Note: Backend doesn't have a specific GET /:id endpoint, but we can use the list endpoint
 * or use the update endpoint to retrieve a single staff member
 */
export async function getStaffMember(id: string): Promise<ApiResponse<Staff>> {
  // For now, we'll use the list endpoint and filter client-side
  // Or the backend should add a GET /:id endpoint
  return api.get<ApiResponse<Staff>>(`/resources/staff/${id}`);
}

/**
 * Create a new staff member
 * Required: branchId, roleId, firstName, lastName, email, password
 */
export async function createStaff(
  data: CreateStaffData
): Promise<ApiResponse<Staff>> {
  return api.post<ApiResponse<Staff>>('/resources/staff', data);
}

/**
 * Update an existing staff member
 * All fields optional except id
 */
export async function updateStaff(
  id: string,
  data: UpdateStaffData
): Promise<ApiResponse<Staff>> {
  return api.put<ApiResponse<Staff>>(`/resources/staff/${id}`, data);
}

/**
 * Delete a staff member
 */
export async function deleteStaff(id: string): Promise<ApiResponse<void>> {
  return api.delete<ApiResponse<void>>(`/resources/staff/${id}`);
}

/**
 * Toggle staff status (active/inactive)
 * PATCH /resources/staff/:id/status
 */
export async function toggleStatus(
  id: string,
  status: string
): Promise<ApiResponse<Staff>> {
  return api.patch<ApiResponse<Staff>>(`/resources/staff/${id}/status`, {
    status,
  });
}

// ============================================
// Role API Functions
// ============================================

/**
 * Get all roles for the tenant
 * Optionally filter by status
 */
export async function getRoles(status?: string): Promise<ApiResponse<RoleListResponse>> {
  const queryParams = new URLSearchParams();

  if (status) queryParams.append('status', status);

  const query = queryParams.toString();
  const url = `/resources/roles${query ? `?${query}` : ''}`;

  return api.get<ApiResponse<RoleListResponse>>(url);
}

/**
 * Get single role by ID
 * Note: Backend doesn't have a specific GET /:id endpoint
 */
export async function getRole(id: string): Promise<ApiResponse<Role>> {
  return api.get<ApiResponse<Role>>(`/resources/roles/${id}`);
}

/**
 * Create a new role
 * Required: name, permissions (JSON object)
 * Permissions structure: { module: { action: boolean } }
 */
export async function createRole(
  data: CreateRoleData
): Promise<ApiResponse<Role>> {
  return api.post<ApiResponse<Role>>('/resources/roles', data);
}

/**
 * Update an existing role
 * All fields optional except id
 */
export async function updateRole(
  id: string,
  data: UpdateRoleData
): Promise<ApiResponse<Role>> {
  return api.put<ApiResponse<Role>>(`/resources/roles/${id}`, data);
}

/**
 * Delete a role
 * Prevents deletion if role has assigned staff
 */
export async function deleteRole(id: string): Promise<ApiResponse<void>> {
  return api.delete<ApiResponse<void>>(`/resources/roles/${id}`);
}
