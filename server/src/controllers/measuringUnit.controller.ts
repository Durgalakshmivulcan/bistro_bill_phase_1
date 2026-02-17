import { Request, Response } from 'express';
import { ApiResponse } from '../types';
import { prisma } from '../services/db.service';

interface MeasuringUnitResponse {
  id: string;
  quantity: string;
  unit: string;
  symbol: string;
  createdAt: Date;
}

/**
 * GET /api/v1/catalog/measuring-units
 * List all measuring units (global, not tenant-specific)
 */
export async function listMeasuringUnits(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const units = await prisma.measuringUnit.findMany({
      orderBy: [{ quantity: 'asc' }],
    });

    const unitResponses: MeasuringUnitResponse[] = units.map((u) => ({
      id: u.id,
      quantity: u.quantity,
      unit: u.unit,
      symbol: u.symbol,
      createdAt: u.createdAt,
    }));

    const response: ApiResponse<{ measuringUnits: MeasuringUnitResponse[]; total: number }> = {
      success: true,
      data: {
        measuringUnits: unitResponses,
        total: unitResponses.length,
      },
      message: 'Measuring units retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error listing measuring units:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve measuring units',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * POST /api/v1/super-admin/measuring-units
 * Create a new measuring unit (SuperAdmin only)
 */
export async function createMeasuringUnit(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { quantity, unit, symbol } = req.body;

    if (!quantity || typeof quantity !== 'string' || quantity.trim() === '') {
      const response: ApiResponse = {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Quantity name is required' },
      };
      res.status(400).json(response);
      return;
    }

    if (!unit || typeof unit !== 'string' || unit.trim() === '') {
      const response: ApiResponse = {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Unit is required' },
      };
      res.status(400).json(response);
      return;
    }

    if (!symbol || typeof symbol !== 'string' || symbol.trim() === '') {
      const response: ApiResponse = {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Symbol is required' },
      };
      res.status(400).json(response);
      return;
    }

    // Check for duplicate unit name
    const existing = await prisma.measuringUnit.findFirst({
      where: {
        unit: { equals: unit.trim(), mode: 'insensitive' },
      },
    });

    if (existing) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'DUPLICATE_UNIT', message: 'A measuring unit with this name already exists' },
      };
      res.status(409).json(response);
      return;
    }

    const created = await prisma.measuringUnit.create({
      data: {
        quantity: quantity.trim(),
        unit: unit.trim(),
        symbol: symbol.trim(),
      },
    });

    const response: ApiResponse<{ measuringUnit: MeasuringUnitResponse }> = {
      success: true,
      data: {
        measuringUnit: {
          id: created.id,
          quantity: created.quantity,
          unit: created.unit,
          symbol: created.symbol,
          createdAt: created.createdAt,
        },
      },
      message: 'Measuring unit created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating measuring unit:', error);
    const response: ApiResponse = {
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create measuring unit' },
    };
    res.status(500).json(response);
  }
}

/**
 * PUT /api/v1/super-admin/measuring-units/:id
 * Update an existing measuring unit (SuperAdmin only)
 */
export async function updateMeasuringUnit(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    const existing = await prisma.measuringUnit.findUnique({ where: { id } });
    if (!existing) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Measuring unit not found' },
      };
      res.status(404).json(response);
      return;
    }

    const { quantity, unit, symbol } = req.body;

    // Check duplicate if unit name changed
    if (unit !== undefined) {
      if (typeof unit !== 'string' || unit.trim() === '') {
        const response: ApiResponse = {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Unit must be a non-empty string' },
        };
        res.status(400).json(response);
        return;
      }

      const duplicate = await prisma.measuringUnit.findFirst({
        where: {
          unit: { equals: unit.trim(), mode: 'insensitive' },
          id: { not: id },
        },
      });

      if (duplicate) {
        const response: ApiResponse = {
          success: false,
          error: { code: 'DUPLICATE_UNIT', message: 'A measuring unit with this name already exists' },
        };
        res.status(409).json(response);
        return;
      }
    }

    const updateData: Record<string, string> = {};
    if (quantity !== undefined) updateData.quantity = quantity.trim();
    if (unit !== undefined) updateData.unit = unit.trim();
    if (symbol !== undefined) updateData.symbol = symbol.trim();

    const updated = await prisma.measuringUnit.update({
      where: { id },
      data: updateData,
    });

    const response: ApiResponse<{ measuringUnit: MeasuringUnitResponse }> = {
      success: true,
      data: {
        measuringUnit: {
          id: updated.id,
          quantity: updated.quantity,
          unit: updated.unit,
          symbol: updated.symbol,
          createdAt: updated.createdAt,
        },
      },
      message: 'Measuring unit updated successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating measuring unit:', error);
    const response: ApiResponse = {
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update measuring unit' },
    };
    res.status(500).json(response);
  }
}

/**
 * DELETE /api/v1/super-admin/measuring-units/:id
 * Delete a measuring unit (SuperAdmin only)
 */
export async function deleteMeasuringUnit(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    const existing = await prisma.measuringUnit.findUnique({ where: { id } });
    if (!existing) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Measuring unit not found' },
      };
      res.status(404).json(response);
      return;
    }

    await prisma.measuringUnit.delete({ where: { id } });

    const response: ApiResponse = {
      success: true,
      message: 'Measuring unit deleted successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting measuring unit:', error);
    const response: ApiResponse = {
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete measuring unit' },
    };
    res.status(500).json(response);
  }
}
