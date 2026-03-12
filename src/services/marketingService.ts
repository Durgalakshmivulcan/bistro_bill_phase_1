import { api } from './api';
import { ApiResponse, SearchParams } from '../types/api';

// ============================================
// TYPES - Discount
// ============================================

export type DiscountType = 'OrderType' | 'ProductCategory' | 'Custom';
export type DiscountValueType = 'Percentage' | 'Fixed' | 'BOGO';
export type DiscountStatus = 'active' | 'inactive';

export interface UsageStats {
  usedCount: number;
  usageLimit: number | null;
  remainingUses: number | null;
}

export interface DiscountProduct {
  productId: string;
}

export interface Discount {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: DiscountType;
  valueType: DiscountValueType;
  value: number; // Decimal from Prisma converted to number
  minOrderAmount: number | null; // Decimal from Prisma converted to number
  maxDiscount: number | null; // Decimal from Prisma converted to number
  startDate: string | null; // ISO date
  endDate: string | null; // ISO date
  usageLimit: number | null;
  usedCount: number;
  status: DiscountStatus;
  usageStats: UsageStats;
  productCount: number; // computed from _count.discountProducts
  categoryCount: number; // computed from _count.discountCategories
  discountProducts?: DiscountProduct[]; // Product associations
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiscountData {
  code?: string; // auto-generated if not provided
  name: string;
  description?: string;
  type: DiscountType;
  valueType: DiscountValueType;
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  startDate?: string; // ISO date
  endDate?: string; // ISO date
  usageLimit?: number;
  status?: DiscountStatus;
  productIds?: string[];
  categoryIds?: string[];
}

export interface UpdateDiscountData {
  code?: string;
  name?: string;
  description?: string;
  type?: DiscountType;
  valueType?: DiscountValueType;
  value?: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  startDate?: string; // ISO date
  endDate?: string; // ISO date
  usageLimit?: number;
  status?: DiscountStatus;
  productIds?: string[];
  categoryIds?: string[];
}

export interface DiscountSearchParams extends SearchParams {
  status?: DiscountStatus;
  type?: DiscountType;
}

export interface ValidateDiscountData {
  code: string;
  orderTotal: number;
  orderItems?: Array<{
    productId: string;
    categoryId?: string;
  }>;
}

export interface ValidateDiscountResponse {
  isValid: boolean;
  reason?: string;
  message?: string;
  discount?: {
    id: string;
    code: string;
    name: string;
    type: DiscountType;
    valueType: DiscountValueType;
    value: number;
    minOrderAmount: number | null;
    maxDiscount: number | null;
  };
  calculatedDiscountAmount?: number;
}

// ============================================
// TYPES - Advertisement
// ============================================

export type AdvertisementStatus = 'active' | 'inactive';

export interface LinkedDiscount {
  id: string;
  code: string;
  name: string;
}

export interface Advertisement {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  startDate: string | null; // ISO date
  endDate: string | null; // ISO date
  status: AdvertisementStatus;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number; // click-through rate (%)
  conversionRate: number; // conversion rate (%)
  discountCount: number; // computed from _count.advertisementDiscounts
  linkedDiscounts: LinkedDiscount[]; // from advertisementDiscounts join
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdvertisementData {
  title: string;
  description?: string;
  image?: string;
  startDate?: string; // ISO date
  endDate?: string; // ISO date
  status?: AdvertisementStatus;
  discountIds?: string[];
}

export interface UpdateAdvertisementData {
  title?: string;
  description?: string;
  image?: string;
  startDate?: string; // ISO date
  endDate?: string; // ISO date
  status?: AdvertisementStatus;
  discountIds?: string[];
}

export interface AdvertisementSearchParams extends SearchParams {
  status?: AdvertisementStatus;
}

// ============================================
// TYPES - Feedback
// ============================================

export type FeedbackQuestionType = 'text' | 'rating' | 'multiple_choice' | 'checkbox';
export type FeedbackFormStatus = 'active' | 'inactive';

export interface FeedbackQuestion {
  id: string;
  type: FeedbackQuestionType;
  text: string;
  options?: string[];
  required: boolean;
}

export interface FeedbackForm {
  id: string;
  title: string;
  description: string | null;
  questions: FeedbackQuestion[]; // JSON field from Prisma
  qrCode: string | null;
  status: FeedbackFormStatus;
  responseCount: number; // computed from _count.feedbackResponses
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeedbackFormData {
  title: string;
  description?: string;
  questions: FeedbackQuestion[];
  status?: FeedbackFormStatus;
}

export interface UpdateFeedbackFormData {
  title?: string;
  description?: string;
  questions?: FeedbackQuestion[];
  status?: FeedbackFormStatus;
}

export interface CustomerInfo {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface FeedbackResponse {
  id: string;
  responses: Record<string, any>; // JSON object from Prisma
  rating: number | null;
  customer: CustomerInfo | null;
  submittedAt: string;
  createdAt: string;
}

export interface FeedbackResponsesParams {
  formId: string;
  startDate?: string; // ISO date
  endDate?: string; // ISO date
}

export interface PublicFeedbackForm {
  id: string;
  title: string;
  description: string | null;
  questions: FeedbackQuestion[];
  status: FeedbackFormStatus;
}

export interface SubmitPublicFeedbackData {
  responses: Record<string, any>;
  rating?: number;
  customerId?: string;
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
  };
}

// ============================================
// API FUNCTIONS - Discount
// ============================================

/**
 * Get all discounts with optional filters
 * GET /api/v1/marketing/discounts
 */
export const getDiscounts = async (params?: DiscountSearchParams): Promise<ApiResponse<Discount[]>> => {
  const response = await api.get<ApiResponse<Discount[]>>('/marketing/discounts', { params });
  return response;
};

/**
 * Get a single discount by ID
 * GET /api/v1/marketing/discounts/:id
 */
export const getDiscountById = async (id: string): Promise<ApiResponse<Discount>> => {
  // Backend currently exposes list/update/delete endpoints for discounts,
  // but not a dedicated GET by ID route. Fetch list and resolve client-side.
  const response = await getDiscounts();

  if (!response.success || !response.data) {
    return {
      success: false,
      error: response.error || { code: 'FETCH_FAILED', message: 'Failed to fetch discounts' },
      message: response.message,
    };
  }

  const discount = response.data.find((item) => item.id === id);
  if (!discount) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Discount not found' },
      message: 'Discount not found',
    };
  }

