import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse, PaginationMeta } from '../types';
import { prisma } from '../services/db.service';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import crypto from 'crypto';

/**
 * Helper function to convert Prisma Decimal to number
 */
function decimalToNumber(value: Decimal | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return value.toNumber();
}

/**
 * Supplier Response Interface
 */
interface SupplierResponse {
  id: string;
  code: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  gstNumber: string | null;
  tinNumber: string | null;
  taxStateCode: string | null;
  bankAccount: string | null;
  bankName: string | null;
  bankBranch: string | null;
  ifscCode: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  purchaseOrderCount: number;
  totalAmountSpent: number;
}

/**
 * Supplier List Response
 */
interface SupplierListResponse {
  suppliers: SupplierResponse[];
  pagination: PaginationMeta;
}

/**
 * GET /api/v1/inventory/suppliers
 * List all suppliers for the authenticated tenant
 * Requires tenant middleware
 * Supports filtering by status
 * Includes purchase order count and total amount spent
 */
export async function listSuppliers(
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
          message: 'Tenant context is required to list suppliers',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Parse query parameters
    const {
      status,
      search,
      page = '1',
      limit = '10',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const whereClause: Prisma.SupplierWhereInput = {
      businessOwnerId: tenantId,
    };

    // Filter by status
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

    // Search filter (search by name, code, phone, email)
    if (search && typeof search === 'string' && search.trim()) {
      const searchTerm = search.trim();
      whereClause.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { code: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    // Count total matching records
    const total = await prisma.supplier.count({
      where: whereClause,
    });

    // Fetch suppliers with pagination
    const suppliers = await prisma.supplier.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            purchaseOrders: true,
          },
        },
        purchaseOrders: {
          where: {
            status: 'Approved',
          },
          select: {
            grandTotal: true,
          },
        },
      },
      orderBy: [
        { name: 'asc' },
      ],
      skip,
      take: limitNum,
    });

    // Transform to response format with total amount spent calculation
    const supplierResponses: SupplierResponse[] = suppliers.map((supplier) => {
      // Calculate total amount spent from approved purchase orders
      const totalAmountSpent = supplier.purchaseOrders.reduce((sum, po) => {
        const grandTotal = decimalToNumber(po.grandTotal) ?? 0;
        return sum + grandTotal;
      }, 0);

      return {
        id: supplier.id,
        code: supplier.code,
        name: supplier.name,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
        gstNumber: supplier.gstNumber,
        tinNumber: supplier.tinNumber,
        taxStateCode: supplier.taxStateCode,
        bankAccount: supplier.bankAccount,
        bankName: supplier.bankName,
        bankBranch: supplier.bankBranch,
        ifscCode: supplier.ifscCode,
        status: supplier.status,
        createdAt: supplier.createdAt,
        updatedAt: supplier.updatedAt,
        purchaseOrderCount: supplier._count.purchaseOrders,
        totalAmountSpent,
      };
    });

    const totalPages = Math.ceil(total / limitNum);

    const response: ApiResponse<SupplierListResponse> = {
      success: true,
      data: {
        suppliers: supplierResponses,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
        },
      },
      message: 'Suppliers retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error listing suppliers:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve suppliers',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * GET /api/v1/inventory/suppliers/:id
 * Get a single supplier by ID for the authenticated tenant
 */
