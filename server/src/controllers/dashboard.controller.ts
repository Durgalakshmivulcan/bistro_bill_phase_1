import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { prisma } from '../services/db.service';
import { cacheService } from '../services/cache.service';
import { LeadStage, Prisma } from '@prisma/client';

/**
 * Lead counts by stage
 */
interface LeadsByStage {
  NewRequest: number;
  InitialContacted: number;
  ScheduledDemo: number;
  Completed: number;
  ClosedWin: number;
  ClosedLoss: number;
}

/**
 * Plan distribution (count per plan)
 */
interface PlanDistribution {
  planId: string;
  planName: string;
  count: number;
}

/**
 * Recent signup (last 7 days)
 */
interface RecentSignup {
  id: string;
  email: string;
  ownerName: string;
  restaurantName: string;
  createdAt: Date;
  plan: {
    id: string;
    name: string;
  } | null;
}

/**
 * Super Admin Dashboard Statistics Response
 */
interface DashboardStatsResponse {
  totalBusinessOwners: number;
  activeBusinessOwners: number;
  totalRevenue: number;
  leadsByStage: LeadsByStage;
  recentSignups: RecentSignup[];
  planDistribution: PlanDistribution[];
}

/**
 * GET /api/v1/super-admin/dashboard/stats
 * Get platform-wide statistics for super admin dashboard
 * Requires SuperAdmin authentication
 */
