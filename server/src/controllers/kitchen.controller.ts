import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { prisma } from '../services/db.service';
import { Prisma, Kitchen } from '@prisma/client';

/**
 * Kitchen Response Interface
 */
interface KitchenResponse {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  branch: {
    id: string;
    name: string;
  };
}

/**
 * Kitchen List Response
 */
interface KitchenListResponse {
  kitchens: KitchenResponse[];
  total: number;
}

/**
 * Transform Kitchen with branch to response format
 */
function transformKitchenResponse(kitchen: Kitchen & { branch: { id: string; name: string } }): KitchenResponse {
  return {
    id: kitchen.id,
    name: kitchen.name,
    description: kitchen.description,
    status: kitchen.status,
    createdAt: kitchen.createdAt,
    updatedAt: kitchen.updatedAt,
    branch: {
      id: kitchen.branch.id,
      name: kitchen.branch.name,
    },
  };
}

/**
 * GET /api/v1/resources/branches/:branchId/kitchens
 * List all kitchens for a specific branch
 * Requires tenant middleware
 */
export async function listKitchens(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;
    const branchId = req.params.branchId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to list kitchens',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Verify branch exists and belongs to tenant
    const branch = await prisma.branch.findFirst({
      where: {
        id: branchId,
        businessOwnerId: tenantId,
      },
    });

    if (!branch) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Branch not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Parse query parameters
    const { status } = req.query;

    // Build where clause
    const whereClause: Prisma.KitchenWhereInput = {
      branchId,
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

    // Fetch kitchens
    const kitchens = await prisma.kitchen.findMany({
      where: whereClause,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Transform to response format
    const kitchenResponses: KitchenResponse[] = kitchens.map(transformKitchenResponse);

    const response: ApiResponse<KitchenListResponse> = {
      success: true,
      data: {
        kitchens: kitchenResponses,
        total: kitchenResponses.length,
      },
      message: 'Kitchens retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error listing kitchens:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve kitchens',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * POST /api/v1/resources/kitchens
 * Create a new kitchen
 * Required: branchId, name
 * Optional: description, status
 */
export async function createKitchen(
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
          message: 'Tenant context is required to create a kitchen',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Validate required fields
    const { branchId, name, description, status } = req.body;

    const missingFields: string[] = [];
    if (!branchId || typeof branchId !== 'string' || !branchId.trim()) {
      missingFields.push('branchId');
    }
    if (!name || typeof name !== 'string' || !name.trim()) {
      missingFields.push('name');
    }

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

    // Verify branch exists and belongs to tenant
    const branch = await prisma.branch.findFirst({
      where: {
        id: branchId,
        businessOwnerId: tenantId,
      },
    });

    if (!branch) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Branch not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Validate status if provided
    if (status !== undefined) {
      const validStatuses = ['active', 'inactive'];
      if (typeof status !== 'string' || !validStatuses.includes(status)) {
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

    // Create the kitchen
    const newKitchen = await prisma.kitchen.create({
      data: {
        branchId,
        name: name.trim(),
        description: description?.trim() || null,
        status: status || 'active',
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const kitchenResponse = transformKitchenResponse(newKitchen);

    const response: ApiResponse<{ kitchen: KitchenResponse }> = {
      success: true,
      data: {
        kitchen: kitchenResponse,
      },
      message: 'Kitchen created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating kitchen:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create kitchen',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * PUT /api/v1/resources/kitchens/:id
 * Update a kitchen
 * All fields optional except id
 */
export async function updateKitchen(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;
    const kitchenId = req.params.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to update a kitchen',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Check if kitchen exists and belongs to tenant (via branch)
    const existingKitchen = await prisma.kitchen.findFirst({
      where: {
        id: kitchenId,
        branch: {
          businessOwnerId: tenantId,
        },
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!existingKitchen) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Kitchen not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Build update data from request body
    const { name, description, status } = req.body;

    const updateData: Prisma.KitchenUpdateInput = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
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
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (status !== undefined) {
      const validStatuses = ['active', 'inactive'];
      if (typeof status !== 'string' || !validStatuses.includes(status)) {
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
      updateData.status = status;
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'No fields provided to update',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Update the kitchen
    const updatedKitchen = await prisma.kitchen.update({
      where: { id: kitchenId },
      data: updateData,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const kitchenResponse = transformKitchenResponse(updatedKitchen);

    const response: ApiResponse<{ kitchen: KitchenResponse }> = {
      success: true,
      data: {
        kitchen: kitchenResponse,
      },
      message: 'Kitchen updated successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating kitchen:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update kitchen',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * DELETE /api/v1/resources/kitchens/:id
 * Delete a kitchen
 * Returns error if kitchen has associated KOTs
 */
export async function deleteKitchen(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;
    const kitchenId = req.params.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to delete a kitchen',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Check if kitchen exists and belongs to tenant (via branch)
    const existingKitchen = await prisma.kitchen.findFirst({
      where: {
        id: kitchenId,
        branch: {
          businessOwnerId: tenantId,
        },
      },
    });

    if (!existingKitchen) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Kitchen not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Delete the kitchen (cascade delete handles OrderKOTs per Prisma schema)
    await prisma.kitchen.delete({
      where: { id: kitchenId },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Kitchen deleted successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting kitchen:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete kitchen',
      },
    };
    res.status(500).json(response);
  }
}
