import { Router } from 'express';
import {
  getLoyaltyBalance,
  awardLoyaltyPoints,
  redeemLoyaltyPoints,
} from '../controllers/loyalty.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route GET /api/v1/loyalty/balance/:customerId
 * @description Get loyalty balance and recent transactions for a customer
 * @access Private
 */
router.get('/balance/:customerId', authenticate, getLoyaltyBalance);

/**
 * @route POST /api/v1/loyalty/award
 * @description Award loyalty points to a customer
 * @access Private
 * @body { customerId, points, description?, orderId? }
 */
router.post('/award', authenticate, awardLoyaltyPoints);

/**
 * @route POST /api/v1/loyalty/redeem
 * @description Redeem loyalty points for a customer
 * @access Private
 * @body { customerId, points, description?, orderId? }
 */
router.post('/redeem', authenticate, redeemLoyaltyPoints);

export default router;
