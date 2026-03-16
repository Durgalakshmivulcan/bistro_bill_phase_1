import { api } from './api';

/**
 * Table Management Service
 * Handles all table, floor, and table status-related API calls
 */

// ============================================
// Type Definitions
// ============================================

/**
 * Table Status Enum
 */
export enum TableStatus {
  AVAILABLE = 'Available',
  OCCUPIED = 'Occupied',
  RESERVED = 'Reserved',
  CLEANING = 'Cleaning',
  MAINTENANCE = 'Maintenance',
}

/**
 * Floor Interface
 */
export interface Floor {
  id: string;
  name: string;
  type?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  branch: {
    id: string;
    name: string;
  };
}

/**
 * Table Interface
 */
export interface Table {
  id: string;
  floorId: string;
  tableNumber: string;
  capacity: number;
  status: string;
  currentStatus: string;
  createdAt: string;
  updatedAt: string;
  floor: {
    id: string;
    name: string;
    branchId?: string;
  };
}

/**
 * Floor List Response
 */
export interface FloorListResponse {
  floors: Floor[];
  total: number;
}

/**
 * Table List Response
 */
export interface TableListResponse {
  tables: Table[];
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
// Floor Functions
// ============================================

/**
 * Get Floors for a Branch
 * GET /api/v1/resources/branches/:branchId/floors
 *
 * @param branchId - The ID of the branch
 * @param status - Optional filter by floor status
 * @returns Promise with floor list response
 */
export async function getFloors(
  branchId: string,
  status?: string
): Promise<ApiResponse<FloorListResponse>> {
  try {
    const queryParams = new URLSearchParams();
    if (status) queryParams.append('status', status);

    const query = queryParams.toString();
    const url = `/resources/branches/${branchId}/floors${query ? `?${query}` : ''}`;

    const response = await api.get<ApiResponse<any>>(url);
    const floors = Array.isArray(response.data?.floors) ? response.data.floors : [];
    return {
      ...response,
      data: {
        floors: floors.map((floor: any) => ({
          id: floor.id,
          name: floor.name,
          type: floor.type,
          status: floor.status,
          createdAt: floor.createdAt,
          updatedAt: floor.updatedAt,
          branch: floor.branch,
        })),
        total: response.data?.total ?? floors.length,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: error.code || 'FETCH_FLOORS_FAILED',
        message: error.message || 'Failed to fetch floors',
      },
    };
  }
}

// ============================================
// Table Functions
// ============================================

/**
 * Get Tables for a Floor
 * GET /api/v1/resources/floors/:floorId/tables
 *
 * @param floorId - The ID of the floor
 * @param status - Optional filter by table status
 * @param currentStatus - Optional filter by current table status
 * @returns Promise with table list response
 */
export async function getTables(
  floorId: string,
  status?: string
): Promise<ApiResponse<TableListResponse>> {
  try {
    const queryParams = new URLSearchParams();
    if (status) queryParams.append('status', status);

    const query = queryParams.toString();
    const url = `/resources/floors/${floorId}/tables${query ? `?${query}` : ''}`;

    const response = await api.get<ApiResponse<any>>(url);
    const rawTables = Array.isArray(response.data?.tables)
      ? response.data.tables
      : Array.isArray(response.data)
        ? response.data
        : [];

    return {
      ...response,
      data: {
        tables: rawTables.map((table: any) => ({
          id: table.id,
          floorId: table.floorId,
          tableNumber: table.label,
          capacity: table.chairs,
          status: table.status,
          currentStatus: table.status,
          createdAt: table.createdAt,
          updatedAt: table.updatedAt,
          floor: {
            id: table.floor?.id || table.floorId,
            name: table.floor?.name || "",
            branchId: table.floor?.branchId,
          },
        })),
        total: response.data?.total ?? rawTables.length,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: error.code || 'FETCH_TABLES_FAILED',
        message: error.message || 'Failed to fetch tables',
      },
    };
  }
}

/**
 * Update Table Status
 * PATCH /api/v1/resources/tables/:id/status
 *
 * @param tableId - The ID of the table to update
 * @param status - The new status for the table
 * @returns Promise with updated table response
 */
export async function updateTableStatus(
  tableId: string,
  status: string
): Promise<ApiResponse<{ table: Table }>> {
  try {
    const response = await api.patch<ApiResponse<{ table: Table }>>(
      `/resources/tables/${tableId}/status`,
      { currentStatus: status }
    );
    return response;
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: error.code || 'UPDATE_TABLE_STATUS_FAILED',
        message: error.message || 'Failed to update table status',
      },
    };
  }
}
