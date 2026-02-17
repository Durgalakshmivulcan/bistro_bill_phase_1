import { Prisma } from '@prisma/client';
import { prisma } from '../db.service';

/**
 * Google My Business Integration Service
 *
 * Fetches Google reviews, stores them in CustomerReview table,
 * supports replying to reviews, and sends notifications for negative reviews.
 * Config stored in Integration model determines OAuth2 credentials.
 */

interface GoogleMyBusinessConfig {
  // OAuth2 credentials
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  // Account info
  accountId?: string; // Google My Business account ID
  locationId?: string; // Location/place ID
  // Settings
  negativeReviewThreshold?: number; // Default: 3
  notifyOnNegativeReview?: boolean; // Default: true
}

interface GoogleReviewData {
  reviewId: string;
  reviewer: {
    displayName: string;
    profilePhotoUrl?: string;
  };
  starRating: string; // ONE, TWO, THREE, FOUR, FIVE
  comment?: string;
  createTime: string; // ISO 8601
  updateTime: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
}

interface GoogleReviewsResponse {
  reviews: GoogleReviewData[];
  averageRating: number;
  totalReviewCount: number;
  nextPageToken?: string;
}

export interface ReviewSyncResult {
  success: boolean;
  message: string;
  totalFetched?: number;
  newReviews?: number;
  updatedReviews?: number;
  negativeReviewAlerts?: number;
}

export interface ReviewReplyResult {
  success: boolean;
  message: string;
  reviewId?: string;
}

/**
 * Map Google star rating string to numeric value.
 */
function starRatingToNumber(rating: string): number {
  const ratingMap: Record<string, number> = {
    ONE: 1,
    TWO: 2,
    THREE: 3,
    FOUR: 4,
    FIVE: 5,
  };
  return ratingMap[rating] || 0;
}

/**
 * Find the Google My Business integration for a business owner.
 */
async function findIntegration(businessOwnerId: string) {
  const integration = await prisma.integration.findUnique({
    where: {
      businessOwnerId_provider: {
        businessOwnerId,
        provider: 'google_my_business',
      },
    },
  });

  if (!integration || integration.status !== 'active') {
    return null;
  }

  return integration;
}

/**
 * Log an action to IntegrationLog.
 */
async function logAction(
  integrationId: string,
  action: string,
  status: string,
  requestPayload: Record<string, unknown> | null,
  responsePayload: Record<string, unknown> | null,
  errorMessage: string | null
): Promise<void> {
  try {
    await prisma.integrationLog.create({
      data: {
        integrationId,
        action,
        status,
        requestPayload: requestPayload
          ? JSON.parse(JSON.stringify(requestPayload))
          : Prisma.JsonNull,
        responsePayload: responsePayload
          ? JSON.parse(JSON.stringify(responsePayload))
          : Prisma.JsonNull,
        errorMessage,
      },
    });
  } catch {
    // Never let logging failure affect main flow
    console.error('[GoogleMyBusiness] Failed to write IntegrationLog');
  }
}

/**
 * Refresh OAuth2 access token using refresh token.
 */
async function refreshAccessToken(
  config: GoogleMyBusinessConfig,
  integrationId: string
): Promise<string | null> {
  if (!config.clientId || !config.clientSecret || !config.refreshToken) {
    return null;
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: config.refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      await logAction(integrationId, 'refresh_token', 'failure', null, null, `Token refresh failed: ${errorText}`);
      return null;
    }

    const data = (await response.json()) as { access_token: string; expires_in: number };

    // Update the stored access token
    const existingIntegration = await prisma.integration.findUnique({ where: { id: integrationId } });
    if (existingIntegration) {
      const updatedConfig = { ...(existingIntegration.config as unknown as GoogleMyBusinessConfig), accessToken: data.access_token };
      await prisma.integration.update({
        where: { id: integrationId },
        data: { config: JSON.parse(JSON.stringify(updatedConfig)) },
      });
    }

    return data.access_token;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    await logAction(integrationId, 'refresh_token', 'failure', null, null, msg);
    return null;
  }
}

