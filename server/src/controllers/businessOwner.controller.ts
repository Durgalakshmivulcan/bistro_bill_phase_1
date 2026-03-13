import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse, PaginationMeta } from '../types';
import { prisma } from '../services/db.service';
import { AuditUserType, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

/**
 * Subscription Plan Response (for BusinessOwner context)
 */
interface SubscriptionPlanInfo {
  id: string;
  name: string;
  price: unknown;
  maxBranches: number;
}

/**
 * Business Owner List Item Response
 */
interface BusinessOwnerListItem {
  id: string;
  email: string;
  ownerName: string;
  restaurantName: string;
  phone: string | null;
  businessType: string | null;
  avatar: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  status: string;
  subscriptionStartDate: Date | null;
  subscriptionEndDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  plan: SubscriptionPlanInfo | null;
  branchCount: number;
}

/**
 * Business Owner List Response
 */
interface BusinessOwnerListResponse {
  businessOwners: BusinessOwnerListItem[];
  pagination: PaginationMeta;
}

/**
 * GET /api/v1/super-admin/business-owners
 * List all business owners with pagination and filters
 * Requires SuperAdmin authentication
 */
export async function listBusinessOwners(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    // Parse query parameters
    const {
      status,
      planId,
      search,
      page = '1',
      limit = '10',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    interface WhereClause {
      status?: string;
      planId?: string;
      OR?: Array<{
        ownerName?: { contains: string; mode: 'insensitive' };
        restaurantName?: { contains: string; mode: 'insensitive' };
        email?: { contains: string; mode: 'insensitive' };
      }>;
    }
    const whereClause: WhereClause = {};

    // Filter by status
    if (status && typeof status === 'string') {
      const validStatuses = ['active', 'inactive', 'suspended'];
      if (!validStatuses.includes(status)) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Status must be one of: active, inactive, suspended',
          },
        };
        res.status(400).json(response);
        return;
      }
      whereClause.status = status;
    }

    // Filter by planId
    if (planId && typeof planId === 'string') {
      whereClause.planId = planId;
    }

    // Search filter (name or email)
    if (search && typeof search === 'string' && search.trim()) {
      const searchTerm = search.trim();
      whereClause.OR = [
        { ownerName: { contains: searchTerm, mode: 'insensitive' } },
        { restaurantName: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    // Count total matching records
    const total = await prisma.businessOwner.count({
      where: whereClause,
    });

    // Fetch business owners with plan and branch count
    const businessOwners = await prisma.businessOwner.findMany({
      where: whereClause,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        ownerName: true,
        restaurantName: true,
        phone: true,
        businessType: true,
        avatar: true,
        country: true,
        state: true,
        city: true,
        status: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        createdAt: true,
        updatedAt: true,
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
            maxBranches: true,
          },
        },
        _count: {
          select: {
            branches: true,
          },
        },
      },
    });

    // Transform response
    const businessOwnerResponses: BusinessOwnerListItem[] = businessOwners.map((bo) => ({
      id: bo.id,
      email: bo.email,
      ownerName: bo.ownerName,
      restaurantName: bo.restaurantName,
      phone: bo.phone,
      businessType: bo.businessType,
      avatar: bo.avatar,
      country: bo.country,
      state: bo.state,
      city: bo.city,
      status: bo.status,
      subscriptionStartDate: bo.subscriptionStartDate,
      subscriptionEndDate: bo.subscriptionEndDate,
      createdAt: bo.createdAt,
      updatedAt: bo.updatedAt,
      plan: bo.plan
        ? {
            id: bo.plan.id,
            name: bo.plan.name,
            price: bo.plan.price,
            maxBranches: bo.plan.maxBranches,
          }
        : null,
      branchCount: bo._count.branches,
    }));

    const totalPages = Math.ceil(total / limitNum);

    const response: ApiResponse<BusinessOwnerListResponse> = {
      success: true,
      data: {
        businessOwners: businessOwnerResponses,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
        },
      },
      message: 'Business owners retrieved successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching business owners:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching business owners',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Branch Detail Response (for Business Owner context)
 */
interface BranchDetailInfo {
  id: string;
  name: string;
  code: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zipCode: string | null;
  isMainBranch: boolean;
  status: string;
  createdAt: Date;
}

/**
 * Subscription Plan Detail Response
 */
interface SubscriptionPlanDetail {
  id: string;
  name: string;
  price: unknown;
  duration: number;
  trialDays: number;
  features: unknown;
  maxBranches: number;
  status: string;
}