export async function getDashboardStats(
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    // Calculate date 7 days ago for recent signups
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Run all queries in parallel for better performance
    const [
      totalBusinessOwners,
      activeBusinessOwners,
      revenueResult,
      leadCounts,
      recentSignups,
      planDistributionRaw,
    ] = await Promise.all([
      // Total business owners count
      prisma.businessOwner.count(),

      // Active business owners count
      prisma.businessOwner.count({
        where: { status: 'active' },
      }),

      // Total revenue from subscriptions (sum of all paid subscription plans)
      // Revenue is calculated as sum of (plan price * number of active subscribers)
      prisma.businessOwner.findMany({
        where: {
          status: 'active',
          planId: { not: null },
        },
        select: {
          plan: {
            select: {
              price: true,
            },
          },
        },
      }),

      // Lead counts by stage - group by stage
      prisma.lead.groupBy({
        by: ['stage'],
        _count: {
          id: true,
        },
      }),

      // Recent signups (last 7 days)
      prisma.businessOwner.findMany({
        where: {
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
        select: {
          id: true,
          email: true,
          ownerName: true,
          restaurantName: true,
          createdAt: true,
          plan: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10, // Limit to 10 most recent
      }),

      // Plan distribution - count business owners per plan
      prisma.businessOwner.groupBy({
        by: ['planId'],
        _count: {
          id: true,
        },
        where: {
          planId: { not: null },
        },
      }),
    ]);

    // Calculate total revenue (sum of all active subscriber plan prices)
    const totalRevenue = revenueResult.reduce((sum, bo) => {
      if (bo.plan?.price) {
        return sum + bo.plan.price.toNumber();
      }
      return sum;
    }, 0);

    // Transform lead counts to LeadsByStage object
    const leadsByStage: LeadsByStage = {
      NewRequest: 0,
      InitialContacted: 0,
      ScheduledDemo: 0,
      Completed: 0,
      ClosedWin: 0,
      ClosedLoss: 0,
    };

    leadCounts.forEach((lc) => {
      if (lc.stage in leadsByStage) {
        leadsByStage[lc.stage as LeadStage] = lc._count.id;
      }
    });

    // Transform recent signups
    const recentSignupsResponse: RecentSignup[] = recentSignups.map((signup) => ({
      id: signup.id,
      email: signup.email,
      ownerName: signup.ownerName,
      restaurantName: signup.restaurantName,
      createdAt: signup.createdAt,
      plan: signup.plan
        ? {
            id: signup.plan.id,
            name: signup.plan.name,
          }
        : null,
    }));

    // Get plan names for plan distribution
    const planIds = planDistributionRaw.map((pd) => pd.planId).filter((id): id is string => id !== null);
    const plans = await prisma.subscriptionPlan.findMany({
      where: {
        id: { in: planIds },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const planNameMap = new Map(plans.map((p) => [p.id, p.name]));

    const planDistribution: PlanDistribution[] = planDistributionRaw
      .filter((pd) => pd.planId !== null)
      .map((pd) => ({
        planId: pd.planId as string,
        planName: planNameMap.get(pd.planId as string) || 'Unknown',
        count: pd._count.id,
      }))
      .sort((a, b) => b.count - a.count); // Sort by count descending

    // Build response
    const statsResponse: DashboardStatsResponse = {
      totalBusinessOwners,
      activeBusinessOwners,
      totalRevenue,
      leadsByStage,
      recentSignups: recentSignupsResponse,
      planDistribution,
    };

    const response: ApiResponse<DashboardStatsResponse> = {
      success: true,
      data: statsResponse,
      message: 'Dashboard statistics retrieved successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching dashboard statistics',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Revenue Summary Response for Business Owner Dashboard
 */
interface RevenueSummaryResponse {
  totalRevenue: number;
  discountAmount: number;
  chargesCollected: number;
  nonChargeableRevenue: number;
  cancelledRevenue: number;
}

/**
 * Revenue By Type Response for Business Owner Dashboard
 */
interface RevenueByTypeResponse {
  takeAwayRevenue: number;
  dineInRevenue: number;
  subscriptionRevenue: number;
  cateringRevenue: number;
  deliveryRevenue: number;
}

/**
 * GET /api/v1/dashboard/revenue-by-type
 * Get revenue breakdown by order type for business owner dashboard
 * Requires BusinessOwner authentication and tenant middleware
 */
export async function getRevenueByType(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { startDate, endDate, branchId } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'startDate and endDate are required',
        },
      };
      res.status(400).json(response);
      return;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_DATE',
          message: 'Invalid date format',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Build base where clause for completed orders
    const baseWhere: Prisma.OrderWhereInput = {
      businessOwnerId: tenantId,
      createdAt: {
        gte: start,
        lte: end,
      },
      orderStatus: 'Completed',
    };

    if (branchId) {
      baseWhere.branchId = branchId as string;
    }

    // Run queries in parallel for each order type
    const [takeAwayOrders, dineInOrders, subscriptionOrders, cateringOrders, deliveryOrders] = await Promise.all([
      prisma.order.aggregate({
        where: {
          ...baseWhere,
          type: 'TakeAway',
        },
        _sum: {
          total: true,
        },
      }),
      prisma.order.aggregate({
        where: {
          ...baseWhere,
          type: 'DineIn',
        },
        _sum: {
          total: true,
        },
      }),
      prisma.order.aggregate({
        where: {
          ...baseWhere,
          type: 'Subscription',
        },
        _sum: {
          total: true,
        },
      }),
      prisma.order.aggregate({
        where: {
          ...baseWhere,
          type: 'Catering',
        },
        _sum: {
          total: true,
        },
      }),
      prisma.order.aggregate({
        where: {
          ...baseWhere,
          type: 'Delivery',
        },
        _sum: {
          total: true,
        },
      }),
    ]);

    // Build response
    const revenueByTypeResponse: RevenueByTypeResponse = {
      takeAwayRevenue: Number(takeAwayOrders._sum.total || 0),
      dineInRevenue: Number(dineInOrders._sum.total || 0),
      subscriptionRevenue: Number(subscriptionOrders._sum.total || 0),
      cateringRevenue: Number(cateringOrders._sum.total || 0),
      deliveryRevenue: Number(deliveryOrders._sum.total || 0),
    };

    const response: ApiResponse<RevenueByTypeResponse> = {
      success: true,
      data: revenueByTypeResponse,
      message: 'Revenue by type retrieved successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching revenue by type:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching revenue by type',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Top Product Response for Business Owner Dashboard
 */
interface TopProduct {
  productId: string;
  productName: string;
  salesCount: number;
  revenue: number;
}

/**
 * GET /api/v1/dashboard/top-products
 * Get top-selling products by revenue for business owner dashboard
 * Requires BusinessOwner authentication and tenant middleware
 */
export async function getTopProducts(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { startDate, endDate, branchId, limit } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'startDate and endDate are required',
        },
      };
      res.status(400).json(response);
      return;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    const limitNum = limit ? parseInt(limit as string, 10) : 5;

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_DATE',
          message: 'Invalid date format',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Check cache first (TTL: 10 minutes)
    const cacheKey = cacheService.buildTopProductsKey(tenantId, startDate as string, endDate as string, branchId as string | undefined, limitNum);
    const cached = await cacheService.get<TopProduct[]>(cacheKey);
    if (cached) {
      const response: ApiResponse<TopProduct[]> = {
        success: true,
        data: cached,
        message: 'Top products retrieved successfully (cached)',
      };
      res.status(200).json(response);
      return;
    }

    // Build where clause for completed orders
    const orderWhere: Prisma.OrderWhereInput = {
      businessOwnerId: tenantId,
      createdAt: {
        gte: start,
        lte: end,
      },
      orderStatus: 'Completed',
    };

    if (branchId) {
      orderWhere.branchId = branchId as string;
    }

    // Get all order items from completed orders
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: orderWhere,
      },
      select: {
        productId: true,
        name: true,
        quantity: true,
        totalPrice: true,
      },
    });

    // Group by product and calculate totals
    const productMap = new Map<string, { name: string; salesCount: number; revenue: number }>();

    orderItems.forEach((item) => {
      const existing = productMap.get(item.productId);
      if (existing) {
        existing.salesCount += item.quantity;
        existing.revenue += Number(item.totalPrice);
      } else {
        productMap.set(item.productId, {
          name: item.name,
          salesCount: item.quantity,
          revenue: Number(item.totalPrice),
        });
      }
    });

    // Convert to array and sort by revenue descending
    const topProducts: TopProduct[] = Array.from(productMap.entries())
      .map(([productId, data]) => ({
        productId,
        productName: data.name,
        salesCount: data.salesCount,
        revenue: Number(data.revenue.toFixed(2)),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limitNum);

    // Cache for 10 minutes (600 seconds)
    await cacheService.set(cacheKey, topProducts, 600);

    const response: ApiResponse<TopProduct[]> = {
      success: true,
      data: topProducts,
      message: 'Top products retrieved successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching top products:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching top products',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Top Brand Response for Business Owner Dashboard
 */
interface TopBrand {
  brandId: string;
  brandName: string;
  productCount: number;
  revenue: number;
}

/**
 * GET /api/v1/dashboard/top-brands
 * Get top brands by revenue for business owner dashboard
 * Requires BusinessOwner authentication and tenant middleware
 */
export async function getTopBrands(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { startDate, endDate, branchId, limit } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'startDate and endDate are required',
        },
      };
      res.status(400).json(response);
      return;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    const limitNum = limit ? parseInt(limit as string, 10) : 5;

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_DATE',
          message: 'Invalid date format',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Check cache first (TTL: 10 minutes)
    const cacheKey = cacheService.buildTopBrandsKey(tenantId, startDate as string, endDate as string, branchId as string | undefined, limitNum);
    const cached = await cacheService.get<TopBrand[]>(cacheKey);
    if (cached) {
      const response: ApiResponse<TopBrand[]> = {
        success: true,
        data: cached,
        message: 'Top brands retrieved successfully (cached)',
      };
      res.status(200).json(response);
      return;
    }

    // Build where clause for completed orders
    const orderWhere: Prisma.OrderWhereInput = {
      businessOwnerId: tenantId,
      createdAt: {
        gte: start,
        lte: end,
      },
      orderStatus: 'Completed',
    };

    if (branchId) {
      orderWhere.branchId = branchId as string;
    }

    // Get all order items from completed orders with product and brand information
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: orderWhere,
      },
      select: {
        productId: true,
        totalPrice: true,
        product: {
          select: {
            brandId: true,
            brand: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Group by brand and calculate totals
    const brandMap = new Map<string, { name: string; productIds: Set<string>; revenue: number }>();

    orderItems.forEach((item) => {
      const brand = item.product.brand;
      const brandId = item.product.brandId;

      // Skip items without a brand
      if (!brand || !brandId) {
        return;
      }

      const existing = brandMap.get(brandId);
      if (existing) {
        existing.productIds.add(item.productId);
        existing.revenue += Number(item.totalPrice);
      } else {
        brandMap.set(brandId, {
          name: brand.name,
          productIds: new Set([item.productId]),
          revenue: Number(item.totalPrice),
        });
      }
    });

    // Convert to array and sort by revenue descending
    const topBrands: TopBrand[] = Array.from(brandMap.entries())
      .map(([brandId, data]) => ({
        brandId,
        brandName: data.name,
        productCount: data.productIds.size,
        revenue: Number(data.revenue.toFixed(2)),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limitNum);

    // Cache for 10 minutes (600 seconds)
    await cacheService.set(cacheKey, topBrands, 600);

    const response: ApiResponse<TopBrand[]> = {
      success: true,
      data: topBrands,
      message: 'Top brands retrieved successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching top brands:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching top brands',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Branch Performance Response for Business Owner Dashboard
 */
interface BranchPerformance {
  branchId: string;
  branchName: string;
  orderCount: number;
  revenue: number;
}

/**
 * GET /api/v1/dashboard/branch-performance
 * Get branch performance rankings for business owner dashboard
 * Requires BusinessOwner authentication and tenant middleware
 * Note: branchId filter is not applicable for this endpoint (shows all branches)
 */
export async function getBranchPerformance(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { startDate, endDate, limit } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'startDate and endDate are required',
        },
      };
      res.status(400).json(response);
      return;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    const limitNum = limit ? parseInt(limit as string, 10) : 5;

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_DATE',
          message: 'Invalid date format',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Check cache first (TTL: 10 minutes)
    const cacheKey = cacheService.buildBranchPerformanceKey(tenantId, startDate as string, endDate as string, limitNum);
    const cached = await cacheService.get<BranchPerformance[]>(cacheKey);
    if (cached) {
      const response: ApiResponse<BranchPerformance[]> = {
        success: true,
        data: cached,
        message: 'Branch performance retrieved successfully (cached)',
      };
      res.status(200).json(response);
      return;
    }

    // Build where clause for completed orders across all branches
    const orderWhere: Prisma.OrderWhereInput = {
      businessOwnerId: tenantId,
      createdAt: {
        gte: start,
        lte: end,
      },
      orderStatus: 'Completed',
    };

    // Get all orders with branch information
    const orders = await prisma.order.findMany({
      where: orderWhere,
      select: {
        branchId: true,
        total: true,
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Group by branch and calculate totals
    const branchMap = new Map<string, { name: string; orderCount: number; revenue: number }>();

    orders.forEach((order) => {
      const branchId = order.branchId;
      const branchName = order.branch?.name || 'Unknown Branch';

      const existing = branchMap.get(branchId);
      if (existing) {
        existing.orderCount += 1;
        existing.revenue += Number(order.total);
      } else {
        branchMap.set(branchId, {
          name: branchName,
          orderCount: 1,
          revenue: Number(order.total),
        });
      }
    });

    // Convert to array and sort by revenue descending
    const branchPerformance: BranchPerformance[] = Array.from(branchMap.entries())
      .map(([branchId, data]) => ({
        branchId,
        branchName: data.name,
        orderCount: data.orderCount,
        revenue: Number(data.revenue.toFixed(2)),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limitNum);

    // Cache for 10 minutes (600 seconds)
    await cacheService.set(cacheKey, branchPerformance, 600);

    const response: ApiResponse<BranchPerformance[]> = {
      success: true,
      data: branchPerformance,
      message: 'Branch performance retrieved successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching branch performance:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching branch performance',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Revenue By Payment Response for Business Owner Dashboard
 */
interface PaymentMethodRevenue {
  paymentMethod: string;
  revenue: number;
  percentage: number;
}

/**
 * GET /api/v1/dashboard/revenue-by-payment
 * Get revenue breakdown by payment method for business owner dashboard
 * Requires BusinessOwner authentication and tenant middleware
 */
export async function getRevenueByPayment(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { startDate, endDate, branchId } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'startDate and endDate are required',
        },
      };
      res.status(400).json(response);
      return;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_DATE',
          message: 'Invalid date format',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Check cache first (TTL: 10 minutes)
    const cacheKey = cacheService.buildRevenueByPaymentKey(tenantId, startDate as string, endDate as string, branchId as string | undefined);
    const cached = await cacheService.get<PaymentMethodRevenue[]>(cacheKey);
    if (cached) {
      const response: ApiResponse<PaymentMethodRevenue[]> = {
        success: true,
        data: cached,
        message: 'Revenue by payment method retrieved successfully (cached)',
      };
      res.status(200).json(response);
      return;
    }

    // Build where clause for completed orders
    const orderWhere: Prisma.OrderWhereInput = {
      businessOwnerId: tenantId,
      createdAt: {
        gte: start,
        lte: end,
      },
      orderStatus: 'Completed',
    };

    if (branchId) {
      orderWhere.branchId = branchId as string;
    }

    // Get all payments from completed orders with payment method information
    const orderPayments = await prisma.orderPayment.findMany({
      where: {
        order: orderWhere,
      },
      select: {
        amount: true,
        paymentOption: {
          select: {
            type: true,
          },
        },
      },
    });

    // Group by payment method and calculate totals
    const paymentMap = new Map<string, number>();
    let totalRevenue = 0;

    orderPayments.forEach((payment) => {
      const paymentType = payment.paymentOption.type;
      const amount = Number(payment.amount);

      totalRevenue += amount;

      const existing = paymentMap.get(paymentType);
      if (existing) {
        paymentMap.set(paymentType, existing + amount);
      } else {
        paymentMap.set(paymentType, amount);
      }
    });

    // Convert to array and calculate percentages
    const revenueByPayment: PaymentMethodRevenue[] = Array.from(paymentMap.entries())
      .map(([paymentMethod, revenue]) => ({
        paymentMethod,
        revenue: Number(revenue.toFixed(2)),
        percentage: totalRevenue > 0 ? Number(((revenue / totalRevenue) * 100).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue); // Sort by revenue descending

    // Cache for 10 minutes (600 seconds)
    await cacheService.set(cacheKey, revenueByPayment, 600);

    const response: ApiResponse<PaymentMethodRevenue[]> = {
      success: true,
      data: revenueByPayment,
      message: 'Revenue by payment method retrieved successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching revenue by payment method:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching revenue by payment method',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Average Values Response for Business Owner Dashboard
 */
interface AverageValuesResponse {
  avgOnline: number;
  avgOffline: number;
  avgDelivery: number;
  avgDiscount: number;
  avgTax: number;
}

/**
 * GET /api/v1/dashboard/average-values
 * Get average order values by type and category for business owner dashboard
 * Requires BusinessOwner authentication and tenant middleware
 */
export async function getAverageValues(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { startDate, endDate, branchId } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'startDate and endDate are required',
        },
      };
      res.status(400).json(response);
      return;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_DATE',
          message: 'Invalid date format',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Build where clause for completed orders
    const baseWhere: Prisma.OrderWhereInput = {
      businessOwnerId: tenantId,
      createdAt: {
        gte: start,
        lte: end,
      },
      orderStatus: 'Completed',
    };

    if (branchId) {
      baseWhere.branchId = branchId as string;
    }

    // Run queries in parallel for better performance
    const [onlineOrders, offlineOrders, deliveryOrders, allOrders] = await Promise.all([
      // Average online order cost (source != BistroBill)
      prisma.order.aggregate({
        where: {
          ...baseWhere,
          source: {
            not: 'BistroBill',
          },
        },
        _avg: {
          total: true,
        },
      }),
      // Average offline order cost (source = BistroBill)
      prisma.order.aggregate({
        where: {
          ...baseWhere,
          source: 'BistroBill',
        },
        _avg: {
          total: true,
        },
      }),
      // Average delivery cost (sum of chargesAmount for Delivery type orders / count of Delivery orders)
      prisma.order.aggregate({
        where: {
          ...baseWhere,
          type: 'Delivery',
        },
        _avg: {
          chargesAmount: true,
        },
      }),
      // Get all orders for discount and tax averages
      prisma.order.aggregate({
        where: baseWhere,
        _avg: {
          discountAmount: true,
          taxAmount: true,
        },
      }),
    ]);

    // Build response
    const averageValuesResponse: AverageValuesResponse = {
      avgOnline: Number(onlineOrders._avg.total || 0),
      avgOffline: Number(offlineOrders._avg.total || 0),
      avgDelivery: Number(deliveryOrders._avg.chargesAmount || 0),
      avgDiscount: Number(allOrders._avg.discountAmount || 0),
      avgTax: Number(allOrders._avg.taxAmount || 0),
    };

    const response: ApiResponse<AverageValuesResponse> = {
      success: true,
      data: averageValuesResponse,
      message: 'Average values retrieved successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching average values:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching average values',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * GET /api/v1/dashboard/revenue-summary
 * Get revenue summary metrics for business owner dashboard
 * Requires BusinessOwner authentication and tenant middleware
 */
export async function getRevenueSummary(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { startDate, endDate, branchId } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'startDate and endDate are required',
        },
      };
      res.status(400).json(response);
      return;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_DATE',
          message: 'Invalid date format',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Check cache first (TTL: 5 minutes)
    const cacheKey = cacheService.buildRevenueSummaryKey(tenantId, startDate as string, endDate as string, branchId as string | undefined);
    const cached = await cacheService.get<RevenueSummaryResponse>(cacheKey);
    if (cached) {
      const response: ApiResponse<RevenueSummaryResponse> = {
        success: true,
        data: cached,
        message: 'Revenue summary retrieved successfully (cached)',
      };
      res.status(200).json(response);
      return;
    }

    // Build where clause for completed orders
    const completedWhere: Prisma.OrderWhereInput = {
      businessOwnerId: tenantId,
      createdAt: {
        gte: start,
        lte: end,
      },
      orderStatus: 'Completed',
    };

    if (branchId) {
      completedWhere.branchId = branchId as string;
    }

    // Build where clause for cancelled orders
    const cancelledWhere: Prisma.OrderWhereInput = {
      businessOwnerId: tenantId,
      createdAt: {
        gte: start,
        lte: end,
      },
      orderStatus: 'Cancelled',
    };

    if (branchId) {
      cancelledWhere.branchId = branchId as string;
    }

    // Run queries in parallel for better performance
    const [completedOrders, cancelledOrders] = await Promise.all([
      prisma.order.findMany({
        where: completedWhere,
        select: {
          total: true,
          discountAmount: true,
          chargesAmount: true,
          paymentStatus: true,
        },
      }),
      prisma.order.findMany({
        where: cancelledWhere,
        select: {
          total: true,
        },
      }),
    ]);

    // Calculate Total Revenue (sum of all completed order totals)
    const totalRevenue = completedOrders.reduce((sum, order) => {
      return sum + Number(order.total);
    }, 0);

    // Calculate Given Discount Amount (sum of all discounts applied)
    const discountAmount = completedOrders.reduce((sum, order) => {
      return sum + Number(order.discountAmount);
    }, 0);

    // Calculate Charges Collected (sum of delivery/service charges)
    const chargesCollected = completedOrders.reduce((sum, order) => {
      return sum + Number(order.chargesAmount);
    }, 0);

    // Calculate Non-Chargeable Orders Revenue (unpaid orders)
    const nonChargeableRevenue = completedOrders
      .filter((order) => order.paymentStatus === 'Unpaid')
      .reduce((sum, order) => {
        return sum + Number(order.total);
      }, 0);

    // Calculate Cancelled Orders Revenue
    const cancelledRevenue = cancelledOrders.reduce((sum, order) => {
      return sum + Number(order.total);
    }, 0);

    // Build response
    const summaryResponse: RevenueSummaryResponse = {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      discountAmount: Number(discountAmount.toFixed(2)),
      chargesCollected: Number(chargesCollected.toFixed(2)),
      nonChargeableRevenue: Number(nonChargeableRevenue.toFixed(2)),
      cancelledRevenue: Number(cancelledRevenue.toFixed(2)),
    };

    // Cache for 5 minutes (300 seconds)
    await cacheService.set(cacheKey, summaryResponse, 300);

    const response: ApiResponse<RevenueSummaryResponse> = {
      success: true,
      data: summaryResponse,
      message: 'Revenue summary retrieved successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching revenue summary:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching revenue summary',
      },
    };
    res.status(500).json(response);
  }
}
