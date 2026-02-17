import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { prisma } from '../services/db.service';
import { Prisma } from '@prisma/client';

/**
 * Subscription Plan Response Interface
 */
interface SubscriptionPlanResponse {
  id: string;
  name: string;
  price: unknown;
  duration: number;
  trialDays: number;
  features: unknown;
  maxBranches: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Subscription Plan List Response
 */
interface SubscriptionPlanListResponse {
  plans: SubscriptionPlanResponse[];
  total: number;
}

/**
 * GET /api/v1/super-admin/subscription-plans
 * List all subscription plans with optional status filter
 * Requires SuperAdmin authentication
 */
export async function listSubscriptionPlans(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    // Get status filter from query params
    const { status } = req.query;

    // Build where clause
    const whereClause: { status?: string } = {};
    if (status && typeof status === 'string') {
      // Validate status value
      if (status !== 'active' && status !== 'inactive') {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Status must be either "active" or "inactive"',
          },
        };
        res.status(400).json(response);
        return;
      }
      whereClause.status = status;
    }

    // Fetch subscription plans
    const plans = await prisma.subscriptionPlan.findMany({
      where: whereClause,
      orderBy: { price: 'asc' }, // Order by price ascending (Free first)
    });

    // Build response
    const planResponses: SubscriptionPlanResponse[] = plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      duration: plan.duration,
      trialDays: plan.trialDays,
      features: plan.features,
      maxBranches: plan.maxBranches,
      status: plan.status,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    }));

    const response: ApiResponse<SubscriptionPlanListResponse> = {
      success: true,
      data: {
        plans: planResponses,
        total: planResponses.length,
      },
      message: 'Subscription plans retrieved successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching subscription plans',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * POST /api/v1/super-admin/subscription-plans
 * Create a new subscription plan
 * Requires SuperAdmin authentication
 */
export async function createSubscriptionPlan(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { name, price, duration, features, maxBranches, trialDays, status } = req.body;

  // Validate required fields
  const requiredFields = ['name', 'price', 'duration', 'features', 'maxBranches'];
  const missingFields = requiredFields.filter((field) => req.body[field] === undefined);

  if (missingFields.length > 0) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Missing required fields: ${missingFields.join(', ')}`,
      },
    };
    res.status(400).json(response);
    return;
  }

  // Validate price >= 0
  const numPrice = Number(price);
  if (isNaN(numPrice) || numPrice < 0) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Price must be a number greater than or equal to 0',
      },
    };
    res.status(400).json(response);
    return;
  }

  // Validate duration > 0
  const numDuration = Number(duration);
  if (isNaN(numDuration) || numDuration <= 0) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Duration must be a number greater than 0',
      },
    };
    res.status(400).json(response);
    return;
  }

  // Validate maxBranches > 0
  const numMaxBranches = Number(maxBranches);
  if (isNaN(numMaxBranches) || numMaxBranches <= 0) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'maxBranches must be a number greater than 0',
      },
    };
    res.status(400).json(response);
    return;
  }

  try {
    // Create the subscription plan
    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        price: new Prisma.Decimal(numPrice),
        duration: numDuration,
        trialDays: trialDays !== undefined ? Number(trialDays) : 0,
        features: features || {},
        maxBranches: numMaxBranches,
        status: status || 'active',
      },
    });

    // Build response
    const planResponse: SubscriptionPlanResponse = {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      duration: plan.duration,
      trialDays: plan.trialDays,
      features: plan.features,
      maxBranches: plan.maxBranches,
      status: plan.status,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };

    const response: ApiResponse<SubscriptionPlanResponse> = {
      success: true,
      data: planResponse,
      message: 'Subscription plan created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while creating subscription plan',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * PUT /api/v1/super-admin/subscription-plans/:id
 * Update an existing subscription plan
 * Requires SuperAdmin authentication
 */
export async function updateSubscriptionPlan(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { id } = req.params;
  const { name, price, duration, features, maxBranches, trialDays, status } = req.body;

  // Check if plan exists
  try {
    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!existingPlan) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Subscription plan not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Build update data object with only provided fields
    const updateData: Prisma.SubscriptionPlanUpdateInput = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (price !== undefined) {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice < 0) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Price must be a number greater than or equal to 0',
          },
        };
        res.status(400).json(response);
        return;
      }
      updateData.price = new Prisma.Decimal(numPrice);
    }

    if (duration !== undefined) {
      const numDuration = Number(duration);
      if (isNaN(numDuration) || numDuration <= 0) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Duration must be a number greater than 0',
          },
        };
        res.status(400).json(response);
        return;
      }
      updateData.duration = numDuration;
    }

    if (maxBranches !== undefined) {
      const numMaxBranches = Number(maxBranches);
      if (isNaN(numMaxBranches) || numMaxBranches <= 0) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'maxBranches must be a number greater than 0',
          },
        };
        res.status(400).json(response);
        return;
      }
      updateData.maxBranches = numMaxBranches;
    }

    if (trialDays !== undefined) {
      updateData.trialDays = Number(trialDays);
    }

    if (features !== undefined) {
      updateData.features = features;
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    // Update the subscription plan
    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: updateData,
    });

    // Build response
    const planResponse: SubscriptionPlanResponse = {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      duration: plan.duration,
      trialDays: plan.trialDays,
      features: plan.features,
      maxBranches: plan.maxBranches,
      status: plan.status,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };

    const response: ApiResponse<SubscriptionPlanResponse> = {
      success: true,
      data: planResponse,
      message: 'Subscription plan updated successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while updating subscription plan',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * DELETE /api/v1/super-admin/subscription-plans/:id
 * Delete a subscription plan
 * Requires SuperAdmin authentication
 * Prevents deletion if plan has active subscribers
 */
export async function deleteSubscriptionPlan(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { id } = req.params;

  try {
    // Check if plan exists
    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!existingPlan) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Subscription plan not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Count active subscribers (business owners with this plan)
    const activeSubscriberCount = await prisma.businessOwner.count({
      where: {
        planId: id,
        status: 'active',
      },
    });

    if (activeSubscriberCount > 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'PLAN_HAS_SUBSCRIBERS',
          message: `Cannot delete plan with ${activeSubscriberCount} active subscriber${activeSubscriberCount === 1 ? '' : 's'}`,
        },
      };
      res.status(400).json(response);
      return;
    }

    // Delete the subscription plan
    await prisma.subscriptionPlan.delete({
      where: { id },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Subscription plan deleted successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error deleting subscription plan:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while deleting subscription plan',
      },
    };
    res.status(500).json(response);
  }
}
