import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../services/db.service';
import { Prisma } from '@prisma/client';
import {
  generateCSV,
  generatePDF,
  formatSalesReportData,
  formatProductSalesData,
  formatCustomerReportData,
  formatGSTReportData,
} from '../services/export.service';
import { getS3SignedUrl } from '../services/s3.service';
import { forecastSales } from '../services/analytics.forecasting.service';
import { predictStockouts } from '../services/analytics.inventory.service';
import { getCohortAnalysis, getCustomerLTV, predictChurn } from '../services/analytics.cohort.service';
import { getSalesHeatmap } from '../services/analytics.heatmap.service';
import { getProductTrends, getMenuEngineeringMatrix } from '../services/analytics.trends.service';
import { getStaffPerformanceAnalytics } from '../services/analytics.staff.service';
import { detectSalesAnomalies, resolveAnomaly } from '../services/analytics.anomaly.service';
import { exportToExcel, getChartConfigForReport, ExcelHeader } from '../services/reportBuilder.service';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

// GET /api/v1/reports/sales/summary - Sales summary report
export const getSalesSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    const { startDate, endDate, branchId } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'startDate and endDate are required',
        },
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATE',
          message: 'Invalid date format',
        },
      });
    }

    // Build where clause
    const where: Prisma.OrderWhereInput = {
      businessOwnerId: tenantId,
      createdAt: {
        gte: start,
        lte: end,
      },
      orderStatus: {
        in: ['Completed'], // Only completed orders count towards sales
      },
    };

    if (branchId) {
      where.branchId = branchId as string;
    }

    // Get orders for current period
    const orders = await prisma.order.findMany({
      where,
      select: {
        total: true,
        discountAmount: true,
        taxAmount: true,
      },
    });

    // Calculate current period metrics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => {
      return sum + Number(order.total);
    }, 0);
    const totalDiscounts = orders.reduce((sum, order) => {
      return sum + Number(order.discountAmount);
    }, 0);
    const totalTax = orders.reduce((sum, order) => {
      return sum + Number(order.taxAmount);
    }, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate previous period dates (same duration)
    const periodDuration = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - periodDuration);
    const prevEnd = new Date(start.getTime());

    // Build where clause for previous period
    const prevWhere: Prisma.OrderWhereInput = {
      businessOwnerId: tenantId,
      createdAt: {
        gte: prevStart,
        lte: prevEnd,
      },
      orderStatus: {
        in: ['Completed'],
      },
    };

    if (branchId) {
      prevWhere.branchId = branchId as string;
    }

    // Get orders for previous period
    const prevOrders = await prisma.order.findMany({
      where: prevWhere,
      select: {
        total: true,
      },
    });

    const prevTotalOrders = prevOrders.length;
    const prevTotalRevenue = prevOrders.reduce((sum, order) => {
      return sum + Number(order.total);
    }, 0);
    const prevAvgOrderValue = prevTotalOrders > 0 ? prevTotalRevenue / prevTotalOrders : 0;

    // Calculate percentage changes
    const calculatePercentageChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const ordersChange = calculatePercentageChange(totalOrders, prevTotalOrders);
    const revenueChange = calculatePercentageChange(totalRevenue, prevTotalRevenue);
    const avgOrderValueChange = calculatePercentageChange(avgOrderValue, prevAvgOrderValue);

    return res.status(200).json({
      success: true,
      data: {
        currentPeriod: {
          totalOrders,
          totalRevenue: Number(totalRevenue.toFixed(2)),
          avgOrderValue: Number(avgOrderValue.toFixed(2)),
          totalDiscounts: Number(totalDiscounts.toFixed(2)),
          totalTax: Number(totalTax.toFixed(2)),
        },
        previousPeriod: {
          totalOrders: prevTotalOrders,
          totalRevenue: Number(prevTotalRevenue.toFixed(2)),
          avgOrderValue: Number(prevAvgOrderValue.toFixed(2)),
        },
        comparison: {
          ordersChange: Number(ordersChange.toFixed(2)),
          revenueChange: Number(revenueChange.toFixed(2)),
          avgOrderValueChange: Number(avgOrderValueChange.toFixed(2)),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching sales summary:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch sales summary',
      },
    });
  }
};

// GET /api/v1/reports/sales/by-period - Sales by time period (day/week/month)
export const getSalesByPeriod = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    const { startDate, endDate, groupBy, branchId } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'startDate and endDate are required',
        },
      });
    }

    // Validate groupBy parameter
    const validGroupBy = ['day', 'week', 'month'];
    const groupByValue = (groupBy as string) || 'day';
    if (!validGroupBy.includes(groupByValue)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_GROUP_BY',
          message: 'groupBy must be one of: day, week, month',
        },
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATE',
          message: 'Invalid date format',
        },
      });
    }

    // Build where clause
    const where: Prisma.OrderWhereInput = {
      businessOwnerId: tenantId,
      createdAt: {
        gte: start,
        lte: end,
      },
      orderStatus: {
        in: ['Completed'], // Only completed orders count towards sales
      },
    };

    if (branchId) {
      where.branchId = branchId as string;
    }

    // Get all completed orders in the period
    const orders = await prisma.order.findMany({
      where,
      select: {
        createdAt: true,
        total: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Helper function to get period key for grouping
    const getPeriodKey = (date: Date, groupBy: string): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      if (groupBy === 'day') {
        return `${year}-${month}-${day}`;
      } else if (groupBy === 'week') {
        // ISO week number calculation
        const firstDayOfYear = new Date(year, 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        return `${year}-W${String(weekNumber).padStart(2, '0')}`;
      } else {
        // month
        return `${year}-${month}`;
      }
    };

    // Group orders by period
    const periodMap = new Map<string, { orderCount: number; revenue: number }>();

    orders.forEach((order) => {
      const periodKey = getPeriodKey(order.createdAt, groupByValue);
      const current = periodMap.get(periodKey) || { orderCount: 0, revenue: 0 };
      current.orderCount += 1;
      current.revenue += Number(order.total);
      periodMap.set(periodKey, current);
    });

    // Convert map to array and sort by period
    const breakdown = Array.from(periodMap.entries())
      .map(([period, data]) => ({
        period,
        orderCount: data.orderCount,
        revenue: Number(data.revenue.toFixed(2)),
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    return res.status(200).json({
      success: true,
      data: {
        groupBy: groupByValue,
        breakdown,
      },
    });
  } catch (error) {
    console.error('Error fetching sales by period:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch sales by period',
      },
    });
  }
};

// GET /api/v1/reports/sales/by-type - Sales by order type breakdown
export const getSalesByType = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    const { startDate, endDate, branchId } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'startDate and endDate are required',
        },
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATE',
          message: 'Invalid date format',
        },
      });
    }

    // Build where clause
    const where: Prisma.OrderWhereInput = {
      businessOwnerId: tenantId,
      createdAt: {
        gte: start,
        lte: end,
      },
      orderStatus: {
        in: ['Completed'], // Only completed orders count towards sales
      },
    };

    if (branchId) {
      where.branchId = branchId as string;
    }

    // Get all completed orders in the period
    const orders = await prisma.order.findMany({
      where,
      select: {
        type: true,
        total: true,
      },
    });

    // Group orders by type
    const typeMap = new Map<string, { orderCount: number; revenue: number }>();

    orders.forEach((order) => {
      const orderType = order.type;
      const current = typeMap.get(orderType) || { orderCount: 0, revenue: 0 };
      current.orderCount += 1;
      current.revenue += Number(order.total);
      typeMap.set(orderType, current);
    });

    // Calculate total revenue for percentage calculation
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);

    // Convert map to array with percentages
    const breakdown = Array.from(typeMap.entries()).map(([type, data]) => ({
      type,
      orderCount: data.orderCount,
      revenue: Number(data.revenue.toFixed(2)),
      percentage: totalRevenue > 0 ? Number(((data.revenue / totalRevenue) * 100).toFixed(2)) : 0,
    }));

    // Sort by revenue descending
    breakdown.sort((a, b) => b.revenue - a.revenue);

    return res.status(200).json({
      success: true,
      data: {
        breakdown,
        total: {
          orderCount: orders.length,
          revenue: Number(totalRevenue.toFixed(2)),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching sales by type:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch sales by type',
      },
    });
  }
};

// GET /api/v1/reports/sales/by-payment - Sales by payment method breakdown
export const getSalesByPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    const { startDate, endDate, branchId } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'startDate and endDate are required',
        },
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATE',
          message: 'Invalid date format',
        },
      });
    }

    // Build where clause for orders
    const orderWhere: Prisma.OrderWhereInput = {
      businessOwnerId: tenantId,
      createdAt: {
        gte: start,
        lte: end,
      },
      orderStatus: {
        in: ['Completed'], // Only completed orders count towards sales
      },
    };

    if (branchId) {
      orderWhere.branchId = branchId as string;
    }

    // Get all payments for completed orders in the period
    const payments = await prisma.orderPayment.findMany({
      where: {
        order: orderWhere,
      },
      select: {
        amount: true,
        paymentOption: {
          select: {
            name: true,
          },
        },
      },
    });

    // Group payments by payment method
    const paymentMap = new Map<string, { count: number; amount: number }>();

    payments.forEach((payment) => {
      const method = payment.paymentOption.name;
      const current = paymentMap.get(method) || { count: 0, amount: 0 };
      current.count += 1;
      current.amount += Number(payment.amount);
      paymentMap.set(method, current);
    });

    // Calculate total amount for percentage calculation
    const totalAmount = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);

    // Convert map to array with percentages
    const breakdown = Array.from(paymentMap.entries()).map(([method, data]) => ({
      method,
      count: data.count,
      amount: Number(data.amount.toFixed(2)),
      percentage: totalAmount > 0 ? Number(((data.amount / totalAmount) * 100).toFixed(2)) : 0,
    }));

    // Sort by amount descending
    breakdown.sort((a, b) => b.amount - a.amount);

    return res.status(200).json({
      success: true,
      data: {
        breakdown,
        total: {
          count: payments.length,
          amount: Number(totalAmount.toFixed(2)),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching sales by payment:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch sales by payment',
      },
    });
  }
};

