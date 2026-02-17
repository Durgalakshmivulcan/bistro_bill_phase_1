import { Response } from 'express';
import { prisma } from '../services/db.service';
import { AuthenticatedRequest, ApiResponse } from '../types';

/**
 * Monthly stats response for SA dashboard EarningsChart
 */
interface MonthlyStatsResponse {
  labels: string[];
  earnings: number[];
  users: number[];
}

/**
 * Top restaurant item for SA dashboard
 */
interface TopRestaurant {
  id: string;
  restaurantName: string;
  ownerName: string;
  totalRevenue: number;
  orderCount: number;
  plan: string;
  status: string;
}

/**
 * GET /api/v1/super-admin/dashboard/monthly-stats
 * Returns monthly earnings (sum of completed order totals) and new BO registrations per month
 */
export async function getMonthlyStats(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const yearParam = req.query.year as string | undefined;
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

    if (isNaN(year) || year < 2000 || year > 2100) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Invalid year parameter',
        },
      };
      res.status(400).json(response);
      return;
    }

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);

    // Run both queries in parallel
    const [completedOrders, newBusinessOwners] = await Promise.all([
      // Get completed orders for the year with their creation dates and totals
      prisma.order.findMany({
        where: {
          orderStatus: 'Completed',
          createdAt: {
            gte: startOfYear,
            lt: endOfYear,
          },
        },
        select: {
          total: true,
          createdAt: true,
        },
      }),
      // Get new BO registrations for the year
      prisma.businessOwner.findMany({
        where: {
          createdAt: {
            gte: startOfYear,
            lt: endOfYear,
          },
        },
        select: {
          createdAt: true,
        },
      }),
    ]);

    // Aggregate earnings by month
    const earnings = new Array(12).fill(0);
    completedOrders.forEach((order) => {
      const month = order.createdAt.getMonth(); // 0-11
      earnings[month] += Number(order.total);
    });

    // Aggregate user registrations by month
    const users = new Array(12).fill(0);
    newBusinessOwners.forEach((bo) => {
      const month = bo.createdAt.getMonth();
      users[month] += 1;
    });

    // Round earnings to 2 decimal places
    const roundedEarnings = earnings.map((e: number) => Number(e.toFixed(2)));

    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const data: MonthlyStatsResponse = {
      labels,
      earnings: roundedEarnings,
      users,
    };

    const response: ApiResponse<MonthlyStatsResponse> = {
      success: true,
      data,
    };
    res.json(response);
  } catch (error) {
    console.error('Error fetching monthly stats:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch monthly stats',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * GET /api/v1/super-admin/dashboard/top-restaurants
 * Returns top 10 BusinessOwners by total completed order revenue
 */
export async function getTopRestaurants(
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    // Get all business owners with their plan info
    const businessOwners = await prisma.businessOwner.findMany({
      select: {
        id: true,
        restaurantName: true,
        ownerName: true,
        status: true,
        plan: {
          select: {
            name: true,
          },
        },
      },
    });

    // Get order aggregates grouped by businessOwnerId for completed orders
    const orderAggregates = await prisma.order.groupBy({
      by: ['businessOwnerId'],
      where: {
        orderStatus: 'Completed',
      },
      _sum: {
        total: true,
      },
      _count: {
        id: true,
      },
    });

    // Build a map of businessOwnerId -> { totalRevenue, orderCount }
    const revenueMap = new Map<string, { totalRevenue: number; orderCount: number }>();
    orderAggregates.forEach((agg) => {
      revenueMap.set(agg.businessOwnerId, {
        totalRevenue: Number(agg._sum.total || 0),
        orderCount: agg._count.id,
      });
    });

    // Combine BO data with revenue data
    const restaurants: TopRestaurant[] = businessOwners
      .map((bo) => {
        const revenue = revenueMap.get(bo.id);
        return {
          id: bo.id,
          restaurantName: bo.restaurantName,
          ownerName: bo.ownerName,
          totalRevenue: revenue ? Number(revenue.totalRevenue.toFixed(2)) : 0,
          orderCount: revenue ? revenue.orderCount : 0,
          plan: bo.plan?.name || 'Free',
          status: bo.status,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    const response: ApiResponse<{ restaurants: TopRestaurant[] }> = {
      success: true,
      data: { restaurants },
    };
    res.json(response);
  } catch (error) {
    console.error('Error fetching top restaurants:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch top restaurants',
      },
    };
    res.status(500).json(response);
  }
}
