import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { prisma } from '../services/db.service';
import { Role } from '@prisma/client';

/**
 * Role Info Interface
 */
interface RoleInfo {
  id: string;
  name: string;
  permissions: Record<string, unknown>;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Role Response with counts
 */
interface RoleResponse extends RoleInfo {
  staffCount: number;
}

/**
 * Role List Response
 */
interface RoleListResponse {
  roles: RoleResponse[];
  total: number;
}

/**
 * Role with relations type from Prisma
 */
type RoleWithCounts = Role & {
  _count: {
    staff: number;
  };
};

/**
 * GET /api/v1/resources/roles
 * List all roles for the authenticated tenant
 * Returns roles with staff count per role
 * Requires tenant middleware
 */
export async function listRoles(
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
          message: 'Tenant context is required to list roles',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Optional filter by status
    const { status } = req.query;

    // Build where clause
    const where: {
      businessOwnerId: string;
      status?: string;
    } = {
      businessOwnerId: tenantId,
    };

    if (status && typeof status === 'string') {
      where.status = status;
    }

    // Fetch roles with staff count
    const roles = await prisma.role.findMany({
      where,
      include: {
        _count: {
          select: {
            staff: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform roles to response format
    const roleResponses: RoleResponse[] = roles.map((role: RoleWithCounts) => ({
      id: role.id,
      name: role.name,
      permissions: role.permissions as Record<string, unknown>,
      status: role.status,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      staffCount: role._count.staff,
    }));

    const response: ApiResponse<RoleListResponse> = {
      success: true,
      data: {
        roles: roleResponses,
        total: roleResponses.length,
      },
      message: 'Roles retrieved successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error listing roles:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while fetching roles',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * GET /api/v1/resources/roles/:id
 * Get a single role by ID
 * Returns role with permissions and staff count
 * Requires tenant middleware
 */
export async function getRoleById(
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
          message: 'Tenant context is required to fetch role',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { id } = req.params;

    const role = await prisma.role.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
      include: {
        _count: {
          select: {
            staff: true,
          },
        },
      },
    });

    if (!role) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'ROLE_NOT_FOUND',
          message: 'Role not found or does not belong to your business',
        },
      };
      res.status(404).json(response);
      return;
    }

    const roleResponse: RoleResponse = {
      id: role.id,
      name: role.name,
      permissions: role.permissions as Record<string, unknown>,
      status: role.status,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      staffCount: role._count.staff,
    };

    const response: ApiResponse<RoleResponse> = {
      success: true,
      data: roleResponse,
      message: 'Role retrieved successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching role:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while fetching the role',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * POST /api/v1/resources/roles
 * Create a new role with permissions
 * Required: name, permissions (JSON object)
 * Permissions structure: { module: { action: boolean } }
 * Example: { products: { view: true, create: true, edit: false, delete: false } }
 * Requires tenant middleware
 */
export async function createRole(
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
          message: 'Tenant context is required to create a role',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Validate required fields
    const { name, permissions } = req.body;

    if (!name) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Role name is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    if (!permissions || typeof permissions !== 'object') {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Permissions object is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Optional status (default to 'active')
    const status = req.body.status || 'active';

    // Create role
    const role = await prisma.role.create({
      data: {
        businessOwnerId: tenantId,
        name,
        permissions,
        status,
      },
    });

    // Return created role
    const roleResponse: RoleInfo = {
      id: role.id,
      name: role.name,
      permissions: role.permissions as Record<string, unknown>,
      status: role.status,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };

    const response: ApiResponse<RoleInfo> = {
      success: true,
      data: roleResponse,
      message: 'Role created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating role:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while creating the role',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * PUT /api/v1/resources/roles/:id
 * Update an existing role
 * All fields optional except id
 * Requires tenant middleware
 */
export async function updateRole(
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
          message: 'Tenant context is required to update a role',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { id } = req.params;

    // Find role to ensure it exists and belongs to tenant
    const existingRole = await prisma.role.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
    });

    if (!existingRole) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'ROLE_NOT_FOUND',
          message: 'Role not found or does not belong to your business',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Extract fields from body (all optional)
    const { name, permissions, status } = req.body;

    // Build update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (name !== undefined) {
      updateData.name = name;
    }
    if (permissions !== undefined) {
      if (typeof permissions !== 'object') {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Permissions must be an object',
          },
        };
        res.status(400).json(response);
        return;
      }
      updateData.permissions = permissions;
    }
    if (status !== undefined) {
      updateData.status = status;
    }

    // Update role
    const updatedRole = await prisma.role.update({
      where: { id },
      data: updateData,
    });

    // Return updated role
    const roleResponse: RoleInfo = {
      id: updatedRole.id,
      name: updatedRole.name,
      permissions: updatedRole.permissions as Record<string, unknown>,
      status: updatedRole.status,
      createdAt: updatedRole.createdAt,
      updatedAt: updatedRole.updatedAt,
    };

    const response: ApiResponse<RoleInfo> = {
      success: true,
      data: roleResponse,
      message: 'Role updated successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating role:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while updating the role',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * DELETE /api/v1/resources/roles/:id
 * Delete a role
 * Prevents deletion if role has assigned staff
 * Requires tenant middleware
 */
export async function deleteRole(
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
          message: 'Tenant context is required to delete a role',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { id } = req.params;

    // Find role with staff count
    const role = await prisma.role.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
      include: {
        _count: {
          select: {
            staff: true,
          },
        },
      },
    });

    if (!role) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'ROLE_NOT_FOUND',
          message: 'Role not found or does not belong to your business',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Check if role has assigned staff
    if (role._count.staff > 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'ROLE_HAS_ASSIGNED_STAFF',
          message: `Cannot delete role. ${role._count.staff} staff member(s) are assigned to this role`,
        },
      };
      res.status(400).json(response);
      return;
    }

    // Delete role
    await prisma.role.delete({
      where: { id },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Role deleted successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error deleting role:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while deleting the role',
      },
    };
    res.status(500).json(response);
  }
}
