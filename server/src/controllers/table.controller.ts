import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { TableShape, TableStatus } from '@prisma/client';
import { prisma } from '../services/db.service';
import { connectionManager } from '../websocket/connectionManager';
import { WebSocketEventType, TableStatusChangedPayload } from '../types/websocket.types';

// Helper function to transform table response
const transformTableResponse = (table: any) => {
  return {
    id: table.id,
    floorId: table.floorId,
    label: table.label,
    shape: table.shape,
    chairs: table.chairs,
    status: table.status,
    createdAt: table.createdAt,
    updatedAt: table.updatedAt,
    floor: table.floor ? {
      id: table.floor.id,
      name: table.floor.name,
      branchId: table.floor.branchId,
    } : undefined,
  };
};

// GET /api/v1/resources/floors/:floorId/tables - List tables for a floor
export const listTables = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { floorId } = req.params;
    const tenantId = req.tenantId;
    const { status } = req.query;

    // Verify floor belongs to tenant
    const floor = await prisma.floor.findFirst({
      where: {
        id: floorId,
        branch: {
          businessOwnerId: tenantId,
        },
      },
    });

    if (!floor) {
      res.status(404).json({
        success: false,
        error: {
          code: 'FLOOR_NOT_FOUND',
          message: 'Floor not found',
        },
      });
      return;
    }

    // Build where clause
    const where: any = {
      floorId: floorId,
    };

    if (status) {
      where.status = status;
    }

    // Fetch tables
    const tables = await prisma.table.findMany({
      where,
      include: {
        floor: {
          select: {
            id: true,
            name: true,
            branchId: true,
          },
        },
      },
      orderBy: {
        label: 'asc',
      },
    });

    res.status(200).json({
      success: true,
      data: tables.map(transformTableResponse),
    });
  } catch (error) {
    console.error('Error listing tables:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch tables',
      },
    });
  }
};

// POST /api/v1/resources/tables - Create table
export const createTable = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId;
    const { floorId, label, chairs, shape, status } = req.body;

    // Validate required fields
    if (!floorId || !label || !chairs) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'floorId, label, and chairs are required',
        },
      });
      return;
    }

    // Validate chairs is a positive number
    if (typeof chairs !== 'number' || chairs <= 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'chairs must be a positive number',
        },
      });
      return;
    }

    // Validate shape if provided
    if (shape && !['square', 'long', 'round'].includes(shape)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'shape must be one of: square, long, round',
        },
      });
      return;
    }

    // Validate status if provided
    if (status && !['available', 'running', 'reserved', 'maintenance'].includes(status)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'status must be one of: available, running, reserved, maintenance',
        },
      });
      return;
    }

    // Verify floor belongs to tenant
    const floor = await prisma.floor.findFirst({
      where: {
        id: floorId,
        branch: {
          businessOwnerId: tenantId,
        },
      },
    });

    if (!floor) {
      res.status(404).json({
        success: false,
        error: {
          code: 'FLOOR_NOT_FOUND',
          message: 'Floor not found',
        },
      });
      return;
    }

    // Create table
    const table = await prisma.table.create({
      data: {
        floorId,
        label,
        chairs,
        shape: shape ? (shape as TableShape) : undefined,
        status: status ? (status as TableStatus) : undefined,
      },
      include: {
        floor: {
          select: {
            id: true,
            name: true,
            branchId: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: transformTableResponse(table),
      message: 'Table created successfully',
    });
  } catch (error) {
    console.error('Error creating table:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create table',
      },
    });
  }
};

// PUT /api/v1/resources/tables/:id - Update table
export const updateTable = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    const { label, chairs, shape, status } = req.body;

    // Validate chairs if provided
    if (chairs !== undefined && (typeof chairs !== 'number' || chairs <= 0)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'chairs must be a positive number',
        },
      });
      return;
    }

    // Validate shape if provided
    if (shape && !['square', 'long', 'round'].includes(shape)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'shape must be one of: square, long, round',
        },
      });
      return;
    }

    // Validate status if provided
    if (status && !['available', 'running', 'reserved', 'maintenance'].includes(status)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'status must be one of: available, running, reserved, maintenance',
        },
      });
      return;
    }

    // Verify table belongs to tenant
    const existingTable = await prisma.table.findFirst({
      where: {
        id,
        floor: {
          branch: {
            businessOwnerId: tenantId,
          },
        },
      },
    });

    if (!existingTable) {
      res.status(404).json({
        success: false,
        error: {
          code: 'TABLE_NOT_FOUND',
          message: 'Table not found',
        },
      });
      return;
    }

    // Build update data
    const updateData: any = {};
    if (label !== undefined) updateData.label = label;
    if (chairs !== undefined) updateData.chairs = chairs;
    if (shape !== undefined) updateData.shape = shape as TableShape;
    if (status !== undefined) updateData.status = status as TableStatus;

    // Update table
    const table = await prisma.table.update({
      where: { id },
      data: updateData,
      include: {
        floor: {
          select: {
            id: true,
            name: true,
            branchId: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: transformTableResponse(table),
      message: 'Table updated successfully',
    });
  } catch (error) {
    console.error('Error updating table:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update table',
      },
    });
  }
};

// DELETE /api/v1/resources/tables/:id - Delete table
export const deleteTable = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    // Verify table belongs to tenant
    const existingTable = await prisma.table.findFirst({
      where: {
        id,
        floor: {
          branch: {
            businessOwnerId: tenantId,
          },
        },
      },
    });

    if (!existingTable) {
      res.status(404).json({
        success: false,
        error: {
          code: 'TABLE_NOT_FOUND',
          message: 'Table not found',
        },
      });
      return;
    }

    // Delete table (cascade deletes reservations and orders per Prisma schema)
    await prisma.table.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Table deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting table:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete table',
      },
    });
  }
};

// PATCH /api/v1/resources/tables/:id/status - Update table status only
export const updateTableStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    const { status } = req.body;

    // Validate status
    if (!status) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'status is required',
        },
      });
      return;
    }

    if (!['available', 'running', 'reserved', 'maintenance'].includes(status)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'status must be one of: available, running, reserved, maintenance',
        },
      });
      return;
    }

    // Verify table belongs to tenant
    const existingTable = await prisma.table.findFirst({
      where: {
        id,
        floor: {
          branch: {
            businessOwnerId: tenantId,
          },
        },
      },
    });

    if (!existingTable) {
      res.status(404).json({
        success: false,
        error: {
          code: 'TABLE_NOT_FOUND',
          message: 'Table not found',
        },
      });
      return;
    }

    // Update status only
    const table = await prisma.table.update({
      where: { id },
      data: { status: status as TableStatus },
      include: {
        floor: {
          select: {
            id: true,
            name: true,
            branchId: true,
          },
        },
      },
    });

    // Emit TABLE_STATUS_CHANGED WebSocket event
    try {
      const tablePayload: TableStatusChangedPayload = {
        tableId: table.id,
        tableName: table.label,
        status: table.status,
        previousStatus: existingTable.status,
        floorId: table.floor.id,
        floorName: table.floor.name,
        updatedAt: new Date().toISOString(),
      };
      connectionManager.broadcastToBranch(tenantId!, table.floor.branchId, WebSocketEventType.TABLE_STATUS_CHANGED, tablePayload);
    } catch (wsError) {
      console.error('Failed to emit TABLE_STATUS_CHANGED WebSocket event:', wsError);
    }

    res.status(200).json({
      success: true,
      data: transformTableResponse(table),
      message: 'Table status updated successfully',
    });
  } catch (error) {
    console.error('Error updating table status:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update table status',
      },
    });
  }
};
