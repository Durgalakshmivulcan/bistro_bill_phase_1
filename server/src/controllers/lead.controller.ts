import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse, PaginationMeta } from '../types';
import { prisma } from '../services/db.service';
import { LeadStage, Prisma } from '@prisma/client';

/**
 * Lead Response Interface
 */
interface LeadResponse {
  id: string;
  restaurantName: string;
  ownerName: string;
  email: string;
  phone: string | null;
  businessType: string | null;
  inquiryType: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  zipCode: string | null;
  address: string | null;
  description: string | null;
  stage: LeadStage;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Lead List Response
 */
interface LeadListResponse {
  leads: LeadResponse[];
  pagination: PaginationMeta;
}

/**
 * Valid Lead Stage values
 */
const VALID_STAGES: LeadStage[] = [
  'NewRequest',
  'InitialContacted',
  'ScheduledDemo',
  'Completed',
  'ClosedWin',
  'ClosedLoss',
];

/**
 * GET /api/v1/super-admin/leads
 * List all leads with pagination, filtering, and sorting
 * Requires SuperAdmin authentication
 */
export async function listLeads(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    // Parse query parameters
    const {
      stage,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = '1',
      limit = '10',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    interface WhereClause {
      stage?: LeadStage;
      OR?: Array<{
        ownerName?: { contains: string; mode: 'insensitive' };
        restaurantName?: { contains: string; mode: 'insensitive' };
        email?: { contains: string; mode: 'insensitive' };
        phone?: { contains: string; mode: 'insensitive' };
      }>;
    }
    const whereClause: WhereClause = {};

    // Filter by stage
    if (stage && typeof stage === 'string') {
      if (!VALID_STAGES.includes(stage as LeadStage)) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Stage must be one of: ${VALID_STAGES.join(', ')}`,
          },
        };
        res.status(400).json(response);
        return;
      }
      whereClause.stage = stage as LeadStage;
    }

    // Search filter (name, email, or phone)
    if (search && typeof search === 'string' && search.trim()) {
      const searchTerm = search.trim();
      whereClause.OR = [
        { ownerName: { contains: searchTerm, mode: 'insensitive' } },
        { restaurantName: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    // Build orderBy clause
    const validSortFields = ['createdAt', 'stage', 'ownerName', 'restaurantName'];
    const sortField = validSortFields.includes(sortBy as string) ? (sortBy as string) : 'createdAt';
    const order = sortOrder === 'asc' ? 'asc' : 'desc';

    // Count total matching records
    const total = await prisma.lead.count({
      where: whereClause,
    });

    // Fetch leads
    const leads = await prisma.lead.findMany({
      where: whereClause,
      skip,
      take: limitNum,
      orderBy: { [sortField]: order },
      select: {
        id: true,
        restaurantName: true,
        ownerName: true,
        email: true,
        phone: true,
        businessType: true,
        inquiryType: true,
        country: true,
        state: true,
        city: true,
        zipCode: true,
        address: true,
        description: true,
        stage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const totalPages = Math.ceil(total / limitNum);

    const response: ApiResponse<LeadListResponse> = {
      success: true,
      data: {
        leads,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
        },
      },
      message: 'Leads retrieved successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching leads:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching leads',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * POST /api/v1/super-admin/leads
 * Create a new lead from an inquiry
 * Requires SuperAdmin authentication
 */
export async function createLead(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const {
    restaurantName,
    ownerName,
    email,
    phone,
    businessType,
    inquiryType,
    country,
    state,
    city,
    zipCode,
    address,
    description,
  } = req.body;

  // Validate required fields
  const missingFields: string[] = [];
  if (!restaurantName || typeof restaurantName !== 'string' || !restaurantName.trim()) {
    missingFields.push('restaurantName');
  }
  if (!ownerName || typeof ownerName !== 'string' || !ownerName.trim()) {
    missingFields.push('ownerName');
  }
  if (!email || typeof email !== 'string' || !email.trim()) {
    missingFields.push('email');
  }
  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    missingFields.push('phone');
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

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid email format',
      },
    };
    res.status(400).json(response);
    return;
  }

  try {
    // Create the lead with default stage 'NewRequest'
    const lead = await prisma.lead.create({
      data: {
        restaurantName: restaurantName.trim(),
        ownerName: ownerName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        businessType: businessType?.trim() || null,
        inquiryType: inquiryType?.trim() || null,
        country: country?.trim() || null,
        state: state?.trim() || null,
        city: city?.trim() || null,
        zipCode: zipCode?.trim() || null,
        address: address?.trim() || null,
        description: description?.trim() || null,
        stage: 'NewRequest', // Default stage
      },
    });

    // Build response
    const leadResponse: LeadResponse = {
      id: lead.id,
      restaurantName: lead.restaurantName,
      ownerName: lead.ownerName,
      email: lead.email,
      phone: lead.phone,
      businessType: lead.businessType,
      inquiryType: lead.inquiryType,
      country: lead.country,
      state: lead.state,
      city: lead.city,
      zipCode: lead.zipCode,
      address: lead.address,
      description: lead.description,
      stage: lead.stage,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    };

    const response: ApiResponse<LeadResponse> = {
      success: true,
      data: leadResponse,
      message: 'Lead created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating lead:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while creating lead',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * PUT /api/v1/super-admin/leads/:id
 * Update an existing lead
 * Requires SuperAdmin authentication
 */
export async function updateLead(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { id } = req.params;
  const {
    restaurantName,
    ownerName,
    email,
    phone,
    businessType,
    inquiryType,
    country,
    state,
    city,
    zipCode,
    address,
    description,
    stage,
  } = req.body;

  try {
    // Check if lead exists
    const existingLead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!existingLead) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Lead not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Validate email format if provided
    if (email !== undefined && email !== null) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (typeof email !== 'string' || !emailRegex.test(email.trim())) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid email format',
          },
        };
        res.status(400).json(response);
        return;
      }
    }

    // Validate stage if provided
    if (stage !== undefined && stage !== null) {
      if (!VALID_STAGES.includes(stage as LeadStage)) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Stage must be one of: ${VALID_STAGES.join(', ')}`,
          },
        };
        res.status(400).json(response);
        return;
      }
    }

    // Build update data object (only include provided fields)
    interface UpdateData {
      restaurantName?: string;
      ownerName?: string;
      email?: string;
      phone?: string;
      businessType?: string | null;
      inquiryType?: string | null;
      country?: string | null;
      state?: string | null;
      city?: string | null;
      zipCode?: string | null;
      address?: string | null;
      description?: string | null;
      stage?: LeadStage;
    }
    const updateData: UpdateData = {};

    if (restaurantName !== undefined) updateData.restaurantName = restaurantName?.trim();
    if (ownerName !== undefined) updateData.ownerName = ownerName?.trim();
    if (email !== undefined) updateData.email = email?.trim().toLowerCase();
    if (phone !== undefined) updateData.phone = phone?.trim();
    if (businessType !== undefined) updateData.businessType = businessType?.trim() || null;
    if (inquiryType !== undefined) updateData.inquiryType = inquiryType?.trim() || null;
    if (country !== undefined) updateData.country = country?.trim() || null;
    if (state !== undefined) updateData.state = state?.trim() || null;
    if (city !== undefined) updateData.city = city?.trim() || null;
    if (zipCode !== undefined) updateData.zipCode = zipCode?.trim() || null;
    if (address !== undefined) updateData.address = address?.trim() || null;
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (stage !== undefined) updateData.stage = stage as LeadStage;

    // Check if stage is being changed for audit logging
    const stageChanged = stage !== undefined && stage !== existingLead.stage;

    // Update lead and optionally create audit log for stage changes
    let updatedLead;
    if (stageChanged) {
      // Use transaction to update lead and create audit log atomically
      const [lead] = await prisma.$transaction([
        prisma.lead.update({
          where: { id },
          data: updateData,
        }),
        prisma.auditLog.create({
          data: {
            userId: req.user!.id,
            userType: 'SuperAdmin',
            action: 'lead_stage_update',
            entityType: 'Lead',
            entityId: id,
            oldValue: { stage: existingLead.stage } as Prisma.InputJsonValue,
            newValue: { stage: stage } as Prisma.InputJsonValue,
            ipAddress: req.ip || req.socket?.remoteAddress || null,
          },
        }),
      ]);
      updatedLead = lead;
    } else {
      // Simple update without audit log
      updatedLead = await prisma.lead.update({
        where: { id },
        data: updateData,
      });
    }

    // Build response
    const leadResponse: LeadResponse = {
      id: updatedLead.id,
      restaurantName: updatedLead.restaurantName,
      ownerName: updatedLead.ownerName,
      email: updatedLead.email,
      phone: updatedLead.phone,
      businessType: updatedLead.businessType,
      inquiryType: updatedLead.inquiryType,
      country: updatedLead.country,
      state: updatedLead.state,
      city: updatedLead.city,
      zipCode: updatedLead.zipCode,
      address: updatedLead.address,
      description: updatedLead.description,
      stage: updatedLead.stage,
      createdAt: updatedLead.createdAt,
      updatedAt: updatedLead.updatedAt,
    };

    const response: ApiResponse<LeadResponse> = {
      success: true,
      data: leadResponse,
      message: 'Lead updated successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating lead:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while updating lead',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * PATCH /api/v1/super-admin/leads/:id/stage
 * Update lead stage (for Kanban board)
 * Requires SuperAdmin authentication
 */
export async function updateLeadStage(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { id } = req.params;
  const { stage } = req.body;

  // Validate stage is provided
  if (stage === undefined || stage === null) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Stage is required',
      },
    };
    res.status(400).json(response);
    return;
  }

  // Validate stage value
  if (!VALID_STAGES.includes(stage as LeadStage)) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Stage must be one of: ${VALID_STAGES.join(', ')}`,
      },
    };
    res.status(400).json(response);
    return;
  }

  try {
    // Check if lead exists
    const existingLead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!existingLead) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Lead not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Skip update if stage hasn't changed
    if (existingLead.stage === stage) {
      const leadResponse: LeadResponse = {
        id: existingLead.id,
        restaurantName: existingLead.restaurantName,
        ownerName: existingLead.ownerName,
        email: existingLead.email,
        phone: existingLead.phone,
        businessType: existingLead.businessType,
        inquiryType: existingLead.inquiryType,
        country: existingLead.country,
        state: existingLead.state,
        city: existingLead.city,
        zipCode: existingLead.zipCode,
        address: existingLead.address,
        description: existingLead.description,
        stage: existingLead.stage,
        createdAt: existingLead.createdAt,
        updatedAt: existingLead.updatedAt,
      };

      const response: ApiResponse<LeadResponse> = {
        success: true,
        data: leadResponse,
        message: 'Lead stage unchanged',
      };

      res.status(200).json(response);
      return;
    }

    // Update lead stage and create audit log atomically
    const [updatedLead] = await prisma.$transaction([
      prisma.lead.update({
        where: { id },
        data: { stage: stage as LeadStage },
      }),
      prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          userType: 'SuperAdmin',
          action: 'lead_stage_update',
          entityType: 'Lead',
          entityId: id,
          oldValue: { stage: existingLead.stage } as Prisma.InputJsonValue,
          newValue: { stage: stage } as Prisma.InputJsonValue,
          ipAddress: req.ip || req.socket?.remoteAddress || null,
        },
      }),
    ]);

    // Build response
    const leadResponse: LeadResponse = {
      id: updatedLead.id,
      restaurantName: updatedLead.restaurantName,
      ownerName: updatedLead.ownerName,
      email: updatedLead.email,
      phone: updatedLead.phone,
      businessType: updatedLead.businessType,
      inquiryType: updatedLead.inquiryType,
      country: updatedLead.country,
      state: updatedLead.state,
      city: updatedLead.city,
      zipCode: updatedLead.zipCode,
      address: updatedLead.address,
      description: updatedLead.description,
      stage: updatedLead.stage,
      createdAt: updatedLead.createdAt,
      updatedAt: updatedLead.updatedAt,
    };

    const response: ApiResponse<LeadResponse> = {
      success: true,
      data: leadResponse,
      message: 'Lead stage updated successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating lead stage:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while updating lead stage',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * DELETE /api/v1/super-admin/leads/:id
 * Delete a lead
 * Requires SuperAdmin authentication
 */
export async function deleteLead(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { id } = req.params;

  try {
    // Check if lead exists
    const existingLead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!existingLead) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Lead not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Delete the lead
    await prisma.lead.delete({
      where: { id },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Lead deleted successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error deleting lead:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while deleting lead',
      },
    };
    res.status(500).json(response);
  }
}
