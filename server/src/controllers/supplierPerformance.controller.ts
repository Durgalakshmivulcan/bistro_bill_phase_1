import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { prisma } from '../services/db.service';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Helper function to convert Prisma Decimal to number
 */
function decimalToNumber(value: Decimal | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return value.toNumber();
}

/**
 * GET /api/v1/inventory/suppliers/performance
 * Returns supplier performance metrics aggregated from PurchaseOrder data
 * Supports pagination, search, minRating filter, and sorting
 */
export async function getSupplierPerformance(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to view supplier performance',
        },
      };
      res.status(403).json(response);
      return;
    }

    const {
      search,
      page = '1',
      limit = '10',
      minRating,
      sortBy = 'totalOrders',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 10));

    // Fetch all suppliers with their PO data and ratings
    const suppliers = await prisma.supplier.findMany({
      where: {
        businessOwnerId: tenantId,
        ...(search && typeof search === 'string' && search.trim()
          ? {
              OR: [
                { name: { contains: search.trim(), mode: 'insensitive' as const } },
                { code: { contains: search.trim(), mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      include: {
        purchaseOrders: {
          select: {
            id: true,
            status: true,
            grandTotal: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        ratings: {
          where: {
            businessOwnerId: tenantId,
          },
          take: 1,
        },
      },
    });

    // Build performance records
    let performanceRecords = suppliers.map((supplier) => {
      const totalOrders = supplier.purchaseOrders.length;
      const totalAmountSpent = supplier.purchaseOrders.reduce(
        (sum, po) => sum + decimalToNumber(po.grandTotal),
        0
      );

      // Calculate on-time delivery rate from received POs
      const receivedPOs = supplier.purchaseOrders.filter((po) => po.status === 'Received');
      const totalReceivedOrApproved = supplier.purchaseOrders.filter(
        (po) => po.status === 'Received' || po.status === 'Approved'
      ).length;
      const onTimeDeliveryRate =
        totalReceivedOrApproved > 0
          ? Math.round((receivedPOs.length / totalReceivedOrApproved) * 100)
          : 0;

      // Calculate average delivery days (from createdAt to updatedAt for received POs)
      let averageDeliveryDays = 0;
      if (receivedPOs.length > 0) {
        const totalDays = receivedPOs.reduce((sum, po) => {
          const days =
            (new Date(po.updatedAt).getTime() - new Date(po.createdAt).getTime()) /
            (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0);
        averageDeliveryDays = Math.round((totalDays / receivedPOs.length) * 10) / 10;
      }

      // Get rating from SupplierRating
      const ratingRecord = supplier.ratings[0];
      const rating = ratingRecord?.rating ?? 0;
      const performanceNotes = ratingRecord?.comment ?? null;

      // Last order date
      const lastOrderDate =
        supplier.purchaseOrders.length > 0
          ? supplier.purchaseOrders
              .map((po) => po.createdAt)
              .sort((a, b) => b.getTime() - a.getTime())[0]
              .toISOString()
          : null;

      return {
        supplierId: supplier.id,
        supplierName: supplier.name,
        supplierCode: supplier.code,
        status: supplier.status as 'active' | 'inactive',
        totalOrders,
        totalAmountSpent: Math.round(totalAmountSpent * 100) / 100,
        onTimeDeliveryRate,
        averageDeliveryDays,
        rating,
        performanceNotes,
        lastOrderDate,
      };
    });

    // Filter by minRating if provided
    if (minRating && typeof minRating === 'string') {
      const minRatingNum = parseInt(minRating, 10);
      if (!isNaN(minRatingNum)) {
        performanceRecords = performanceRecords.filter((r) => r.rating >= minRatingNum);
      }
    }

    // Sort
    const validSortFields = ['rating', 'totalOrders', 'onTimeDeliveryRate', 'totalAmountSpent'];
    const sortField = validSortFields.includes(sortBy as string)
      ? (sortBy as keyof (typeof performanceRecords)[0])
      : 'totalOrders';
    const order = sortOrder === 'asc' ? 1 : -1;

    performanceRecords.sort((a, b) => {
      const aVal = a[sortField] as number;
      const bVal = b[sortField] as number;
      return (aVal - bVal) * order;
    });

    // Paginate
    const total = performanceRecords.length;
    const paginatedRecords = performanceRecords.slice(
      (pageNum - 1) * limitNum,
      pageNum * limitNum
    );

    const response: ApiResponse = {
      success: true,
      data: {
        suppliers: paginatedRecords,
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
    res.json(response);
  } catch (error) {
    console.error('Error fetching supplier performance:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch supplier performance data',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * PATCH /api/v1/inventory/suppliers/:supplierId/rating
 * Upsert a SupplierRating record for the supplier + businessOwner combination
 * Accepts { rating, comment } or { rating, performanceNotes }
 */
export async function updateSupplierRating(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to update supplier rating',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { supplierId } = req.params;
    const { rating, comment, performanceNotes } = req.body;

    // Validate rating
    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Rating must be an integer between 1 and 5',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Verify supplier belongs to tenant
    const supplier = await prisma.supplier.findFirst({
      where: {
        id: supplierId,
        businessOwnerId: tenantId,
      },
    });

    if (!supplier) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Supplier not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Use performanceNotes or comment (frontend sends performanceNotes)
    const commentText = (performanceNotes ?? comment ?? null) as string | null;

    // Upsert the rating
    await prisma.supplierRating.upsert({
      where: {
        supplierId_businessOwnerId: {
          supplierId,
          businessOwnerId: tenantId,
        },
      },
      update: {
        rating: ratingNum,
        comment: commentText,
      },
      create: {
        supplierId,
        businessOwnerId: tenantId,
        rating: ratingNum,
        comment: commentText,
      },
    });

    // Re-fetch supplier performance data for response
    const updatedSupplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      include: {
        purchaseOrders: {
          select: {
            id: true,
            status: true,
            grandTotal: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        ratings: {
          where: { businessOwnerId: tenantId },
          take: 1,
        },
      },
    });

    if (!updatedSupplier) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Supplier not found after update',
        },
      };
      res.status(404).json(response);
      return;
    }

    const totalOrders = updatedSupplier.purchaseOrders.length;
    const totalAmountSpent = updatedSupplier.purchaseOrders.reduce(
      (sum, po) => sum + decimalToNumber(po.grandTotal),
      0
    );
    const receivedPOs = updatedSupplier.purchaseOrders.filter((po) => po.status === 'Received');
    const totalReceivedOrApproved = updatedSupplier.purchaseOrders.filter(
      (po) => po.status === 'Received' || po.status === 'Approved'
    ).length;
    const onTimeDeliveryRate =
      totalReceivedOrApproved > 0
        ? Math.round((receivedPOs.length / totalReceivedOrApproved) * 100)
        : 0;

    let averageDeliveryDays = 0;
    if (receivedPOs.length > 0) {
      const totalDays = receivedPOs.reduce((sum, po) => {
        const days =
          (new Date(po.updatedAt).getTime() - new Date(po.createdAt).getTime()) /
          (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0);
      averageDeliveryDays = Math.round((totalDays / receivedPOs.length) * 10) / 10;
    }

    const ratingRecord = updatedSupplier.ratings[0];
    const lastOrderDate =
      updatedSupplier.purchaseOrders.length > 0
        ? updatedSupplier.purchaseOrders
            .map((po) => po.createdAt)
            .sort((a, b) => b.getTime() - a.getTime())[0]
            .toISOString()
        : null;

    const performanceData = {
      supplierId: updatedSupplier.id,
      supplierName: updatedSupplier.name,
      supplierCode: updatedSupplier.code,
      status: updatedSupplier.status as 'active' | 'inactive',
      totalOrders,
      totalAmountSpent: Math.round(totalAmountSpent * 100) / 100,
      onTimeDeliveryRate,
      averageDeliveryDays,
      rating: ratingRecord?.rating ?? 0,
      performanceNotes: ratingRecord?.comment ?? null,
      lastOrderDate,
    };

    const response: ApiResponse = {
      success: true,
      data: performanceData,
    };
    res.json(response);
  } catch (error) {
    console.error('Error updating supplier rating:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update supplier rating',
      },
    };
    res.status(500).json(response);
  }
}
