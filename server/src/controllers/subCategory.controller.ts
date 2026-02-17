import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { prisma } from '../services/db.service';
import { RequestWithUpload } from '../middleware/upload.middleware';
import { deleteFromS3, extractKeyFromUrl } from '../services/s3.service';

/**
 * SubCategory Response Interface
 */
interface SubCategoryResponse {
  id: string;
  categoryId: string;
  name: string;
  image: string | null;
  description: string | null;
  status: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  productCount: number;
  category?: {
    id: string;
    name: string;
  };
}

/**
 * SubCategory List Response
 */
interface SubCategoryListResponse {
  subCategories: SubCategoryResponse[];
  total: number;
}

/**
 * GET /api/v1/catalog/categories/:categoryId/subcategories
 * List all subcategories for a specific category
 * Requires tenant middleware
 */
export async function listSubCategories(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    // Tenant ID is required (set by tenant middleware)
    const tenantId = req.tenantId;
    const categoryId = req.params.categoryId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to list subcategories',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Verify category exists and belongs to tenant
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        businessOwnerId: tenantId,
      },
    });

    if (!category) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Category not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Parse query parameters
    const { status } = req.query;

    // Build where clause
    interface WhereClause {
      businessOwnerId: string;
      categoryId: string;
      status?: string;
    }
    const whereClause: WhereClause = {
      businessOwnerId: tenantId,
      categoryId: categoryId,
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

    // Fetch subcategories with product count
    const subCategories = await prisma.subCategory.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            products: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    });

    // Transform to response format
    const subCategoryResponses: SubCategoryResponse[] = subCategories.map((sub) => ({
      id: sub.id,
      categoryId: sub.categoryId,
      name: sub.name,
      image: sub.image,
      description: sub.description,
      status: sub.status,
      sortOrder: sub.sortOrder,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
      productCount: sub._count.products,
      category: sub.category,
    }));

    const response: ApiResponse<SubCategoryListResponse> = {
      success: true,
      data: {
        subCategories: subCategoryResponses,
        total: subCategoryResponses.length,
      },
      message: 'Subcategories retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error listing subcategories:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve subcategories',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * POST /api/v1/catalog/subcategories
 * Create a new subcategory for the authenticated tenant
 * Requires tenant middleware
 * Supports optional image upload via multipart/form-data
 */
export async function createSubCategory(
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
          message: 'Tenant context is required to create a subcategory',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Parse request body
    const { categoryId, name, description, status, sortOrder } = req.body;

    // Validate required fields
    if (!categoryId || typeof categoryId !== 'string' || categoryId.trim() === '') {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'categoryId is required',
        },
      };
      res.status(400).json(response);
      return;
    }

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

    // Verify category exists and belongs to tenant
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId.trim(),
        businessOwnerId: tenantId,
      },
    });

    if (!category) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: 'Category not found',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Validate status if provided
    if (status !== undefined && status !== null) {
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

    // Validate sortOrder if provided
    let parsedSortOrder = 0;
    if (sortOrder !== undefined && sortOrder !== null && sortOrder !== '') {
      parsedSortOrder = Number(sortOrder);
      if (isNaN(parsedSortOrder)) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'sortOrder must be a valid number',
          },
        };
        res.status(400).json(response);
        return;
      }
    }

    // Get image URL from S3 upload if present
    const imageUrl = req.uploadedFile?.url || null;

    // Create subcategory
    const subCategory = await prisma.subCategory.create({
      data: {
        businessOwnerId: tenantId,
        categoryId: categoryId.trim(),
        name: name.trim(),
        description: description?.trim() || null,
        image: imageUrl,
        status: status || 'active',
        sortOrder: parsedSortOrder,
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Build response
    const subCategoryResponse: SubCategoryResponse = {
      id: subCategory.id,
      categoryId: subCategory.categoryId,
      name: subCategory.name,
      image: subCategory.image,
      description: subCategory.description,
      status: subCategory.status,
      sortOrder: subCategory.sortOrder,
      createdAt: subCategory.createdAt,
      updatedAt: subCategory.updatedAt,
      productCount: subCategory._count.products,
      category: subCategory.category,
    };

    const response: ApiResponse<SubCategoryResponse> = {
      success: true,
      data: subCategoryResponse,
      message: 'Subcategory created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating subcategory:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create subcategory',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * PUT /api/v1/catalog/subcategories/:id
 * Update an existing subcategory for the authenticated tenant
 * Requires tenant middleware
 * Supports optional image upload/replacement via multipart/form-data
 */
export async function updateSubCategory(
  req: AuthenticatedRequest & RequestWithUpload,
  res: Response
): Promise<void> {
  try {
    // Tenant ID is required (set by tenant middleware)
    const tenantId = req.tenantId;
    const subCategoryId = req.params.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to update a subcategory',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Find existing subcategory (check tenant ownership)
    const existingSubCategory = await prisma.subCategory.findFirst({
      where: {
        id: subCategoryId,
        businessOwnerId: tenantId,
      },
    });

    if (!existingSubCategory) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Subcategory not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Parse request body
    const { categoryId, name, description, status, sortOrder } = req.body;

    // Validate categoryId if provided (must belong to tenant)
    if (categoryId !== undefined && categoryId !== null && categoryId !== '') {
      const category = await prisma.category.findFirst({
        where: {
          id: categoryId.trim(),
          businessOwnerId: tenantId,
        },
      });

      if (!category) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'CATEGORY_NOT_FOUND',
            message: 'Category not found',
          },
        };
        res.status(400).json(response);
        return;
      }
    }

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
    if (status !== undefined && status !== null) {
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

    // Validate sortOrder if provided
    let parsedSortOrder: number | undefined;
    if (sortOrder !== undefined && sortOrder !== null && sortOrder !== '') {
      parsedSortOrder = Number(sortOrder);
      if (isNaN(parsedSortOrder)) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'sortOrder must be a valid number',
          },
        };
        res.status(400).json(response);
        return;
      }
    }

    // Handle image replacement
    let imageUrl: string | null | undefined;
    const newImageUrl = req.uploadedFile?.url;

    if (newImageUrl) {
      // New image uploaded - delete old one from S3 if exists
      if (existingSubCategory.image) {
        const oldKey = extractKeyFromUrl(existingSubCategory.image);
        if (oldKey) {
          try {
            await deleteFromS3(oldKey);
          } catch (deleteError) {
            console.error('Error deleting old image from S3:', deleteError);
            // Continue with update even if delete fails
          }
        }
      }
      imageUrl = newImageUrl;
    }

    // Build update data
    interface SubCategoryUpdateData {
      categoryId?: string;
      name?: string;
      description?: string | null;
      status?: string;
      sortOrder?: number;
      image?: string | null;
    }
    const updateData: SubCategoryUpdateData = {};

    if (categoryId !== undefined && categoryId !== null && categoryId !== '') {
      updateData.categoryId = categoryId.trim();
    }
    if (name !== undefined) {
      updateData.name = name.trim();
    }
    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }
    if (status !== undefined) {
      updateData.status = status;
    }
    if (parsedSortOrder !== undefined) {
      updateData.sortOrder = parsedSortOrder;
    }
    if (imageUrl !== undefined) {
      updateData.image = imageUrl;
    }

    // Update subcategory
    const updatedSubCategory = await prisma.subCategory.update({
      where: { id: subCategoryId },
      data: updateData,
      include: {
        _count: {
          select: {
            products: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Build response
    const subCategoryResponse: SubCategoryResponse = {
      id: updatedSubCategory.id,
      categoryId: updatedSubCategory.categoryId,
      name: updatedSubCategory.name,
      image: updatedSubCategory.image,
      description: updatedSubCategory.description,
      status: updatedSubCategory.status,
      sortOrder: updatedSubCategory.sortOrder,
      createdAt: updatedSubCategory.createdAt,
      updatedAt: updatedSubCategory.updatedAt,
      productCount: updatedSubCategory._count.products,
      category: updatedSubCategory.category,
    };

    const response: ApiResponse<SubCategoryResponse> = {
      success: true,
      data: subCategoryResponse,
      message: 'Subcategory updated successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating subcategory:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update subcategory',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * DELETE /api/v1/catalog/subcategories/:id
 * Delete a subcategory for the authenticated tenant
 * Requires tenant middleware
 * - Prevents deletion if subcategory has products
 * - Deletes associated image from S3
 */
export async function deleteSubCategory(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    // Tenant ID is required (set by tenant middleware)
    const tenantId = req.tenantId;
    const subCategoryId = req.params.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to delete a subcategory',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Find existing subcategory (check tenant ownership)
    const existingSubCategory = await prisma.subCategory.findFirst({
      where: {
        id: subCategoryId,
        businessOwnerId: tenantId,
      },
    });

    if (!existingSubCategory) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Subcategory not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Check if subcategory has any products
    const productCount = await prisma.product.count({
      where: {
        subCategoryId: subCategoryId,
      },
    });

    if (productCount > 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'SUBCATEGORY_HAS_PRODUCTS',
          message: `Cannot delete subcategory. It has ${productCount} ${productCount === 1 ? 'product' : 'products'} associated with it.`,
        },
      };
      res.status(400).json(response);
      return;
    }

    // Collect image to delete from S3
    const imageKey = existingSubCategory.image
      ? extractKeyFromUrl(existingSubCategory.image)
      : null;

    // Delete subcategory
    await prisma.subCategory.delete({
      where: { id: subCategoryId },
    });

    // Delete image from S3 (do this after DB delete to avoid orphaned records)
    if (imageKey) {
      try {
        await deleteFromS3(imageKey);
      } catch (deleteError) {
        console.error('Error deleting image from S3:', deleteError);
        // Continue even if S3 delete fails - DB record is already gone
      }
    }

    const response: ApiResponse = {
      success: true,
      message: 'Subcategory deleted successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete subcategory',
      },
    };
    res.status(500).json(response);
  }
}
