import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { prisma } from '../services/db.service';
import { RequestWithUpload } from '../middleware/upload.middleware';
import { deleteFromS3, extractKeyFromUrl } from '../services/s3.service';

/**
 * Category Response Interface
 */
interface CategoryResponse {
  id: string;
  name: string;
  image: string | null;
  description: string | null;
  status: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  subCategoryCount: number;
}

/**
 * Category List Response
 */
interface CategoryListResponse {
  categories: CategoryResponse[];
  total: number;
}

/**
 * GET /api/v1/catalog/categories
 * List all categories for the authenticated tenant
 * Requires tenant middleware
 */
export async function listCategories(
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
          message: 'Tenant context is required to list categories',
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

    // Fetch categories with subcategory count
    const categories = await prisma.category.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            subCategories: true,
          },
        },
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    });

    // Transform to response format
    const categoryResponses: CategoryResponse[] = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      image: cat.image,
      description: cat.description,
      status: cat.status,
      sortOrder: cat.sortOrder,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
      subCategoryCount: cat._count.subCategories,
    }));

    const response: ApiResponse<CategoryListResponse> = {
      success: true,
      data: {
        categories: categoryResponses,
        total: categoryResponses.length,
      },
      message: 'Categories retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error listing categories:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve categories',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * POST /api/v1/catalog/categories
 * Create a new category for the authenticated tenant
 * Requires tenant middleware
 * Supports optional image upload via multipart/form-data
 */
export async function createCategory(
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
          message: 'Tenant context is required to create a category',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Parse request body
    const { name, description, status, sortOrder } = req.body;

    // Validate required field: name
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

    // Create category
    const category = await prisma.category.create({
      data: {
        businessOwnerId: tenantId,
        name: name.trim(),
        description: description?.trim() || null,
        image: imageUrl,
        status: status || 'active',
        sortOrder: parsedSortOrder,
      },
      include: {
        _count: {
          select: {
            subCategories: true,
          },
        },
      },
    });

    // Build response
    const categoryResponse: CategoryResponse = {
      id: category.id,
      name: category.name,
      image: category.image,
      description: category.description,
      status: category.status,
      sortOrder: category.sortOrder,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      subCategoryCount: category._count.subCategories,
    };

    const response: ApiResponse<CategoryResponse> = {
      success: true,
      data: categoryResponse,
      message: 'Category created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating category:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create category',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * PUT /api/v1/catalog/categories/:id
 * Update an existing category for the authenticated tenant
 * Requires tenant middleware
 * Supports optional image upload/replacement via multipart/form-data
 */
export async function updateCategory(
  req: AuthenticatedRequest & RequestWithUpload,
  res: Response
): Promise<void> {
  try {
    // Tenant ID is required (set by tenant middleware)
    const tenantId = req.tenantId;
    const categoryId = req.params.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to update a category',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Find existing category (check tenant ownership)
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: categoryId,
        businessOwnerId: tenantId,
      },
    });

    if (!existingCategory) {
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

    // Parse request body
    const { name, description, status, sortOrder } = req.body;

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
      if (existingCategory.image) {
        const oldKey = extractKeyFromUrl(existingCategory.image);
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
    interface CategoryUpdateData {
      name?: string;
      description?: string | null;
      status?: string;
      sortOrder?: number;
      image?: string | null;
    }
    const updateData: CategoryUpdateData = {};

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

    // Update category
    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: updateData,
      include: {
        _count: {
          select: {
            subCategories: true,
          },
        },
      },
    });

    // Build response
    const categoryResponse: CategoryResponse = {
      id: updatedCategory.id,
      name: updatedCategory.name,
      image: updatedCategory.image,
      description: updatedCategory.description,
      status: updatedCategory.status,
      sortOrder: updatedCategory.sortOrder,
      createdAt: updatedCategory.createdAt,
      updatedAt: updatedCategory.updatedAt,
      subCategoryCount: updatedCategory._count.subCategories,
    };

    const response: ApiResponse<CategoryResponse> = {
      success: true,
      data: categoryResponse,
      message: 'Category updated successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating category:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update category',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * DELETE /api/v1/catalog/categories/:id
 * Delete a category for the authenticated tenant
 * Requires tenant middleware
 * - Prevents deletion if category has products
 * - Deletes associated image from S3
 * - Also deletes subcategories under this category (and their images)
 */
export async function deleteCategory(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    // Tenant ID is required (set by tenant middleware)
    const tenantId = req.tenantId;
    const categoryId = req.params.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to delete a category',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Find existing category (check tenant ownership)
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: categoryId,
        businessOwnerId: tenantId,
      },
      include: {
        subCategories: {
          select: {
            id: true,
            image: true,
          },
        },
      },
    });

    if (!existingCategory) {
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

    // Check if category has any products
    const productCount = await prisma.product.count({
      where: {
        categoryId: categoryId,
      },
    });

    if (productCount > 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'CATEGORY_HAS_PRODUCTS',
          message: `Cannot delete category. It has ${productCount} ${productCount === 1 ? 'product' : 'products'} associated with it.`,
        },
      };
      res.status(400).json(response);
      return;
    }

    // Collect all images to delete from S3 (category + subcategories)
    const imagesToDelete: string[] = [];

    if (existingCategory.image) {
      const categoryKey = extractKeyFromUrl(existingCategory.image);
      if (categoryKey) {
        imagesToDelete.push(categoryKey);
      }
    }

    for (const subCategory of existingCategory.subCategories) {
      if (subCategory.image) {
        const subCategoryKey = extractKeyFromUrl(subCategory.image);
        if (subCategoryKey) {
          imagesToDelete.push(subCategoryKey);
        }
      }
    }

    // Delete category and subcategories (cascade delete handles subcategories)
    await prisma.category.delete({
      where: { id: categoryId },
    });

    // Delete images from S3 (do this after DB delete to avoid orphaned records)
    for (const key of imagesToDelete) {
      try {
        await deleteFromS3(key);
      } catch (deleteError) {
        console.error('Error deleting image from S3:', deleteError);
        // Continue even if S3 delete fails - DB record is already gone
      }
    }

    const response: ApiResponse = {
      success: true,
      message: 'Category deleted successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting category:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete category',
      },
    };
    res.status(500).json(response);
  }
}
