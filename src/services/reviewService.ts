import { api } from './api';

/**
 * Google Reviews Service
 * API functions for fetching and managing Google My Business reviews
 */

export interface GoogleReview {
  id: string;
  externalReviewId: string;
  reviewerName: string;
  rating: number;
  comment: string | null;
  replyText: string | null;
  repliedAt: string | null;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoogleReviewsResponse {
  reviews: GoogleReview[];
  totalCount: number;
  averageRating: number;
  unrespondedCount: number;
}

export interface ReviewReplyResult {
  success: boolean;
  message: string;
  reviewId: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

/**
 * Fetch Google reviews for the current business
 */
export async function getGoogleReviews(params?: {
  limit?: number;
  offset?: number;
}): Promise<ApiResponse<GoogleReviewsResponse>> {
  try {
    const queryParams: Record<string, string> = {};
    if (params?.limit) queryParams.limit = String(params.limit);
    if (params?.offset) queryParams.offset = String(params.offset);

    const response = await api.get<any>('/reviews/google', { params: queryParams });
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'FETCH_REVIEWS_FAILED',
        message: error?.response?.data?.message || error?.message || 'Failed to fetch Google reviews',
      },
    };
  }
}

/**
 * Reply to a Google review
 */
export async function replyToGoogleReview(
  reviewId: string,
  replyText: string
): Promise<ApiResponse<ReviewReplyResult>> {
  try {
    const response = await api.post<any>(`/reviews/google/${reviewId}/reply`, { replyText });
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'REPLY_REVIEW_FAILED',
        message: error?.response?.data?.message || error?.message || 'Failed to reply to review',
      },
    };
  }
}
