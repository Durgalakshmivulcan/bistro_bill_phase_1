import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { prisma } from '../services/db.service';
import { Prisma, Branch, BusinessHours } from '@prisma/client';
import crypto from 'crypto';

/**
 * Business Hours Info Interface
 */
interface BusinessHoursInfo {
  id: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

/**
 * Day names for validation and response messages
 */
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Branch Info Interface
 */
interface BranchInfo {
  id: string;
  name: string;
  code: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zipCode: string | null;
  isMainBranch: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Branch Response with counts
 */
interface BranchResponse extends BranchInfo {
  staffCount: number;
  tableCount: number;
  kitchenCount: number;
}

/**
 * Branch List Response
 */
interface BranchListResponse {
  branches: BranchResponse[];
  total: number;
}

/**
 * Branch with relations type from Prisma
 */
type BranchWithCounts = Branch & {
  _count: {
    staff: number;
    kitchens: number;
  };
  floors: Array<{
    _count: {
      tables: number;
    };
  }>;
};

/**
 * GET /api/v1/resources/branches
 * List all branches for the authenticated tenant
 * Returns branches with staff count, table count, and kitchen count
 * Requires tenant middleware
 */
export async function listBranches(
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
          message: 'Tenant context is required to list branches',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Parse query parameters
    const { status } = req.query;

    // Build where clause
    const whereClause: Prisma.BranchWhereInput = {
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

    // Fetch branches with counts
    const branches = await prisma.branch.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            staff: true,
            kitchens: true,
          },
        },
        floors: {
          select: {
            _count: {
              select: {
                tables: true,
              },
            },
          },
        },
      },
      orderBy: [
        { isMainBranch: 'desc' }, // Main branch first
        { name: 'asc' },
      ],
    });

    // Transform to response format
    const branchResponses: BranchResponse[] = branches.map((branch: BranchWithCounts) => {
      // Calculate total table count across all floors
      const tableCount = branch.floors.reduce((total, floor) => total + floor._count.tables, 0);

      return {
        id: branch.id,
        name: branch.name,
        code: branch.code,
        phone: branch.phone,
        email: branch.email,
        address: branch.address,
        city: branch.city,
        state: branch.state,
        country: branch.country,
        zipCode: branch.zipCode,
        isMainBranch: branch.isMainBranch,
        status: branch.status,
        createdAt: branch.createdAt,
        updatedAt: branch.updatedAt,
        staffCount: branch._count.staff,
        tableCount,
        kitchenCount: branch._count.kitchens,
      };
    });

    const response: ApiResponse<BranchListResponse> = {
      success: true,
      data: {
        branches: branchResponses,
        total: branchResponses.length,
      },
      message: 'Branches retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error listing branches:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve branches',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Generate a unique branch code in format BR-XXXX
 * @returns A random 4-character uppercase alphanumeric code with BR- prefix
 */
function generateBranchCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  const randomBytes = crypto.randomBytes(4);
  for (let i = 0; i < 4; i++) {
    code += chars[randomBytes[i] % chars.length];
  }
  return `BR-${code}`;
}

/**
 * POST /api/v1/resources/branches
 * Create a new branch for the authenticated tenant
 * Checks subscription plan maxBranches limit
 * Required: name, address
 * Returns 403 if branch limit reached
 */
