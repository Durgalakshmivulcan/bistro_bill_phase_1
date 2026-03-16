import { api } from './api';
import { ApiResponse, PaginatedResponse, PaginationParams } from '../types/api';

/**
 * Reservation Service
 *
 * Provides API functions for reservation management including:
 * - Reservations (CRUD + Status updates)
 *
 * All endpoints are under /reservations base path
 */

// ============================================
// Type Definitions
// ============================================

export type ReservationStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';

export interface Reservation {
  id: string;
  branchId: string;
  tableId?: string | null;
  roomId?: string | null;
  customerId?: string | null;
  customerName: string;
  customerPhone: string;
  date: string; // ISO date string
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  guestCount: number;
  status: ReservationStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  // Populated relations
  table?: {
    id: string;
    label: string;
    floorId: string;
    floor?: {
      id: string;
      name: string;
      type: string;
    };
  } | null;
  room?: {
    id: string;
    name: string;
    capacity: number;
  } | null;
  customer?: {
    id: string;
    name: string;
    email?: string | null;
    phone: string;
  } | null;
}

export interface CreateReservationInput {
  branchId: string;
  tableId?: string | null;
  roomId?: string | null;
  customerId?: string | null;
  customerName: string;
  customerPhone: string;
  date: string; // ISO date string or YYYY-MM-DD
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  guestCount: number;
  notes?: string;
}

export interface UpdateReservationInput {
  tableId?: string | null;
  roomId?: string | null;
  customerName?: string;
  customerPhone?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  guestCount?: number;
  notes?: string;
}

export interface UpdateReservationStatusInput {
  status: ReservationStatus;
  reason?: string; // For cancelled status
  waitingTime?: number; // For waiting status (minutes)
  description?: string; // Additional notes for status change
}

export interface ReservationFilters extends PaginationParams {
  branchId?: string;
  status?: ReservationStatus;
  date?: string; // Filter by specific date
  startDate?: string; // Filter by date range
  endDate?: string;
  customerId?: string;
  tableId?: string;
  roomId?: string;
}

// Response types
export type ReservationListResponse = PaginatedResponse<Reservation>;
export type ReservationResponse = ApiResponse<Reservation>;

// ============================================
// API Functions
// ============================================

/**
 * Get all reservations with optional filters and pagination
 * GET /api/v1/reservations
 */
export const getReservations = async (
  params?: ReservationFilters
): Promise<ReservationListResponse> => {
  const response = await api.get<ApiResponse<{ reservations: Reservation[] }> & { pagination?: any }>(
    '/reservations',
    { params }
  );

  return {
    success: response.success,
    data: response.data?.reservations || [],
    pagination: response.pagination,
  };
};

/**
 * Get a single reservation by ID
 * GET /api/v1/reservations/:id
 */
export const getReservation = async (id: string): Promise<ReservationResponse> => {
  try {
    const response = await api.get<ApiResponse<{ reservation: Reservation }>>(
      `/reservations/${id}`
    );

    console.log("API getReservation response:", response);

    if (!response || !response.success) {
      return {
        success: false,
        data: undefined,
      };
    }

    return {
      success: true,
      data: response.data?.reservation,
    };
  } catch (error) {
    console.error("Error fetching reservation:", error);

    return {
      success: false,
      data: undefined,
    };
  }
};
/**
 * Create a new reservation
 * POST /api/v1/reservations
 */
export const createReservation = async (
  input: CreateReservationInput
): Promise<ReservationResponse> => {
  const response = await api.post<ApiResponse<{ reservation: Reservation }>>(
    '/reservations',
    input
  );

  return {
    success: response.success,
    data: response.data?.reservation as Reservation,
  };
};

/**
 * Update an existing reservation
 * PUT /api/v1/reservations/:id
 */
export const updateReservation = async (
  id: string,
  input: UpdateReservationInput
): Promise<ReservationResponse> => {
  const response = await api.put<ApiResponse<{ reservation: Reservation }>>(
    `/reservations/${id}`,
    input
  );

  return {
    success: response.success,
    data: response.data?.reservation as Reservation,
  };
};

/**
 * Delete a reservation
 * DELETE /api/v1/reservations/:id
 */
export const deleteReservation = async (id: string): Promise<ApiResponse<void>> => {
  const response = await api.delete<ApiResponse<void>>(`/reservations/${id}`);

  return {
    success: response.success,
    message: response.message,
  };
};

/**
 * Update reservation status
 * PATCH /api/v1/reservations/:id/status
 */
export const updateReservationStatus = async (
  id: string,
  input: UpdateReservationStatusInput
): Promise<ReservationResponse> => {
  const response = await api.patch<ApiResponse<{ reservation: Reservation }>>(
    `/reservations/${id}/status`,
    input
  );

  return {
    success: response.success,
    data: response.data?.reservation as Reservation,
  };
};
