import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { prisma } from '../services/db.service';

/**
 * GET /api/v1/super-admin/menu-visibility
 * List all menu visibility config, optionally filtered by userType
 * Requires SuperAdmin authentication
 */
export async function listMenuVisibility(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { userType } = req.query;

    const whereClause: { userType?: string } = {};
    if (userType && typeof userType === 'string') {
      const validTypes = ['SuperAdmin', 'BusinessOwner', 'Staff'];
      if (!validTypes.includes(userType)) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'userType must be one of: SuperAdmin, BusinessOwner, Staff',
          },
        };
        res.status(400).json(response);
        return;
      }
      whereClause.userType = userType;
    }

    const items = await prisma.menuVisibility.findMany({
      where: whereClause,
      orderBy: [{ userType: 'asc' }, { menuKey: 'asc' }],
    });

    const response: ApiResponse = {
      success: true,
      data: { items, total: items.length },
      message: 'Menu visibility config retrieved successfully',
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching menu visibility:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching menu visibility config',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * PUT /api/v1/super-admin/menu-visibility
 * Bulk upsert menu visibility config
 * Requires SuperAdmin authentication
 * Body: { items: [{ userType, menuKey, isVisible }] }
 */
export async function updateMenuVisibility(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'items must be a non-empty array',
        },
      };
      res.status(400).json(response);
      return;
    }

    const validTypes = ['SuperAdmin', 'BusinessOwner', 'Staff'];

    for (const item of items) {
      if (!item.userType || !item.menuKey || typeof item.isVisible !== 'boolean') {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Each item must have userType (string), menuKey (string), and isVisible (boolean)',
          },
        };
        res.status(400).json(response);
        return;
      }
      if (!validTypes.includes(item.userType)) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Invalid userType: ${item.userType}. Must be one of: SuperAdmin, BusinessOwner, Staff`,
          },
        };
        res.status(400).json(response);
        return;
      }
    }

    // Bulk upsert using transactions
    const results = await prisma.$transaction(
      items.map((item: { userType: string; menuKey: string; isVisible: boolean }) =>
        prisma.menuVisibility.upsert({
          where: {
            userType_menuKey: {
              userType: item.userType,
              menuKey: item.menuKey,
            },
          },
          update: { isVisible: item.isVisible },
          create: {
            userType: item.userType,
            menuKey: item.menuKey,
            isVisible: item.isVisible,
          },
        })
      )
    );

    const response: ApiResponse = {
      success: true,
      data: { items: results, total: results.length },
      message: 'Menu visibility config updated successfully',
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating menu visibility:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while updating menu visibility config',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * GET /api/v1/auth/menu-visibility
 * Returns visible menu keys for the current user's type
 * Requires authentication (any user type)
 */
export async function getMyMenuVisibility(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const userType = req.user?.userType;

    if (!userType) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User type not found in authentication token',
        },
      };
      res.status(401).json(response);
      return;
    }

    const visibleItems = await prisma.menuVisibility.findMany({
      where: {
        userType,
        isVisible: true,
      },
      select: {
        menuKey: true,
      },
    });

    const visibleMenuKeys = visibleItems.map((item) => item.menuKey);

    const response: ApiResponse<{ visibleMenuKeys: string[] }> = {
      success: true,
      data: { visibleMenuKeys },
      message: 'Menu visibility retrieved successfully',
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching user menu visibility:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching menu visibility',
      },
    };
    res.status(500).json(response);
  }
}
