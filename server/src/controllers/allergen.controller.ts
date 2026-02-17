import { Request, Response } from 'express';
import { ApiResponse } from '../types';
import { prisma } from '../services/db.service';

/**
 * Allergen Response Interface
 */
interface AllergenResponse {
  id: string;
  name: string;
  icon: string | null;
  createdAt: Date;
  productCount: number;
}

/**
 * Allergen List Response
 */
interface AllergenListResponse {
  allergens: AllergenResponse[];
  total: number;
}

/**
 * GET /api/v1/catalog/allergens
 * List all allergens (global, not tenant-specific)
 * Any authenticated user can access this endpoint
 */
export async function listAllergens(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    // Fetch all allergens with product count
    const allergens = await prisma.allergen.findMany({
      include: {
        _count: {
          select: {
            productAllergens: true,
          },
        },
      },
      orderBy: [
        { name: 'asc' },
      ],
    });

    // Transform to response format
    const allergenResponses: AllergenResponse[] = allergens.map((allergen) => ({
      id: allergen.id,
      name: allergen.name,
      icon: allergen.icon,
      createdAt: allergen.createdAt,
      productCount: allergen._count.productAllergens,
    }));

    const response: ApiResponse<AllergenListResponse> = {
      success: true,
      data: {
        allergens: allergenResponses,
        total: allergenResponses.length,
      },
      message: 'Allergens retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error listing allergens:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve allergens',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * POST /api/v1/super-admin/allergens
 * Create a new allergen (SuperAdmin only)
 */
export async function createAllergen(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Extract fields from body
    const { name, icon } = req.body;

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

    // Check if allergen with same name already exists
    const existingAllergen = await prisma.allergen.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive',
        },
      },
    });

    if (existingAllergen) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'DUPLICATE_ALLERGEN',
          message: 'An allergen with this name already exists',
        },
      };
      res.status(409).json(response);
      return;
    }

    // Create allergen
    const allergen = await prisma.allergen.create({
      data: {
        name: name.trim(),
        icon: icon?.trim() || null,
      },
      include: {
        _count: {
          select: {
            productAllergens: true,
          },
        },
      },
    });

    // Transform to response format
    const allergenResponse: AllergenResponse = {
      id: allergen.id,
      name: allergen.name,
      icon: allergen.icon,
      createdAt: allergen.createdAt,
      productCount: allergen._count.productAllergens,
    };

    const response: ApiResponse<{ allergen: AllergenResponse }> = {
      success: true,
      data: {
        allergen: allergenResponse,
      },
      message: 'Allergen created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating allergen:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create allergen',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * PUT /api/v1/super-admin/allergens/:id
 * Update an existing allergen (SuperAdmin only)
 */
export async function updateAllergen(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Get allergen ID from path params
    const { id } = req.params;

    if (!id) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Allergen ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Find existing allergen
    const existingAllergen = await prisma.allergen.findUnique({
      where: { id },
    });

    if (!existingAllergen) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Allergen not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Extract fields from body
    const { name, icon } = req.body;

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

    // Check if another allergen with the same name exists (excluding current)
    if (name !== undefined) {
      const duplicateAllergen = await prisma.allergen.findFirst({
        where: {
          name: {
            equals: name.trim(),
            mode: 'insensitive',
          },
          id: {
            not: id,
          },
        },
      });

      if (duplicateAllergen) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'DUPLICATE_ALLERGEN',
            message: 'An allergen with this name already exists',
          },
        };
        res.status(409).json(response);
        return;
      }
    }

    // Build update data
    interface UpdateData {
      name?: string;
      icon?: string | null;
    }
    const updateData: UpdateData = {};

    if (name !== undefined) {
      updateData.name = name.trim();
    }

    if (icon !== undefined) {
      updateData.icon = icon?.trim() || null;
    }

    // Update allergen
    const updatedAllergen = await prisma.allergen.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            productAllergens: true,
          },
        },
      },
    });

    // Transform to response format
    const allergenResponse: AllergenResponse = {
      id: updatedAllergen.id,
      name: updatedAllergen.name,
      icon: updatedAllergen.icon,
      createdAt: updatedAllergen.createdAt,
      productCount: updatedAllergen._count.productAllergens,
    };

    const response: ApiResponse<{ allergen: AllergenResponse }> = {
      success: true,
      data: {
        allergen: allergenResponse,
      },
      message: 'Allergen updated successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating allergen:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update allergen',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * DELETE /api/v1/super-admin/allergens/:id
 * Delete an allergen (SuperAdmin only)
 * Note: Deleting an allergen also removes it from all products (cascade delete on ProductAllergen)
 */
export async function deleteAllergen(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Get allergen ID from path params
    const { id } = req.params;

    if (!id) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Allergen ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Find existing allergen
    const existingAllergen = await prisma.allergen.findUnique({
      where: { id },
    });

    if (!existingAllergen) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Allergen not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Delete allergen from database
    // Note: ProductAllergen associations will be automatically deleted (Cascade on delete)
    await prisma.allergen.delete({
      where: { id },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Allergen deleted successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting allergen:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete allergen',
      },
    };
    res.status(500).json(response);
  }
}