// GET /api/v1/reports/products/top - Top products report
export const getTopProducts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    const { startDate, endDate, limit, branchId } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'startDate and endDate are required',
        },
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATE',
          message: 'Invalid date format',
        },
      });
    }

    // Parse limit parameter (default 10)
    const limitValue = limit ? parseInt(limit as string, 10) : 10;
    if (isNaN(limitValue) || limitValue <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_LIMIT',
          message: 'Limit must be a positive number',
        },
      });
    }

    // Build where clause for orders
    const orderWhere: Prisma.OrderWhereInput = {
      businessOwnerId: tenantId,
      createdAt: {
        gte: start,
        lte: end,
      },
      orderStatus: {
        in: ['Completed'], // Only completed orders count towards sales
      },
    };

    if (branchId) {
      orderWhere.branchId = branchId as string;
    }

    // Get all order items for completed orders in the period
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: orderWhere,
      },
      select: {
        productId: true,
        name: true,
        quantity: true,
        totalPrice: true,
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            categoryId: true,
            category: {
              select: {
                name: true,
              },
            },
            images: {
              where: {
                isPrimary: true,
              },
              select: {
                url: true,
              },
              take: 1,
            },
          },
        },
      },
    });

    // Group by productId and calculate totals
    const productMap = new Map<
      string,
      {
        product: {
          id: string;
          name: string;
          sku: string | null;
          categoryName: string | null;
          imageUrl: string | null;
        };
        quantitySold: number;
        revenue: number;
      }
    >();

    orderItems.forEach((item) => {
      const productId = item.productId;
      const existing = productMap.get(productId);

      if (existing) {
        existing.quantitySold += item.quantity;
        existing.revenue += Number(item.totalPrice);
      } else {
        productMap.set(productId, {
          product: {
            id: item.product.id,
            name: item.product.name,
            sku: item.product.sku,
            categoryName: item.product.category?.name || null,
            imageUrl: item.product.images[0]?.url || null,
          },
          quantitySold: item.quantity,
          revenue: Number(item.totalPrice),
        });
      }
    });

    // Convert map to array, sort by revenue descending, and add ranking
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limitValue)
      .map((item, index) => ({
        ranking: index + 1,
        product: item.product,
        quantitySold: item.quantitySold,
        revenue: Number(item.revenue.toFixed(2)),
      }));

    return res.status(200).json({
      success: true,
      data: {
        topProducts,
        total: topProducts.length,
      },
    });
  } catch (error) {
    console.error('Error fetching top products:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch top products',
      },
    });
  }
};

// GET /api/v1/reports/products/least - Least selling products report
export const getLeastProducts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    const { startDate, endDate, limit, branchId } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'startDate and endDate are required',
        },
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATE',
          message: 'Invalid date format',
        },
      });
    }

    // Parse limit parameter (default 10)
    const limitValue = limit ? parseInt(limit as string, 10) : 10;
    if (isNaN(limitValue) || limitValue <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_LIMIT',
          message: 'Limit must be a positive number',
        },
      });
    }

    // Build where clause for orders
    const orderWhere: Prisma.OrderWhereInput = {
      businessOwnerId: tenantId,
      createdAt: {
        gte: start,
        lte: end,
      },
      orderStatus: {
        in: ['Completed'], // Only completed orders count towards sales
      },
    };

    if (branchId) {
      orderWhere.branchId = branchId as string;
    }

    // Get all order items for completed orders in the period
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: orderWhere,
      },
      select: {
        productId: true,
        name: true,
        quantity: true,
        totalPrice: true,
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            categoryId: true,
            category: {
              select: {
                name: true,
              },
            },
            images: {
              where: {
                isPrimary: true,
              },
              select: {
                url: true,
              },
              take: 1,
            },
          },
        },
      },
    });

    // Group by productId and calculate totals
    const productMap = new Map<
      string,
      {
        product: {
          id: string;
          name: string;
          sku: string | null;
          categoryName: string | null;
          imageUrl: string | null;
        };
        quantitySold: number;
        revenue: number;
      }
    >();

    orderItems.forEach((item) => {
      const productId = item.productId;
      const existing = productMap.get(productId);

      if (existing) {
        existing.quantitySold += item.quantity;
        existing.revenue += Number(item.totalPrice);
      } else {
        productMap.set(productId, {
          product: {
            id: item.product.id,
            name: item.product.name,
            sku: item.product.sku,
            categoryName: item.product.category?.name || null,
            imageUrl: item.product.images[0]?.url || null,
          },
          quantitySold: item.quantity,
          revenue: Number(item.totalPrice),
        });
      }
    });

    // Convert map to array, sort by revenue ASCENDING (lowest first), and add ranking
    const leastProducts = Array.from(productMap.values())
      .sort((a, b) => a.revenue - b.revenue) // Changed from b.revenue - a.revenue for ascending order
      .slice(0, limitValue)
      .map((item, index) => ({
        ranking: index + 1,
        product: item.product,
        quantitySold: item.quantitySold,
        revenue: Number(item.revenue.toFixed(2)),
      }));

    return res.status(200).json({
      success: true,
      data: {
        leastProducts,
        total: leastProducts.length,
      },
    });
  } catch (error) {
    console.error('Error fetching least selling products:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch least selling products',
      },
    });
  }
};

// GET /api/v1/reports/products/sales - Product sales report with pagination
export const getProductSales = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    const { startDate, endDate, categoryId, page, limit, branchId } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'startDate and endDate are required',
        },
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATE',
          message: 'Invalid date format',
        },
      });
    }

    // Parse pagination parameters
    const pageNumber = page ? parseInt(page as string, 10) : 1;
    const pageSize = limit ? parseInt(limit as string, 10) : 10;

    if (isNaN(pageNumber) || pageNumber <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PAGE',
          message: 'Page must be a positive number',
        },
      });
    }

    if (isNaN(pageSize) || pageSize <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_LIMIT',
          message: 'Limit must be a positive number',
        },
      });
    }

    // Build where clause for orders
    const orderWhere: Prisma.OrderWhereInput = {
      businessOwnerId: tenantId,
      createdAt: {
        gte: start,
        lte: end,
      },
      orderStatus: {
        in: ['Completed'], // Only completed orders count towards sales
      },
    };

    if (branchId) {
      orderWhere.branchId = branchId as string;
    }

    // Build where clause for products
    const productWhere: Prisma.ProductWhereInput = {
      businessOwnerId: tenantId,
    };

    if (categoryId) {
      productWhere.categoryId = categoryId as string;
    }

    // Get all order items for completed orders in the period
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: orderWhere,
        product: productWhere,
      },
      select: {
        productId: true,
        quantity: true,
        totalPrice: true,
      },
    });

    // Group by productId and calculate totals
    const productStatsMap = new Map<
      string,
      {
        quantitySold: number;
        revenue: number;
        orderCount: number;
      }
    >();

    orderItems.forEach((item) => {
      const productId = item.productId;
      const existing = productStatsMap.get(productId);

      if (existing) {
        existing.quantitySold += item.quantity;
        existing.revenue += Number(item.totalPrice);
        existing.orderCount += 1;
      } else {
        productStatsMap.set(productId, {
          quantitySold: item.quantity,
          revenue: Number(item.totalPrice),
          orderCount: 1,
        });
      }
    });

    // Get all products that had sales
    const productIds = Array.from(productStatsMap.keys());

    // Build product filter with pagination
    const productFilter: Prisma.ProductWhereInput = {
      ...productWhere,
      id: {
        in: productIds,
      },
    };

    // Get total count for pagination
    const totalProducts = productIds.length;
    const totalPages = Math.ceil(totalProducts / pageSize);

    // Get paginated product details
    const skip = (pageNumber - 1) * pageSize;
    const products = await prisma.product.findMany({
      where: productFilter,
      select: {
        id: true,
        name: true,
        sku: true,
        categoryId: true,
        category: {
          select: {
            name: true,
          },
        },
        images: {
          where: {
            isPrimary: true,
          },
          select: {
            url: true,
          },
          take: 1,
        },
      },
      skip,
      take: pageSize,
      orderBy: {
        name: 'asc',
      },
    });

    // Combine product details with sales stats
    const productSales = products.map((product) => {
      const stats = productStatsMap.get(product.id);
      const quantitySold = stats?.quantitySold || 0;
      const revenue = stats?.revenue || 0;
      const avgPrice = quantitySold > 0 ? revenue / quantitySold : 0;

      return {
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          categoryName: product.category?.name || null,
          imageUrl: product.images[0]?.url || null,
        },
        quantitySold,
        revenue: Number(revenue.toFixed(2)),
        avgPrice: Number(avgPrice.toFixed(2)),
      };
    });

    return res.status(200).json({
      success: true,
      data: productSales,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total: totalProducts,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching product sales:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch product sales',
      },
    });
  }
};

// GET /api/v1/reports/customers - Customer analytics report
export const getCustomerReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    const { startDate, endDate, branchId } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'startDate and endDate are required',
        },
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATE',
          message: 'Invalid date format',
        },
      });
    }

    // Build where clause for current period
    const orderWhere: Prisma.OrderWhereInput = {
      businessOwnerId: tenantId,
      createdAt: {
        gte: start,
        lte: end,
      },
      orderStatus: {
        in: ['Completed'], // Only completed orders count
      },
    };

    if (branchId) {
      orderWhere.branchId = branchId as string;
    }

    // Get all customers who placed orders in this period
    const customersWithOrders = await prisma.customer.findMany({
      where: {
        businessOwnerId: tenantId,
        orders: {
          some: orderWhere,
        },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        type: true,
        createdAt: true,
        orders: {
          where: orderWhere,
          select: {
            id: true,
            total: true,
            createdAt: true,
          },
        },
      },
    });

    // Identify new customers (created within the period)
    const newCustomers = customersWithOrders.filter((customer) => {
      return customer.createdAt >= start && customer.createdAt <= end;
    });

    // Identify returning customers (created before the period but ordered within it)
    const returningCustomers = customersWithOrders.filter((customer) => {
      return customer.createdAt < start;
    });

    // Calculate top customers by spend
    const customersWithTotalSpend = customersWithOrders.map((customer) => {
      const totalSpent = customer.orders.reduce((sum, order) => sum + Number(order.total), 0);
      const orderCount = customer.orders.length;

      return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        type: customer.type,
        totalSpent: Number(totalSpent.toFixed(2)),
        orderCount,
      };
    });

    // Sort by total spend and get top 10
    const topCustomers = customersWithTotalSpend
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    // Calculate average metrics
    const totalCustomersWithOrders = customersWithOrders.length;
    const totalOrders = customersWithOrders.reduce((sum, c) => sum + c.orders.length, 0);
    const totalRevenue = customersWithOrders.reduce((sum, c) => {
      return sum + c.orders.reduce((orderSum, o) => orderSum + Number(o.total), 0);
    }, 0);

    const avgOrdersPerCustomer = totalCustomersWithOrders > 0
      ? totalOrders / totalCustomersWithOrders
      : 0;

    const avgSpendPerCustomer = totalCustomersWithOrders > 0
      ? totalRevenue / totalCustomersWithOrders
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        newCustomers: newCustomers.length,
        returningCustomers: returningCustomers.length,
        topCustomers,
        avgOrdersPerCustomer: Number(avgOrdersPerCustomer.toFixed(2)),
        avgSpendPerCustomer: Number(avgSpendPerCustomer.toFixed(2)),
        totalCustomersWithOrders,
      },
    });
  } catch (error) {
    console.error('Error fetching customer report:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch customer report',
      },
    });
  }
};

// GET /api/v1/reports/staff/performance - Staff performance metrics
export const getStaffPerformance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    const { startDate, endDate, branchId } = req.query;

    const result = await getStaffPerformanceAnalytics(
      tenantId,
      startDate as string | undefined,
      endDate as string | undefined,
      branchId as string | undefined
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching staff performance:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'STAFF_PERFORMANCE_FAILED',
        message: 'Failed to fetch staff performance analytics',
      },
    });
  }
};