/**
 * Get a valid access token, refreshing if needed.
 */
async function getValidAccessToken(
  config: GoogleMyBusinessConfig,
  integrationId: string
): Promise<string | null> {
  if (config.accessToken) {
    return config.accessToken;
  }

  // Try to refresh
  return refreshAccessToken(config, integrationId);
}

/**
 * Fetch reviews from Google My Business API.
 */
async function fetchFromGoogleAPI(
  accessToken: string,
  accountId: string,
  locationId: string,
  pageToken?: string
): Promise<GoogleReviewsResponse | null> {
  let url = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews?pageSize=50`;
  if (pageToken) {
    url += `&pageToken=${pageToken}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google API error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as GoogleReviewsResponse;
  return data;
}

/**
 * Fetch reviews from Google My Business and store in CustomerReview table.
 * Sends notification for negative reviews (< threshold stars).
 */
export async function fetchReviews(
  businessOwnerId: string
): Promise<ReviewSyncResult> {
  const integration = await findIntegration(businessOwnerId);
  if (!integration) {
    return { success: false, message: 'Google My Business integration is not configured or inactive' };
  }

  const config = integration.config as unknown as GoogleMyBusinessConfig;
  const threshold = config.negativeReviewThreshold || 3;

  if (!config.accountId || !config.locationId) {
    return { success: false, message: 'Google My Business account ID or location ID not configured' };
  }

  const accessToken = await getValidAccessToken(config, integration.id);
  if (!accessToken) {
    // Update integration status to error
    await prisma.integration.update({
      where: { id: integration.id },
      data: { status: 'error' },
    });
    return { success: false, message: 'Unable to obtain valid access token. Please re-authenticate.' };
  }

  try {
    let totalFetched = 0;
    let newReviews = 0;
    let updatedReviews = 0;
    let negativeReviewAlerts = 0;
    let pageToken: string | undefined;

    do {
      const reviewsResponse = await fetchFromGoogleAPI(
        accessToken,
        config.accountId,
        config.locationId,
        pageToken
      );

      if (!reviewsResponse || !reviewsResponse.reviews) {
        break;
      }

      for (const review of reviewsResponse.reviews) {
        totalFetched++;
        const rating = starRatingToNumber(review.starRating);
        const externalReviewId = review.reviewId;

        // Check if review already exists
        const existingReview = await prisma.customerReview.findUnique({
          where: { externalReviewId },
        });

        if (existingReview) {
          // Update if reply was added externally
          if (review.reviewReply && !existingReview.replyText) {
            await prisma.customerReview.update({
              where: { id: existingReview.id },
              data: {
                replyText: review.reviewReply.comment,
                repliedAt: new Date(review.reviewReply.updateTime),
              },
            });
            updatedReviews++;
          }
        } else {
          // Create new review
          await prisma.customerReview.create({
            data: {
              businessOwnerId,
              externalReviewId,
              source: 'google',
              reviewerName: review.reviewer.displayName,
              rating,
              comment: review.comment || null,
              replyText: review.reviewReply?.comment || null,
              repliedAt: review.reviewReply ? new Date(review.reviewReply.updateTime) : null,
              publishedAt: new Date(review.createTime),
            },
          });
          newReviews++;

          // Send notification for negative reviews
          if (rating < threshold && (config.notifyOnNegativeReview !== false)) {
            negativeReviewAlerts++;
            await logAction(
              integration.id,
              'negative_review_alert',
              'success',
              {
                reviewerName: review.reviewer.displayName,
                rating,
                comment: review.comment || '',
                publishedAt: review.createTime,
              },
              null,
              null
            );
          }
        }
      }

      pageToken = reviewsResponse.nextPageToken;
    } while (pageToken);

    // Update lastSyncAt
    await prisma.integration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() },
    });

    await logAction(
      integration.id,
      'fetch_reviews',
      'success',
      { locationId: config.locationId },
      { totalFetched, newReviews, updatedReviews, negativeReviewAlerts },
      null
    );

    return {
      success: true,
      message: `Synced ${totalFetched} reviews (${newReviews} new, ${updatedReviews} updated)`,
      totalFetched,
      newReviews,
      updatedReviews,
      negativeReviewAlerts,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error fetching reviews';
    await logAction(
      integration.id,
      'fetch_reviews',
      'failure',
      { locationId: config.locationId },
      null,
      msg
    );
    return { success: false, message: msg };
  }
}

