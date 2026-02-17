import { Response } from 'express';
import { prisma } from '../services/db.service';
import { AuthenticatedRequest } from '../types';
import { deleteFromS3 } from '../services/s3.service';

/**
 * US-107: Advertisement List Endpoint
 * GET /api/v1/marketing/advertisements
 */
export const getAdvertisements = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const tenantId = req.tenantId;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'TENANT_REQUIRED',
          message: 'Tenant context is required',
        },
      });
      return;
    }

    // Build filter
    const where: any = {
      businessOwnerId: tenantId,
    };

    if (status) {
      where.status = status;
    }

    // Fetch advertisements with discount associations
    const advertisements = await prisma.advertisement.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            advertisementDiscounts: true,
          },
        },
        advertisementDiscounts: {
          include: {
            discount: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Transform to include linked discounts and computed metrics
    const advertisementsWithDiscounts = advertisements.map((ad) => ({
      ...ad,
      discountCount: ad._count.advertisementDiscounts,
      linkedDiscounts: ad.advertisementDiscounts.map((ad) => ad.discount),
      ctr: ad.impressions > 0 ? parseFloat(((ad.clicks / ad.impressions) * 100).toFixed(2)) : 0,
      conversionRate: ad.clicks > 0 ? parseFloat(((ad.conversions / ad.clicks) * 100).toFixed(2)) : 0,
    }));

    res.json({
      success: true,
      data: advertisementsWithDiscounts,
      message: 'Advertisements fetched successfully',
    });
  } catch (error) {
    console.error('Error fetching advertisements:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch advertisements',
      },
    });
  }
};

/**
 * US-107: Advertisement Create Endpoint
 * POST /api/v1/marketing/advertisements
 */
export const createAdvertisement = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'TENANT_REQUIRED',
          message: 'Tenant context is required',
        },
      });
      return;
    }

    const { title, description, image, startDate, endDate, status, discountIds } = req.body;

    // Validate required fields
    if (!title) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Required field: title',
        },
      });
      return;
    }

    // Create advertisement with discount associations
    const advertisement = await prisma.advertisement.create({
      data: {
        businessOwnerId: tenantId,
        title,
        description: description || null,
        image: image || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: status || 'active',
        // Create discount associations if provided
        advertisementDiscounts: discountIds?.length
          ? {
              create: discountIds.map((discountId: string) => ({
                discountId,
              })),
            }
          : undefined,
      },
      include: {
        _count: {
          select: {
            advertisementDiscounts: true,
          },
        },
        advertisementDiscounts: {
          include: {
            discount: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        ...advertisement,
        discountCount: advertisement._count.advertisementDiscounts,
        linkedDiscounts: advertisement.advertisementDiscounts.map((ad) => ad.discount),
      },
      message: 'Advertisement created successfully',
    });
  } catch (error) {
    console.error('Error creating advertisement:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create advertisement',
      },
    });
  }
};

/**
 * US-107: Advertisement Update Endpoint
 * PUT /api/v1/marketing/advertisements/:id
 */
export const updateAdvertisement = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'TENANT_REQUIRED',
          message: 'Tenant context is required',
        },
      });
      return;
    }

    // Check if advertisement exists and belongs to tenant
    const existingAdvertisement = await prisma.advertisement.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
    });

    if (!existingAdvertisement) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ADVERTISEMENT_NOT_FOUND',
          message: 'Advertisement not found',
        },
      });
      return;
    }

    const { title, description, image, startDate, endDate, status, discountIds } = req.body;

    // Handle image replacement
    if (image && existingAdvertisement.image && image !== existingAdvertisement.image) {
      // Delete old image from S3
      try {
        await deleteFromS3(existingAdvertisement.image);
      } catch (error) {
        console.error('Error deleting old image from S3:', error);
        // Continue with update even if S3 delete fails
      }
    }

    // Update discount associations if provided
    if (discountIds !== undefined) {
      // Delete existing associations
      await prisma.advertisementDiscount.deleteMany({
        where: { advertisementId: id },
      });
    }

    // Build update data
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (status !== undefined) updateData.status = status;

    // Add new discount associations
    if (discountIds?.length) {
      updateData.advertisementDiscounts = {
        create: discountIds.map((discountId: string) => ({
          discountId,
        })),
      };
    }

    // Update advertisement
    const updatedAdvertisement = await prisma.advertisement.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            advertisementDiscounts: true,
          },
        },
        advertisementDiscounts: {
          include: {
            discount: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      data: {
        ...updatedAdvertisement,
        discountCount: updatedAdvertisement._count.advertisementDiscounts,
        linkedDiscounts: updatedAdvertisement.advertisementDiscounts.map((ad) => ad.discount),
      },
      message: 'Advertisement updated successfully',
    });
  } catch (error) {
    console.error('Error updating advertisement:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update advertisement',
      },
    });
  }
};