// GET /api/v1/reports/inventory - Inventory status report
export const getInventoryReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    const { branchId } = req.query;

    // Build where clause for inventory products
    const inventoryWhere: Prisma.InventoryProductWhereInput = {
      businessOwnerId: tenantId,
    };

    if (branchId) {
      inventoryWhere.branchId = branchId as string;
    }

    // Get all inventory items
    const inventoryItems = await prisma.inventoryProduct.findMany({
      where: inventoryWhere,
      select: {
        id: true,
        name: true,
        inStock: true,
        restockAlert: true,
        costPrice: true,
        supplierId: true,
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Calculate summary metrics
    const totalItems = inventoryItems.length;
    const lowStockCount = inventoryItems.filter((item) => {
      const restockAlert = item.restockAlert || 0;
      return item.inStock <= restockAlert;
    }).length;

    const totalValue = inventoryItems.reduce((sum, item) => {
      const cost = Number(item.costPrice) || 0;
      const quantity = Number(item.inStock) || 0;
      return sum + cost * quantity;
    }, 0);

    // Group items by supplier
    const supplierMap = new Map<
      string,
      {
        supplierId: string;
        supplierName: string;
        itemCount: number;
        totalValue: number;
      }
    >();

    inventoryItems.forEach((item) => {
      if (!item.supplierId || !item.supplier) {
        // Skip items without supplier
        return;
      }

      const supplierId = item.supplierId;
      const existing = supplierMap.get(supplierId);
      const itemValue = Number(item.costPrice || 0) * Number(item.inStock || 0);

      if (existing) {
        existing.itemCount += 1;
        existing.totalValue += itemValue;
      } else {
        supplierMap.set(supplierId, {
          supplierId: item.supplier.id,
          supplierName: item.supplier.name,
          itemCount: 1,
          totalValue: itemValue,
        });
      }
    });

    // Convert supplier map to array
    const itemsBySupplier = Array.from(supplierMap.values()).map((supplier) => ({
      supplierId: supplier.supplierId,
      supplierName: supplier.supplierName,
      itemCount: supplier.itemCount,
      totalValue: Number(supplier.totalValue.toFixed(2)),
    }));

    // Sort by item count descending
    itemsBySupplier.sort((a, b) => b.itemCount - a.itemCount);

    // Get recent movements from audit logs (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentMovements = await prisma.auditLog.findMany({
      where: {
        businessOwnerId: tenantId,
        entityType: 'InventoryProduct',
        action: 'update',
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        id: true,
        entityId: true,
        action: true,
        oldValue: true,
        newValue: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    // Format movements with change details
    const formattedMovements = await Promise.all(
      recentMovements
        .filter((log) => log.entityId !== null)
        .map(async (log) => {
          // Get inventory product name
          const inventoryProduct = await prisma.inventoryProduct.findUnique({
            where: { id: log.entityId as string },
            select: { name: true },
          });

          const oldStock = (log.oldValue as any)?.inStock || 0;
          const newStock = (log.newValue as any)?.inStock || 0;
          const change = newStock - oldStock;

          return {
            id: log.id,
            inventoryProductId: log.entityId as string,
            inventoryProductName: inventoryProduct?.name || 'Unknown',
            oldStock,
            newStock,
            change,
            changeType: change > 0 ? 'increase' : 'decrease',
            timestamp: log.createdAt,
          };
        })
    );

    return res.status(200).json({
      success: true,
      data: {
        totalItems,
        lowStockCount,
        totalValue: Number(totalValue.toFixed(2)),
        itemsBySupplier,
        recentMovements: formattedMovements,
      },
    });
  } catch (error) {
    console.error('Error fetching inventory report:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch inventory report',
      },
    });
  }
};

// GET /api/v1/reports/gst/b2b - GST B2B Report (transactions with registered customers)
export const getGstB2bReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    const { month, year, branchId } = req.query;

    // Validate required parameters
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'month and year are required',
        },
      });
    }

    // Parse and validate month and year
    const monthNum = parseInt(month as string, 10);
    const yearNum = parseInt(year as string, 10);

    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MONTH',
          message: 'Month must be between 1 and 12',
        },
      });
    }

    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_YEAR',
          message: 'Year must be a valid year',
        },
      });
    }

    // Calculate date range for the specified month
    const startDate = new Date(yearNum, monthNum - 1, 1); // First day of month
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999); // Last day of month

    // Build where clause for orders
    const orderWhere: Prisma.OrderWhereInput = {
      businessOwnerId: tenantId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      orderStatus: 'Completed', // Only completed orders for GST
      customerId: {
        not: null, // Must have a customer
      },
      customer: {
        gstin: {
          not: null, // Only customers with GSTIN (B2B)
        },
      },
    };

    if (branchId) {
      orderWhere.branchId = branchId as string;
    }

    // Get all B2B orders for the month
    const b2bOrders = await prisma.order.findMany({
      where: orderWhere,
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        subtotal: true,
        discountAmount: true,
        taxAmount: true,
        total: true,
        customer: {
          select: {
            id: true,
            name: true,
            gstin: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Format B2B transactions
    const transactions = b2bOrders.map((order) => {
      const taxableAmount = Number(order.subtotal) - Number(order.discountAmount);

      return {
        invoiceNumber: order.orderNumber,
        invoiceDate: order.createdAt,
        customerName: order.customer?.name || 'Unknown',
        customerGSTIN: order.customer?.gstin || '',
        taxableAmount: Number(taxableAmount.toFixed(2)),
        taxAmount: Number(order.taxAmount),
        totalAmount: Number(order.total),
      };
    });

    // Calculate summary
    const totalTransactions = transactions.length;
    const totalTaxableAmount = transactions.reduce((sum, t) => sum + t.taxableAmount, 0);
    const totalTaxAmount = transactions.reduce((sum, t) => sum + t.taxAmount, 0);
    const totalAmount = transactions.reduce((sum, t) => sum + t.totalAmount, 0);

    return res.status(200).json({
      success: true,
      data: {
        period: {
          month: monthNum,
          year: yearNum,
        },
        summary: {
          totalTransactions,
          totalTaxableAmount: Number(totalTaxableAmount.toFixed(2)),
          totalTaxAmount: Number(totalTaxAmount.toFixed(2)),
          totalAmount: Number(totalAmount.toFixed(2)),
        },
        transactions,
      },
    });
  } catch (error) {
    console.error('Error fetching GST B2B report:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch GST B2B report',
      },
    });
  }
};

// GET /api/v1/reports/gst/b2c - GST B2C Report (transactions without GSTIN, aggregated by state)
export const getGstB2cReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    const { month, year, branchId } = req.query;

    // Validate required parameters
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'month and year are required',
        },
      });
    }

    // Parse and validate month and year
    const monthNum = parseInt(month as string, 10);
    const yearNum = parseInt(year as string, 10);

    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MONTH',
          message: 'Month must be between 1 and 12',
        },
      });
    }

    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_YEAR',
          message: 'Year must be a valid year',
        },
      });
    }

    // Calculate date range for the specified month
    const startDate = new Date(yearNum, monthNum - 1, 1); // First day of month
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999); // Last day of month

    // Build where clause for B2C orders (customers without GSTIN or no customer)
    const orderWhere: Prisma.OrderWhereInput = {
      businessOwnerId: tenantId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      orderStatus: 'Completed', // Only completed orders for GST
      OR: [
        {
          customerId: null, // Walk-in customers
        },
        {
          customer: {
            gstin: null, // Customers without GSTIN (B2C)
          },
        },
      ],
    };

    if (branchId) {
      orderWhere.branchId = branchId as string;
    }

    // Get all B2C orders for the month with branch state information
    const b2cOrders = await prisma.order.findMany({
      where: orderWhere,
      select: {
        id: true,
        subtotal: true,
        discountAmount: true,
        taxAmount: true,
        total: true,
        branch: {
          select: {
            state: true,
          },
        },
      },
    });

    // Group orders by state and calculate aggregates
    const stateMap = new Map<
      string,
      {
        orderCount: number;
        taxableAmount: number;
        taxAmount: number;
        totalAmount: number;
      }
    >();

    b2cOrders.forEach((order) => {
      const state = order.branch.state || 'Unknown';
      const taxableAmount = Number(order.subtotal) - Number(order.discountAmount);
      const taxAmount = Number(order.taxAmount);
      const totalAmount = Number(order.total);

      const existing = stateMap.get(state);
      if (existing) {
        existing.orderCount += 1;
        existing.taxableAmount += taxableAmount;
        existing.taxAmount += taxAmount;
        existing.totalAmount += totalAmount;
      } else {
        stateMap.set(state, {
          orderCount: 1,
          taxableAmount,
          taxAmount,
          totalAmount,
        });
      }
    });

    // Convert to array and format
    const stateWiseSummary = Array.from(stateMap.entries())
      .map(([state, data]) => ({
        state,
        orderCount: data.orderCount,
        taxableAmount: Number(data.taxableAmount.toFixed(2)),
        taxAmount: Number(data.taxAmount.toFixed(2)),
        totalAmount: Number(data.totalAmount.toFixed(2)),
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount); // Sort by total amount descending

    // Calculate overall summary
    const totalOrders = b2cOrders.length;
    const totalTaxableAmount = stateWiseSummary.reduce((sum, s) => sum + s.taxableAmount, 0);
    const totalTaxAmount = stateWiseSummary.reduce((sum, s) => sum + s.taxAmount, 0);
    const totalAmount = stateWiseSummary.reduce((sum, s) => sum + s.totalAmount, 0);

    return res.status(200).json({
      success: true,
      data: {
        period: {
          month: monthNum,
          year: yearNum,
        },
        summary: {
          totalOrders,
          totalTaxableAmount: Number(totalTaxableAmount.toFixed(2)),
          totalTaxAmount: Number(totalTaxAmount.toFixed(2)),
          totalAmount: Number(totalAmount.toFixed(2)),
        },
        stateWiseSummary,
      },
    });
  } catch (error) {
    console.error('Error fetching GST B2C report:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch GST B2C report',
      },
    });
  }
};

