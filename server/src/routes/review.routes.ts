import { Router } from 'express';
import {
  listGoogleReviews,
  replyToGoogleReview,
} from '../controllers/review.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route GET /api/v1/reviews/google
 * @description List Google reviews for the authenticated business owner
 * @access Private
 * @query limit - Number of reviews to return (default: 20)
 * @query offset - Number of reviews to skip (default: 0)
 */
router.get('/google', authenticate, listGoogleReviews);

/**
 * @route POST /api/v1/reviews/google/:reviewId/reply
 * @description Reply to a Google review
 * @access Private
 * @body { replyText: string }
 */
router.post('/google/:reviewId/reply', authenticate, replyToGoogleReview);

export default router;
