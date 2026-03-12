import { api } from './api';
import { ApiResponse } from '../types/api';

/**
 * Super Admin Dashboard Statistics Response
 */
export interface SuperAdminDashboardStats {
  totalBusinessOwners: number;
  activeBusinessOwners: number;
  totalRevenue: number;
  leadsByStage: {
    NewRequest: number;
    InitialContacted: number;
    ScheduledDemo: number;
    Completed: number;
    ClosedWin: number;
    ClosedLoss: number;
  };
  recentSignups: Array<{
    id: string;
    email: string;
    ownerName: string;
    restaurantName: string;
    createdAt: Date;
    plan: {
      id: string;
      name: string;
    } | null;
  }>;
  planDistribution: Array<{
    planId: string;
    planName: string;
    count: number;
  }>;
}

/**
 * Get super admin dashboard statistics
 * Fetches platform-wide metrics including business owners, revenue, leads, and subscriptions
 */
export const getSuperAdminDashboardStats = async (): Promise<
  ApiResponse<SuperAdminDashboardStats>
> => {
  return api.get<ApiResponse<SuperAdminDashboardStats>>('/super-admin/dashboard/stats');
};

export const getSuperAdminDashboardStatsByDate = async (params?: {
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<SuperAdminDashboardStats>> => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  const qs = queryParams.toString();
  return api.get<ApiResponse<SuperAdminDashboardStats>>(
    `/super-admin/dashboard/stats${qs ? `?${qs}` : ''}`
  );
};

/* =========================================================
 * Business Owner Types & API Methods
 * ========================================================= */

export interface BusinessOwnerListItem {
  id: string;
  email: string;
  ownerName: string;
  restaurantName: string;
  phone: string | null;
  businessType: string | null;
  avatar: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  status: string;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  createdAt: string;
  plan: { id: string; name: string; price: number; maxBranches: number } | null;
  branchCount: number;
}

export interface BusinessOwnerDetail extends BusinessOwnerListItem {
  tinGstNumber: string | null;
  zipCode: string | null;
  address: string | null;
  updatedAt: string;
  branches: Array<{
    id: string;
    name: string;
    code: string | null;
    status: string;
  }>;
  staffCount: number;
  orderStatistics: {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BusinessOwnerListResponse {
  businessOwners: BusinessOwnerListItem[];
  pagination: PaginationMeta;
}

export interface BusinessOwnerFilters {
  status?: string;
  planId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateBusinessOwnerInput {
  email: string;
  password: string;
  ownerName: string;
  restaurantName: string;
  phone: string;
  businessType?: string;
  tinGstNumber?: string;
  country?: string;
  state?: string;
  city?: string;
  zipCode?: string;
  address?: string;
  planId?: string;
  subscriptionStartDate?: string | null;
  subscriptionEndDate?: string | null;
}

export interface UpdateBusinessOwnerInput {
  ownerName?: string;
  restaurantName?: string;
  phone?: string;
  email?: string;
  businessType?: string;
  tinGstNumber?: string;
  country?: string;
  state?: string;
  city?: string;
  zipCode?: string;
  address?: string;
  planId?: string;
  subscriptionStartDate?: string | null;
  subscriptionEndDate?: string | null;
}

/**
 * List business owners with filters and pagination
 */
export const getBusinessOwners = async (
  filters: BusinessOwnerFilters = {}
): Promise<ApiResponse<BusinessOwnerListResponse>> => {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.planId) params.set('planId', filters.planId);
  if (filters.search) params.set('search', filters.search);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  const qs = params.toString();
  return api.get<ApiResponse<BusinessOwnerListResponse>>(
    `/super-admin/business-owners${qs ? '?' + qs : ''}`
  );
};

/**
 * Get a single business owner by ID
 */
export const getBusinessOwner = async (
  id: string
): Promise<ApiResponse<BusinessOwnerDetail>> => {
  return api.get<ApiResponse<BusinessOwnerDetail>>(
    `/super-admin/business-owners/${id}`
  );
};

/**
 * Create a new business owner
 */
export const createBusinessOwnerApi = async (
  data: CreateBusinessOwnerInput,
  avatarFile?: File
): Promise<ApiResponse> => {
  if (avatarFile) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, String(value));
      }
    });
    formData.append('avatar', avatarFile);
    return api.post<ApiResponse>('/super-admin/business-owners', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
  return api.post<ApiResponse>('/super-admin/business-owners', data);
};

/**
 * Update a business owner
 */