// GET /api/v1/reports/gst/hsn - GST HSN Report (HSN-wise summary for GST filing)
export const getGstHsnReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    const { month, year, branchId } = req.query;

    // Validate required parameters
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'month and year are required',
        },
      });
    }

    // Parse and validate month and year
    const monthNum = parseInt(month as string, 10);
    const yearNum = parseInt(year as string, 10);

    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MONTH',
          message: 'Month must be between 1 and 12',
        },
      });
    }

    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_YEAR',
          message: 'Year must be a valid year',
        },
      });
    }

    // Calculate date range for the specified month
    const startDate = new Date(yearNum, monthNum - 1, 1); // First day of month
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999); // Last day of month

    // Build where clause for completed orders
    const orderWhere: Prisma.OrderWhereInput = {
      businessOwnerId: tenantId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      orderStatus: 'Completed', // Only completed orders for GST
    };

    if (branchId) {
      orderWhere.branchId = branchId as string;
    }

    // Get all completed orders with order items and product details
    const orders = await prisma.order.findMany({
      where: orderWhere,
      select: {
        id: true,
        items: {
          select: {
            id: true,
            productId: true,
            quantity: true,
            totalPrice: true,
            product: {
              select: {
                hsnCode: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Group order items by HSN code
    const hsnMap = new Map<
      string,
      {
        description: string;
        quantity: number;
        taxableAmount: number;
        taxAmount: number;
      }
    >();

    // Flatten all order items
    const allOrderItems = orders.flatMap((order) => order.items);

    allOrderItems.forEach((item) => {
      const hsnCode = item.product.hsnCode || 'N/A';
      const description = item.product.name || 'Unknown Product';
      const quantity = Number(item.quantity);
      const itemTotal = Number(item.totalPrice);

      // For simplicity, we'll assume taxAmount is 18% of the item total (GST default)
      // In a real scenario, you'd fetch the actual tax breakdown from the order
      const taxableAmount = itemTotal / 1.18; // Remove 18% GST
      const taxAmount = itemTotal - taxableAmount;

      const existing = hsnMap.get(hsnCode);
      if (existing) {
        existing.quantity += quantity;
        existing.taxableAmount += taxableAmount;
        existing.taxAmount += taxAmount;
      } else {
        hsnMap.set(hsnCode, {
          description,
          quantity,
          taxableAmount,
          taxAmount,
        });
      }
    });

    // Convert to array and format
    const hsnSummary = Array.from(hsnMap.entries())
      .map(([hsnCode, data]) => ({
        hsnCode,
        description: data.description,
        quantity: Number(data.quantity.toFixed(2)),
        taxableAmount: Number(data.taxableAmount.toFixed(2)),
        taxAmount: Number(data.taxAmount.toFixed(2)),
        totalAmount: Number((data.taxableAmount + data.taxAmount).toFixed(2)),
      }))
      .sort((a, b) => {
        // Sort by HSN code (put N/A at the end)
        if (a.hsnCode === 'N/A' && b.hsnCode !== 'N/A') return 1;
        if (a.hsnCode !== 'N/A' && b.hsnCode === 'N/A') return -1;
        return a.hsnCode.localeCompare(b.hsnCode);
      });

    // Calculate overall summary
    const totalQuantity = hsnSummary.reduce((sum, h) => sum + h.quantity, 0);
    const totalTaxableAmount = hsnSummary.reduce((sum, h) => sum + h.taxableAmount, 0);
    const totalTaxAmount = hsnSummary.reduce((sum, h) => sum + h.taxAmount, 0);
    const totalAmount = hsnSummary.reduce((sum, h) => sum + h.totalAmount, 0);

    return res.status(200).json({
      success: true,
      data: {
        period: {
          month: monthNum,
          year: yearNum,
        },
        summary: {
          totalQuantity: Number(totalQuantity.toFixed(2)),
          totalTaxableAmount: Number(totalTaxableAmount.toFixed(2)),
          totalTaxAmount: Number(totalTaxAmount.toFixed(2)),
          totalAmount: Number(totalAmount.toFixed(2)),
        },
        hsnSummary,
      },
    });
  } catch (error) {
    console.error('Error fetching GST HSN report:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch GST HSN report',
      },
    });
  }
};

// GET /api/v1/reports/discounts - Discount usage report
export const getDiscountUsageReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    const { startDate, endDate } = req.query;

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'startDate and endDate are required',
        },
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATE',
          message: 'Invalid date format',
        },
      });
    }

    // Get all discounts for the tenant
    const discounts = await prisma.discount.findMany({
      where: {
        businessOwnerId: tenantId,
      },
      include: {
        orders: {
          where: {
            createdAt: {
              gte: start,
              lte: end,
            },
            orderStatus: 'Completed', // Only count completed orders
          },
          select: {
            id: true,
            discountAmount: true,
          },
        },
      },
    });

    // Calculate analytics for each discount
    const discountAnalytics = discounts.map((discount) => {
      const usageCount = discount.orders.length;
      const totalDiscountGiven = discount.orders.reduce(
        (sum, order) => sum + Number(order.discountAmount),
        0
      );
      const ordersAffected = usageCount;

      return {
        id: discount.id,
        code: discount.code,
        name: discount.name,
        type: discount.type,
        valueType: discount.valueType,
        value: Number(discount.value),
        status: discount.status,
        usageCount,
        totalDiscountGiven: Number(totalDiscountGiven.toFixed(2)),
        ordersAffected,
        usageLimit: discount.usageLimit || null,
        remainingUses: discount.usageLimit
          ? Math.max(0, discount.usageLimit - usageCount)
          : null,
      };
    });

    // Sort by total discount given (descending)
    discountAnalytics.sort((a, b) => b.totalDiscountGiven - a.totalDiscountGiven);

    // Calculate overall summary
    const totalUsageCount = discountAnalytics.reduce(
      (sum, d) => sum + d.usageCount,
      0
    );
    const totalDiscountGiven = discountAnalytics.reduce(
      (sum, d) => sum + d.totalDiscountGiven,
      0
    );
    const totalOrdersAffected = discountAnalytics.reduce(
      (sum, d) => sum + d.ordersAffected,
      0
    );
    const activeDiscounts = discountAnalytics.filter(
      (d) => d.status === 'active'
    ).length;

    return res.status(200).json({
      success: true,
      data: {
        period: {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
        summary: {
          totalDiscounts: discounts.length,
          activeDiscounts,
          totalUsageCount,
          totalDiscountGiven: Number(totalDiscountGiven.toFixed(2)),
          totalOrdersAffected,
        },
        discounts: discountAnalytics,
      },
    });
  } catch (error) {
    console.error('Error fetching discount usage report:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch discount usage report',
      },
    });
  }
};

// GET /api/v1/reports/audit-logs - Audit log report
export const getAuditLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    const { userId, action, entityType, startDate, endDate, page = '1', limit = '50' } = req.query;

    // Build where clause
    const where: Prisma.AuditLogWhereInput = {
      businessOwnerId: tenantId,
    };

    // Apply filters
    if (userId) {
      where.userId = userId as string;
    }

    if (action) {
      where.action = {
        contains: action as string,
        mode: 'insensitive',
      };
    }

    if (entityType) {
      where.entityType = {
        contains: entityType as string,
        mode: 'insensitive',
      };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        const start = new Date(startDate as string);
        if (!isNaN(start.getTime())) {
          where.createdAt.gte = start;
        }
      }
      if (endDate) {
        const end = new Date(endDate as string);
        if (!isNaN(end.getTime())) {
          where.createdAt.lte = end;
        }
      }
    }

    // Pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await prisma.auditLog.count({ where });

    // Get audit logs
    const auditLogs = await prisma.auditLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limitNum,
      select: {
        id: true,
        userId: true,
        userType: true,
        action: true,
        entityType: true,
        entityId: true,
        oldValue: true,
        newValue: true,
        ipAddress: true,
        createdAt: true,
      },
    });

    // For each audit log, try to get the user name
    const logsWithUserNames = await Promise.all(
      auditLogs.map(async (log) => {
        let userName = 'Unknown User';

        try {
          if (log.userType === 'SuperAdmin') {
            const admin = await prisma.superAdmin.findUnique({
              where: { id: log.userId },
              select: { name: true },
            });
            userName = admin?.name || 'Super Admin';
          } else if (log.userType === 'BusinessOwner') {
            const owner = await prisma.businessOwner.findUnique({
              where: { id: log.userId },
              select: { ownerName: true },
            });
            userName = owner?.ownerName || 'Business Owner';
          } else if (log.userType === 'Staff') {
            const staff = await prisma.staff.findUnique({
              where: { id: log.userId },
              select: { firstName: true, lastName: true },
            });
            userName = staff ? `${staff.firstName} ${staff.lastName}` : 'Staff';
          }
        } catch (error) {
          // If user lookup fails, keep default
        }

        return {
          id: log.id,
          userId: log.userId,
          userName,
          userType: log.userType,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          oldValue: log.oldValue,
          newValue: log.newValue,
          ipAddress: log.ipAddress,
          timestamp: log.createdAt,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: logsWithUserNames,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch audit logs',
      },
    });
  }
};

