import { api } from './api';
import { ApiResponse } from './authService';

export interface MenuVisibilityItem {
  id: string;
  userType: string;
  menuKey: string;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MenuVisibilityListResponse {
  items: MenuVisibilityItem[];
  total: number;
}

export interface MyMenuVisibilityResponse {
  visibleMenuKeys: string[];
}

export interface UpdateMenuVisibilityPayload {
  items: { userType: string; menuKey: string; isVisible: boolean }[];
}

/**
 * Get visible menu keys for the current authenticated user
 */
export function getMyMenuVisibility(): Promise<ApiResponse<MyMenuVisibilityResponse>> {
  return api.get<ApiResponse<MyMenuVisibilityResponse>>('/auth/menu-visibility');
}

/**
 * Get all menu visibility config (SuperAdmin only)
 */
export function getAllMenuVisibility(userType?: string): Promise<ApiResponse<MenuVisibilityListResponse>> {
  const params = userType ? `?userType=${userType}` : '';
  return api.get<ApiResponse<MenuVisibilityListResponse>>(`/super-admin/menu-visibility${params}`);
}

/**
 * Bulk update menu visibility config (SuperAdmin only)
 */
export function updateMenuVisibility(payload: UpdateMenuVisibilityPayload): Promise<ApiResponse<MenuVisibilityListResponse>> {
  return api.put<ApiResponse<MenuVisibilityListResponse>>('/super-admin/menu-visibility', payload);
}