export async function getSupplierById(
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
          message: 'Tenant context is required',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { id } = req.params;

    const supplier = await prisma.supplier.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
      include: {
        _count: {
          select: {
            purchaseOrders: true,
          },
        },
        purchaseOrders: {
          where: {
            status: 'Approved',
          },
          select: {
            grandTotal: true,
          },
        },
      },
    });

    if (!supplier) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Supplier not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    const totalAmountSpent = supplier.purchaseOrders.reduce((sum, po) => {
      const grandTotal = decimalToNumber(po.grandTotal) ?? 0;
      return sum + grandTotal;
    }, 0);

    const supplierResponse: SupplierResponse = {
      id: supplier.id,
      code: supplier.code,
      name: supplier.name,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      gstNumber: supplier.gstNumber,
      tinNumber: supplier.tinNumber,
      taxStateCode: supplier.taxStateCode,
      bankAccount: supplier.bankAccount,
      bankName: supplier.bankName,
      bankBranch: supplier.bankBranch,
      ifscCode: supplier.ifscCode,
      status: supplier.status,
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt,
      purchaseOrderCount: supplier._count.purchaseOrders,
      totalAmountSpent,
    };

    const response: ApiResponse<SupplierResponse> = {
      success: true,
      data: supplierResponse,
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting supplier:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve supplier',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Create Supplier Input Interface
 */
interface CreateSupplierInput {
  name: string;
  phone: string;
  code?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  tinNumber?: string;
  taxStateCode?: string;
  bankAccount?: string;
  bankName?: string;
  bankBranch?: string;
  ifscCode?: string;
  status?: string;
}

/**
 * Create Supplier Response (simpler than list response - no PO stats yet)
 */
interface CreateSupplierResponse {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  gstNumber: string | null;
  tinNumber: string | null;
  taxStateCode: string | null;
  bankAccount: string | null;
  bankName: string | null;
  bankBranch: string | null;
  ifscCode: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  purchaseOrderCount: number;
  totalAmountSpent: number;
}

/**
 * Generate unique supplier code
 * Format: SUP-XXXXX (5 random alphanumeric characters)
 */
async function generateSupplierCode(businessOwnerId: string): Promise<string> {
  const maxAttempts = 10;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Generate 5 random bytes and convert to uppercase alphanumeric
    const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 5);
    const code = `SUP-${randomPart}`;

    // Check if code already exists for this tenant
    const existing = await prisma.supplier.findFirst({
      where: {
        businessOwnerId,
        code,
      },
    });

    if (!existing) {
      return code;
    }
  }

  // Fallback with timestamp if all random attempts fail
  const timestamp = Date.now().toString(36).toUpperCase().slice(-5);
  return `SUP-${timestamp}`;
}

/**
 * POST /api/v1/inventory/suppliers
 * Create a new supplier for the authenticated tenant
 * Required: name, phone
 * Optional: code, email, address, status
 * Generates unique code if not provided (format: SUP-XXXXX)
 */