// POST /api/v1/reports/export - Export reports to CSV or PDF
export const exportReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    const { reportType, format, filters } = req.body;

    // Validate required parameters
    if (!reportType || !format) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'reportType and format are required',
        },
      });
    }

    // Validate format
    if (!['csv', 'pdf', 'excel'].includes(format)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FORMAT',
          message: 'format must be "csv", "pdf", or "excel"',
        },
      });
    }

    // Validate reportType
    const validReportTypes = ['sales', 'products', 'customers', 'gst'];
    if (!validReportTypes.includes(reportType)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REPORT_TYPE',
          message: `reportType must be one of: ${validReportTypes.join(', ')}`,
        },
      });
    }

    let data: any[] = [];
    let filename = '';
    let title = '';

    // Fetch data based on reportType
    if (reportType === 'sales') {
      const { startDate, endDate, branchId } = filters || {};

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FILTERS',
            message: 'startDate and endDate are required for sales report',
          },
        });
      }

      const where: Prisma.OrderWhereInput = {
        businessOwnerId: tenantId,
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      };

      if (branchId) {
        where.branchId = branchId;
      }

      const orders = await prisma.order.findMany({
        where,
        include: {
          customer: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      data = formatSalesReportData(orders);
      filename = `sales-report-${new Date().getTime()}`;
      title = 'Sales Report';
    } else if (reportType === 'products') {
      const { startDate, endDate, categoryId } = filters || {};

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FILTERS',
            message: 'startDate and endDate are required for products report',
          },
        });
      }

      // Fetch products with sales data
      const productWhere: Prisma.ProductWhereInput = {
        businessOwnerId: tenantId,
      };

      if (categoryId) {
        productWhere.categoryId = categoryId;
      }

      const products = await prisma.product.findMany({
        where: productWhere,
        include: {
          category: {
            select: {
              name: true,
            },
          },
          orderItems: {
            where: {
              order: {
                createdAt: {
                  gte: new Date(startDate),
                  lte: new Date(endDate),
                },
                orderStatus: {
                  in: ['Completed', 'Served'],
                },
              },
            },
            select: {
              quantity: true,
              totalPrice: true,
            },
          },
        },
      });

      // Calculate sales metrics
      const productsWithMetrics = products.map((product) => {
        const quantitySold = product.orderItems.reduce((sum, item) => sum + item.quantity, 0);
        const revenue = product.orderItems.reduce(
          (sum, item) => sum + Number(item.totalPrice),
          0
        );
        const avgPrice = quantitySold > 0 ? revenue / quantitySold : 0;

        return {
          name: product.name,
          category: product.category,
          quantitySold,
          revenue,
          avgPrice,
        };
      });

      data = formatProductSalesData(productsWithMetrics);
      filename = `product-sales-report-${new Date().getTime()}`;
      title = 'Product Sales Report';
    } else if (reportType === 'customers') {
      const { startDate, endDate } = filters || {};

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FILTERS',
            message: 'startDate and endDate are required for customers report',
          },
        });
      }

      const customers = await prisma.customer.findMany({
        where: {
          businessOwnerId: tenantId,
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        include: {
          _count: {
            select: {
              orders: true,
            },
          },
          orders: {
            take: 1,
            orderBy: {
              createdAt: 'desc',
            },
            select: {
              createdAt: true,
            },
          },
        },
      });

      data = formatCustomerReportData(customers);
      filename = `customers-report-${new Date().getTime()}`;
      title = 'Customers Report';
    } else if (reportType === 'gst') {
      const { month, year, gstType } = filters || {};

      if (!month || !year) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FILTERS',
            message: 'month and year are required for GST report',
          },
        });
      }

      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

      const orders = await prisma.order.findMany({
        where: {
          businessOwnerId: tenantId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          orderStatus: {
            in: ['Completed', 'Served'],
          },
        },
        include: {
          customer: {
            select: {
              name: true,
              gstin: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Filter by B2B or B2C if specified
      let filteredOrders = orders;
      if (gstType === 'b2b') {
        filteredOrders = orders.filter((order) => order.customer?.gstin);
        title = 'GST B2B Report';
      } else if (gstType === 'b2c') {
        filteredOrders = orders.filter((order) => !order.customer?.gstin);
        title = 'GST B2C Report';
      } else {
        title = 'GST Report';
      }

      data = formatGSTReportData(filteredOrders);
      filename = `gst-report-${gstType || 'all'}-${new Date().getTime()}`;
    }

    if (data.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_DATA',
          message: 'No data available for the selected criteria',
        },
      });
    }

    let downloadUrl = '';

    // Generate export based on format
    if (format === 'csv') {
      // Define headers based on report type
      let headers: { id: string; title: string }[] = [];

      if (reportType === 'sales') {
        headers = [
          { id: 'orderNumber', title: 'Order Number' },
          { id: 'date', title: 'Date' },
          { id: 'type', title: 'Type' },
          { id: 'customer', title: 'Customer' },
          { id: 'subtotal', title: 'Subtotal' },
          { id: 'discount', title: 'Discount' },
          { id: 'tax', title: 'Tax' },
          { id: 'total', title: 'Total' },
          { id: 'paymentStatus', title: 'Payment Status' },
          { id: 'orderStatus', title: 'Order Status' },
        ];
      } else if (reportType === 'products') {
        headers = [
          { id: 'productName', title: 'Product Name' },
          { id: 'category', title: 'Category' },
          { id: 'quantitySold', title: 'Quantity Sold' },
          { id: 'revenue', title: 'Revenue' },
          { id: 'avgPrice', title: 'Avg Price' },
        ];
      } else if (reportType === 'customers') {
        headers = [
          { id: 'name', title: 'Name' },
          { id: 'phone', title: 'Phone' },
          { id: 'email', title: 'Email' },
          { id: 'type', title: 'Type' },
          { id: 'totalSpent', title: 'Total Spent' },
          { id: 'orderCount', title: 'Order Count' },
          { id: 'lastVisit', title: 'Last Visit' },
        ];
      } else if (reportType === 'gst') {
        headers = [
          { id: 'invoiceNumber', title: 'Invoice Number' },
          { id: 'date', title: 'Date' },
          { id: 'customerName', title: 'Customer Name' },
          { id: 'gstin', title: 'GSTIN' },
          { id: 'taxableAmount', title: 'Taxable Amount' },
          { id: 'cgst', title: 'CGST' },
          { id: 'sgst', title: 'SGST' },
          { id: 'totalTax', title: 'Total Tax' },
          { id: 'invoiceValue', title: 'Invoice Value' },
        ];
      }

      downloadUrl = await generateCSV(data, headers, filename);
    } else if (format === 'pdf') {
      // Define columns based on report type
      let columns: { header: string; key: string; width?: number }[] = [];

      if (reportType === 'sales') {
        columns = [
          { header: 'Order #', key: 'orderNumber', width: 80 },
          { header: 'Date', key: 'date', width: 70 },
          { header: 'Type', key: 'type', width: 60 },
          { header: 'Customer', key: 'customer', width: 80 },
          { header: 'Subtotal', key: 'subtotal', width: 50 },
          { header: 'Discount', key: 'discount', width: 50 },
          { header: 'Tax', key: 'tax', width: 40 },
          { header: 'Total', key: 'total', width: 50 },
        ];
      } else if (reportType === 'products') {
        columns = [
          { header: 'Product', key: 'productName', width: 150 },
          { header: 'Category', key: 'category', width: 100 },
          { header: 'Qty Sold', key: 'quantitySold', width: 60 },
          { header: 'Revenue', key: 'revenue', width: 70 },
          { header: 'Avg Price', key: 'avgPrice', width: 70 },
        ];
      } else if (reportType === 'customers') {
        columns = [
          { header: 'Name', key: 'name', width: 100 },
          { header: 'Phone', key: 'phone', width: 80 },
          { header: 'Type', key: 'type', width: 60 },
          { header: 'Total Spent', key: 'totalSpent', width: 70 },
          { header: 'Orders', key: 'orderCount', width: 50 },
          { header: 'Last Visit', key: 'lastVisit', width: 80 },
        ];
      } else if (reportType === 'gst') {
        columns = [
          { header: 'Invoice #', key: 'invoiceNumber', width: 80 },
          { header: 'Date', key: 'date', width: 70 },
          { header: 'Customer', key: 'customerName', width: 90 },
          { header: 'GSTIN', key: 'gstin', width: 80 },
          { header: 'Taxable', key: 'taxableAmount', width: 60 },
          { header: 'Tax', key: 'totalTax', width: 50 },
          { header: 'Total', key: 'invoiceValue', width: 60 },
        ];
      }

      downloadUrl = await generatePDF(title, data, columns, filename);
    } else if (format === 'excel') {
      // Define Excel headers with formatting metadata based on report type
      let excelHeaders: ExcelHeader[] = [];

      if (reportType === 'sales') {
        excelHeaders = [
          { id: 'orderNumber', title: 'Order Number', width: 18 },
          { id: 'date', title: 'Date', width: 14, isDate: true },
          { id: 'type', title: 'Type', width: 12 },
          { id: 'customer', title: 'Customer', width: 20 },
          { id: 'subtotal', title: 'Subtotal', width: 14, isCurrency: true },
          { id: 'discount', title: 'Discount', width: 14, isCurrency: true },
          { id: 'tax', title: 'Tax', width: 12, isCurrency: true },
          { id: 'total', title: 'Total', width: 14, isCurrency: true },
          { id: 'paymentStatus', title: 'Payment Status', width: 16 },
          { id: 'orderStatus', title: 'Order Status', width: 16 },
        ];
      } else if (reportType === 'products') {
        excelHeaders = [
          { id: 'productName', title: 'Product Name', width: 25 },
          { id: 'category', title: 'Category', width: 18 },
          { id: 'quantitySold', title: 'Quantity Sold', width: 14 },
          { id: 'revenue', title: 'Revenue', width: 14, isCurrency: true },
          { id: 'avgPrice', title: 'Avg Price', width: 14, isCurrency: true },
        ];
      } else if (reportType === 'customers') {
        excelHeaders = [
          { id: 'name', title: 'Name', width: 20 },
          { id: 'phone', title: 'Phone', width: 16 },
          { id: 'email', title: 'Email', width: 25 },
          { id: 'type', title: 'Type', width: 12 },
          { id: 'totalSpent', title: 'Total Spent', width: 14, isCurrency: true },
          { id: 'orderCount', title: 'Order Count', width: 14 },
          { id: 'lastVisit', title: 'Last Visit', width: 14, isDate: true },
        ];
      } else if (reportType === 'gst') {
        excelHeaders = [
          { id: 'invoiceNumber', title: 'Invoice Number', width: 18 },
          { id: 'date', title: 'Date', width: 14, isDate: true },
          { id: 'customerName', title: 'Customer Name', width: 20 },
          { id: 'gstin', title: 'GSTIN', width: 18 },
          { id: 'taxableAmount', title: 'Taxable Amount', width: 16, isCurrency: true },
          { id: 'cgst', title: 'CGST', width: 12, isCurrency: true },
          { id: 'sgst', title: 'SGST', width: 12, isCurrency: true },
          { id: 'totalTax', title: 'Total Tax', width: 12, isCurrency: true },
          { id: 'invoiceValue', title: 'Invoice Value', width: 14, isCurrency: true },
        ];
      }

      const chartConfig = getChartConfigForReport(reportType);
      downloadUrl = await exportToExcel(title, data, excelHeaders, filename, chartConfig);
    }

    // Generate signed URL for download (valid for 1 hour)
    // Extract the S3 key from the URL
    const urlParts = downloadUrl.split('.amazonaws.com/');
    const s3Key = urlParts.length > 1 ? urlParts[1] : downloadUrl;
    const signedUrl = await getS3SignedUrl(s3Key, 3600);

    return res.status(200).json({
      success: true,
      data: {
        downloadUrl: signedUrl,
        filename: `${filename}.${format === 'excel' ? 'xlsx' : format}`,
        format,
        reportType,
        recordCount: data.length,
      },
      message: 'Report generated successfully',
    });
  } catch (error) {
    console.error('Error exporting report:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to export report',
      },
    });
  }
};