  return {
    success: true,
    data: discount,
    message: 'Discount fetched successfully',
  };
};

/**
 * Create a new discount
 * POST /api/v1/marketing/discounts
 */
export const createDiscount = async (data: CreateDiscountData): Promise<ApiResponse<Discount>> => {
  const response = await api.post<ApiResponse<Discount>>('/marketing/discounts', data);
  return response;
};

/**
 * Update an existing discount
 * PUT /api/v1/marketing/discounts/:id
 */
export const updateDiscount = async (id: string, data: UpdateDiscountData): Promise<ApiResponse<Discount>> => {
  const response = await api.put<ApiResponse<Discount>>(`/marketing/discounts/${id}`, data);
  return response;
};

/**
 * Delete a discount
 * DELETE /api/v1/marketing/discounts/:id
 */
export const deleteDiscount = async (id: string): Promise<ApiResponse<null>> => {
  const response = await api.delete<ApiResponse<null>>(`/marketing/discounts/${id}`);
  return response;
};

/**
 * Validate a discount code
 * POST /api/v1/marketing/discounts/validate
 */
export const validateDiscount = async (data: ValidateDiscountData): Promise<ApiResponse<ValidateDiscountResponse>> => {
  const response = await api.post<ApiResponse<ValidateDiscountResponse>>('/marketing/discounts/validate', data);
  return response;
};

/**
 * Get active discounts with product associations
 * GET /api/v1/marketing/discounts?status=active&type=ProductCategory
 * Filters discounts where startDate <= today <= endDate
 */
export const getActiveDiscounts = async (): Promise<ApiResponse<Discount[]>> => {
  const response = await api.get<ApiResponse<Discount[]>>('/marketing/discounts', {
    params: {
      status: 'active',
      type: 'ProductCategory',
    },
  });

  // Filter by date range (startDate <= today <= endDate)
  if (response.success && response.data) {
    const today = new Date();
    const activeDiscounts = response.data.filter((discount) => {
      // If startDate exists, check if today >= startDate
      if (discount.startDate) {
        const startDate = new Date(discount.startDate);
        if (today < startDate) {
          return false;
        }
      }

      // If endDate exists, check if today <= endDate
      if (discount.endDate) {
        const endDate = new Date(discount.endDate);
        if (today > endDate) {
          return false;
        }
      }

      return true;
    });

    return {
      ...response,
      data: activeDiscounts,
    };
  }

  return response;
};

// ============================================
// API FUNCTIONS - Advertisement
// ============================================

/**
 * Get all advertisements with optional filters
 * GET /api/v1/marketing/advertisements
 */
export const getAdvertisements = async (params?: AdvertisementSearchParams): Promise<ApiResponse<Advertisement[]>> => {
  const response = await api.get<ApiResponse<Advertisement[]>>('/marketing/advertisements', { params });
  return response;
};

/**
 * Create a new advertisement
 * POST /api/v1/marketing/advertisements
 */
export const createAdvertisement = async (data: CreateAdvertisementData): Promise<ApiResponse<Advertisement>> => {
  const response = await api.post<ApiResponse<Advertisement>>('/marketing/advertisements', data);
  return response;
};

/**
 * Update an existing advertisement
 * PUT /api/v1/marketing/advertisements/:id
 */
export const updateAdvertisement = async (id: string, data: UpdateAdvertisementData): Promise<ApiResponse<Advertisement>> => {
  const response = await api.put<ApiResponse<Advertisement>>(`/marketing/advertisements/${id}`, data);
  return response;
};

/**
 * Get a single advertisement by ID
 * GET /api/v1/marketing/advertisements/:id
 */
export const getAdvertisement = async (id: string): Promise<ApiResponse<Advertisement>> => {
  return api.get<ApiResponse<Advertisement>>(`/marketing/advertisements/${id}`);
};

/**
 * Delete an advertisement
 * DELETE /api/v1/marketing/advertisements/:id
 */
export const deleteAdvertisement = async (id: string): Promise<ApiResponse<null>> => {
  const response = await api.delete<ApiResponse<null>>(`/marketing/advertisements/${id}`);
  return response;
};

// ============================================
// API FUNCTIONS - Feedback
// ============================================

/**
 * Get all feedback forms
 * GET /api/v1/marketing/feedback-forms
 */
export const getFeedbackForms = async (): Promise<ApiResponse<FeedbackForm[]>> => {
  const response = await api.get<ApiResponse<FeedbackForm[]>>('/marketing/feedback-forms');
  return response;
};

/**
 * Create a new feedback form
 * POST /api/v1/marketing/feedback-forms
 */
export const createFeedbackForm = async (data: CreateFeedbackFormData): Promise<ApiResponse<FeedbackForm>> => {
  const response = await api.post<ApiResponse<FeedbackForm>>('/marketing/feedback-forms', data);
  return response;
};

/**
 * Update an existing feedback form
 * PUT /api/v1/marketing/feedback-forms/:id
 */
export const updateFeedbackForm = async (id: string, data: UpdateFeedbackFormData): Promise<ApiResponse<FeedbackForm>> => {
  const response = await api.put<ApiResponse<FeedbackForm>>(`/marketing/feedback-forms/${id}`, data);
  return response;
};

/**
 * Delete a feedback form
 * DELETE /api/v1/marketing/feedback-forms/:id
 */
export const deleteFeedbackForm = async (id: string): Promise<ApiResponse<null>> => {
  const response = await api.delete<ApiResponse<null>>(`/marketing/feedback-forms/${id}`);
  return response;
};

/**
 * Get all feedback responses for a specific form
 * GET /api/v1/marketing/feedback-forms/:formId/responses
 */
export const getFeedbackResponses = async (params: FeedbackResponsesParams): Promise<ApiResponse<FeedbackResponse[]>> => {
  const { formId, startDate, endDate } = params;
  const queryParams: any = {};
  if (startDate) queryParams.startDate = startDate;
  if (endDate) queryParams.endDate = endDate;

  const response = await api.get<ApiResponse<FeedbackResponse[]>>(`/marketing/feedback-forms/${formId}/responses`, { params: queryParams });
  return response;
};

/**
 * Get a public feedback form by id (for QR/mobile flow)
 * GET /api/v1/public/feedback/:formId
 */
export const getPublicFeedbackForm = async (formId: string): Promise<ApiResponse<PublicFeedbackForm>> => {
  const response = await api.get<ApiResponse<PublicFeedbackForm>>(`/public/feedback/${formId}`);
  return response;
};

/**
 * Submit feedback response from public/mobile flow
 * POST /api/v1/public/feedback/:formId
 */
export const submitPublicFeedbackResponse = async (
  formId: string,
  data: SubmitPublicFeedbackData
): Promise<ApiResponse<any>> => {
  const response = await api.post<ApiResponse<any>>(`/public/feedback/${formId}`, data);
  return response;
};