export async function createSupplier(
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
          message: 'Tenant context is required to create a supplier',
        },
      };
      res.status(403).json(response);
      return;
    }

    const input = req.body as CreateSupplierInput;

    // Validate required fields
    const missingFields: string[] = [];

    if (!input.name || typeof input.name !== 'string' || !input.name.trim()) {
      missingFields.push('name');
    }

    if (!input.phone || typeof input.phone !== 'string' || !input.phone.trim()) {
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

    // Validate status if provided
    if (input.status !== undefined && input.status !== null) {
      const validStatuses = ['active', 'inactive'];
      if (!validStatuses.includes(input.status)) {
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

    // Validate email format if provided
    if (input.email && typeof input.email === 'string' && input.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.email.trim())) {
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

    // Validate GST Number format if provided (15 characters)
    if (input.gstNumber && typeof input.gstNumber === 'string' && input.gstNumber.trim()) {
      if (input.gstNumber.trim().length !== 15) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'GST Number must be exactly 15 characters',
          },
        };
        res.status(400).json(response);
        return;
      }
    }

    // Validate IFSC Code format if provided (11 characters)
    if (input.ifscCode && typeof input.ifscCode === 'string' && input.ifscCode.trim()) {
      if (input.ifscCode.trim().length !== 11) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'IFSC Code must be exactly 11 characters',
          },
        };
        res.status(400).json(response);
        return;
      }
    }

    // Generate or validate code
    let supplierCode: string;
    if (input.code && typeof input.code === 'string' && input.code.trim()) {
      // Use provided code but check for uniqueness within tenant
      const existingCode = await prisma.supplier.findFirst({
        where: {
          businessOwnerId: tenantId,
          code: input.code.trim(),
        },
      });

      if (existingCode) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'DUPLICATE_CODE',
            message: 'A supplier with this code already exists',
          },
        };
        res.status(409).json(response);
        return;
      }

      supplierCode = input.code.trim();
    } else {
      // Generate unique code
      supplierCode = await generateSupplierCode(tenantId);
    }

    // Create the supplier
    const supplier = await prisma.supplier.create({
      data: {
        businessOwnerId: tenantId,
        name: input.name.trim(),
        phone: input.phone.trim(),
        code: supplierCode,
        email: input.email?.trim() || null,
        address: input.address?.trim() || null,
        gstNumber: input.gstNumber?.trim() || null,
        tinNumber: input.tinNumber?.trim() || null,
        taxStateCode: input.taxStateCode?.trim() || null,
        bankAccount: input.bankAccount?.trim() || null,
        bankName: input.bankName?.trim() || null,
        bankBranch: input.bankBranch?.trim() || null,
        ifscCode: input.ifscCode?.trim() || null,
        status: input.status || 'active',
      },
    });

    // Build response (new supplier has 0 purchase orders)
    const supplierResponse: CreateSupplierResponse = {
      id: supplier.id,
      code: supplier.code || supplierCode,
      name: supplier.name,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      gstNumber: supplier.gstNumber,
      tinNumber: supplier.tinNumber,
      taxStateCode: supplier.taxStateCode,
      bankAccount: supplier.bankAccount,
      bankName: supplier.bankName,
      bankBranch: supplier.bankBranch,
      ifscCode: supplier.ifscCode,
      status: supplier.status,
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt,
      purchaseOrderCount: 0,
      totalAmountSpent: 0,
    };

    const response: ApiResponse<CreateSupplierResponse> = {
      success: true,
      data: supplierResponse,
      message: 'Supplier created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating supplier:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create supplier',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Update Supplier Input Interface
 */
interface UpdateSupplierInput {
  name?: string;
  phone?: string;
  code?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  tinNumber?: string;
  taxStateCode?: string;
  bankAccount?: string;
  bankName?: string;
  bankBranch?: string;
  ifscCode?: string;
  status?: string;
}

/**
 * PUT /api/v1/inventory/suppliers/:id
 * Update an existing supplier for the authenticated tenant
 * All fields optional
 */
export async function updateSupplier(
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
          message: 'Tenant context is required to update a supplier',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { id } = req.params;
    const input = req.body as UpdateSupplierInput;

    // Check if supplier exists and belongs to tenant
    const existingSupplier = await prisma.supplier.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
    });

    if (!existingSupplier) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Supplier not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Validate status if provided
    if (input.status !== undefined && input.status !== null) {
      const validStatuses = ['active', 'inactive'];
      if (!validStatuses.includes(input.status)) {
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

    // Validate email format if provided
    if (input.email && typeof input.email === 'string' && input.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.email.trim())) {
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

    // Validate GST Number format if provided (15 characters)
    if (input.gstNumber && typeof input.gstNumber === 'string' && input.gstNumber.trim()) {
      if (input.gstNumber.trim().length !== 15) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'GST Number must be exactly 15 characters',
          },
        };
        res.status(400).json(response);
        return;
      }
    }

    // Validate IFSC Code format if provided (11 characters)
    if (input.ifscCode && typeof input.ifscCode === 'string' && input.ifscCode.trim()) {
      if (input.ifscCode.trim().length !== 11) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'IFSC Code must be exactly 11 characters',
          },
        };
        res.status(400).json(response);
        return;
      }
    }

    // Validate code uniqueness if provided and different from existing
    if (input.code && typeof input.code === 'string' && input.code.trim()) {
      const trimmedCode = input.code.trim();
      if (trimmedCode !== existingSupplier.code) {
        const existingCode = await prisma.supplier.findFirst({
          where: {
            businessOwnerId: tenantId,
            code: trimmedCode,
            id: { not: id },
          },
        });

        if (existingCode) {
          const response: ApiResponse = {
            success: false,
            error: {
              code: 'DUPLICATE_CODE',
              message: 'A supplier with this code already exists',
            },
          };
          res.status(409).json(response);
          return;
        }
      }
    }

    // Build update data object with only provided fields
    const updateData: Prisma.SupplierUpdateInput = {};

    if (input.name !== undefined && input.name.trim()) {
      updateData.name = input.name.trim();
    }

    if (input.phone !== undefined) {
      updateData.phone = input.phone?.trim() || null;
    }

    if (input.code !== undefined) {
      updateData.code = input.code?.trim() || null;
    }

    if (input.email !== undefined) {
      updateData.email = input.email?.trim() || null;
    }

    if (input.address !== undefined) {
      updateData.address = input.address?.trim() || null;
    }

    if (input.gstNumber !== undefined) {
      updateData.gstNumber = input.gstNumber?.trim() || null;
    }

    if (input.tinNumber !== undefined) {
      updateData.tinNumber = input.tinNumber?.trim() || null;
    }

    if (input.taxStateCode !== undefined) {
      updateData.taxStateCode = input.taxStateCode?.trim() || null;
    }

    if (input.bankAccount !== undefined) {
      updateData.bankAccount = input.bankAccount?.trim() || null;
    }

    if (input.bankName !== undefined) {
      updateData.bankName = input.bankName?.trim() || null;
    }

    if (input.bankBranch !== undefined) {
      updateData.bankBranch = input.bankBranch?.trim() || null;
    }

    if (input.ifscCode !== undefined) {
      updateData.ifscCode = input.ifscCode?.trim() || null;
    }

    if (input.status !== undefined) {
      updateData.status = input.status;
    }

    // Update the supplier
    const updatedSupplier = await prisma.supplier.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            purchaseOrders: true,
          },
        },
        purchaseOrders: {
          where: {
            status: 'Approved',
          },
          select: {
            grandTotal: true,
          },
        },
      },
    });

    // Calculate total amount spent from approved purchase orders
    const totalAmountSpent = updatedSupplier.purchaseOrders.reduce((sum, po) => {
      const grandTotal = decimalToNumber(po.grandTotal) ?? 0;
      return sum + grandTotal;
    }, 0);

    // Build response
    const supplierResponse: SupplierResponse = {
      id: updatedSupplier.id,
      code: updatedSupplier.code,
      name: updatedSupplier.name,
      phone: updatedSupplier.phone,
      email: updatedSupplier.email,
      address: updatedSupplier.address,
      gstNumber: updatedSupplier.gstNumber,
      tinNumber: updatedSupplier.tinNumber,
      taxStateCode: updatedSupplier.taxStateCode,
      bankAccount: updatedSupplier.bankAccount,
      bankName: updatedSupplier.bankName,
      bankBranch: updatedSupplier.bankBranch,
      ifscCode: updatedSupplier.ifscCode,
      status: updatedSupplier.status,
      createdAt: updatedSupplier.createdAt,
      updatedAt: updatedSupplier.updatedAt,
      purchaseOrderCount: updatedSupplier._count.purchaseOrders,
      totalAmountSpent,
    };

    const response: ApiResponse<SupplierResponse> = {
      success: true,
      data: supplierResponse,
      message: 'Supplier updated successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating supplier:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update supplier',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * DELETE /api/v1/inventory/suppliers/:id
 * Delete a supplier for the authenticated tenant
 * Prevents deletion if supplier has pending purchase orders
 */
export async function deleteSupplier(
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
          message: 'Tenant context is required to delete a supplier',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { id } = req.params;

    // Check if supplier exists and belongs to tenant
    const existingSupplier = await prisma.supplier.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
    });

    if (!existingSupplier) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Supplier not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Check for pending purchase orders
    const pendingPOCount = await prisma.purchaseOrder.count({
      where: {
        supplierId: id,
        status: 'Pending',
      },
    });

    if (pendingPOCount > 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'HAS_PENDING_POS',
          message: `Cannot delete supplier with ${pendingPOCount} pending purchase order${pendingPOCount > 1 ? 's' : ''}`,
        },
      };
      res.status(400).json(response);
      return;
    }

    // Delete the supplier
    await prisma.supplier.delete({
      where: { id },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Supplier deleted successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting supplier:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete supplier',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * SupplierContact Response Interface
 */
interface SupplierContactResponse {
  id: string;
  supplierId: string;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * GET /api/v1/inventory/suppliers/:supplierId/contacts
 * List all contacts for a supplier
 */
export async function listSupplierContacts(
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
          message: 'Tenant context is required',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { supplierId } = req.params;

    // Verify supplier exists and belongs to tenant
    const supplier = await prisma.supplier.findFirst({
      where: {
        id: supplierId,
        businessOwnerId: tenantId,
      },
    });

    if (!supplier) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Supplier not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Fetch contacts
    const contacts = await prisma.supplierContact.findMany({
      where: {
        supplierId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const response: ApiResponse<{ contacts: SupplierContactResponse[] }> = {
      success: true,
      data: {
        contacts,
      },
      message: 'Supplier contacts retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error listing supplier contacts:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve supplier contacts',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Create SupplierContact Input Interface
 */
interface CreateSupplierContactInput {
  name: string;
  email?: string;
  phone?: string;
}

/**
 * POST /api/v1/inventory/suppliers/:supplierId/contacts
 * Create a new contact for a supplier
 */
export async function createSupplierContact(
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
          message: 'Tenant context is required',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { supplierId } = req.params;
    const input = req.body as CreateSupplierContactInput;

    // Verify supplier exists and belongs to tenant
    const supplier = await prisma.supplier.findFirst({
      where: {
        id: supplierId,
        businessOwnerId: tenantId,
      },
    });

    if (!supplier) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Supplier not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Validate required fields
    if (!input.name || typeof input.name !== 'string' || !input.name.trim()) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Validate email format if provided
    if (input.email && typeof input.email === 'string' && input.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.email.trim())) {
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

    // Create contact
    const contact = await prisma.supplierContact.create({
      data: {
        supplierId,
        name: input.name.trim(),
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
      },
    });

    const response: ApiResponse<SupplierContactResponse> = {
      success: true,
      data: contact,
      message: 'Supplier contact created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating supplier contact:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create supplier contact',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Update SupplierContact Input Interface
 */
interface UpdateSupplierContactInput {
  name?: string;
  email?: string;
  phone?: string;
}

/**
 * PUT /api/v1/inventory/suppliers/:supplierId/contacts/:id
 * Update a supplier contact
 */
export async function updateSupplierContact(
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
          message: 'Tenant context is required',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { supplierId, id } = req.params;
    const input = req.body as UpdateSupplierContactInput;

    // Verify supplier exists and belongs to tenant
    const supplier = await prisma.supplier.findFirst({
      where: {
        id: supplierId,
        businessOwnerId: tenantId,
      },
    });

    if (!supplier) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Supplier not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Verify contact exists and belongs to supplier
    const existingContact = await prisma.supplierContact.findFirst({
      where: {
        id,
        supplierId,
      },
    });

    if (!existingContact) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Contact not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Validate email format if provided
    if (input.email && typeof input.email === 'string' && input.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.email.trim())) {
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

    // Build update data
    const updateData: Prisma.SupplierContactUpdateInput = {};

    if (input.name !== undefined && input.name.trim()) {
      updateData.name = input.name.trim();
    }

    if (input.email !== undefined) {
      updateData.email = input.email?.trim() || null;
    }

    if (input.phone !== undefined) {
      updateData.phone = input.phone?.trim() || null;
    }

    // Update contact
    const contact = await prisma.supplierContact.update({
      where: { id },
      data: updateData,
    });

    const response: ApiResponse<SupplierContactResponse> = {
      success: true,
      data: contact,
      message: 'Supplier contact updated successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating supplier contact:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update supplier contact',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * DELETE /api/v1/inventory/suppliers/:supplierId/contacts/:id
 * Delete a supplier contact
 */
export async function deleteSupplierContact(
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
          message: 'Tenant context is required',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { supplierId, id } = req.params;

    // Verify supplier exists and belongs to tenant
    const supplier = await prisma.supplier.findFirst({
      where: {
        id: supplierId,
        businessOwnerId: tenantId,
      },
    });

    if (!supplier) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Supplier not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Verify contact exists and belongs to supplier
    const existingContact = await prisma.supplierContact.findFirst({
      where: {
        id,
        supplierId,
      },
    });

    if (!existingContact) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Contact not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Delete contact
    await prisma.supplierContact.delete({
      where: { id },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Supplier contact deleted successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting supplier contact:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete supplier contact',
      },
    };
    res.status(500).json(response);
  }
}
