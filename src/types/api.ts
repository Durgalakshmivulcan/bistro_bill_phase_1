/**
 * API Response Types
 *
 * Standard response wrappers and types for all API communication
 */

// Base API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
}

// Error Response
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, any>;
}

// Pagination metadata
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Paginated Response wrapper
export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
  message?: string;
  error?: ApiError;
}

// Request pagination parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// Search parameters
export interface SearchParams extends PaginationParams {
  search?: string;
  filters?: Record<string, any>;
}

// Success response helper type
export type SuccessResponse<T> = Required<Pick<ApiResponse<T>, 'success' | 'data'>> & Partial<Pick<ApiResponse<T>, 'message'>>;

// Error response helper type
export type ErrorResponse = Required<Pick<ApiResponse, 'success' | 'error'>> & Partial<Pick<ApiResponse, 'message'>>;