// GET /api/v1/reports/sales/summary-by-channel - Sales summary grouped by channel
export const getSalesSummaryByChannel = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return res.status(403).json({ success: false, error: { code: 'MISSING_TENANT_CONTEXT', message: 'Tenant context is required' } });
    }

    const { startDate, endDate, branchId, channel } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETERS', message: 'startDate and endDate are required' } });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_DATE', message: 'Invalid date format' } });
    }

    const where: Prisma.OrderWhereInput = {
      businessOwnerId: tenantId,
      createdAt: { gte: start, lte: end },
      orderStatus: { in: ['Completed'] },
    };
    if (branchId) where.branchId = branchId as string;
    if (channel) where.type = channel as any;

    const orders = await prisma.order.findMany({
      where,
      include: {
        payments: { include: { paymentOption: { select: { name: true } } } },
        items: { include: { product: { include: { category: { select: { name: true } } } } } },
      },
    });

    const channelMap: Record<string, any> = {};
    const totalSummary = { grossSales: 0, salesReturn: 0, discounts: 0, netSales: 0, taxes: 0, totalGrossRevenue: 0, transactionCount: 0 };
    const paymentSummary: Record<string, number> = {};
    const taxSummary = { cgst: 0, sgst: 0, igst: 0 };
    const categorySummary: Record<string, number> = {};

    for (const order of orders) {
      const ch = order.type || 'Other';
      if (!channelMap[ch]) {
        channelMap[ch] = { grossSales: 0, salesReturn: 0, discounts: 0, netSales: 0, taxes: 0, totalGrossRevenue: 0, transactionCount: 0 };
      }

      const subtotal = Number(order.subtotal);
      const discount = Number(order.discountAmount);
      const tax = Number(order.taxAmount);
      const total = Number(order.total);

      channelMap[ch].grossSales += subtotal;
      channelMap[ch].discounts += discount;
      channelMap[ch].netSales += subtotal - discount;
      channelMap[ch].taxes += tax;
      channelMap[ch].totalGrossRevenue += total;
      channelMap[ch].transactionCount += 1;

      totalSummary.grossSales += subtotal;
      totalSummary.discounts += discount;
      totalSummary.netSales += subtotal - discount;
      totalSummary.taxes += tax;
      totalSummary.totalGrossRevenue += total;
      totalSummary.transactionCount += 1;

      for (const payment of order.payments) {
        const method = payment.paymentOption?.name || 'Other';
        paymentSummary[method] = (paymentSummary[method] || 0) + Number(payment.amount);
      }

      taxSummary.cgst += tax / 2;
      taxSummary.sgst += tax / 2;

      for (const item of order.items) {
        const catName = item.product?.category?.name || 'Uncategorized';
        categorySummary[catName] = (categorySummary[catName] || 0) + Number(item.totalPrice);
      }
    }

    const round2 = (n: number) => Number(n.toFixed(2));

    return res.status(200).json({
      success: true,
      data: {
        total: {
          grossSales: round2(totalSummary.grossSales),
          salesReturn: 0,
          discounts: round2(totalSummary.discounts),
          netSales: round2(totalSummary.netSales),
          taxes: round2(totalSummary.taxes),
          totalGrossRevenue: round2(totalSummary.totalGrossRevenue),
          transactionCount: totalSummary.transactionCount,
          avgSalePerTransaction: totalSummary.transactionCount > 0 ? round2(totalSummary.netSales / totalSummary.transactionCount) : 0,
        },
        byChannel: Object.entries(channelMap).map(([ch, data]: [string, any]) => ({
          channel: ch,
          grossSales: round2(data.grossSales),
          salesReturn: 0,
          discounts: round2(data.discounts),
          netSales: round2(data.netSales),
          taxes: round2(data.taxes),
          totalGrossRevenue: round2(data.totalGrossRevenue),
          transactionCount: data.transactionCount,
          avgSalePerTransaction: data.transactionCount > 0 ? round2(data.netSales / data.transactionCount) : 0,
        })),
        paymentSummary: Object.entries(paymentSummary).map(([method, amount]) => ({ method, amount: round2(amount) })),
        taxSummary: { cgst: round2(taxSummary.cgst), sgst: round2(taxSummary.sgst), igst: round2(taxSummary.igst) },
        categorySummary: Object.entries(categorySummary).map(([category, amount]) => ({ category, amount: round2(amount as number) })),
      },
    });
  } catch (error) {
    console.error('Error fetching sales summary by channel:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch sales summary by channel' } });
  }
};

// GET /api/v1/reports/sales/trend - Sales trend by branch
export const getSalesTrend = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return res.status(403).json({ success: false, error: { code: 'MISSING_TENANT_CONTEXT', message: 'Tenant context is required' } });
    }

    const { startDate, endDate, page = '1', limit = '20' } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETERS', message: 'startDate and endDate are required' } });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_DATE', message: 'Invalid date format' } });
    }

    const branches = await prisma.branch.findMany({
      where: { businessOwnerId: tenantId, status: 'Active' },
      select: { id: true, name: true, code: true },
    });

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const currentYearStart = new Date(now.getFullYear(), 0, 1);
    const currentYearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const prevYearStart = new Date(now.getFullYear() - 1, 0, 1);
    const prevYearEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);

    const trendData = [];

    for (const branch of branches) {
      const baseWhere = { businessOwnerId: tenantId, branchId: branch.id, orderStatus: { in: ['Completed' as any] } };

      const [currentMonth, currentYear, prevMonth, prevYear] = await Promise.all([
        prisma.order.aggregate({ where: { ...baseWhere, createdAt: { gte: currentMonthStart, lte: currentMonthEnd } }, _sum: { total: true } }),
        prisma.order.aggregate({ where: { ...baseWhere, createdAt: { gte: currentYearStart, lte: currentYearEnd } }, _sum: { total: true } }),
        prisma.order.aggregate({ where: { ...baseWhere, createdAt: { gte: prevMonthStart, lte: prevMonthEnd } }, _sum: { total: true } }),
        prisma.order.aggregate({ where: { ...baseWhere, createdAt: { gte: prevYearStart, lte: prevYearEnd } }, _sum: { total: true } }),
      ]);

      const currentMonthSale = Number(currentMonth._sum.total || 0);
      const currentYearSale = Number(currentYear._sum.total || 0);
      const prevMonthSale = Number(prevMonth._sum.total || 0);
      const prevYearSale = Number(prevYear._sum.total || 0);

      const mom = prevMonthSale > 0 ? ((currentMonthSale - prevMonthSale) / prevMonthSale * 100) : currentMonthSale > 0 ? 100 : 0;
      const yoy = prevYearSale > 0 ? ((currentYearSale - prevYearSale) / prevYearSale * 100) : currentYearSale > 0 ? 100 : 0;

      trendData.push({
        branchName: branch.name,
        branchCode: branch.code,
        branchLabel: 'Outlet',
        currentMonthSale: Number(currentMonthSale.toFixed(2)),
        currentYearSale: Number(currentYearSale.toFixed(2)),
        momPercent: Number(mom.toFixed(2)),
        yoyPercent: Number(yoy.toFixed(2)),
      });
    }

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const offset = (pageNum - 1) * limitNum;
    const paginatedData = trendData.slice(offset, offset + limitNum);

    return res.status(200).json({
      success: true,
      data: { trends: paginatedData, total: trendData.length, page: pageNum, limit: limitNum },
    });
  } catch (error) {
    console.error('Error fetching sales trend:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch sales trend' } });
  }
};

// GET /api/v1/reports/sales/transactions - Detailed sales transactions
export const getSalesTransactions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return res.status(403).json({ success: false, error: { code: 'MISSING_TENANT_CONTEXT', message: 'Tenant context is required' } });
    }

    const { startDate, endDate, branchId, channel, page = '1', limit = '20' } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETERS', message: 'startDate and endDate are required' } });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_DATE', message: 'Invalid date format' } });
    }

    const where: Prisma.OrderWhereInput = {
      businessOwnerId: tenantId,
      createdAt: { gte: start, lte: end },
    };
    if (branchId) where.branchId = branchId as string;
    if (channel) where.type = channel as any;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          branch: { select: { name: true, code: true } },
          customer: { select: { name: true, phone: true, type: true } },
          staff: { select: { firstName: true, lastName: true } },
          payments: { include: { paymentOption: { select: { name: true } } } },
          items: { select: { id: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    const transactions = orders.map((order) => ({
      branchName: order.branch.name,
      branchCode: order.branch.code,
      brand: 'Outlet',
      businessDate: order.createdAt.toISOString().split('T')[0],
      invoiceNumber: order.orderNumber,
      invoiceDate: order.createdAt.toISOString(),
      invoiceType: 'Sale',
      orderSource: order.source,
      sourceOrderNumber: '-',
      sourceOutletId: '-',
      advanceOrder: 'No',
      subTotal: `₹${Number(order.subtotal).toFixed(2)}`,
      discounts: `₹${Number(order.discountAmount).toFixed(2)}`,
      charges: `₹${Number(order.chargesAmount).toFixed(2)}`,
      netAmount: `₹${(Number(order.subtotal) - Number(order.discountAmount)).toFixed(2)}`,
      otherCharges: '₹0',
      taxes: `₹${Number(order.taxAmount).toFixed(2)}`,
      rounding: '₹0',
      tips: '₹0',
      total: `₹${Number(order.total).toFixed(2)}`,
      amountPaid: `₹${Number(order.paidAmount).toFixed(2)}`,
      amountDue: `₹${Number(order.dueAmount).toFixed(2)}`,
      paymentMode: order.payments.map((p: any) => p.paymentOption?.name || 'Other').join(', ') || '-',
      saleBy: `${order.staff.firstName} ${order.staff.lastName}`,
      channel: order.type,
      label: '-',
      session: '-',
      customerId: order.customerId || '-',
      customerName: order.customer ? order.customer.name : '-',
      phoneNumber: order.customer?.phone || '-',
      customerType: order.customer?.type || '-',
      customerState: '-',
      settlement: '-',
      paymentStatus: order.paymentStatus,
      cgst: `₹${(Number(order.taxAmount) / 2).toFixed(2)}`,
      sgst: `₹${(Number(order.taxAmount) / 2).toFixed(2)}`,
      igst: '₹0',
      gstRate: Number(order.taxAmount) > 0 ? `${((Number(order.taxAmount) / Number(order.subtotal)) * 100).toFixed(0)}%` : '0%',
    }));

    return res.status(200).json({
      success: true,
      data: { transactions, total, page: pageNum, limit: limitNum },
    });
  } catch (error) {
    console.error('Error fetching sales transactions:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch sales transactions' } });
  }
};

// GET /api/v1/reports/sales/cancelled - Cancelled transactions
export const getCancelledTransactions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return res.status(403).json({ success: false, error: { code: 'MISSING_TENANT_CONTEXT', message: 'Tenant context is required' } });
    }

    const { startDate, endDate, branchId, channel, page = '1', limit = '20' } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETERS', message: 'startDate and endDate are required' } });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_DATE', message: 'Invalid date format' } });
    }

    const where: Prisma.OrderWhereInput = {
      businessOwnerId: tenantId,
      createdAt: { gte: start, lte: end },
      orderStatus: 'Cancelled',
    };
    if (branchId) where.branchId = branchId as string;
    if (channel) where.type = channel as any;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          branch: { select: { name: true, code: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    const transactions = orders.map((order) => ({
      branchName: order.branch.name,
      branchCode: order.branch.code,
      brand: 'Brand',
      date: order.createdAt.toISOString().split('T')[0],
      invoiceNumber: order.orderNumber,
      offlineNumber: '-',
      transferredToOrder: '-',
      orderNo: `#${order.orderNumber}`,
      orderSource: order.type,
      sourceOrderNumber: `#${order.orderNumber}`,
      sourceOutletId: '-',
    }));

    return res.status(200).json({
      success: true,
      data: { transactions, total, page: pageNum, limit: limitNum },
    });
  } catch (error) {
    console.error('Error fetching cancelled transactions:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch cancelled transactions' } });
  }
};