export async function createBranch(
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
          message: 'Tenant context is required to create a branch',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Validate required fields
    const { name, address, phone, email, city, state, country, zipCode, status } = req.body;

    const missingFields: string[] = [];
    if (!name || typeof name !== 'string' || !name.trim()) {
      missingFields.push('name');
    }
    if (!address || typeof address !== 'string' || !address.trim()) {
      missingFields.push('address');
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

    // Get business owner with subscription plan and current branch count
    const businessOwner = await prisma.businessOwner.findUnique({
      where: { id: tenantId },
      include: {
        plan: true,
        _count: {
          select: {
            branches: true,
          },
        },
      },
    });

    if (!businessOwner) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Business owner not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Check branch limit from subscription plan
    const currentBranchCount = businessOwner._count.branches;
    const maxBranches = businessOwner.plan?.maxBranches ?? 1; // Default to 1 if no plan

    if (currentBranchCount >= maxBranches) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'BRANCH_LIMIT_REACHED',
          message: `Your subscription plan allows a maximum of ${maxBranches} branch${maxBranches > 1 ? 'es' : ''}. You currently have ${currentBranchCount}. Please upgrade your plan to add more branches.`,
        },
      };
      res.status(403).json(response);
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

    // Generate unique branch code
    let branchCode = generateBranchCode();
    let codeIsUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!codeIsUnique && attempts < maxAttempts) {
      const existingBranch = await prisma.branch.findUnique({
        where: {
          businessOwnerId_code: {
            businessOwnerId: tenantId,
            code: branchCode,
          },
        },
      });
      if (!existingBranch) {
        codeIsUnique = true;
      } else {
        branchCode = generateBranchCode();
        attempts++;
      }
    }

    if (!codeIsUnique) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'CODE_GENERATION_FAILED',
          message: 'Failed to generate a unique branch code. Please try again.',
        },
      };
      res.status(500).json(response);
      return;
    }

    // Create the branch
    const newBranch = await prisma.branch.create({
      data: {
        businessOwnerId: tenantId,
        name: name.trim(),
        code: branchCode,
        address: address.trim(),
        phone: phone?.trim() || null,
        email: email?.trim().toLowerCase() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        country: country?.trim() || null,
        zipCode: zipCode?.trim() || null,
        isMainBranch: false, // New branches are never main branches
        status: status || 'active',
      },
    });

    // Transform to response format with counts (all zero for new branch)
    const branchResponse: BranchResponse = {
      id: newBranch.id,
      name: newBranch.name,
      code: newBranch.code,
      phone: newBranch.phone,
      email: newBranch.email,
      address: newBranch.address,
      city: newBranch.city,
      state: newBranch.state,
      country: newBranch.country,
      zipCode: newBranch.zipCode,
      isMainBranch: newBranch.isMainBranch,
      status: newBranch.status,
      createdAt: newBranch.createdAt,
      updatedAt: newBranch.updatedAt,
      staffCount: 0,
      tableCount: 0,
      kitchenCount: 0,
    };

    const response: ApiResponse<{ branch: BranchResponse }> = {
      success: true,
      data: {
        branch: branchResponse,
      },
      message: 'Branch created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating branch:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create branch',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * PUT /api/v1/resources/branches/:id
 * Update branch details
 * All fields optional except id
 * Cannot change isMainBranch flag
 * Returns updated branch
 */
export async function updateBranch(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;
    const branchId = req.params.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to update a branch',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Check if branch exists and belongs to tenant
    const existingBranch = await prisma.branch.findFirst({
      where: {
        id: branchId,
        businessOwnerId: tenantId,
      },
      include: {
        _count: {
          select: {
            staff: true,
            kitchens: true,
          },
        },
        floors: {
          select: {
            _count: {
              select: {
                tables: true,
              },
            },
          },
        },
      },
    });

    if (!existingBranch) {
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

    // Build update data from request body
    const { name, address, phone, email, city, state, country, zipCode, status } = req.body;

    const updateData: Prisma.BranchUpdateInput = {};

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

    if (address !== undefined) {
      if (typeof address !== 'string' || !address.trim()) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Address must be a non-empty string',
          },
        };
        res.status(400).json(response);
        return;
      }
      updateData.address = address.trim();
    }

    if (phone !== undefined) {
      updateData.phone = phone?.trim() || null;
    }

    if (email !== undefined) {
      updateData.email = email?.trim().toLowerCase() || null;
    }

    if (city !== undefined) {
      updateData.city = city?.trim() || null;
    }

    if (state !== undefined) {
      updateData.state = state?.trim() || null;
    }

    if (country !== undefined) {
      updateData.country = country?.trim() || null;
    }

    if (zipCode !== undefined) {
      updateData.zipCode = zipCode?.trim() || null;
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

    // Update the branch
    const updatedBranch = await prisma.branch.update({
      where: { id: branchId },
      data: updateData,
      include: {
        _count: {
          select: {
            staff: true,
            kitchens: true,
          },
        },
        floors: {
          select: {
            _count: {
              select: {
                tables: true,
              },
            },
          },
        },
      },
    });

    // Calculate total table count across all floors
    const tableCount = (updatedBranch as BranchWithCounts).floors.reduce(
      (total, floor) => total + floor._count.tables,
      0
    );

    // Transform to response format
    const branchResponse: BranchResponse = {
      id: updatedBranch.id,
      name: updatedBranch.name,
      code: updatedBranch.code,
      phone: updatedBranch.phone,
      email: updatedBranch.email,
      address: updatedBranch.address,
      city: updatedBranch.city,
      state: updatedBranch.state,
      country: updatedBranch.country,
      zipCode: updatedBranch.zipCode,
      isMainBranch: updatedBranch.isMainBranch,
      status: updatedBranch.status,
      createdAt: updatedBranch.createdAt,
      updatedAt: updatedBranch.updatedAt,
      staffCount: (updatedBranch as BranchWithCounts)._count.staff,
      tableCount,
      kitchenCount: (updatedBranch as BranchWithCounts)._count.kitchens,
    };

    const response: ApiResponse<{ branch: BranchResponse }> = {
      success: true,
      data: {
        branch: branchResponse,
      },
      message: 'Branch updated successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating branch:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update branch',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * DELETE /api/v1/resources/branches/:id
 * Delete a branch
 * Cannot delete main branch (isMainBranch = true)
 * Cascade deletes: kitchens, floors, tables, rooms, staff assignments
 */
export async function deleteBranch(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;
    const branchId = req.params.id;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to delete a branch',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Check if branch exists and belongs to tenant
    const existingBranch = await prisma.branch.findFirst({
      where: {
        id: branchId,
        businessOwnerId: tenantId,
      },
    });

    if (!existingBranch) {
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

    // Cannot delete main branch
    if (existingBranch.isMainBranch) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'CANNOT_DELETE_MAIN_BRANCH',
          message: 'Cannot delete the main branch. Please designate another branch as main first.',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Delete branch with cascade (Prisma schema handles cascade deletes)
    // Related records are deleted: kitchens, floors (with tables), rooms, reservations, business hours
    // Staff are updated (branchId set to null due to SetNull) - but this depends on schema
    // Note: Per Prisma schema, staff has SetNull on branchId FK, so staff remain but lose branch assignment
    await prisma.branch.delete({
      where: { id: branchId },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Branch deleted successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting branch:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete branch',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * GET /api/v1/resources/branches/:branchId/hours
 * Get business hours for a specific branch
 * Returns all 7 days with their hours or defaults
 */
export async function getBranchBusinessHours(
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
          message: 'Tenant context is required to get business hours',
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

    // Get existing business hours for the branch
    const existingHours = await prisma.businessHours.findMany({
      where: { branchId },
      orderBy: { dayOfWeek: 'asc' },
    });

    // Create a map of existing hours by day of week
    const hoursMap = new Map<number, BusinessHours>();
    for (const hours of existingHours) {
      hoursMap.set(hours.dayOfWeek, hours);
    }

    // Build response for all 7 days (0-6)
    const businessHours: Array<BusinessHoursInfo & { dayName: string }> = [];
    for (let day = 0; day < 7; day++) {
      const existing = hoursMap.get(day);
      if (existing) {
        businessHours.push({
          id: existing.id,
          dayOfWeek: existing.dayOfWeek,
          dayName: DAY_NAMES[day],
          openTime: existing.openTime,
          closeTime: existing.closeTime,
          isClosed: existing.isClosed,
        });
      } else {
        // Return default values for days without records
        businessHours.push({
          id: '', // No record exists yet
          dayOfWeek: day,
          dayName: DAY_NAMES[day],
          openTime: '09:00',
          closeTime: '22:00',
          isClosed: false,
        });
      }
    }

    const response: ApiResponse<{
      branchId: string;
      branchName: string;
      businessHours: Array<BusinessHoursInfo & { dayName: string }>;
    }> = {
      success: true,
      data: {
        branchId: branch.id,
        branchName: branch.name,
        businessHours,
      },
      message: 'Business hours retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting business hours:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve business hours',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Input for a single day's business hours
 */
interface BusinessHoursInput {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

/**
 * Validate time format (HH:MM)
 */
function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(time);
}

/**
 * PUT /api/v1/resources/branches/:branchId/hours
 * Bulk update business hours for all 7 days
 * Accepts array of 7 days with: dayOfWeek, openTime, closeTime, isClosed
 */
export async function updateBranchBusinessHours(
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
          message: 'Tenant context is required to update business hours',
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

    // Validate request body
    const { hours } = req.body;

    if (!hours || !Array.isArray(hours)) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request body must contain an "hours" array',
        },
      };
      res.status(400).json(response);
      return;
    }

    if (hours.length !== 7) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Hours array must contain exactly 7 entries (one for each day of the week)',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Validate each day entry
    const validDays = new Set<number>();
    const validatedHours: BusinessHoursInput[] = [];
    const errors: string[] = [];

    for (let i = 0; i < hours.length; i++) {
      const entry = hours[i];
      const dayOfWeek = Number(entry.dayOfWeek);

      // Validate dayOfWeek
      if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
        errors.push(`Entry ${i}: dayOfWeek must be a number between 0 (Sunday) and 6 (Saturday)`);
        continue;
      }

      // Check for duplicate days
      if (validDays.has(dayOfWeek)) {
        errors.push(`Entry ${i}: duplicate dayOfWeek ${dayOfWeek} (${DAY_NAMES[dayOfWeek]})`);
        continue;
      }
      validDays.add(dayOfWeek);

      // Validate openTime format
      if (typeof entry.openTime !== 'string' || !isValidTimeFormat(entry.openTime)) {
        errors.push(`Entry ${i} (${DAY_NAMES[dayOfWeek]}): openTime must be in HH:MM format (e.g., "09:00")`);
        continue;
      }

      // Validate closeTime format
      if (typeof entry.closeTime !== 'string' || !isValidTimeFormat(entry.closeTime)) {
        errors.push(`Entry ${i} (${DAY_NAMES[dayOfWeek]}): closeTime must be in HH:MM format (e.g., "22:00")`);
        continue;
      }

      // Validate isClosed is boolean
      if (typeof entry.isClosed !== 'boolean') {
        errors.push(`Entry ${i} (${DAY_NAMES[dayOfWeek]}): isClosed must be a boolean`);
        continue;
      }

      validatedHours.push({
        dayOfWeek,
        openTime: entry.openTime,
        closeTime: entry.closeTime,
        isClosed: entry.isClosed,
      });
    }

    // Check that all 7 days are present
    for (let day = 0; day < 7; day++) {
      if (!validDays.has(day)) {
        errors.push(`Missing entry for ${DAY_NAMES[day]} (dayOfWeek: ${day})`);
      }
    }

    if (errors.length > 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: errors.join('; '),
        },
      };
      res.status(400).json(response);
      return;
    }

    // Use transaction to update all business hours atomically
    const updatedHours = await prisma.$transaction(
      validatedHours.map((dayHours) =>
        prisma.businessHours.upsert({
          where: {
            branchId_dayOfWeek: {
              branchId,
              dayOfWeek: dayHours.dayOfWeek,
            },
          },
          create: {
            branchId,
            dayOfWeek: dayHours.dayOfWeek,
            openTime: dayHours.openTime,
            closeTime: dayHours.closeTime,
            isClosed: dayHours.isClosed,
          },
          update: {
            openTime: dayHours.openTime,
            closeTime: dayHours.closeTime,
            isClosed: dayHours.isClosed,
          },
        })
      )
    );

    // Sort by day of week and format response
    const businessHours: Array<BusinessHoursInfo & { dayName: string }> = updatedHours
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
      .map((hours) => ({
        id: hours.id,
        dayOfWeek: hours.dayOfWeek,
        dayName: DAY_NAMES[hours.dayOfWeek],
        openTime: hours.openTime,
        closeTime: hours.closeTime,
        isClosed: hours.isClosed,
      }));

    const response: ApiResponse<{
      branchId: string;
      branchName: string;
      businessHours: Array<BusinessHoursInfo & { dayName: string }>;
    }> = {
      success: true,
      data: {
        branchId: branch.id,
        branchName: branch.name,
        businessHours,
      },
      message: 'Business hours updated successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating business hours:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update business hours',
      },
    };
    res.status(500).json(response);
  }
}
