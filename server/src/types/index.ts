import { Request } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: PaginationMeta;
  error?: ApiError;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    userType: 'SuperAdmin' | 'BusinessOwner' | 'Staff';
    businessOwnerId?: string;
    branchId?: string;
  };
  /**
   * Tenant ID for multi-tenant data isolation.
   * Set by tenant middleware from req.user.businessOwnerId.
   * SuperAdmin users will have undefined tenantId (they can access all tenants).
   */
  tenantId?: string;
  /**
   * Array of branch IDs the user is allowed to access.
   * null means unrestricted (SuperAdmin).
   * Set by branchScope middleware.
   */
  branchScope?: string[] | null;
  /**
   * Array of kitchen IDs the user is allowed to access.
   * null means unrestricted (SuperAdmin).
   * Set by branchScope middleware.
   */
  kitchenScope?: string[] | null;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}