// GET /api/v1/reports/sales/audit - Sales audit transactions
export const getSalesAuditTransactions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return res.status(403).json({ success: false, error: { code: 'MISSING_TENANT_CONTEXT', message: 'Tenant context is required' } });
    }

    const { startDate, endDate, branchId, channel, page = '1', limit = '20' } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETERS', message: 'startDate and endDate are required' } });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_DATE', message: 'Invalid date format' } });
    }

    const where: Prisma.OrderWhereInput = {
      businessOwnerId: tenantId,
      createdAt: { gte: start, lte: end },
    };
    if (branchId) where.branchId = branchId as string;
    if (channel) where.type = channel as any;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          branch: { select: { name: true, code: true } },
          customer: { select: { name: true, phone: true } },
          staff: { select: { firstName: true, lastName: true } },
          payments: { include: { paymentOption: { select: { name: true } } } },
          items: { select: { id: true, quantity: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    const transactions = orders.map((order) => {
      const tax = Number(order.taxAmount);
      const subtotal = Number(order.subtotal);
      const itemCount = order.items.length;
      const totalQty = order.items.reduce((s: number, i: any) => s + i.quantity, 0);

      return {
        branchName: order.branch.name,
        branchCode: order.branch.code,
        branchLabel: 'Outlet',
        brand: 'Brand',
        businessDate: order.createdAt.toISOString().split('T')[0],
        invoiceNumber: order.orderNumber,
        invoiceDate: order.createdAt.toISOString(),
        customerTIN: '-',
        statementNumber: '-',
        saleStatus: order.orderStatus,
        advanceOrder: 'No',
        einvoiceStatus: '-',
        einvoiceNumber: '-',
        einvoiceRemarks: '-',
        einvoiceCustomerTIN: '-',
        amountRefunded: '₹0',
        returnPaymentMode: '-',
        fulfillmentStatus: order.orderStatus,
        invoiceType: 'Sale',
        orderNumber: order.orderNumber,
        offlineOrderNumber: '-',
        orderSource: order.source,
        sourceOrderNumber: '-',
        sourceOutletId: '-',
        openOrderAmount: `₹${Number(order.total).toFixed(2)}`,
        discounts: `₹${Number(order.discountAmount).toFixed(2)}`,
        charges: `₹${Number(order.chargesAmount).toFixed(2)}`,
        netAmount: `₹${(subtotal - Number(order.discountAmount)).toFixed(2)}`,
        otherCharge: '₹0',
        taxes: `₹${tax.toFixed(2)}`,
        rounding: '₹0',
        tips: '₹0',
        total: `₹${Number(order.total).toFixed(2)}`,
        amountPaid: `₹${Number(order.paidAmount).toFixed(2)}`,
        amountDue: `₹${Number(order.dueAmount).toFixed(2)}`,
        discountPercent: subtotal > 0 ? ((Number(order.discountAmount) / subtotal) * 100).toFixed(1) : '0',
        taxPaidByAggregator: '₹0',
        paymentMode: order.payments.map((p: any) => p.paymentOption?.name || 'Other').join(', ') || '-',
        materialCost: '₹0',
        suppliesCost: '₹0',
        channel: order.type,
        channelLabel: 'Direct',
        session: '-',
        label: '-',
        tags: '-',
        orderNotes: order.notes || '-',
        resourceGroup: '-',
        noOfProducts: itemCount,
        totalQuantity: totalQty,
        byReservation: 'No',
        reservationSource: '-',
        reservationReference: '-',
        noOfPeople: 0,
        duration: 0,
        noOfTickets: 0,
        noOfModifiedTickets: 0,
        noOfCancelledTickets: 0,
        billPrints: 0,
        modifiedAfterPrint: 'No',
        modifiedAfterClose: 'No',
        changeLogs: '-',
        billPrintLog: '-',
        createdOn: order.createdAt.toISOString().split('T')[0],
        createdBy: order.staff ? `${order.staff.firstName} ${order.staff.lastName}` : '-',
        closedBy: order.staff ? `${order.staff.firstName} ${order.staff.lastName}` : '-',
        saleBy: order.staff ? `${order.staff.firstName} ${order.staff.lastName}` : '-',
        deliveryMode: '-',
        deliveryBy: '-',
        deliveryUserId: '-',
        cancelDate: order.orderStatus === 'Cancelled' ? order.updatedAt.toISOString().split('T')[0] : '-',
        cancelReason: '-',
      };
    });

    return res.status(200).json({
      success: true,
      data: { transactions, total, page: pageNum, limit: limitNum },
    });
  } catch (error) {
    console.error('Error fetching sales audit transactions:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch sales audit transactions' } });
  }
};

// GET /api/v1/reports/payments - Payment transactions report
export const getPaymentTransactions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return res.status(403).json({ success: false, error: { code: 'MISSING_TENANT_CONTEXT', message: 'Tenant context is required' } });
    }

    const { startDate, endDate, branchId, page = '1', limit = '20' } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETERS', message: 'startDate and endDate are required' } });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_DATE', message: 'Invalid date format' } });
    }

    const where: Prisma.OrderPaymentWhereInput = {
      order: {
        businessOwnerId: tenantId,
        createdAt: { gte: start, lte: end },
      },
    };
    if (branchId) {
      (where.order as any).branchId = branchId;
    }

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;

    const [payments, total] = await Promise.all([
      prisma.orderPayment.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            include: {
              branch: { select: { name: true, code: true } },
              staff: { select: { firstName: true, lastName: true } },
            },
          },
          paymentOption: { select: { name: true } },
        },
      }),
      prisma.orderPayment.count({ where }),
    ]);

    const paymentRows = payments.map((payment) => ({
      branch: payment.order.branch.name,
      code: payment.order.branch.code,
      label: 'Outlet',
      brand: '-',
      bdate: payment.order.createdAt.toISOString().split('T')[0],
      order: payment.order.type,
      pdate: payment.createdAt.toISOString().split('T')[0],
      ptime: payment.createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      amount: `₹${Number(payment.amount).toFixed(2)}`,
      ptype: 'Full',
      pmode: payment.paymentOption?.name || '-',
      posted: payment.order.staff ? `${payment.order.staff.firstName} ${payment.order.staff.lastName}` : '-',
      pid: payment.id.substring(0, 24),
      tid: payment.reference || '-',
      inv: payment.order.orderNumber,
      idate: payment.order.createdAt.toISOString().split('T')[0],
      itype: '-',
      status: payment.order.orderStatus,
      warn: '-',
      orderno: `#${payment.order.orderNumber}`,
    }));

    return res.status(200).json({
      success: true,
      data: { payments: paymentRows, total, page: pageNum, limit: limitNum },
    });
  } catch (error) {
    console.error('Error fetching payment transactions:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch payment transactions' } });
  }
};

// GET /api/v1/reports/sales/targets - Transaction targets vs actuals
export const getSalesTargets = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return res.status(403).json({ success: false, error: { code: 'MISSING_TENANT_CONTEXT', message: 'Tenant context is required' } });
    }

    const { startDate, endDate, branchId, page = '1', limit = '20' } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_PARAMETERS', message: 'startDate and endDate are required' } });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_DATE', message: 'Invalid date format' } });
    }

    const branchWhere: any = { businessOwnerId: tenantId, status: 'Active' };
    if (branchId) branchWhere.id = branchId;

    const branches = await prisma.branch.findMany({
      where: branchWhere,
      select: { id: true, name: true, code: true },
    });

    const targetData = [];

    for (const branch of branches) {
      const channelTypes = ['DineIn', 'TakeAway', 'Delivery', 'Online'];

      for (const channelType of channelTypes) {
        const orderStats = await prisma.order.aggregate({
          where: {
            businessOwnerId: tenantId,
            branchId: branch.id,
            type: channelType as any,
            createdAt: { gte: start, lte: end },
            orderStatus: { in: ['Completed'] },
          },
          _sum: { total: true },
          _count: true,
        });

        const actualAmount = Number(orderStats._sum.total || 0);
        const actualTransactions = orderStats._count;

        targetData.push({
          branchName: branch.name,
          branchCode: branch.code,
          channel: channelType,
          date: `${start.toISOString().split('T')[0]} - ${end.toISOString().split('T')[0]}`,
          targetSalesAmount: 0,
          actualSalesAmount: Number(actualAmount.toFixed(2)),
          varianceAmount: Number(actualAmount.toFixed(2)),
          targetSalesTransactions: 0,
          actualSalesTransactions: actualTransactions,
          varianceTransactions: actualTransactions,
        });
      }
    }

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const offset = (pageNum - 1) * limitNum;
    const paginatedData = targetData.slice(offset, offset + limitNum);

    return res.status(200).json({
      success: true,
      data: { targets: paginatedData, total: targetData.length, page: pageNum, limit: limitNum },
    });
  } catch (error) {
    console.error('Error fetching sales targets:', error);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch sales targets' } });
  }
};

// GET /api/v1/reports/sales/forecast - Sales forecasting
export const getSalesForecast = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: { code: 'MISSING_TENANT_CONTEXT', message: 'Tenant context is required' },
      });
    }

    const { branchId, days } = req.query;

    if (!branchId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMETERS', message: 'branchId is required' },
      });
    }

    const forecastDays = days ? parseInt(days as string) : 7;
    if (isNaN(forecastDays) || forecastDays < 1 || forecastDays > 90) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMETER', message: 'days must be between 1 and 90' },
      });
    }

    const result = await forecastSales(tenantId, branchId as string, forecastDays);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error generating sales forecast:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'FORECAST_FAILED', message: 'Failed to generate sales forecast' },
    });
  }
};

export const getInventoryStockoutPredictions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: { code: 'MISSING_TENANT_CONTEXT', message: 'Tenant context is required' },
      });
    }

    const { branchId } = req.query;

    if (!branchId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMETERS', message: 'branchId is required' },
      });
    }

    const result = await predictStockouts(tenantId, branchId as string);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error generating stockout predictions:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'STOCKOUT_PREDICTION_FAILED', message: 'Failed to generate stockout predictions' },
    });
  }
};

// GET /api/v1/reports/customers/cohort-analysis - Customer cohort analysis
export const getCustomerCohortAnalysis = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Tenant context required' },
      });
    }

    const { startDate, endDate } = req.query;

    const result = await getCohortAnalysis(
      tenantId,
      startDate as string | undefined,
      endDate as string | undefined
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error generating cohort analysis:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'COHORT_ANALYSIS_FAILED', message: 'Failed to generate cohort analysis' },
    });
  }
};

// GET /api/v1/reports/sales/heatmap - Sales heatmap (day x hour)
export const getSalesHeatmapReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Tenant context required' },
      });
    }

    const { branchId, startDate, endDate } = req.query;

    const result = await getSalesHeatmap(
      tenantId,
      branchId as string | undefined,
      startDate as string | undefined,
      endDate as string | undefined
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error generating sales heatmap:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SALES_HEATMAP_FAILED', message: 'Failed to generate sales heatmap' },
    });
  }
};

// GET /api/v1/reports/products/trends - Product performance trends
export const getProductTrendsReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Tenant context required' },
      });
    }

    const { branchId, days } = req.query;

    const result = await getProductTrends(
      tenantId,
      branchId as string | undefined,
      days ? parseInt(days as string, 10) : undefined
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error generating product trends:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'PRODUCT_TRENDS_FAILED', message: 'Failed to generate product trends' },
    });
  }
};

