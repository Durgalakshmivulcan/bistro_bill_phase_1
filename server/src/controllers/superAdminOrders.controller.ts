import { Response } from 'express';
import { prisma } from '../services/db.service';
import { AuthenticatedRequest, ApiResponse } from '../types';

/**
 * GET /api/v1/super-admin/orders
 * List subscription orders (BusinessOwner subscriptions) with filters and pagination
 */
export async function listSubscriptionOrders(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const {
      businessType,
      plan,
      status,
      search,
      page = '1',
      limit = '10',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (businessType && businessType !== 'Filter by Business Type') {
      where.businessType = businessType as string;
    }

    if (status && status !== 'Filter by Status') {
      where.status = (status as string).toLowerCase();
    }

    if (plan && plan !== 'Filter by Plan') {
      where.plan = {
        name: plan as string,
      };
    }

    if (search) {
      where.OR = [
        { ownerName: { contains: search as string, mode: 'insensitive' } },
        { restaurantName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [businessOwners, total] = await Promise.all([
      prisma.businessOwner.findMany({
        where,
        include: {
          plan: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.businessOwner.count({ where }),
    ]);

    // Shape data to match frontend SubscriptionOrder interface
    const orders = businessOwners.map((bo, index) => ({
      id: bo.id,
      orderId: `ORD-${String(skip + index + 1).padStart(4, '0')}`,
      restaurant: bo.restaurantName,
      owner: bo.ownerName,
      businessType: bo.businessType || 'N/A',
      plan: bo.plan?.name || 'Free',
      price: bo.plan ? `₹${bo.plan.price}` : '₹0',
      date: bo.subscriptionStartDate
        ? new Date(bo.subscriptionStartDate).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : new Date(bo.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
      invoice: !!bo.plan,
      status: bo.status === 'active' ? 'Success' : bo.status === 'suspended' ? 'Failed' : 'Pending',
    }));

    const response: ApiResponse = {
      success: true,
      data: {
        orders,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    };
    res.json(response);
  } catch (error) {
    console.error('Error listing subscription orders:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to list subscription orders',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * DELETE /api/v1/super-admin/orders/:id
 * Delete a subscription order (deactivate BO subscription)
 */
export async function deleteSubscriptionOrder(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    const bo = await prisma.businessOwner.findUnique({
      where: { id },
    });

    if (!bo) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Order not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Remove subscription (set plan to null, clear dates)
    await prisma.businessOwner.update({
      where: { id },
      data: {
        planId: null,
        subscriptionStartDate: null,
        subscriptionEndDate: null,
      },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Subscription order removed successfully',
    };
    res.json(response);
  } catch (error) {
    console.error('Error deleting subscription order:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete subscription order',
      },
    };
    res.status(500).json(response);
  }
}
