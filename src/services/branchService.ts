import { api } from './api';
import { ApiResponse, SearchParams } from '../types/api';

/**
 * Branch Entity from Backend
 */
export interface Branch {
  id: string;
  name: string;
  code: string | null;
  parentBranchId: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zipCode: string | null;
  isMainBranch: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Branch Response with counts
 */
export interface BranchResponse extends Branch {
  staffCount: number;
  tableCount: number;
  kitchenCount: number;
}

/**
 * Branch List Response
 */
export interface BranchListResponse {
  branches: BranchResponse[];
  total: number;
}

/**
 * Branch Search Parameters
 */
export interface BranchSearchParams extends SearchParams {
  status?: string;
}

/**
 * Create Branch Data
 */
export interface CreateBranchData {
  name: string;
  address: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  status?: string;
}

/**
 * Update Branch Data
 */
export interface UpdateBranchData {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  status?: string;
}

// ============================================
// Business Hours Types
// ============================================

/**
 * Business Hours Info
 */
export interface BusinessHoursInfo {
  id: string;
  dayOfWeek: number;
  dayName: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

/**
 * Business Hours Response
 */
export interface BusinessHoursResponse {
  branchId: string;
  branchName: string;
  businessHours: BusinessHoursInfo[];
}

/**
 * Business Hours Input for Update
 */
export interface BusinessHoursInput {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

// ============================================
// Kitchen Types
// ============================================

/**
 * Kitchen Entity from Backend
 */
export interface Kitchen {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  branch: {
    id: string;
    name: string;
  };
}

/**
 * Kitchen List Response
 */
export interface KitchenListResponse {
  kitchens: Kitchen[];
  total: number;
}

/**
 * Create Kitchen Data
 */
export interface CreateKitchenData {
  branchId: string;
  name: string;
  description?: string;
  status?: string;
}

/**
 * Update Kitchen Data
 */
export interface UpdateKitchenData {
  name?: string;
  description?: string;
  status?: string;
}

// ============================================
// Floor Types
// ============================================

/**
 * Floor Entity from Backend
 */
export interface Floor {
  id: string;
  name: string;
  floorNumber: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  branch: {
    id: string;
    name: string;
  };
  tableCount: number;
}

/**
 * Floor List Response
 */
export interface FloorListResponse {
  floors: Floor[];
  total: number;
}

/**
 * Create Floor Data
 */
export interface CreateFloorData {
  branchId: string;
  name: string;
  floorNumber: number;
  status?: string;
}

/**
 * Update Floor Data
 */
export interface UpdateFloorData {
  name?: string;
  floorNumber?: number;
  status?: string;
}

// ============================================
// Table Types
// ============================================

/**
 * Table Entity from Backend
 */
export interface Table {
  id: string;
  tableNumber: string;
  capacity: number;
  status: string;
  currentStatus: string;
  createdAt: string;
  updatedAt: string;
  floor: {
    id: string;
    name: string;
    branch: {
      id: string;
      name: string;
    };
  };
}

/**
 * Table List Response
 */
export interface TableListResponse {
  tables: Table[];
  total: number;
}

/**
 * Create Table Data
 */
export interface CreateTableData {
  floorId: string;
  tableNumber: string;
  capacity: number;
  status?: string;
  currentStatus?: string;
}

/**
 * Update Table Data
 */
export interface UpdateTableData {
  tableNumber?: string;
  capacity?: number;
  status?: string;
  currentStatus?: string;
}

// ============================================
// Room Types
// ============================================

/**
 * Room Entity from Backend
 */
export interface Room {
  id: string;
  name: string;
  roomNumber: string;
  capacity: number;
  status: string;
  currentStatus: string;
  hourlyRate: number | null;
  createdAt: string;
  updatedAt: string;
  branch: {
    id: string;
    name: string;
  };
}

/**
 * Room List Response
 */
export interface RoomListResponse {
  rooms: Room[];
  total: number;
}

/**
 * Create Room Data
 */
export interface CreateRoomData {
  branchId: string;
  name: string;
  roomNumber: string;
  capacity: number;
  hourlyRate?: number;
  status?: string;
  currentStatus?: string;
}

/**
 * Update Room Data
 */
export interface UpdateRoomData {
  name?: string;
  roomNumber?: string;
  capacity?: number;
  hourlyRate?: number;
  status?: string;
  currentStatus?: string;
}

// ============================================
// Branch API Functions
// ============================================

/**
 * Get list of branches
 * Supports filtering by status
 */
export async function getBranches(
  params?: BranchSearchParams
): Promise<ApiResponse<BranchListResponse>> {
  const queryParams = new URLSearchParams();

  if (params?.status) queryParams.append('status', params.status.toLowerCase());

  const query = queryParams.toString();
  const url = `/resources/branches${query ? `?${query}` : ''}`;

  return api.get<ApiResponse<BranchListResponse>>(url);
}

/**
 * Get single branch by ID
 * Note: Backend doesn't have a specific GET /:id endpoint
 * We can fetch the list and filter client-side or add the endpoint later
 */
export async function getBranch(id: string): Promise<ApiResponse<BranchResponse>> {
  // For now, fetch all branches and filter
  const response = await getBranches();

  if (response.success && response.data) {
    const branch = response.data.branches.find(b => b.id === id);
    if (branch) {
      return {
        success: true,
        data: branch,
      };
    }
  }

  return {
    success: false,
    error: {
      message: 'Branch not found',
      code: 'NOT_FOUND',
    },
  };
}

/**
 * Create a new branch
 * Required: name, address
 */
export async function createBranch(
  data: CreateBranchData
): Promise<ApiResponse<{ branch: BranchResponse }>> {
  return api.post<ApiResponse<{ branch: BranchResponse }>>('/resources/branches', data);
}

/**
 * Update an existing branch
 * All fields optional except id
 */
export async function updateBranch(
  id: string,
  data: UpdateBranchData
): Promise<ApiResponse<{ branch: BranchResponse }>> {
  return api.put<ApiResponse<{ branch: BranchResponse }>>(`/resources/branches/${id}`, data);
}

/**
 * Delete a branch
 * Cannot delete main branch
 */
export async function deleteBranch(id: string): Promise<ApiResponse<void>> {
  return api.delete<ApiResponse<void>>(`/resources/branches/${id}`);
}

// ============================================
// Business Hours API Functions
// ============================================

/**
 * Get business hours for a branch
 * Returns all 7 days with their hours or defaults
 */
export async function getBusinessHours(
  branchId: string
): Promise<ApiResponse<BusinessHoursResponse>> {
  return api.get<ApiResponse<BusinessHoursResponse>>(`/resources/branches/${branchId}/hours`);
}

/**
 * Bulk update business hours for all 7 days
 * Accepts array of 7 days with: dayOfWeek, openTime, closeTime, isClosed
 */
export async function updateBusinessHours(
  branchId: string,
  hours: BusinessHoursInput[]
): Promise<ApiResponse<BusinessHoursResponse>> {
  return api.put<ApiResponse<BusinessHoursResponse>>(
    `/resources/branches/${branchId}/hours`,
    { hours }
  );
}

// ============================================
// Kitchen API Functions
// ============================================

/**
 * Get list of kitchens for a branch
 * Supports filtering by status
 */
export async function getKitchens(
  branchId: string,
  status?: string
): Promise<ApiResponse<KitchenListResponse>> {
  const queryParams = new URLSearchParams();

  if (status) queryParams.append('status', status);

  const query = queryParams.toString();
  const url = `/resources/branches/${branchId}/kitchens${query ? `?${query}` : ''}`;

  return api.get<ApiResponse<KitchenListResponse>>(url);
}

/**
 * Create a new kitchen
 * Required: branchId, name
 */
export async function createKitchen(
  data: CreateKitchenData
): Promise<ApiResponse<{ kitchen: Kitchen }>> {
  return api.post<ApiResponse<{ kitchen: Kitchen }>>('/resources/kitchens', data);
}

/**
 * Update an existing kitchen
 * All fields optional except id
 */
export async function updateKitchen(
  id: string,
  data: UpdateKitchenData
): Promise<ApiResponse<{ kitchen: Kitchen }>> {
  return api.put<ApiResponse<{ kitchen: Kitchen }>>(`/resources/kitchens/${id}`, data);
}

/**
 * Delete a kitchen
 */
export async function deleteKitchen(id: string): Promise<ApiResponse<void>> {
  return api.delete<ApiResponse<void>>(`/resources/kitchens/${id}`);
}

// ============================================
// Floor API Functions
// ============================================

/**
 * Get list of floors for a branch
 * Supports filtering by status
 */
export async function getFloors(
  branchId: string,
  status?: string
): Promise<ApiResponse<FloorListResponse>> {
  const queryParams = new URLSearchParams();

  if (status) queryParams.append('status', status);

  const query = queryParams.toString();
  const url = `/resources/branches/${branchId}/floors${query ? `?${query}` : ''}`;

  return api.get<ApiResponse<FloorListResponse>>(url);
}

/**
 * Create a new floor
 * Required: branchId, name, floorNumber
 */
export async function createFloor(
  data: CreateFloorData
): Promise<ApiResponse<{ floor: Floor }>> {
  return api.post<ApiResponse<{ floor: Floor }>>('/resources/floors', data);
}

/**
 * Update an existing floor
 * All fields optional except id
 */
export async function updateFloor(
  id: string,
  data: UpdateFloorData
): Promise<ApiResponse<{ floor: Floor }>> {
  return api.put<ApiResponse<{ floor: Floor }>>(`/resources/floors/${id}`, data);
}

/**
 * Delete a floor
 */
export async function deleteFloor(id: string): Promise<ApiResponse<void>> {
  return api.delete<ApiResponse<void>>(`/resources/floors/${id}`);
}

// ============================================
// Table API Functions
// ============================================

/**
 * Get list of tables for a floor
 * Supports filtering by status and currentStatus
 */
export async function getTables(
  floorId: string,
  status?: string,
  currentStatus?: string
): Promise<ApiResponse<TableListResponse>> {
  const queryParams = new URLSearchParams();

  if (status) queryParams.append('status', status);
  if (currentStatus) queryParams.append('currentStatus', currentStatus);

  const query = queryParams.toString();
  const url = `/resources/floors/${floorId}/tables${query ? `?${query}` : ''}`;

  return api.get<ApiResponse<TableListResponse>>(url);
}

/**
 * Create a new table
 * Required: floorId, tableNumber, capacity
 */
export async function createTable(
  data: CreateTableData
): Promise<ApiResponse<{ table: Table }>> {
  return api.post<ApiResponse<{ table: Table }>>('/resources/tables', data);
}

/**
 * Update an existing table
 * All fields optional except id
 */
export async function updateTable(
  id: string,
  data: UpdateTableData
): Promise<ApiResponse<{ table: Table }>> {
  return api.put<ApiResponse<{ table: Table }>>(`/resources/tables/${id}`, data);
}

/**
 * Delete a table
 */
export async function deleteTable(id: string): Promise<ApiResponse<void>> {
  return api.delete<ApiResponse<void>>(`/resources/tables/${id}`);
}

/**
 * Update table status (occupied, available, reserved, etc.)
 * PATCH /resources/tables/:id/status
 */
export async function updateTableStatus(
  id: string,
  currentStatus: string
): Promise<ApiResponse<{ table: Table }>> {
  return api.patch<ApiResponse<{ table: Table }>>(`/resources/tables/${id}/status`, {
    currentStatus,
  });
}

// ============================================
// Room API Functions
// ============================================

/**
 * Get list of rooms for a branch
 * Supports filtering by status and currentStatus
 */
export async function getRooms(
  branchId: string,
  status?: string,
  currentStatus?: string
): Promise<ApiResponse<RoomListResponse>> {
  const queryParams = new URLSearchParams();

  if (status) queryParams.append('status', status);
  if (currentStatus) queryParams.append('currentStatus', currentStatus);

  const query = queryParams.toString();
  const url = `/resources/branches/${branchId}/rooms${query ? `?${query}` : ''}`;

  return api.get<ApiResponse<RoomListResponse>>(url);
}

/**
 * Create a new room
 * Required: branchId, name, roomNumber, capacity
 */
export async function createRoom(
  data: CreateRoomData
): Promise<ApiResponse<{ room: Room }>> {
  return api.post<ApiResponse<{ room: Room }>>('/resources/rooms', data);
}

/**
 * Update an existing room
 * All fields optional except id
 */
export async function updateRoom(
  id: string,
  data: UpdateRoomData
): Promise<ApiResponse<{ room: Room }>> {
  return api.put<ApiResponse<{ room: Room }>>(`/resources/rooms/${id}`, data);
}

/**
 * Delete a room
 */
export async function deleteRoom(id: string): Promise<ApiResponse<void>> {
  return api.delete<ApiResponse<void>>(`/resources/rooms/${id}`);
}
