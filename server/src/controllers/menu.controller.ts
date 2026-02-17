import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { prisma } from '../services/db.service';

/**
 * Menu Response Interface
 */
interface MenuResponse {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  productCount: number;
}

/**
 * Menu List Response
 */
interface MenuListResponse {
  menus: MenuResponse[];
  total: number;
}

/**
 * GET /api/v1/catalog/menus
 * List all menus for the authenticated tenant
 * Requires tenant middleware
 */
export async function listMenus(
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
          message: 'Tenant context is required to list menus',
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

    // Fetch menus with product count
    const menus = await prisma.menu.findMany({
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
    const menuResponses: MenuResponse[] = menus.map((menu) => ({
      id: menu.id,
      name: menu.name,
      description: menu.description,
      status: menu.status,
      createdAt: menu.createdAt,
      updatedAt: menu.updatedAt,
      productCount: menu._count.products,
    }));

    const response: ApiResponse<MenuListResponse> = {
      success: true,
      data: {
        menus: menuResponses,
        total: menuResponses.length,
      },
      message: 'Menus retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error listing menus:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve menus',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * POST /api/v1/catalog/menus
 * Create a new menu for the authenticated tenant
 * Requires tenant middleware
 */
export async function createMenu(
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
          message: 'Tenant context is required to create a menu',
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

    // Create menu
    const menu = await prisma.menu.create({
      data: {
        businessOwnerId: tenantId,
        name: name.trim(),
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
    const menuResponse: MenuResponse = {
      id: menu.id,
      name: menu.name,
      description: menu.description,
      status: menu.status,
      createdAt: menu.createdAt,
      updatedAt: menu.updatedAt,
      productCount: menu._count.products,
    };

    const response: ApiResponse<{ menu: MenuResponse }> = {
      success: true,
      data: {
        menu: menuResponse,
      },
      message: 'Menu created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating menu:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create menu',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * PUT /api/v1/catalog/menus/:id
 * Update an existing menu for the authenticated tenant
 * Requires tenant middleware
 */
export async function updateMenu(
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
          message: 'Tenant context is required to update a menu',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Get menu ID from path params
    const { id } = req.params;

    if (!id) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Menu ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Find existing menu (ensure it belongs to the tenant)
    const existingMenu = await prisma.menu.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
    });

    if (!existingMenu) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Menu not found',
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

    // Update menu
    const updatedMenu = await prisma.menu.update({
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

    // Transform to response format
    const menuResponse: MenuResponse = {
      id: updatedMenu.id,
      name: updatedMenu.name,
      description: updatedMenu.description,
      status: updatedMenu.status,
      createdAt: updatedMenu.createdAt,
      updatedAt: updatedMenu.updatedAt,
      productCount: updatedMenu._count.products,
    };

    const response: ApiResponse<{ menu: MenuResponse }> = {
      success: true,
      data: {
        menu: menuResponse,
      },
      message: 'Menu updated successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating menu:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update menu',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * DELETE /api/v1/catalog/menus/:id
 * Delete a menu for the authenticated tenant
 * Requires tenant middleware
 * Note: Deletion does NOT delete associated products, just removes the menu reference
 */
export async function deleteMenu(
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
          message: 'Tenant context is required to delete a menu',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Get menu ID from path params
    const { id } = req.params;

    if (!id) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Menu ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Find existing menu (ensure it belongs to the tenant)
    const existingMenu = await prisma.menu.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!existingMenu) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Menu not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Delete menu from database
    // Note: Products with this menuId will have their menuId set to NULL (SetNull on delete)
    await prisma.menu.delete({
      where: { id },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Menu deleted successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting menu:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete menu',
      },
    };
    res.status(500).json(response);
  }
}
