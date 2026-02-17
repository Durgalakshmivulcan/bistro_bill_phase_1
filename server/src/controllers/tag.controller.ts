import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { prisma } from '../services/db.service';

/**
 * Tag Response Interface
 */
interface TagResponse {
  id: string;
  name: string;
  color: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  productCount: number;
  customerCount: number;
}

/**
 * Tag List Response
 */
interface TagListResponse {
  tags: TagResponse[];
  total: number;
}

/**
 * GET /api/v1/catalog/tags
 * List all tags for the authenticated tenant
 * Requires tenant middleware
 */
export async function listTags(
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
          message: 'Tenant context is required to list tags',
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

    // Fetch tags with product and customer count
    const tags = await prisma.tag.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            productTags: true,
            customerTags: true,
          },
        },
      },
      orderBy: [
        { name: 'asc' },
      ],
    });

    // Transform to response format
    const tagResponses: TagResponse[] = tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      status: tag.status,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
      productCount: tag._count.productTags,
      customerCount: tag._count.customerTags,
    }));

    const response: ApiResponse<TagListResponse> = {
      success: true,
      data: {
        tags: tagResponses,
        total: tagResponses.length,
      },
      message: 'Tags retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error listing tags:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve tags',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * POST /api/v1/catalog/tags
 * Create a new tag for the authenticated tenant
 * Requires tenant middleware
 */
export async function createTag(
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
          message: 'Tenant context is required to create a tag',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Extract fields from body
    const { name, color, status } = req.body;

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

    // Color is required as per PRD (US-052)
    if (!color || typeof color !== 'string' || color.trim() === '') {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Color is required and must be a non-empty string',
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

    // Create tag
    const tag = await prisma.tag.create({
      data: {
        businessOwnerId: tenantId,
        name: name.trim(),
        color: color.trim(),
        status: status || 'active',
      },
      include: {
        _count: {
          select: {
            productTags: true,
            customerTags: true,
          },
        },
      },
    });

    // Transform to response format
    const tagResponse: TagResponse = {
      id: tag.id,
      name: tag.name,
      color: tag.color,
      status: tag.status,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
      productCount: tag._count.productTags,
      customerCount: tag._count.customerTags,
    };

    const response: ApiResponse<{ tag: TagResponse }> = {
      success: true,
      data: {
        tag: tagResponse,
      },
      message: 'Tag created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating tag:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create tag',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * PUT /api/v1/catalog/tags/:id
 * Update an existing tag for the authenticated tenant
 * Requires tenant middleware
 */
export async function updateTag(
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
          message: 'Tenant context is required to update a tag',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Get tag ID from path params
    const { id } = req.params;

    if (!id) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Tag ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Find existing tag (ensure it belongs to the tenant)
    const existingTag = await prisma.tag.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
    });

    if (!existingTag) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Tag not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Extract fields from body
    const { name, color, status } = req.body;

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

    // Validate color if provided
    if (color !== undefined && (typeof color !== 'string' || color.trim() === '')) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Color must be a non-empty string',
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
      color?: string;
      status?: string;
    }
    const updateData: UpdateData = {};

    if (name !== undefined) {
      updateData.name = name.trim();
    }

    if (color !== undefined) {
      updateData.color = color.trim();
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    // Update tag
    const updatedTag = await prisma.tag.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            productTags: true,
            customerTags: true,
          },
        },
      },
    });

    // Transform to response format
    const tagResponse: TagResponse = {
      id: updatedTag.id,
      name: updatedTag.name,
      color: updatedTag.color,
      status: updatedTag.status,
      createdAt: updatedTag.createdAt,
      updatedAt: updatedTag.updatedAt,
      productCount: updatedTag._count.productTags,
      customerCount: updatedTag._count.customerTags,
    };

    const response: ApiResponse<{ tag: TagResponse }> = {
      success: true,
      data: {
        tag: tagResponse,
      },
      message: 'Tag updated successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating tag:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update tag',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * DELETE /api/v1/catalog/tags/:id
 * Delete a tag for the authenticated tenant
 * Requires tenant middleware
 * Note: Deleting a tag also removes it from all products (cascade delete on ProductTag)
 */
export async function deleteTag(
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
          message: 'Tenant context is required to delete a tag',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Get tag ID from path params
    const { id } = req.params;

    if (!id) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Tag ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Find existing tag (ensure it belongs to the tenant)
    const existingTag = await prisma.tag.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
    });

    if (!existingTag) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Tag not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Delete tag from database
    // Note: ProductTag associations will be automatically deleted (Cascade on delete)
    await prisma.tag.delete({
      where: { id },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Tag deleted successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting tag:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete tag',
      },
    };
    res.status(500).json(response);
  }
}
