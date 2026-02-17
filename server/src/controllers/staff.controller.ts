import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { prisma } from '../services/db.service';
import { hashPassword } from '../utils/password';

/**
 * Staff Info Interface
 */
interface StaffInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  status: string;
  branchId: string;
  branchName: string;
  roleId: string;
  roleName: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Staff List Response with pagination
 */
interface StaffListResponse {
  staff: StaffInfo[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * GET /api/v1/resources/staff
 * List all staff members for the authenticated tenant
 * Returns paginated staff with branch name and role name
 * Supports filtering by branchId, roleId, status
 * Requires tenant middleware
 */
export async function listStaff(
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
          message: 'Tenant context is required to list staff',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Extract filters from query
    const { branchId, roleId, status, page, limit } = req.query;

    // Pagination parameters
    const currentPage = page && typeof page === 'string' ? parseInt(page, 10) : 1;
    const pageSize = limit && typeof limit === 'string' ? parseInt(limit, 10) : 10;
    const skip = (currentPage - 1) * pageSize;

    // Build where clause
    const where: Prisma.StaffWhereInput = {
      businessOwnerId: tenantId,
    };

    // Apply branch scope filter
    if (req.branchScope !== null && req.branchScope !== undefined) {
      if (branchId && typeof branchId === 'string') {
        if (!req.branchScope.includes(branchId)) {
          const response: ApiResponse = {
            success: false,
            error: {
              code: 'BRANCH_ACCESS_DENIED',
              message: 'You do not have access to this branch',
            },
          };
          res.status(403).json(response);
          return;
        }
        where.branchId = branchId;
      } else {
        where.branchId = { in: req.branchScope };
      }
    } else if (branchId && typeof branchId === 'string') {
      where.branchId = branchId;
    }

    if (roleId && typeof roleId === 'string') {
      where.roleId = roleId;
    }

    if (status && typeof status === 'string') {
      where.status = status;
    }

    // Fetch total count
    const total = await prisma.staff.count({ where });

    // Fetch staff with branch and role details
    const staffList = await prisma.staff.findMany({
      where,
      include: {
        branch: {
          select: {
            name: true,
          },
        },
        role: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: pageSize,
    });

    // Transform staff to response format
    const staffResponses: StaffInfo[] = staffList.map((staff) => ({
      id: staff.id,
      firstName: staff.firstName,
      lastName: staff.lastName,
      email: staff.email,
      phone: staff.phone,
      avatar: staff.avatar,
      status: staff.status,
      branchId: staff.branchId,
      branchName: staff.branch.name,
      roleId: staff.roleId,
      roleName: staff.role.name,
      createdAt: staff.createdAt,
      updatedAt: staff.updatedAt,
    }));

    // Calculate total pages
    const totalPages = Math.ceil(total / pageSize);

    const response: ApiResponse<StaffListResponse> = {
      success: true,
      data: {
        staff: staffResponses,
        total,
        page: currentPage,
        limit: pageSize,
        totalPages,
      },
      message: 'Staff retrieved successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error listing staff:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while fetching staff',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * POST /api/v1/resources/staff
 * Create a new staff member
 * Required: branchId, roleId, firstName, lastName, email, password
 * Hashes password before storing
 * Checks unique email within tenant
 * Returns created staff (without password)
 * Requires tenant middleware
 */
export async function createStaff(
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
          message: 'Tenant context is required to create staff',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Extract required fields from request body
    const { branchId, roleId, firstName, lastName, email, password, phone, avatar, status } = req.body;

    // Validate required fields
    if (!branchId || !roleId || !firstName || !lastName || !email || !password) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'branchId, roleId, firstName, lastName, email, and password are required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Check if email is unique within tenant
    const existingStaff = await prisma.staff.findFirst({
      where: {
        businessOwnerId: tenantId,
        email,
      },
    });

    if (existingStaff) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'A staff member with this email already exists',
        },
      };
      res.status(409).json(response);
      return;
    }

    // Verify that branchId and roleId belong to this tenant
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
          code: 'INVALID_BRANCH',
          message: 'Branch not found or does not belong to this business',
        },
      };
      res.status(400).json(response);
      return;
    }

    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        businessOwnerId: tenantId,
      },
    });

    if (!role) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_ROLE',
          message: 'Role not found or does not belong to this business',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Hash password before storing
    const hashedPassword = await hashPassword(password);

    // Create staff member
    const staff = await prisma.staff.create({
      data: {
        businessOwnerId: tenantId,
        branchId,
        roleId,
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone: phone || null,
        avatar: avatar || null,
        status: status || 'active',
      },
      include: {
        branch: {
          select: {
            name: true,
          },
        },
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    // Transform staff to response format (exclude password)
    const staffResponse: StaffInfo = {
      id: staff.id,
      firstName: staff.firstName,
      lastName: staff.lastName,
      email: staff.email,
      phone: staff.phone,
      avatar: staff.avatar,
      status: staff.status,
      branchId: staff.branchId,
      branchName: staff.branch.name,
      roleId: staff.roleId,
      roleName: staff.role.name,
      createdAt: staff.createdAt,
      updatedAt: staff.updatedAt,
    };

    const response: ApiResponse<StaffInfo> = {
      success: true,
      data: staffResponse,
      message: 'Staff member created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating staff:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while creating staff member',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * PUT /api/v1/resources/staff/:id
 * Update an existing staff member
 * All fields optional except id
 * If password provided, hash it
 * Returns updated staff (without password)
 * Requires tenant middleware
 */
export async function updateStaff(
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
          message: 'Tenant context is required to update staff',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { id } = req.params;

    // Check if staff exists and belongs to tenant
    const existingStaff = await prisma.staff.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
    });

    if (!existingStaff) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'STAFF_NOT_FOUND',
          message: 'Staff member not found or does not belong to this business',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Extract update fields from request body
    const { branchId, roleId, firstName, lastName, email, password, phone, avatar, status } = req.body;

    // If email is being changed, check uniqueness
    if (email && email !== existingStaff.email) {
      const duplicateStaff = await prisma.staff.findFirst({
        where: {
          businessOwnerId: tenantId,
          email,
          id: {
            not: id,
          },
        },
      });

      if (duplicateStaff) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            message: 'A staff member with this email already exists',
          },
        };
        res.status(409).json(response);
        return;
      }
    }

    // If branchId is being changed, verify it belongs to tenant
    if (branchId && branchId !== existingStaff.branchId) {
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
            code: 'INVALID_BRANCH',
            message: 'Branch not found or does not belong to this business',
          },
        };
        res.status(400).json(response);
        return;
      }
    }

    // If roleId is being changed, verify it belongs to tenant
    if (roleId && roleId !== existingStaff.roleId) {
      const role = await prisma.role.findFirst({
        where: {
          id: roleId,
          businessOwnerId: tenantId,
        },
      });

      if (!role) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'INVALID_ROLE',
            message: 'Role not found or does not belong to this business',
          },
        };
        res.status(400).json(response);
        return;
      }
    }

    // Build update data object
    const updateData: {
      branchId?: string;
      roleId?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      password?: string;
      phone?: string | null;
      avatar?: string | null;
      status?: string;
    } = {};

    if (branchId) updateData.branchId = branchId;
    if (roleId) updateData.roleId = roleId;
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone || null;
    if (avatar !== undefined) updateData.avatar = avatar || null;
    if (status) updateData.status = status;

    // If password is provided, hash it
    if (password) {
      updateData.password = await hashPassword(password);
    }

    // Update staff member
    const staff = await prisma.staff.update({
      where: {
        id,
      },
      data: updateData,
      include: {
        branch: {
          select: {
            name: true,
          },
        },
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    // Transform staff to response format (exclude password)
    const staffResponse: StaffInfo = {
      id: staff.id,
      firstName: staff.firstName,
      lastName: staff.lastName,
      email: staff.email,
      phone: staff.phone,
      avatar: staff.avatar,
      status: staff.status,
      branchId: staff.branchId,
      branchName: staff.branch.name,
      roleId: staff.roleId,
      roleName: staff.role.name,
      createdAt: staff.createdAt,
      updatedAt: staff.updatedAt,
    };

    const response: ApiResponse<StaffInfo> = {
      success: true,
      data: staffResponse,
      message: 'Staff member updated successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating staff:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while updating staff member',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * DELETE /api/v1/resources/staff/:id
 * Delete a staff member
 * Returns 404 if staff not found or doesn't belong to tenant
 * Requires tenant middleware
 */
export async function deleteStaff(
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
          message: 'Tenant context is required to delete staff',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { id } = req.params;

    // Check if staff exists and belongs to tenant
    const existingStaff = await prisma.staff.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
    });

    if (!existingStaff) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'STAFF_NOT_FOUND',
          message: 'Staff member not found or does not belong to this business',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Delete staff member
    await prisma.staff.delete({
      where: {
        id,
      },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Staff member deleted successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error deleting staff:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while deleting staff member',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * GET /api/v1/resources/staff/:id
 * Get a single staff member by ID
 * Returns staff with branch and role details
 * Requires tenant middleware
 */
export async function getStaffMember(
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
          message: 'Tenant context is required to fetch staff member',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { id } = req.params;

    const staff = await prisma.staff.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
      include: {
        branch: {
          select: {
            name: true,
          },
        },
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!staff) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'STAFF_NOT_FOUND',
          message: 'Staff member not found or does not belong to this business',
        },
      };
      res.status(404).json(response);
      return;
    }

    const staffResponse: StaffInfo = {
      id: staff.id,
      firstName: staff.firstName,
      lastName: staff.lastName,
      email: staff.email,
      phone: staff.phone,
      avatar: staff.avatar,
      status: staff.status,
      branchId: staff.branchId,
      branchName: staff.branch.name,
      roleId: staff.roleId,
      roleName: staff.role.name,
      createdAt: staff.createdAt,
      updatedAt: staff.updatedAt,
    };

    const response: ApiResponse<StaffInfo> = {
      success: true,
      data: staffResponse,
      message: 'Staff member retrieved successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching staff member:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while fetching staff member',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * PATCH /api/v1/resources/staff/:id/status
 * Update staff status only
 * Accepts status value ('active', 'inactive', etc.)
 * Returns updated staff
 * Requires tenant middleware
 */
export async function updateStaffStatus(
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
          message: 'Tenant context is required to update staff status',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { id } = req.params;
    const { status } = req.body;

    // Validate status is provided
    if (!status) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_STATUS',
          message: 'Status is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Check if staff exists and belongs to tenant
    const existingStaff = await prisma.staff.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
    });

    if (!existingStaff) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'STAFF_NOT_FOUND',
          message: 'Staff member not found or does not belong to this business',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Update staff status
    const staff = await prisma.staff.update({
      where: {
        id,
      },
      data: {
        status,
      },
      include: {
        branch: {
          select: {
            name: true,
          },
        },
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    // Transform staff to response format (exclude password)
    const staffResponse: StaffInfo = {
      id: staff.id,
      firstName: staff.firstName,
      lastName: staff.lastName,
      email: staff.email,
      phone: staff.phone,
      avatar: staff.avatar,
      status: staff.status,
      branchId: staff.branchId,
      branchName: staff.branch.name,
      roleId: staff.roleId,
      roleName: staff.role.name,
      createdAt: staff.createdAt,
      updatedAt: staff.updatedAt,
    };

    const response: ApiResponse<StaffInfo> = {
      success: true,
      data: staffResponse,
      message: 'Staff status updated successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating staff status:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while updating staff status',
      },
    };
    res.status(500).json(response);
  }
}
