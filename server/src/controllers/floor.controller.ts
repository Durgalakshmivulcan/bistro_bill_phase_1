import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { prisma } from '../services/db.service';
import { Prisma, Floor, FloorType } from '@prisma/client';

/**
 * Floor Response Interface
 */
interface FloorResponse {
  id: string;
  name: string;
  type: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  branch: {
    id: string;
    name: string;
  };
  tableCount: number;
}

/**
 * Floor List Response
 */
interface FloorListResponse {
  floors: FloorResponse[];
  total: number;
}

/**
 * Transform Floor with branch and tables to response format
 */
function transformFloorResponse(floor: Floor & { branch: { id: string; name: string }; _count: { tables: number } }): FloorResponse {
  return {
    id: floor.id,
    name: floor.name,
    type: floor.type,
    status: floor.status,
    createdAt: floor.createdAt,
    updatedAt: floor.updatedAt,
    branch: {
      id: floor.branch.id,
      name: floor.branch.name,
    },
    tableCount: floor._count.tables,
  };
}

/**
 * GET /api/v1/resources/branches/:branchId/floors
 * List all floors for a specific branch
 * Requires tenant middleware
 */
export async function listFloors(
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
          message: 'Tenant context is required to list floors',
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
    const whereClause: Prisma.FloorWhereInput = {
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

    // Fetch floors
    const floors = await prisma.floor.findMany({
      where: whereClause,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            tables: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Transform to response format
    const floorResponses: FloorResponse[] = floors.map(transformFloorResponse);

    const response: ApiResponse<FloorListResponse> = {
      success: true,
      data: {
        floors: floorResponses,
        total: floorResponses.length,
      },
      message: 'Floors retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error listing floors:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve floors',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * POST /api/v1/resources/floors
 * Create a new floor
 * Required: branchId, name, type
 * Optional: status
 */
export async function createFloor(
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
          message: 'Tenant context is required to create a floor',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Validate required fields
    const { branchId, name, type, status } = req.body;

    const missingFields: string[] = [];
    if (!branchId || typeof branchId !== 'string' || !branchId.trim()) {
      missingFields.push('branchId');
    }
    if (!name || typeof name !== 'string' || !name.trim()) {
      missingFields.push('name');
    }
    if (!type || typeof type !== 'string' || !type.trim()) {
      missingFields.push('type');
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

    // Validate type
    const validTypes = ['AC', 'NonAC', 'Outdoor', 'Family'];
    if (!validTypes.includes(type)) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Type must be one of: AC, NonAC, Outdoor, Family',
        },
      };
      res.status(400).json(response);
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

    // Create the floor
    const newFloor = await prisma.floor.create({
      data: {
        branchId,
        name: name.trim(),
        type: type as 'AC' | 'NonAC' | 'Outdoor' | 'Family',
        status: status || 'active',
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            tables: true,
          },
        },
      },
    });

    const floorResponse = transformFloorResponse(newFloor);

    const response: ApiResponse<{ floor: FloorResponse }> = {
      success: true,
      data: {
        floor: floorResponse,
      },
      message: 'Floor created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating floor:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create floor',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * PUT /api/v1/resources/floors/:id
 * Update a floor
 * All fields optional except id
 */
export async function updateFloor(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;
    const floorId = req.params.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to update a floor',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Check if floor exists and belongs to tenant (via branch)
    const existingFloor = await prisma.floor.findFirst({
      where: {
        id: floorId,
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
        _count: {
          select: {
            tables: true,
          },
        },
      },
    });

    if (!existingFloor) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Floor not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Build update data from request body
    const { name, type, status } = req.body;

    const updateData: Prisma.FloorUpdateInput = {};

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

    if (type !== undefined) {
      const validTypes = ['AC', 'NonAC', 'Outdoor', 'Family'];
      if (typeof type !== 'string' || !validTypes.includes(type)) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Type must be one of: AC, NonAC, Outdoor, Family',
          },
        };
        res.status(400).json(response);
        return;
      }
      updateData.type = type as FloorType;
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

    // Update the floor
    const updatedFloor = await prisma.floor.update({
      where: { id: floorId },
      data: updateData,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            tables: true,
          },
        },
      },
    });

    const floorResponse = transformFloorResponse(updatedFloor);

    const response: ApiResponse<{ floor: FloorResponse }> = {
      success: true,
      data: {
        floor: floorResponse,
      },
      message: 'Floor updated successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating floor:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update floor',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * DELETE /api/v1/resources/floors/:id
 * Delete a floor (cascade delete tables)
 */
export async function deleteFloor(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;
    const floorId = req.params.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to delete a floor',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Check if floor exists and belongs to tenant (via branch)
    const existingFloor = await prisma.floor.findFirst({
      where: {
        id: floorId,
        branch: {
          businessOwnerId: tenantId,
        },
      },
    });

    if (!existingFloor) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Floor not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Delete the floor (cascade delete handles tables per Prisma schema)
    await prisma.floor.delete({
      where: { id: floorId },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Floor deleted successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting floor:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete floor',
      },
    };
    res.status(500).json(response);
  }
}
