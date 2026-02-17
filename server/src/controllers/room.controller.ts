import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../services/db.service';

// Helper function to transform room response
const transformRoomResponse = (room: any) => {
  return {
    id: room.id,
    branchId: room.branchId,
    name: room.name,
    capacity: room.capacity,
    hourlyRate: room.hourlyRate,
    status: room.status,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    branch: room.branch ? {
      id: room.branch.id,
      name: room.branch.name,
    } : undefined,
  };
};

// GET /api/v1/resources/branches/:branchId/rooms - List rooms for a branch
export const listRooms = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { branchId } = req.params;
    const tenantId = req.tenantId;
    const { status } = req.query;

    // Verify branch belongs to tenant
    const branch = await prisma.branch.findFirst({
      where: {
        id: branchId,
        businessOwnerId: tenantId,
      },
    });

    if (!branch) {
      res.status(404).json({
        success: false,
        error: {
          code: 'BRANCH_NOT_FOUND',
          message: 'Branch not found',
        },
      });
      return;
    }

    // Build where clause
    const where: any = {
      branchId: branchId,
    };

    if (status) {
      where.status = status;
    }

    // Fetch rooms
    const rooms = await prisma.room.findMany({
      where,
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

    res.status(200).json({
      success: true,
      data: rooms.map(transformRoomResponse),
    });
  } catch (error) {
    console.error('Error listing rooms:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch rooms',
      },
    });
  }
};

// POST /api/v1/resources/rooms - Create room
export const createRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId;
    const { branchId, name, capacity, hourlyRate, status } = req.body;

    // Validate required fields
    if (!branchId || !name || !capacity) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'branchId, name, and capacity are required',
        },
      });
      return;
    }

    // Validate capacity is a positive number
    if (typeof capacity !== 'number' || capacity <= 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'capacity must be a positive number',
        },
      });
      return;
    }

    // Verify branch belongs to tenant
    const branch = await prisma.branch.findFirst({
      where: {
        id: branchId,
        businessOwnerId: tenantId,
      },
    });

    if (!branch) {
      res.status(404).json({
        success: false,
        error: {
          code: 'BRANCH_NOT_FOUND',
          message: 'Branch not found',
        },
      });
      return;
    }

    // Create room
    const room = await prisma.room.create({
      data: {
        branchId,
        name,
        capacity,
        hourlyRate: hourlyRate !== undefined ? hourlyRate : undefined,
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

    res.status(201).json({
      success: true,
      data: transformRoomResponse(room),
      message: 'Room created successfully',
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create room',
      },
    });
  }
};

// PUT /api/v1/resources/rooms/:id - Update room
export const updateRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    const { name, capacity, hourlyRate, status } = req.body;

    // Validate capacity if provided
    if (capacity !== undefined && (typeof capacity !== 'number' || capacity <= 0)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'capacity must be a positive number',
        },
      });
      return;
    }

    // Verify room belongs to tenant
    const existingRoom = await prisma.room.findFirst({
      where: {
        id,
        branch: {
          businessOwnerId: tenantId,
        },
      },
    });

    if (!existingRoom) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ROOM_NOT_FOUND',
          message: 'Room not found',
        },
      });
      return;
    }

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (capacity !== undefined) updateData.capacity = capacity;
    if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate;
    if (status !== undefined) updateData.status = status;

    // Update room
    const room = await prisma.room.update({
      where: { id },
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

    res.status(200).json({
      success: true,
      data: transformRoomResponse(room),
      message: 'Room updated successfully',
    });
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update room',
      },
    });
  }
};

// DELETE /api/v1/resources/rooms/:id - Delete room
export const deleteRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    // Verify room belongs to tenant
    const existingRoom = await prisma.room.findFirst({
      where: {
        id,
        branch: {
          businessOwnerId: tenantId,
        },
      },
    });

    if (!existingRoom) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ROOM_NOT_FOUND',
          message: 'Room not found',
        },
      });
      return;
    }

    // Delete room (cascade deletes reservations per Prisma schema)
    await prisma.room.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Room deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete room',
      },
    });
  }
};