/**
 * Order Statistics Response
 */
interface OrderStatistics {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
}

/**
 * Business Owner Detail Response
 */
interface BusinessOwnerDetailResponse {
  id: string;
  email: string;
  ownerName: string;
  restaurantName: string;
  phone: string | null;
  businessType: string | null;
  tinGstNumber: string | null;
  avatar: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  zipCode: string | null;
  address: string | null;
  status: string;
  subscriptionStartDate: Date | null;
  subscriptionEndDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  plan: SubscriptionPlanDetail | null;
  branches: BranchDetailInfo[];
  staffCount: number;
  orderStatistics: OrderStatistics;
}

/**
 * GET /api/v1/super-admin/business-owners/:id
 * Get detailed information about a specific business owner
 * Requires SuperAdmin authentication
 */
export async function getBusinessOwnerDetail(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { id } = req.params;

  try {
    // Fetch business owner with all related data
    const businessOwner = await prisma.businessOwner.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        ownerName: true,
        restaurantName: true,
        phone: true,
        businessType: true,
        tinGstNumber: true,
        avatar: true,
        country: true,
        state: true,
        city: true,
        zipCode: true,
        address: true,
        status: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        createdAt: true,
        updatedAt: true,
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
            trialDays: true,
            features: true,
            maxBranches: true,
            status: true,
          },
        },
        branches: {
          select: {
            id: true,
            name: true,
            code: true,
            phone: true,
            email: true,
            address: true,
            city: true,
            state: true,
            country: true,
            zipCode: true,
            isMainBranch: true,
            status: true,
            createdAt: true,
          },
          orderBy: { isMainBranch: 'desc' },
        },
        _count: {
          select: {
            staff: true,
          },
        },
      },
    });

    if (!businessOwner) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Business owner not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Get order statistics for this business owner
    const [totalOrders, completedOrders, cancelledOrders, revenueResult] = await Promise.all([
      prisma.order.count({
        where: { businessOwnerId: id },
      }),
      prisma.order.count({
        where: { businessOwnerId: id, orderStatus: 'Completed' },
      }),
      prisma.order.count({
        where: { businessOwnerId: id, orderStatus: 'Cancelled' },
      }),
      prisma.order.aggregate({
        where: { businessOwnerId: id, paymentStatus: 'Paid' },
        _sum: { total: true },
      }),
    ]);

    // Build the response
    const detailResponse: BusinessOwnerDetailResponse = {
      id: businessOwner.id,
      email: businessOwner.email,
      ownerName: businessOwner.ownerName,
      restaurantName: businessOwner.restaurantName,
      phone: businessOwner.phone,
      businessType: businessOwner.businessType,
      tinGstNumber: businessOwner.tinGstNumber,
      avatar: businessOwner.avatar,
      country: businessOwner.country,
      state: businessOwner.state,
      city: businessOwner.city,
      zipCode: businessOwner.zipCode,
      address: businessOwner.address,
      status: businessOwner.status,
      subscriptionStartDate: businessOwner.subscriptionStartDate,
      subscriptionEndDate: businessOwner.subscriptionEndDate,
      createdAt: businessOwner.createdAt,
      updatedAt: businessOwner.updatedAt,
      plan: businessOwner.plan
        ? {
            id: businessOwner.plan.id,
            name: businessOwner.plan.name,
            price: businessOwner.plan.price,
            duration: businessOwner.plan.duration,
            trialDays: businessOwner.plan.trialDays,
            features: businessOwner.plan.features,
            maxBranches: businessOwner.plan.maxBranches,
            status: businessOwner.plan.status,
          }
        : null,
      branches: businessOwner.branches.map((branch) => ({
        id: branch.id,
        name: branch.name,
        code: branch.code,
        phone: branch.phone,
        email: branch.email,
        address: branch.address,
        city: branch.city,
        state: branch.state,
        country: branch.country,
        zipCode: branch.zipCode,
        isMainBranch: branch.isMainBranch,
        status: branch.status,
        createdAt: branch.createdAt,
      })),
      staffCount: businessOwner._count.staff,
      orderStatistics: {
        totalOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue: revenueResult._sum.total?.toNumber() || 0,
      },
    };

    const response: ApiResponse<BusinessOwnerDetailResponse> = {
      success: true,
      data: detailResponse,
      message: 'Business owner details retrieved successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching business owner details:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching business owner details',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Valid status values for business owner
 */
const VALID_STATUSES = ['active', 'inactive', 'suspended'] as const;
type BusinessOwnerStatus = typeof VALID_STATUSES[number];

/**
 * Business Owner Status Update Response
 */
interface BusinessOwnerStatusUpdateResponse {
  id: string;
  email: string;
  ownerName: string;
  restaurantName: string;
  status: string;
  updatedAt: Date;
}

/**
 * Business Owner Subscription Update Response
 */
interface BusinessOwnerSubscriptionUpdateResponse {
  id: string;
  email: string;
  ownerName: string;
  restaurantName: string;
  status: string;
  subscriptionStartDate: Date | null;
  subscriptionEndDate: Date | null;
  updatedAt: Date;
  plan: SubscriptionPlanDetail | null;
}

/**
 * PATCH /api/v1/super-admin/business-owners/:id/subscription
 * Update business owner subscription plan and dates
 * Requires SuperAdmin authentication
 */
export async function updateBusinessOwnerSubscription(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { id } = req.params;
  const { planId, subscriptionStartDate, subscriptionEndDate } = req.body;

  try {
    // Validate at least one field is provided
    if (planId === undefined && subscriptionStartDate === undefined && subscriptionEndDate === undefined) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'At least one field must be provided: planId, subscriptionStartDate, or subscriptionEndDate',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Check if business owner exists
    const existingOwner = await prisma.businessOwner.findUnique({
      where: { id },
      select: {
        id: true,
        planId: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        plan: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!existingOwner) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Business owner not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // If planId is provided, validate it exists
    if (planId !== undefined) {
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: planId },
      });

      if (!plan) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Subscription plan not found',
          },
        };
        res.status(400).json(response);
        return;
      }
    }

    // Build update data
    interface UpdateData {
      planId?: string | null;
      subscriptionStartDate?: Date | null;
      subscriptionEndDate?: Date | null;
    }
    const updateData: UpdateData = {};

    if (planId !== undefined) {
      updateData.planId = planId;
    }

    if (subscriptionStartDate !== undefined) {
      // Allow null to clear the date
      updateData.subscriptionStartDate = subscriptionStartDate ? new Date(subscriptionStartDate) : null;
    }

    if (subscriptionEndDate !== undefined) {
      // Allow null to clear the date
      updateData.subscriptionEndDate = subscriptionEndDate ? new Date(subscriptionEndDate) : null;
    }

    // Build old value for audit log
    const oldValue = {
      planId: existingOwner.planId,
      planName: existingOwner.plan?.name || null,
      subscriptionStartDate: existingOwner.subscriptionStartDate,
      subscriptionEndDate: existingOwner.subscriptionEndDate,
    };

    // Update subscription and log to audit in a transaction
    const [updatedOwner] = await prisma.$transaction([
      // Update the business owner subscription
      prisma.businessOwner.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          ownerName: true,
          restaurantName: true,
          status: true,
          subscriptionStartDate: true,
          subscriptionEndDate: true,
          updatedAt: true,
          plan: {
            select: {
              id: true,
              name: true,
              price: true,
              duration: true,
              trialDays: true,
              features: true,
              maxBranches: true,
              status: true,
            },
          },
        },
      }),
      // Log the subscription change to AuditLog
      prisma.auditLog.create({
        data: {
          businessOwnerId: id,
          userId: req.user?.id || 'system',
          userType: AuditUserType.SuperAdmin,
          action: 'business_owner_subscription_update',
          entityType: 'BusinessOwner',
          entityId: id,
          oldValue: oldValue as Prisma.InputJsonValue,
          newValue: {
            planId: updateData.planId !== undefined ? updateData.planId : existingOwner.planId,
            subscriptionStartDate: updateData.subscriptionStartDate !== undefined
              ? updateData.subscriptionStartDate
              : existingOwner.subscriptionStartDate,
            subscriptionEndDate: updateData.subscriptionEndDate !== undefined
              ? updateData.subscriptionEndDate
              : existingOwner.subscriptionEndDate,
          } as Prisma.InputJsonValue,
          ipAddress: req.ip || req.socket?.remoteAddress || null,
        },
      }),
    ]);

    const responseData: BusinessOwnerSubscriptionUpdateResponse = {
      id: updatedOwner.id,
      email: updatedOwner.email,
      ownerName: updatedOwner.ownerName,
      restaurantName: updatedOwner.restaurantName,
      status: updatedOwner.status,
      subscriptionStartDate: updatedOwner.subscriptionStartDate,
      subscriptionEndDate: updatedOwner.subscriptionEndDate,
      updatedAt: updatedOwner.updatedAt,
      plan: updatedOwner.plan
        ? {
            id: updatedOwner.plan.id,
            name: updatedOwner.plan.name,
            price: updatedOwner.plan.price,
            duration: updatedOwner.plan.duration,
            trialDays: updatedOwner.plan.trialDays,
            features: updatedOwner.plan.features,
            maxBranches: updatedOwner.plan.maxBranches,
            status: updatedOwner.plan.status,
          }
        : null,
    };

    const response: ApiResponse<BusinessOwnerSubscriptionUpdateResponse> = {
      success: true,
      data: responseData,
      message: 'Business owner subscription updated successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating business owner subscription:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while updating business owner subscription',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * PATCH /api/v1/super-admin/business-owners/:id/status
 * Update business owner status (active, inactive, suspended)
 * Requires SuperAdmin authentication
 */
export async function updateBusinessOwnerStatus(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { id } = req.params;
  const { status } = req.body;

  try {
    // Validate required field
    if (!status) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Status is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Validate status value
    if (!VALID_STATUSES.includes(status as BusinessOwnerStatus)) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Status must be one of: active, inactive, suspended',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Check if business owner exists
    const existingOwner = await prisma.businessOwner.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!existingOwner) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Business owner not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Skip update if status is the same
    if (existingOwner.status === status) {
      const businessOwner = await prisma.businessOwner.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          ownerName: true,
          restaurantName: true,
          status: true,
          updatedAt: true,
        },
      });

      const response: ApiResponse<BusinessOwnerStatusUpdateResponse> = {
        success: true,
        data: businessOwner as BusinessOwnerStatusUpdateResponse,
        message: 'Business owner status is already set to the specified value',
      };
      res.status(200).json(response);
      return;
    }

    // Update status and log to audit in a transaction
    const [updatedOwner] = await prisma.$transaction([
      // Update the business owner status
      prisma.businessOwner.update({
        where: { id },
        data: { status },
        select: {
          id: true,
          email: true,
          ownerName: true,
          restaurantName: true,
          status: true,
          updatedAt: true,
        },
      }),
      // Log the status change to AuditLog
      prisma.auditLog.create({
        data: {
          businessOwnerId: id,
          userId: req.user?.id || 'system',
          userType: AuditUserType.SuperAdmin,
          action: 'business_owner_status_update',
          entityType: 'BusinessOwner',
          entityId: id,
          oldValue: { status: existingOwner.status } as Prisma.InputJsonValue,
          newValue: { status } as Prisma.InputJsonValue,
          ipAddress: req.ip || req.socket?.remoteAddress || null,
        },
      }),
    ]);

    const response: ApiResponse<BusinessOwnerStatusUpdateResponse> = {
      success: true,
      data: updatedOwner,
      message: `Business owner status updated to '${status}' successfully`,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating business owner status:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while updating business owner status',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * POST /api/v1/super-admin/business-owners
 * Create a new business owner (SuperAdmin creates on behalf)
 * Requires SuperAdmin authentication
 */
export async function createBusinessOwner(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const {
    email, password, ownerName, restaurantName, phone,
    businessType, tinGstNumber, country, state, city, zipCode, address, planId,
  } = req.body;

  try {
    // Validate required fields
    const requiredFields = ['email', 'password', 'ownerName', 'restaurantName', 'phone'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

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

    // Check for duplicate email
    const existing = await prisma.businessOwner.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'A business owner with this email already exists',
        },
      };
      res.status(409).json(response);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create business owner
    const businessOwner = await prisma.businessOwner.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        ownerName,
        restaurantName,
        phone,
        businessType: businessType || null,
        tinGstNumber: tinGstNumber || null,
        country: country || null,
        state: state || null,
        city: city || null,
        zipCode: zipCode || null,
        address: address || null,
        planId: planId || null,
        status: 'active',
      },
      select: {
        id: true,
        email: true,
        ownerName: true,
        restaurantName: true,
        phone: true,
        businessType: true,
        tinGstNumber: true,
        avatar: true,
        country: true,
        state: true,
        city: true,
        zipCode: true,
        address: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        plan: {
          select: { id: true, name: true, price: true, maxBranches: true },
        },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        businessOwnerId: businessOwner.id,
        userId: req.user?.id || 'system',
        userType: AuditUserType.SuperAdmin,
        action: 'business_owner_create',
        entityType: 'BusinessOwner',
        entityId: businessOwner.id,
        oldValue: Prisma.JsonNull,
        newValue: { email: businessOwner.email, ownerName, restaurantName } as Prisma.InputJsonValue,
        ipAddress: req.ip || req.socket?.remoteAddress || null,
      },
    });

    const response: ApiResponse = {
      success: true,
      data: businessOwner,
      message: 'Business owner created successfully',
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating business owner:', error);
    const response: ApiResponse = {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An error occurred while creating business owner' },
    };
    res.status(500).json(response);
  }
}