/**
 * Reply to a Google review.
 */
export async function replyToReview(
  businessOwnerId: string,
  reviewId: string,
  replyText: string
): Promise<ReviewReplyResult> {
  const integration = await findIntegration(businessOwnerId);
  if (!integration) {
    return { success: false, message: 'Google My Business integration is not configured or inactive' };
  }

  const config = integration.config as unknown as GoogleMyBusinessConfig;

  if (!config.accountId || !config.locationId) {
    return { success: false, message: 'Google My Business account ID or location ID not configured' };
  }

  const accessToken = await getValidAccessToken(config, integration.id);
  if (!accessToken) {
    return { success: false, message: 'Unable to obtain valid access token. Please re-authenticate.' };
  }

  // Find the review in our database
  const review = await prisma.customerReview.findUnique({
    where: { externalReviewId: reviewId },
  });

  if (!review) {
    return { success: false, message: `Review not found: ${reviewId}` };
  }

  try {
    const url = `https://mybusiness.googleapis.com/v4/accounts/${config.accountId}/locations/${config.locationId}/reviews/${reviewId}/reply`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ comment: replyText }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      await logAction(
        integration.id,
        'reply_to_review',
        'failure',
        { reviewId, replyText },
        null,
        `Google API error (${response.status}): ${errorText}`
      );
      return { success: false, message: `Failed to reply: ${errorText}` };
    }

    // Update local review record
    await prisma.customerReview.update({
      where: { id: review.id },
      data: {
        replyText,
        repliedAt: new Date(),
      },
    });

    await logAction(
      integration.id,
      'reply_to_review',
      'success',
      { reviewId, replyText },
      null,
      null
    );

    return {
      success: true,
      message: 'Reply posted successfully',
      reviewId,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error replying to review';
    await logAction(
      integration.id,
      'reply_to_review',
      'failure',
      { reviewId, replyText },
      null,
      msg
    );
    return { success: false, message: msg };
  }
}

/**
 * Schedule daily Google reviews sync.
 * Runs at 6 AM daily for all active Google My Business integrations.
 */
export function scheduleGoogleReviewSync(): void {
  function scheduleNextRun(): void {
    const now = new Date();
    const today6AM = new Date(now);
    today6AM.setHours(6, 0, 0, 0);

    let nextRun: Date;
    if (now >= today6AM) {
      nextRun = new Date(today6AM);
      nextRun.setDate(nextRun.getDate() + 1);
    } else {
      nextRun = today6AM;
    }

    const delay = nextRun.getTime() - now.getTime();
    console.log(`[GoogleMyBusiness] Next review sync scheduled for ${nextRun.toISOString()}`);

    setTimeout(async () => {
      try {
        console.log('[GoogleMyBusiness] Running daily review sync...');
        await syncAllBusinessReviews();
        console.log('[GoogleMyBusiness] Daily review sync complete.');
      } catch (error) {
        console.error('[GoogleMyBusiness] Daily review sync failed:', error);
      }
      scheduleNextRun();
    }, delay);
  }

  scheduleNextRun();
}

/**
 * Sync reviews for all business owners with active Google My Business integration.
 */
async function syncAllBusinessReviews(): Promise<void> {
  const activeIntegrations = await prisma.integration.findMany({
    where: {
      provider: 'google_my_business',
      status: 'active',
    },
    select: {
      businessOwnerId: true,
    },
  });

  for (const integration of activeIntegrations) {
    try {
      const result = await fetchReviews(integration.businessOwnerId);
      console.log(`[GoogleMyBusiness] Sync for ${integration.businessOwnerId}: ${result.message}`);
    } catch (error) {
      console.error(`[GoogleMyBusiness] Sync failed for ${integration.businessOwnerId}:`, error);
    }
  }
}
