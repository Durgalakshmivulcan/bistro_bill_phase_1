import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { prisma } from '../services/db.service';

/**
 * GET /api/v1/reviews/google
 * List Google reviews for the authenticated business owner
 */
export async function listGoogleReviews(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const businessOwnerId = req.user?.businessOwnerId;

    if (!businessOwnerId) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Business owner context required' },
      };
      res.status(403).json(response);
      return;
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const [reviews, total] = await Promise.all([
      prisma.customerReview.findMany({
        where: {
          businessOwnerId,
          source: 'google',
        },
        orderBy: { publishedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.customerReview.count({
        where: {
          businessOwnerId,
          source: 'google',
        },
      }),
    ]);

    // Calculate aggregate stats
    const stats = await prisma.customerReview.aggregate({
      where: {
        businessOwnerId,
        source: 'google',
      },
      _avg: { rating: true },
      _count: { id: true },
    });

    const unrespondedCount = await prisma.customerReview.count({
      where: {
        businessOwnerId,
        source: 'google',
        replyText: null,
      },
    });

    const response: ApiResponse = {
      success: true,
      data: {
        reviews,
        total,
        totalCount: stats._count.id,
        averageRating: stats._avg.rating ?? 0,
        unrespondedCount,
      },
    };
    res.json(response);
  } catch (error) {
    console.error('Error listing Google reviews:', error);
    const response: ApiResponse = {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch Google reviews' },
    };
    res.status(500).json(response);
  }
}

/**
 * POST /api/v1/reviews/google/:reviewId/reply
 * Reply to a Google review
 */
export async function replyToGoogleReview(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { reviewId } = req.params;
    const { replyText } = req.body;
    const businessOwnerId = req.user?.businessOwnerId;

    if (!businessOwnerId) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Business owner context required' },
      };
      res.status(403).json(response);
      return;
    }

    if (!replyText || typeof replyText !== 'string' || replyText.trim().length === 0) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'replyText is required' },
      };
      res.status(400).json(response);
      return;
    }

    // Find the review and ensure it belongs to the business owner
    const review = await prisma.customerReview.findFirst({
      where: {
        id: reviewId,
        businessOwnerId,
      },
    });

    if (!review) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Review not found' },
      };
      res.status(404).json(response);
      return;
    }

    // Update the review with the reply
    const updatedReview = await prisma.customerReview.update({
      where: { id: reviewId },
      data: {
        replyText: replyText.trim(),
        repliedAt: new Date(),
      },
    });

    const response: ApiResponse = {
      success: true,
      data: updatedReview,
    };
    res.json(response);
  } catch (error) {
    console.error('Error replying to Google review:', error);
    const response: ApiResponse = {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to reply to review' },
    };
    res.status(500).json(response);
  }
}