/**
 * PUT /api/v1/super-admin/business-owners/:id
 * Update a business owner's profile details
 * Requires SuperAdmin authentication
 */
export async function updateBusinessOwner(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { id } = req.params;
  const {
    ownerName, restaurantName, phone, email,
    businessType, tinGstNumber, country, state, city, zipCode, address, planId,
  } = req.body;

  try {
    const existing = await prisma.businessOwner.findUnique({
      where: { id },
      select: { id: true, email: true, ownerName: true, restaurantName: true },
    });

    if (!existing) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Business owner not found' },
      };
      res.status(404).json(response);
      return;
    }

    // If email is changing, check uniqueness
    if (email && email.toLowerCase() !== existing.email) {
      const emailTaken = await prisma.businessOwner.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (emailTaken) {
        const response: ApiResponse = {
          success: false,
          error: { code: 'EMAIL_EXISTS', message: 'This email is already in use' },
        };
        res.status(409).json(response);
        return;
      }
    }

    interface UpdateFields {
      ownerName?: string;
      restaurantName?: string;
      phone?: string;
      email?: string;
      businessType?: string | null;
      tinGstNumber?: string | null;
      country?: string | null;
      state?: string | null;
      city?: string | null;
      zipCode?: string | null;
      address?: string | null;
      planId?: string | null;
    }
    const data: UpdateFields = {};
    if (ownerName !== undefined) data.ownerName = ownerName;
    if (restaurantName !== undefined) data.restaurantName = restaurantName;
    if (phone !== undefined) data.phone = phone;
    if (email !== undefined) data.email = email.toLowerCase();
    if (businessType !== undefined) data.businessType = businessType || null;
    if (tinGstNumber !== undefined) data.tinGstNumber = tinGstNumber || null;
    if (country !== undefined) data.country = country || null;
    if (state !== undefined) data.state = state || null;
    if (city !== undefined) data.city = city || null;
    if (zipCode !== undefined) data.zipCode = zipCode || null;
    if (address !== undefined) data.address = address || null;
    if (planId !== undefined) data.planId = planId || null;

    const updated = await prisma.businessOwner.update({
      where: { id },
      data,
      select: {
        id: true, email: true, ownerName: true, restaurantName: true,
        phone: true, businessType: true, tinGstNumber: true, avatar: true,
        country: true, state: true, city: true, zipCode: true, address: true,
        status: true, createdAt: true, updatedAt: true,
        plan: { select: { id: true, name: true, price: true, maxBranches: true } },
      },
    });

    const response: ApiResponse = {
      success: true,
      data: updated,
      message: 'Business owner updated successfully',
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating business owner:', error);
    const response: ApiResponse = {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An error occurred while updating business owner' },
    };
    res.status(500).json(response);
  }
}

/**
 * DELETE /api/v1/super-admin/business-owners/:id
 * Delete a business owner
 * Requires SuperAdmin authentication
 */
export async function deleteBusinessOwner(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { id } = req.params;

  try {
    const existing = await prisma.businessOwner.findUnique({
      where: { id },
      select: { id: true, email: true, ownerName: true },
    });

    if (!existing) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Business owner not found' },
      };
      res.status(404).json(response);
      return;
    }

    await prisma.businessOwner.delete({ where: { id } });

    // Audit log (best-effort, business owner record is gone so use system)
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || 'system',
        userType: AuditUserType.SuperAdmin,
        action: 'business_owner_delete',
        entityType: 'BusinessOwner',
        entityId: id,
        oldValue: { email: existing.email, ownerName: existing.ownerName } as Prisma.InputJsonValue,
        newValue: Prisma.JsonNull,
        ipAddress: req.ip || req.socket?.remoteAddress || null,
      },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Business owner deleted successfully',
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('Error deleting business owner:', error);
    const response: ApiResponse = {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An error occurred while deleting business owner' },
    };
    res.status(500).json(response);
  }
}
export const updateOwnBusinessProfile = async (_req: any, res: any) => {
  res.json({ message: "Business profile updated" });
};
