import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { prisma } from '../services/db.service';
import { RequestWithUpload } from '../middleware/upload.middleware';
import { deleteFromS3, extractKeyFromUrl } from '../services/s3.service';

/**
 * Brand Response Interface
 */
interface BrandResponse {
  id: string;
  name: string;
  image: string | null;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  productCount: number;
}

/**
 * Brand List Response
 */
interface BrandListResponse {
  brands: BrandResponse[];
  total: number;
}

/**
 * GET /api/v1/catalog/
 * List all brands for the authenticated tenant
 * Requires tenant middleware
 */
export async function listBrands(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    // Tenant ID is required (set by tenant middleware)
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to list brands',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Parse query parameters
    const { status } = req.query;

    // Build where clause
    interface WhereClause {
      businessOwnerId: string;
      status?: string;
    }
    const whereClause: WhereClause = {
      businessOwnerId: tenantId,
    };

    // Filter by status if provided
    if (status && typeof status === 'string') {
      const validStatuses = ['active', 'inactive'];
      if (!validStatuses.includes(status)) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Status must be one of: active, inactive',
          },
        };
        res.status(400).json(response);
        return;
      }
      whereClause.status = status;
    }

    // Fetch brands with product count
    const brands = await prisma.brand.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: [
        { name: 'asc' },
      ],
    });

    // Transform to response format
    const brandResponses: BrandResponse[] = brands.map((brand) => ({
      id: brand.id,
      name: brand.name,
      image: brand.image,
      description: brand.description,
      status: brand.status,
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt,
      productCount: brand._count.products,
    }));

    const response: ApiResponse<BrandListResponse> = {
      success: true,
      data: {
        brands: brandResponses,
        total: brandResponses.length,
      },
      message: 'Brands retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error listing brands:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve brands',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * POST /api/v1/catalog/brands
 * Create a new brand for the authenticated tenant
 * Requires tenant middleware
 * Supports image upload via multipart/form-data
 */
export async function createBrand(
  req: AuthenticatedRequest & RequestWithUpload,
  res: Response
): Promise<void> {
  try {
    // Tenant ID is required (set by tenant middleware)
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to create a brand',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Extract fields from body
    const { name, description, status } = req.body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name is required and must be a non-empty string',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Validate status if provided
    if (status !== undefined) {
      const validStatuses = ['active', 'inactive'];
      if (!validStatuses.includes(status)) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Status must be one of: active, inactive',
          },
        };
        res.status(400).json(response);
        return;
      }
    }

    if (!req.uploadedFile?.url) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Image is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Get image URL from upload middleware
    const imageUrl = req.uploadedFile?.url || null;

    // Create brand
    const brand = await prisma.brand.create({
      data: {
        businessOwnerId: tenantId,
        name: name.trim(),
        image: imageUrl,
        description: description?.trim() || null,
        status: status || 'active',
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    // Transform to response format
    const brandResponse: BrandResponse = {
      id: brand.id,
      name: brand.name,
      image: brand.image,
      description: brand.description,
      status: brand.status,
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt,
      productCount: brand._count.products,
    };

    const response: ApiResponse<{ brand: BrandResponse }> = {
      success: true,
      data: {
        brand: brandResponse,
      },
      message: 'Brand created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating brand:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create brand',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * PUT /api/v1/catalog/brands/:id
 * Update an existing brand for the authenticated tenant
 * Requires tenant middleware
 * Supports image replacement via multipart/form-data
 */
export async function updateBrand(
  req: AuthenticatedRequest & RequestWithUpload,
  res: Response
): Promise<void> {
  try {
    // Tenant ID is required (set by tenant middleware)
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to update a brand',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Get brand ID from path params
    const { id } = req.params;

    if (!id) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Brand ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Find existing brand (ensure it belongs to the tenant)
    const existingBrand = await prisma.brand.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
    });

    if (!existingBrand) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Brand not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Extract fields from body
    const { name, description, status } = req.body;

    // Validate name if provided
    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name must be a non-empty string',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Validate status if provided
    if (status !== undefined) {
      const validStatuses = ['active', 'inactive'];
      if (!validStatuses.includes(status)) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Status must be one of: active, inactive',
          },
        };
        res.status(400).json(response);
        return;
      }
    }

    // Build update data
    interface UpdateData {
      name?: string;
      description?: string | null;
      status?: string;
      image?: string | null;
    }
    const updateData: UpdateData = {};

    if (name !== undefined) {
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    // Handle image replacement
    let oldImageKey: string | null = null;
    if (req.uploadedFile?.url) {
      // New image was uploaded, save old image key for deletion
      if (existingBrand.image) {
        oldImageKey = extractKeyFromUrl(existingBrand.image);
      }
      updateData.image = req.uploadedFile.url;
    }

    // Update brand
    const updatedBrand = await prisma.brand.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    // Delete old image from S3 if replaced
    if (oldImageKey) {
      try {
        await deleteFromS3(oldImageKey);
      } catch (s3Error) {
        console.error('Error deleting old brand image from S3:', s3Error);
        // Continue with response, don't fail the request
      }
    }

    // Transform to response format
    const brandResponse: BrandResponse = {
      id: updatedBrand.id,
      name: updatedBrand.name,
      image: updatedBrand.image,
      description: updatedBrand.description,
      status: updatedBrand.status,
      createdAt: updatedBrand.createdAt,
      updatedAt: updatedBrand.updatedAt,
      productCount: updatedBrand._count.products,
    };

    const response: ApiResponse<{ brand: BrandResponse }> = {
      success: true,
      data: {
        brand: brandResponse,
      },
      message: 'Brand updated successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating brand:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update brand',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * DELETE /api/v1/catalog/brands/:id
 * Delete a brand for the authenticated tenant
 * Requires tenant middleware
 * Prevents deletion if brand has products
 * Deletes associated image from S3
 */
export async function deleteBrand(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    // Tenant ID is required (set by tenant middleware)
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to delete a brand',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Get brand ID from path params
    const { id } = req.params;

    if (!id) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Brand ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Find existing brand (ensure it belongs to the tenant)
    const existingBrand = await prisma.brand.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
    });

    if (!existingBrand) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Brand not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Check if brand has products
    const productCount = await prisma.product.count({
      where: {
        brandId: id,
      },
    });

    if (productCount > 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'HAS_PRODUCTS',
          message: `Cannot delete brand. It has ${productCount} product${productCount === 1 ? '' : 's'} associated with it.`,
        },
      };
      res.status(400).json(response);
      return;
    }

    // Get image key for S3 cleanup
    const imageKey = existingBrand.image ? extractKeyFromUrl(existingBrand.image) : null;

    // Delete brand from database
    await prisma.brand.delete({
      where: { id },
    });

    // Delete image from S3 if exists
    if (imageKey) {
      try {
        await deleteFromS3(imageKey);
      } catch (s3Error) {
        console.error('Error deleting brand image from S3:', s3Error);
        // Continue with response, don't fail the request
      }
    }

    const response: ApiResponse = {
      success: true,
      message: 'Brand deleted successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting brand:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete brand',
      },
    };
    res.status(500).json(response);
  }
}
