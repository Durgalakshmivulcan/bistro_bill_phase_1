import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { prisma } from '../services/db.service';

/**
 * GET /api/v1/loyalty/balance/:customerId
 * Get loyalty balance and recent transactions for a customer
 */
export async function getLoyaltyBalance(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { customerId } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, name: true, loyaltyPoints: true },
    });

    if (!customer) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Customer not found' },
      };
      res.status(404).json(response);
      return;
    }

    const recentTransactions = await prisma.loyaltyTransaction.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        type: true,
        points: true,
        description: true,
        orderId: true,
        createdAt: true,
      },
    });

    const response: ApiResponse = {
      success: true,
      data: {
        balance: customer.loyaltyPoints,
        recentTransactions,
      },
      message: 'Loyalty balance retrieved successfully',
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('Error getting loyalty balance:', error);
    const response: ApiResponse = {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get loyalty balance' },
    };
    res.status(500).json(response);
  }
}

/**
 * POST /api/v1/loyalty/award
 * Award loyalty points to a customer
 * Body: { customerId, points, description?, orderId? }
 */
export async function awardLoyaltyPoints(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const businessOwnerId = req.user?.businessOwnerId;
    const branchId = req.user?.branchId;

    if (!businessOwnerId || !branchId) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'TENANT_CONTEXT_REQUIRED', message: 'Business owner and branch context required' },
      };
      res.status(403).json(response);
      return;
    }

    const { customerId, points, description, orderId, orderTotal } = req.body;

    if (!customerId) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'customerId is required' },
      };
      res.status(400).json(response);
      return;
    }

    // Support both explicit points and orderTotal-based calculation
    const pointsToAward = points ? parseInt(points, 10) : (orderTotal ? Math.floor(parseFloat(orderTotal)) : 0);

    if (pointsToAward <= 0) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'points must be a positive integer' },
      };
      res.status(400).json(response);
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.loyaltyTransaction.create({
        data: {
          customerId,
          branchId,
          businessOwnerId,
          type: 'award',
          points: pointsToAward,
          description: description || `Awarded ${pointsToAward} points`,
          orderId: orderId || null,
        },
      });

      const customer = await tx.customer.update({
        where: { id: customerId },
        data: { loyaltyPoints: { increment: pointsToAward } },
        select: { loyaltyPoints: true },
      });

      return { transaction, newBalance: customer.loyaltyPoints };
    });

    const response: ApiResponse = {
      success: true,
      data: {
        pointsAwarded: pointsToAward,
        newBalance: result.newBalance,
        transaction: result.transaction,
      },
      message: `${pointsToAward} loyalty points awarded successfully`,
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Error awarding loyalty points:', error);
    const response: ApiResponse = {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to award loyalty points' },
    };
    res.status(500).json(response);
  }
}

/**
 * POST /api/v1/loyalty/redeem
 * Redeem loyalty points for a customer
 * Body: { customerId, points, description?, orderId? }
 */
export async function redeemLoyaltyPoints(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const businessOwnerId = req.user?.businessOwnerId;
    const branchId = req.user?.branchId;

    if (!businessOwnerId || !branchId) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'TENANT_CONTEXT_REQUIRED', message: 'Business owner and branch context required' },
      };
      res.status(403).json(response);
      return;
    }

    const { customerId, points, description, orderId } = req.body;

    if (!customerId || !points) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'customerId and points are required' },
      };
      res.status(400).json(response);
      return;
    }

    const pointsToRedeem = parseInt(points, 10);
    if (pointsToRedeem <= 0) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'points must be a positive integer' },
      };
      res.status(400).json(response);
      return;
    }

    // Check sufficient balance
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { loyaltyPoints: true },
    });

    if (!customer) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Customer not found' },
      };
      res.status(404).json(response);
      return;
    }

    if (customer.loyaltyPoints < pointsToRedeem) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'INSUFFICIENT_BALANCE', message: `Insufficient loyalty points. Current balance: ${customer.loyaltyPoints}` },
      };
      res.status(400).json(response);
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.loyaltyTransaction.create({
        data: {
          customerId,
          branchId,
          businessOwnerId,
          type: 'redeem',
          points: pointsToRedeem,
          description: description || `Redeemed ${pointsToRedeem} points`,
          orderId: orderId || null,
        },
      });

      const updatedCustomer = await tx.customer.update({
        where: { id: customerId },
        data: { loyaltyPoints: { decrement: pointsToRedeem } },
        select: { loyaltyPoints: true },
      });

      return { transaction, remainingBalance: updatedCustomer.loyaltyPoints };
    });

    const response: ApiResponse = {
      success: true,
      data: {
        pointsRedeemed: pointsToRedeem,
        remainingBalance: result.remainingBalance,
        transaction: result.transaction,
      },
      message: `${pointsToRedeem} loyalty points redeemed successfully`,
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('Error redeeming loyalty points:', error);
    const response: ApiResponse = {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to redeem loyalty points' },
    };
    res.status(500).json(response);
  }
}