export const updateBusinessOwnerApi = async (
  id: string,
  data: UpdateBusinessOwnerInput,
  avatarFile?: File
): Promise<ApiResponse> => {
  if (avatarFile) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, String(value));
      }
    });
    formData.append('avatar', avatarFile);
    return api.put<ApiResponse>(`/super-admin/business-owners/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
  return api.put<ApiResponse>(`/super-admin/business-owners/${id}`, data);
};

/**
 * Delete a business owner
 */
export const deleteBusinessOwnerApi = async (
  id: string
): Promise<ApiResponse> => {
  return api.delete<ApiResponse>(`/super-admin/business-owners/${id}`);
};

/**
 * Update business owner status (activate/deactivate)
 */
export const updateBusinessOwnerStatus = async (
  id: string,
  status: 'active' | 'inactive' | 'suspended'
): Promise<ApiResponse> => {
  return api.patch<ApiResponse>(
    `/super-admin/business-owners/${id}/status`,
    { status }
  );
};

/* =========================================================
 * Super Admin Profile API Methods
 * ========================================================= */

export interface UpdateSuperAdminProfileInput {
  name?: string;
  phone?: string;
}

export interface SuperAdminProfile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatar: string | null;
  userType: 'SuperAdmin';
  createdAt: string;
}

/**
 * Update super admin profile (name, phone, optional avatar file)
 */
export const updateSuperAdminProfile = async (
  data: { name: string; phone?: string },
  avatar?: File
): Promise<ApiResponse<SuperAdminProfile>> => {

  const formData = new FormData();
  formData.append("name", data.name);
  formData.append("phone", data.phone || "");

  if (avatar) {
    formData.append("avatar", avatar);
  }

  return api.put<ApiResponse<SuperAdminProfile>>(
    "/super-admin/profile",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
};
/**
 * Delete super admin avatar
 */
export const deleteSuperAdminAvatar = async (): Promise<ApiResponse> => {
  return api.delete<ApiResponse>('/super-admin/profile/avatar');
};

/* =========================================================
 * Subscription Orders API Methods
 * ========================================================= */

export interface SubscriptionOrder {
  id: string;
  orderId: string;
  restaurant: string;
  owner: string;
  businessType: string;
  plan: string;
  price: string;
  date: string;
  invoice: boolean;
  status: string;
}

export interface SubscriptionOrderListResponse {
  orders: SubscriptionOrder[];
  pagination: PaginationMeta;
}

export interface SubscriptionOrderFilters {
  businessType?: string;
  plan?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * List subscription orders with filters and pagination
 */
export const getSubscriptionOrders = async (
  filters: SubscriptionOrderFilters = {}
): Promise<ApiResponse<SubscriptionOrderListResponse>> => {
  const params = new URLSearchParams();
  if (filters.businessType) params.set('businessType', filters.businessType);
  if (filters.plan) params.set('plan', filters.plan);
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  const qs = params.toString();
  return api.get<ApiResponse<SubscriptionOrderListResponse>>(
    `/super-admin/orders${qs ? '?' + qs : ''}`
  );
};

/**
 * Delete a subscription order
 */
export const deleteSubscriptionOrder = async (
  id: string | number
): Promise<ApiResponse> => {
  return api.delete<ApiResponse>(`/super-admin/orders/${id}`);
};

/* =========================================================
 * SA Dashboard Monthly Stats & Top Restaurants
 * ========================================================= */

export interface MonthlyStatsResponse {
  labels: string[];
  earnings: number[];
  users: number[];
}

export interface TopRestaurant {
  id: string;
  restaurantName: string;
  ownerName: string;
  totalRevenue: number;
  orderCount: number;
  plan: string;
  status: string;
}

export interface TopRestaurantsResponse {
  restaurants: TopRestaurant[];
}

/**
 * Get monthly earnings and user registration stats for the SA dashboard chart
 */
export const getMonthlyStats = async (
  year?: number
): Promise<ApiResponse<MonthlyStatsResponse>> => {
  const qs = year ? `?year=${year}` : '';
  return api.get<ApiResponse<MonthlyStatsResponse>>(
    `/super-admin/dashboard/monthly-stats${qs}`
  );
};

/**
 * Get top 10 restaurants by total revenue
 */
export const getTopRestaurants = async (): Promise<
  ApiResponse<TopRestaurantsResponse>
> => {
  return api.get<ApiResponse<TopRestaurantsResponse>>(
    '/super-admin/dashboard/top-restaurants'
  );
};