// GET /api/v1/reports/customers/ltv - Customer lifetime value analysis
export const getCustomerLTVReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Tenant context required' },
      });
    }

    const result = await getCustomerLTV(tenantId);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error generating customer LTV report:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'CUSTOMER_LTV_FAILED', message: 'Failed to generate customer LTV report' },
    });
  }
};

// GET /api/v1/reports/customers/churn-prediction - Predictive Customer Churn Analysis
export const getChurnPrediction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Tenant context required' },
      });
    }

    const result = await predictChurn(tenantId);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error generating churn prediction:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'CHURN_PREDICTION_FAILED', message: 'Failed to generate churn prediction' },
    });
  }
};

// GET /api/v1/reports/products/menu-engineering - Menu Engineering Matrix
export const getMenuEngineeringReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Tenant context required' },
      });
    }

    const { branchId, days } = req.query;

    const result = await getMenuEngineeringMatrix(
      tenantId,
      branchId as string | undefined,
      days ? parseInt(days as string, 10) : undefined
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error generating menu engineering matrix:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'MENU_ENGINEERING_FAILED', message: 'Failed to generate menu engineering matrix' },
    });
  }
};

// GET /api/v1/reports/sales/anomalies - Detect sales anomalies
export const getSalesAnomalies = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Tenant context required' },
      });
    }

    const { branchId, days } = req.query;

    const result = await detectSalesAnomalies(
      tenantId,
      branchId as string | undefined,
      days ? parseInt(days as string, 10) : undefined
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error detecting sales anomalies:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'ANOMALY_DETECTION_FAILED', message: 'Failed to detect sales anomalies' },
    });
  }
};

// POST /api/v1/reports/sales/anomalies/:id/resolve - Resolve a sales anomaly
export const resolveSalesAnomaly = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Tenant context required' },
      });
    }

    const { id } = req.params;

    const result = await resolveAnomaly(id, tenantId);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: { code: 'ANOMALY_NOT_FOUND', message: 'Anomaly not found' },
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error resolving anomaly:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'RESOLVE_ANOMALY_FAILED', message: 'Failed to resolve anomaly' },
    });
  }
};

// ============================================
// Report Sharing (US-219)
// ============================================

// POST /api/v1/reports/share - Create a shared report link
export const createReportShare = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: { code: 'MISSING_TENANT_CONTEXT', message: 'Tenant context is required' },
      });
    }

    const { reportType, reportConfig, reportData, password, expiresInDays } = req.body;

    if (!reportType || !reportConfig || !reportData) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMETERS', message: 'reportType, reportConfig, and reportData are required' },
      });
    }

    const shareToken = randomUUID();
    let hashedPassword: string | null = null;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    let expiresAt: Date | null = null;
    if (expiresInDays && expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    const reportShare = await prisma.reportShare.create({
      data: {
        businessOwnerId: tenantId,
        reportType,
        reportConfig,
        reportData,
        shareToken,
        password: hashedPassword,
        expiresAt,
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        id: reportShare.id,
        shareToken: reportShare.shareToken,
        expiresAt: reportShare.expiresAt,
        hasPassword: !!hashedPassword,
        createdAt: reportShare.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating report share:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'CREATE_SHARE_FAILED', message: 'Failed to create shared report link' },
    });
  }
};

// GET /api/v1/reports/share - List shared reports for current tenant
export const getReportShares = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: { code: 'MISSING_TENANT_CONTEXT', message: 'Tenant context is required' },
      });
    }

    const shares = await prisma.reportShare.findMany({
      where: { businessOwnerId: tenantId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        reportType: true,
        shareToken: true,
        password: true,
        expiresAt: true,
        viewCount: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        shares: shares.map(s => ({
          ...s,
          hasPassword: !!s.password,
          password: undefined,
        })),
        total: shares.length,
      },
    });
  } catch (error) {
    console.error('Error fetching report shares:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'FETCH_SHARES_FAILED', message: 'Failed to fetch shared reports' },
    });
  }
};

// DELETE /api/v1/reports/share/:id - Delete a shared report link
export const deleteReportShare = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: { code: 'MISSING_TENANT_CONTEXT', message: 'Tenant context is required' },
      });
    }

    const { id } = req.params;

    const share = await prisma.reportShare.findFirst({
      where: { id, businessOwnerId: tenantId },
    });

    if (!share) {
      return res.status(404).json({
        success: false,
        error: { code: 'SHARE_NOT_FOUND', message: 'Shared report not found' },
      });
    }

    await prisma.reportShare.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      data: { message: 'Shared report link deleted' },
    });
  } catch (error) {
    console.error('Error deleting report share:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'DELETE_SHARE_FAILED', message: 'Failed to delete shared report link' },
    });
  }
};

// GET /api/v1/public/shared-reports/:token - View shared report (no auth required)
export const viewSharedReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { token } = req.params;
    const { password } = req.query;

    const share = await prisma.reportShare.findUnique({
      where: { shareToken: token },
      include: {
        businessOwner: {
          select: { restaurantName: true },
        },
      },
    });

    if (!share) {
      return res.status(404).json({
        success: false,
        error: { code: 'SHARE_NOT_FOUND', message: 'Shared report not found or link is invalid' },
      });
    }

    // Check expiration
    if (share.expiresAt && new Date() > share.expiresAt) {
      return res.status(410).json({
        success: false,
        error: { code: 'SHARE_EXPIRED', message: 'This shared report link has expired' },
      });
    }

    // Check password
    if (share.password) {
      if (!password) {
        return res.status(200).json({
          success: true,
          data: {
            requiresPassword: true,
            reportType: share.reportType,
            restaurantName: share.businessOwner.restaurantName,
          },
        });
      }

      const isValid = await bcrypt.compare(password as string, share.password);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: { code: 'INVALID_PASSWORD', message: 'Incorrect password' },
        });
      }
    }

    // Increment view count
    await prisma.reportShare.update({
      where: { id: share.id },
      data: { viewCount: { increment: 1 } },
    });

    return res.status(200).json({
      success: true,
      data: {
        requiresPassword: false,
        reportType: share.reportType,
        reportConfig: share.reportConfig,
        reportData: share.reportData,
        restaurantName: share.businessOwner.restaurantName,
        viewCount: share.viewCount + 1,
        createdAt: share.createdAt,
        expiresAt: share.expiresAt,
      },
    });
  } catch (error) {
    console.error('Error viewing shared report:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'VIEW_SHARE_FAILED', message: 'Failed to load shared report' },
    });
  }
};

// ============================================
// Report Comments (US-220)
// ============================================

// POST /api/v1/reports/comments - Create a report comment
export const createReportComment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const user = req.user!;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: { code: 'MISSING_TENANT_CONTEXT', message: 'Tenant context is required' },
      });
    }

    const { reportType, reportConfig, comment, mentions } = req.body;

    if (!reportType || !reportConfig || !comment) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'reportType, reportConfig, and comment are required' },
      });
    }

    // Resolve user name
    let userName = 'Unknown User';
    if (user.userType === 'BusinessOwner') {
      const bo = await prisma.businessOwner.findUnique({
        where: { id: user.id },
        select: { ownerName: true },
      });
      userName = bo?.ownerName || 'Business Owner';
    } else if (user.userType === 'Staff') {
      const staff = await prisma.staff.findUnique({
        where: { id: user.id },
        select: { firstName: true, lastName: true },
      });
      userName = staff ? `${staff.firstName} ${staff.lastName}` : 'Staff';
    }

    const reportComment = await prisma.reportComment.create({
      data: {
        businessOwnerId: tenantId,
        reportType,
        reportConfig,
        userId: user.id,
        userName,
        comment,
        mentions: mentions || undefined,
      },
    });

    return res.status(201).json({
      success: true,
      data: reportComment,
    });
  } catch (error) {
    console.error('Error creating report comment:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'CREATE_COMMENT_FAILED', message: 'Failed to create comment' },
    });
  }
};

// GET /api/v1/reports/comments - Get comments for a report
export const getReportComments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: { code: 'MISSING_TENANT_CONTEXT', message: 'Tenant context is required' },
      });
    }

    const { reportType } = req.query;

    if (!reportType) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_REPORT_TYPE', message: 'reportType query parameter is required' },
      });
    }

    const comments = await prisma.reportComment.findMany({
      where: {
        businessOwnerId: tenantId,
        reportType: reportType as string,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: { comments, total: comments.length },
    });
  } catch (error) {
    console.error('Error fetching report comments:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'FETCH_COMMENTS_FAILED', message: 'Failed to fetch comments' },
    });
  }
};

// PUT /api/v1/reports/comments/:id - Update a report comment
export const updateReportComment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const user = req.user!;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: { code: 'MISSING_TENANT_CONTEXT', message: 'Tenant context is required' },
      });
    }

    const { id } = req.params;
    const { comment, mentions } = req.body;

    const existing = await prisma.reportComment.findFirst({
      where: { id, businessOwnerId: tenantId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'COMMENT_NOT_FOUND', message: 'Comment not found' },
      });
    }

    // Only the author can edit their comment
    if (existing.userId !== user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'NOT_AUTHOR', message: 'You can only edit your own comments' },
      });
    }

    const updated = await prisma.reportComment.update({
      where: { id },
      data: {
        comment,
        mentions: mentions || undefined,
        editedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Error updating report comment:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'UPDATE_COMMENT_FAILED', message: 'Failed to update comment' },
    });
  }
};

// DELETE /api/v1/reports/comments/:id - Delete a report comment
export const deleteReportComment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const user = req.user!;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: { code: 'MISSING_TENANT_CONTEXT', message: 'Tenant context is required' },
      });
    }

    const { id } = req.params;

    const existing = await prisma.reportComment.findFirst({
      where: { id, businessOwnerId: tenantId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'COMMENT_NOT_FOUND', message: 'Comment not found' },
      });
    }

    // Only the author can delete their comment
    if (existing.userId !== user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'NOT_AUTHOR', message: 'You can only delete your own comments' },
      });
    }

    await prisma.reportComment.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      data: { message: 'Comment deleted' },
    });
  } catch (error) {
    console.error('Error deleting report comment:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'DELETE_COMMENT_FAILED', message: 'Failed to delete comment' },
    });
  }
};

// GET /api/v1/reports/comments/team - Get team members for @mentions
export const getTeamMembers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: { code: 'MISSING_TENANT_CONTEXT', message: 'Tenant context is required' },
      });
    }

    const [owner, staffMembers] = await Promise.all([
      prisma.businessOwner.findUnique({
        where: { id: tenantId },
        select: { id: true, ownerName: true, email: true },
      }),
      prisma.staff.findMany({
        where: { businessOwnerId: tenantId, status: 'active' },
        select: { id: true, firstName: true, lastName: true, email: true },
      }),
    ]);

    const members = [];
    if (owner) {
      members.push({ id: owner.id, name: owner.ownerName, email: owner.email });
    }
    for (const s of staffMembers) {
      members.push({ id: s.id, name: `${s.firstName} ${s.lastName}`, email: s.email });
    }

    return res.status(200).json({
      success: true,
      data: { members },
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'FETCH_TEAM_FAILED', message: 'Failed to fetch team members' },
    });
  }
};