/**
 * US-107: Advertisement Delete Endpoint
 * DELETE /api/v1/marketing/advertisements/:id
 */
export const deleteAdvertisement = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'TENANT_REQUIRED',
          message: 'Tenant context is required',
        },
      });
      return;
    }

    // Check if advertisement exists and belongs to tenant
    const existingAdvertisement = await prisma.advertisement.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
    });

    if (!existingAdvertisement) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ADVERTISEMENT_NOT_FOUND',
          message: 'Advertisement not found',
        },
      });
      return;
    }

    // Delete image from S3 if exists
    if (existingAdvertisement.image) {
      try {
        await deleteFromS3(existingAdvertisement.image);
      } catch (error) {
        console.error('Error deleting image from S3:', error);
        // Continue with delete even if S3 delete fails
      }
    }

    // Delete advertisement (cascade will remove associations)
    await prisma.advertisement.delete({
      where: { id },
    });

    res.json({
      success: true,
      data: null,
      message: 'Advertisement deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting advertisement:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete advertisement',
      },
    });
  }
};

/**
 * US-168: Get single advertisement with metrics
 * GET /api/v1/marketing/advertisements/:id
 */
export const getAdvertisement = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: { code: 'TENANT_REQUIRED', message: 'Tenant context is required' },
      });
      return;
    }

    const advertisement = await prisma.advertisement.findFirst({
      where: { id, businessOwnerId: tenantId },
      include: {
        _count: { select: { advertisementDiscounts: true } },
        advertisementDiscounts: {
          include: {
            discount: { select: { id: true, code: true, name: true } },
          },
        },
      },
    });

    if (!advertisement) {
      res.status(404).json({
        success: false,
        error: { code: 'ADVERTISEMENT_NOT_FOUND', message: 'Advertisement not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        ...advertisement,
        discountCount: advertisement._count.advertisementDiscounts,
        linkedDiscounts: advertisement.advertisementDiscounts.map((ad) => ad.discount),
        ctr: advertisement.impressions > 0 ? parseFloat(((advertisement.clicks / advertisement.impressions) * 100).toFixed(2)) : 0,
        conversionRate: advertisement.clicks > 0 ? parseFloat(((advertisement.conversions / advertisement.clicks) * 100).toFixed(2)) : 0,
      },
      message: 'Advertisement fetched successfully',
    });
  } catch (error) {
    console.error('Error fetching advertisement:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch advertisement' },
    });
  }
};

/**
 * US-168: Increment advertisement metric
 * PATCH /api/v1/marketing/advertisements/:id/metrics
 */
export const updateMetrics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    const { impressions, clicks, conversions } = req.body;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: { code: 'TENANT_REQUIRED', message: 'Tenant context is required' },
      });
      return;
    }

    const existing = await prisma.advertisement.findFirst({
      where: { id, businessOwnerId: tenantId },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: 'ADVERTISEMENT_NOT_FOUND', message: 'Advertisement not found' },
      });
      return;
    }

    const updateData: any = {};
    if (impressions !== undefined) updateData.impressions = impressions;
    if (clicks !== undefined) updateData.clicks = clicks;
    if (conversions !== undefined) updateData.conversions = conversions;

    const updated = await prisma.advertisement.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      data: {
        ...updated,
        ctr: updated.impressions > 0 ? parseFloat(((updated.clicks / updated.impressions) * 100).toFixed(2)) : 0,
        conversionRate: updated.clicks > 0 ? parseFloat(((updated.conversions / updated.clicks) * 100).toFixed(2)) : 0,
      },
      message: 'Advertisement metrics updated successfully',
    });
  } catch (error) {
    console.error('Error updating advertisement metrics:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update advertisement metrics' },
    });
  }
};
