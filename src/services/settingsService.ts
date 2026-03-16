import { api } from './api';
import { ApiResponse } from '../types/api';

/**
 * Settings Service
 *
 * Provides API functions for business settings including:
 * - Taxes
 * - Tax Groups
 * - Payment Options
 * - Charges
 * - Reasons
 * - Business Preferences
 * - Business Profile
 *
 * All endpoints are under /settings base path
 */

// ============================================
// Type Definitions
// ============================================

// Enums
export type PaymentType = 'Cash' | 'Card' | 'UPI' | 'Wallet' | 'Other';
export type ChargeType = 'Percentage' | 'Fixed';
export type ChargeApplyTo = 'All' | 'DineIn' | 'TakeAway' | 'Delivery';
export type ReasonType = 'Discount' | 'BranchClose' | 'OrderCancel' | 'Refund' | 'NonChargeable' | 'InventoryAdjustment' | 'Reservation' | 'SalesReturn';

// Tax
export interface Tax {
  id: string;
  businessOwnerId: string;
  name: string;
  symbol?: string | null;
  percentage: number;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  status: string; // 'active' | 'inactive'
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaxInput {
  name: string;
  symbol?: string;
  percentage: number;
  country?: string;
  state?: string;
  city?: string;
  status?: string;
}

export interface UpdateTaxInput {
  name?: string;
  symbol?: string;
  percentage?: number;
  country?: string;
  state?: string;
  city?: string;
  status?: string;
}

// Tax Group
export interface TaxGroupItem {
  taxGroupId: string;
  taxId: string;
  tax: Tax;
}

export interface TaxGroup {
  id: string;
  businessOwnerId: string;
  name: string;
  status: string; // 'active' | 'inactive'
  createdAt: string;
  updatedAt: string;
  taxGroupItems?: TaxGroupItem[];
}

export interface CreateTaxGroupInput {
  name: string;
  status?: string;
  taxIds: string[]; // Array of tax IDs to include in the group
}

export interface UpdateTaxGroupInput {
  name?: string;
  status?: string;
  taxIds?: string[];
}

// Payment Option
export interface PaymentOption {
  id: string;
  businessOwnerId: string;
  name: string;
  type: PaymentType;
  isDefault: boolean;
  status: string; // 'active' | 'inactive'
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentOptionInput {
  name: string;
  type: PaymentType;
  isDefault?: boolean;
  status?: string;
}

export interface UpdatePaymentOptionInput {
  name?: string;
  type?: PaymentType;
  isDefault?: boolean;
  status?: string;
}

// Charge
export interface Charge {
  id: string;
  businessOwnerId: string;
  name: string;
  type: ChargeType;
  value: number;
  applyTo: ChargeApplyTo;
  status: string; // 'active' | 'inactive'
  createdAt: string;
  updatedAt: string;
}

export interface CreateChargeInput {
  name: string;
  type: ChargeType;
  value: number;
  applyTo: ChargeApplyTo;
  status?: string;
}

export interface UpdateChargeInput {
  name?: string;
  type?: ChargeType;
  value?: number;
  applyTo?: ChargeApplyTo;
  status?: string;
}

// Reason
export interface Reason {
  id: string;
  businessOwnerId: string;
  type: ReasonType;
  text: string;
  description?: string;
  status: string; // 'active' | 'inactive'
  createdAt: string;
  updatedAt: string;
}

export interface CreateReasonInput {
  type: ReasonType;
  text: string;
  description?: string;
  status?: string;
}

export interface UpdateReasonInput {
  type?: ReasonType;
  text?: string;
  description?: string;
  status?: string;
}

// Business Preferences
export interface BusinessPreferences {
  id: string;
  businessOwnerId: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  invoicePrefix: string;
  kotPrefix: string;
  autoAcceptOrders: boolean;
  enableReservations: boolean;
  settings?: any; // Additional flexible settings as JSON
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePreferencesInput {
  currency?: string;
  timezone?: string;
  dateFormat?: string;
  invoicePrefix?: string;
  kotPrefix?: string;
  autoAcceptOrders?: boolean;
  enableReservations?: boolean;
  settings?: any;
}

// Business Profile
export interface BusinessProfile {
  id: string;
  businessName: string;
  restaurantName?: string;
  ownerName?: string;
  brandName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  zipCode?: string;
  avatar?: string;
  logo?: string;
  website?: string;
  description?: string;
  [key: string]: any;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileInput {
  businessName?: string;
  restaurantName?: string;
  ownerName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  zipCode?: string;
  brandName?: string;
  avatar?: string;
  logo?: string;
  website?: string;
  description?: string;
  [key: string]: any;
}

// Subscription Plan
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration: number; // months (e.g. 1 = Monthly, 12 = Yearly)
  trialDays: number;
  features: any; // JSON field for plan features (string[] of feature names)
  maxBranches: number;
  status: string; // 'active' | 'inactive'
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionPlanInput {
  name: string;
  price: number;
  duration: number;
  trialDays?: number;
  features: string[];
  maxBranches: number;
  status?: string;
}

export interface UpdateSubscriptionPlanInput {
  name?: string;
  price?: number;
  duration?: number;
  trialDays?: number;
  features?: string[];
  maxBranches?: number;
  status?: string;
}

// Response types
export type TaxListResponse = ApiResponse<Tax[]>;
export type TaxResponse = ApiResponse<Tax>;
export type TaxGroupListResponse = ApiResponse<TaxGroup[]>;
export type TaxGroupResponse = ApiResponse<TaxGroup>;
export type PaymentOptionListResponse = ApiResponse<PaymentOption[]>;
export type PaymentOptionResponse = ApiResponse<PaymentOption>;
export type ChargeListResponse = ApiResponse<Charge[]>;
export type ChargeResponse = ApiResponse<Charge>;
export type ReasonListResponse = ApiResponse<Reason[]>;
export type ReasonResponse = ApiResponse<Reason>;
export type PreferencesResponse = ApiResponse<BusinessPreferences>;
export type ProfileResponse = ApiResponse<BusinessProfile>;
export type SubscriptionPlanListResponse = ApiResponse<SubscriptionPlan[]>;

// ============================================
// Tax API Functions
// ============================================

/**
 * Get all taxes
 * GET /api/v1/settings/taxes
 */
export const getTaxes = async (params?: { status?: string }): Promise<TaxListResponse> => {
  const response = await api.get<ApiResponse<Tax[]>>('/settings/taxes', { params });

  return {
    success: response.success,
    data: response.data || [],
  };
};

/**
 * Create a new tax
 * POST /api/v1/settings/taxes
 */
export const createTax = async (input: CreateTaxInput): Promise<TaxResponse> => {
  const response = await api.post<ApiResponse<Tax>>('/settings/taxes', input);

  return {
    success: response.success,
    data: response.data as Tax,
    message: response.message,
  };
};

/**
 * Update an existing tax
 * PUT /api/v1/settings/taxes/:id
 */
export const updateTax = async (id: string, input: UpdateTaxInput): Promise<TaxResponse> => {
  const response = await api.put<ApiResponse<Tax>>(`/settings/taxes/${id}`, input);

  return {
    success: response.success,
    data: response.data as Tax,
    message: response.message,
  };
};

/**
 * Delete a tax
 * DELETE /api/v1/settings/taxes/:id
 */
export const deleteTax = async (id: string): Promise<ApiResponse<void>> => {
  const response = await api.delete<ApiResponse<void>>(`/settings/taxes/${id}`);

  return {
    success: response.success,
    message: response.message,
  };
};

// ============================================
// Tax Group API Functions
// ============================================

/**
 * Get all tax groups
 * GET /api/v1/settings/tax-groups
 */
export const getTaxGroups = async (params?: { status?: string }): Promise<TaxGroupListResponse> => {
  const response = await api.get<ApiResponse<TaxGroup[]>>('/settings/tax-groups', { params });

  return {
    success: response.success,
    data: response.data || [],
  };
};

/**
 * Create a new tax group
 * POST /api/v1/settings/tax-groups
 */
export const createTaxGroup = async (input: CreateTaxGroupInput): Promise<TaxGroupResponse> => {
  const response = await api.post<ApiResponse<TaxGroup>>('/settings/tax-groups', input);

  return {
    success: response.success,
    data: response.data as TaxGroup,
    message: response.message,
  };
};

/**
 * Update an existing tax group
 * PUT /api/v1/settings/tax-groups/:id
 */
export const updateTaxGroup = async (id: string, input: UpdateTaxGroupInput): Promise<TaxGroupResponse> => {
  const response = await api.put<ApiResponse<TaxGroup>>(`/settings/tax-groups/${id}`, input);

  return {
    success: response.success,
    data: response.data as TaxGroup,
    message: response.message,
  };
};

/**
 * Delete a tax group
 * DELETE /api/v1/settings/tax-groups/:id
 */
export const deleteTaxGroup = async (id: string): Promise<ApiResponse<void>> => {
  const response = await api.delete<ApiResponse<void>>(`/settings/tax-groups/${id}`);

  return {
    success: response.success,
    message: response.message,
  };
};

// ============================================
// Payment Option API Functions
// ============================================

/**
 * Get all payment options
 * GET /api/v1/settings/payment-options
 */
export const getPaymentOptions = async (params?: { status?: string }): Promise<PaymentOptionListResponse> => {
  const response = await api.get<ApiResponse<PaymentOption[]>>('/settings/payment-options', { params });

  return {
    success: response.success,
    data: response.data || [],
  };
};

/**
 * Create a new payment option
 * POST /api/v1/settings/payment-options
 */
export const createPaymentOption = async (input: CreatePaymentOptionInput): Promise<PaymentOptionResponse> => {
  const response = await api.post<ApiResponse<PaymentOption>>('/settings/payment-options', input);

  return {
    success: response.success,
    data: response.data as PaymentOption,
    message: response.message,
  };
};

/**
 * Update an existing payment option
 * PUT /api/v1/settings/payment-options/:id
 */
export const updatePaymentOption = async (id: string, input: UpdatePaymentOptionInput): Promise<PaymentOptionResponse> => {
  const response = await api.put<ApiResponse<PaymentOption>>(`/settings/payment-options/${id}`, input);

  return {
    success: response.success,
    data: response.data as PaymentOption,
    message: response.message,
  };
};

/**
 * Delete a payment option
 * DELETE /api/v1/settings/payment-options/:id
 */
export const deletePaymentOption = async (id: string): Promise<ApiResponse<void>> => {
  const response = await api.delete<ApiResponse<void>>(`/settings/payment-options/${id}`);

  return {
    success: response.success,
    message: response.message,
  };
};

// ============================================
// Charge API Functions
// ============================================

/**
 * Get all charges
 * GET /api/v1/settings/charges
 */
export const getCharges = async (params?: { status?: string }): Promise<ChargeListResponse> => {
  const response = await api.get<ApiResponse<Charge[]>>('/settings/charges', { params });

  return {
    success: response.success,
    data: response.data || [],
  };
};

/**
 * Create a new charge
 * POST /api/v1/settings/charges
 */
export const createCharge = async (input: CreateChargeInput): Promise<ChargeResponse> => {
  const response = await api.post<ApiResponse<Charge>>('/settings/charges', input);

  return {
    success: response.success,
    data: response.data as Charge,
    message: response.message,
  };
};

/**
 * Update an existing charge
 * PUT /api/v1/settings/charges/:id
 */
export const updateCharge = async (id: string, input: UpdateChargeInput): Promise<ChargeResponse> => {
  const response = await api.put<ApiResponse<Charge>>(`/settings/charges/${id}`, input);

  return {
    success: response.success,
    data: response.data as Charge,
    message: response.message,
  };
};

/**
 * Delete a charge
 * DELETE /api/v1/settings/charges/:id
 */
export const deleteCharge = async (id: string): Promise<ApiResponse<void>> => {
  const response = await api.delete<ApiResponse<void>>(`/settings/charges/${id}`);

  return {
    success: response.success,
    message: response.message,
  };
};

// ============================================
// Reason API Functions
// ============================================

/**
 * Get all reasons
 * GET /api/v1/settings/reasons
 */
export const getReasons = async (params?: { type?: ReasonType; status?: string }): Promise<ReasonListResponse> => {
  const response = await api.get<ApiResponse<Reason[]>>('/settings/reasons', { params });

  return {
    success: response.success,
    data: response.data || [],
  };
};

/**
 * Create a new reason
 * POST /api/v1/settings/reasons
 */
export const createReason = async (input: CreateReasonInput): Promise<ReasonResponse> => {
  const response = await api.post<ApiResponse<Reason>>('/settings/reasons', input);

  return {
    success: response.success,
    data: response.data as Reason,
    message: response.message,
  };
};

/**
 * Update an existing reason
 * PUT /api/v1/settings/reasons/:id
 */
export const updateReason = async (id: string, input: UpdateReasonInput): Promise<ReasonResponse> => {
  const response = await api.put<ApiResponse<Reason>>(`/settings/reasons/${id}`, input);

  return {
    success: response.success,
    data: response.data as Reason,
    message: response.message,
  };
};

/**
 * Delete a reason
 * DELETE /api/v1/settings/reasons/:id
 */
export const deleteReason = async (id: string): Promise<ApiResponse<void>> => {
  const response = await api.delete<ApiResponse<void>>(`/settings/reasons/${id}`);

  return {
    success: response.success,
    message: response.message,
  };
};

// ============================================
// Business Preferences API Functions
// ============================================

/**
 * Get business preferences
 * GET /api/v1/settings/preferences
 */
export const getPreferences = async (): Promise<PreferencesResponse> => {
  const response = await api.get<ApiResponse<BusinessPreferences>>('/settings/preferences');

  return {
    success: response.success,
    data: response.data as BusinessPreferences,
  };
};

/**
 * Update business preferences
 * PUT /api/v1/settings/preferences
 */
export const updatePreferences = async (input: UpdatePreferencesInput): Promise<PreferencesResponse> => {
  const response = await api.put<ApiResponse<BusinessPreferences>>('/settings/preferences', input);

  return {
    success: response.success,
    data: response.data as BusinessPreferences,
    message: response.message,
  };
};

// ============================================
// Business Profile API Functions
// ============================================

/**
 * Get business profile
 * GET /api/v1/settings/profile
 */
export const getProfile = async (): Promise<ProfileResponse> => {
  const response = await api.get<ApiResponse<BusinessProfile>>('/settings/profile');
  const rawProfile = response.data as BusinessProfile | undefined;

  const normalizedProfile = rawProfile
    ? {
        ...rawProfile,
        businessName: rawProfile.businessName || rawProfile.restaurantName || "",
        restaurantName: rawProfile.restaurantName || rawProfile.businessName || "",
        brandName: rawProfile.brandName || rawProfile.ownerName || "",
        ownerName: rawProfile.ownerName || rawProfile.brandName || "",
        postalCode: rawProfile.postalCode || rawProfile.zipCode || "",
        zipCode: rawProfile.zipCode || rawProfile.postalCode || "",
        logo: rawProfile.logo || rawProfile.avatar || "",
        avatar: rawProfile.avatar || rawProfile.logo || "",
      }
    : undefined;

  return {
    success: response.success,
    data: normalizedProfile as BusinessProfile,
  };
};

/**
 * Update business profile
 * PUT /api/v1/settings/profile
 */
export const updateProfile = async (input: UpdateProfileInput): Promise<ProfileResponse> => {
  const payload = {
    restaurantName: input.businessName ?? input.restaurantName,
    ownerName: input.brandName ?? input.ownerName,
    phone: input.phone,
    businessType: input.businessType,
    country: input.country,
    state: input.state,
    city: input.city,
    zipCode: input.postalCode ?? input.zipCode,
    address: input.address,
    avatar: input.logo ?? input.avatar,
    website: input.website,
    description: input.description,
    email: input.email,
  };

  const response = await api.put<ApiResponse<BusinessProfile>>('/settings/profile', payload);
  const rawProfile = response.data as BusinessProfile | undefined;
  const normalizedProfile = rawProfile
    ? {
        ...rawProfile,
        businessName: rawProfile.businessName || rawProfile.restaurantName || payload.restaurantName || "",
        restaurantName: rawProfile.restaurantName || rawProfile.businessName || payload.restaurantName || "",
        brandName: rawProfile.brandName || rawProfile.ownerName || payload.ownerName || "",
        ownerName: rawProfile.ownerName || rawProfile.brandName || payload.ownerName || "",
        postalCode: rawProfile.postalCode || rawProfile.zipCode || payload.zipCode || "",
        zipCode: rawProfile.zipCode || rawProfile.postalCode || payload.zipCode || "",
        logo: rawProfile.logo || rawProfile.avatar || payload.avatar || "",
        avatar: rawProfile.avatar || rawProfile.logo || payload.avatar || "",
      }
    : undefined;

  return {
    success: response.success,
    data: normalizedProfile as BusinessProfile,
    message: response.message,
  };
};

// ============================================
// Subscription Plan API Functions
// ============================================

/**
 * Get all subscription plans
 * GET /api/v1/settings/subscription-plans
 */
export const getSubscriptionPlans = async (params?: { status?: string }): Promise<ApiResponse<{ plans: SubscriptionPlan[]; total: number }>> => {
  return api.get<ApiResponse<{ plans: SubscriptionPlan[]; total: number }>>('/super-admin/subscription-plans', { params });
};

/**
 * Create a subscription plan
 * POST /api/v1/super-admin/subscription-plans
 */
export const createSubscriptionPlan = async (data: CreateSubscriptionPlanInput): Promise<ApiResponse<SubscriptionPlan>> => {
  return api.post<ApiResponse<SubscriptionPlan>>('/super-admin/subscription-plans', data);
};

/**
 * Update a subscription plan
 * PUT /api/v1/super-admin/subscription-plans/:id
 */
export const updateSubscriptionPlan = async (id: string, data: UpdateSubscriptionPlanInput): Promise<ApiResponse<SubscriptionPlan>> => {
  return api.put<ApiResponse<SubscriptionPlan>>(`/super-admin/subscription-plans/${id}`, data);
};

/**
 * Delete a subscription plan
 * DELETE /api/v1/super-admin/subscription-plans/:id
 */
export const deleteSubscriptionPlanApi = async (id: string): Promise<ApiResponse> => {
  return api.delete<ApiResponse>(`/super-admin/subscription-plans/${id}`);
};

// ============================================
// Channel Configuration
// ============================================

/**
 * Channel Interface - Sales channels for pricing and images
 */
export interface Channel {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}

/**
 * Get all active channels
 * GET /api/v1/settings/sales-channels
 */
export const getChannels = async (): Promise<ApiResponse<Channel[]>> => {
  const response = await api.get<ApiResponse<SalesChannel[]>>('/settings/sales-channels');

  return {
    success: response.success,
    data: (response.data || []).map((sc) => ({
      id: sc.id,
      name: sc.name,
      status: sc.enabled ? 'active' : 'inactive' as 'active' | 'inactive',
    })),
  };
};

// ============================================
// Subscription Info API Functions
// ============================================

/**
 * Subscription Info Interface - Current user's subscription
 */
export interface SubscriptionInfo {
  planId: string;
  planName: string;
  planPrice: number;
  maxBranches: number;
  currentBranches: number;
  subscriptionStartDate: Date | null;
  subscriptionEndDate: Date | null;
  features: unknown;
}

export type SubscriptionInfoResponse = ApiResponse<SubscriptionInfo>;

/**
 * Get current user's subscription info
 * Fetches subscription data from getCurrentUser endpoint
 */
export const getSubscription = async (): Promise<SubscriptionInfoResponse> => {
  try {
    const response = await api.get<ApiResponse<{
      id: string;
      userType: string;
      branches?: { id: string }[];
      plan?: {
        id: string;
        name: string;
        price: unknown;
        maxBranches: number;
        features: unknown;
        subscriptionStartDate: Date | null;
        subscriptionEndDate: Date | null;
      } | null;
    }>>('/auth/me');

    if (!response.success || !response.data) {
      return {
        success: false,
        error: {
          code: 'FETCH_SUBSCRIPTION_FAILED',
          message: 'Failed to fetch subscription info',
        },
      };
    }

    const user = response.data;

    // Check if user has a plan
    if (!user.plan) {
      return {
        success: false,
        error: {
          code: 'NO_SUBSCRIPTION',
          message: 'No active subscription found',
        },
      };
    }

    const subscriptionInfo: SubscriptionInfo = {
      planId: user.plan.id,
      planName: user.plan.name,
      planPrice: typeof user.plan.price === 'number' ? user.plan.price : parseFloat(String(user.plan.price)),
      maxBranches: user.plan.maxBranches,
      currentBranches: user.branches?.length || 0,
      subscriptionStartDate: user.plan.subscriptionStartDate,
      subscriptionEndDate: user.plan.subscriptionEndDate,
      features: user.plan.features,
    };

    return {
      success: true,
      data: subscriptionInfo,
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: {
        code: 'FETCH_SUBSCRIPTION_FAILED',
        message: error instanceof Error ? error.message : 'Failed to fetch subscription info',
      },
    };
  }
};

// ============================================
// Sales Channel API Functions (US-133)
// ============================================

/**
 * Sales Channel Interface
 */
export interface SalesChannel {
  id: string;
  businessOwnerId: string;
  name: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSalesChannelInput {
  enabled: boolean;
}

export type SalesChannelListResponse = ApiResponse<SalesChannel[]>;
export type SalesChannelResponse = ApiResponse<SalesChannel>;

/**
 * Get all sales channels for the current business owner
 * GET /api/v1/settings/sales-channels
 */
export const getSalesChannels = async (): Promise<SalesChannelListResponse> => {
  const response = await api.get<ApiResponse<SalesChannel[]>>('/settings/sales-channels');

  return {
    success: response.success,
    data: response.data || [],
  };
};

/**
 * Update a sales channel's enabled status
 * PUT /api/v1/settings/sales-channels/:id
 */
export const updateSalesChannel = async (id: string, input: UpdateSalesChannelInput): Promise<SalesChannelResponse> => {
  const response = await api.put<ApiResponse<SalesChannel>>(`/settings/sales-channels/${id}`, input);

  return {
    success: response.success,
    data: response.data as SalesChannel,
    message: response.message,
  };
};

// ============================================
// Aggregator API Functions (US-133)
// ============================================

/**
 * Aggregator Interface
 */
export interface Aggregator {
  id: string;
  businessOwnerId: string;
  name: string;
  logo?: string | null;
  merchantId?: string | null;
  apiKey?: string | null;
  apiEndpoint?: string | null;
  callbackUrl?: string | null;
  isConnected: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateAggregatorInput {
  merchantId?: string;
  apiKey?: string;
  apiEndpoint?: string;
  callbackUrl?: string;
  isConnected?: boolean;
}

export type AggregatorListResponse = ApiResponse<Aggregator[]>;
export type AggregatorResponse = ApiResponse<Aggregator>;

/**
 * Get all aggregators for the current business owner
 * GET /api/v1/settings/aggregators
 */
export const getAggregators = async (): Promise<AggregatorListResponse> => {
  const response = await api.get<ApiResponse<Aggregator[]>>('/settings/aggregators');

  return {
    success: response.success,
    data: response.data || [],
  };
};

/**
 * Update an aggregator's connection details
 * PUT /api/v1/settings/aggregators/:id
 */
export const updateAggregator = async (id: string, input: UpdateAggregatorInput): Promise<AggregatorResponse> => {
  const response = await api.put<ApiResponse<Aggregator>>(`/settings/aggregators/${id}`, input);

  return {
    success: response.success,
    data: response.data as Aggregator,
    message: response.message,
  };
};
