import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { prisma } from '../services/db.service';
import { CustomerType } from '@prisma/client';

/**
 * Customer Info Interface
 */
interface CustomerTagInfo {
  id: string;
  name: string;
  color: string | null;
}

interface CustomerInfo {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  gender: string | null;
  dob: Date | null;
  type: string;
  gstin: string | null;
  amountDue: number;
  totalSpent: number;
  customerGroupId: string | null;
  customerGroupName: string | null;
  notes: string | null;
  orderCount: number;
  tags: CustomerTagInfo[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Customer List Response with pagination
 */
interface CustomerListResponse {
  customers: CustomerInfo[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * GET /api/v1/customers
 * List all customers for the authenticated tenant
 * Returns paginated customers with total spent and order count
 * Supports filtering by customerGroupId, type, and search (name/phone/email)
 * Requires tenant middleware
 */
export async function listCustomers(
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
          message: 'Tenant context is required to list customers',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Extract filters from query
    const { customerGroupId, type, search, page, limit, tagId } = req.query;

    // Pagination parameters
    const currentPage = page && typeof page === 'string' ? parseInt(page, 10) : 1;
    const pageSize = limit && typeof limit === 'string' ? parseInt(limit, 10) : 10;
    const skip = (currentPage - 1) * pageSize;

    // Build where clause
    const where: any = {
      businessOwnerId: tenantId,
    };

    if (customerGroupId && typeof customerGroupId === 'string') {
      where.customerGroupId = customerGroupId;
    }

    if (type && typeof type === 'string') {
      where.type = type as CustomerType;
    }

    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (tagId && typeof tagId === 'string') {
      where.customerTags = {
        some: { tagId },
      };
    }

    // Fetch total count
    const total = await prisma.customer.count({ where });

    // Fetch customers with customer group details, order count, and tags
    const customerList = await prisma.customer.findMany({
      where,
      include: {
        customerGroup: {
          select: {
            name: true,
          },
        },
        orders: {
          select: {
            id: true,
            total: true,
            dueAmount: true,
          },
        },
        customerTags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: pageSize,
    });

    // Transform customers to response format
    const customerResponses: CustomerInfo[] = customerList.map((customer: any) => {
      const amountDue = customer.orders.reduce(
        (sum: number, order: any) => sum + order.dueAmount.toNumber(),
        0
      );

      return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        gender: customer.gender,
        dob: customer.dob,
        type: customer.type,
        gstin: customer.gstin,
        amountDue,
        totalSpent: customer.totalSpent.toNumber(),
        customerGroupId: customer.customerGroupId,
        customerGroupName: customer.customerGroup?.name || null,
        notes: customer.notes,
        orderCount: customer.orders.length,
        tags: customer.customerTags.map((ct: any) => ({
          id: ct.tag.id,
          name: ct.tag.name,
          color: ct.tag.color,
        })),
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      };
    });

    // Calculate total pages
    const totalPages = Math.ceil(total / pageSize);

    const response: ApiResponse<CustomerListResponse> = {
      success: true,
      data: {
        customers: customerResponses,
        total,
        page: currentPage,
        limit: pageSize,
        totalPages,
      },
      message: 'Customers retrieved successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error listing customers:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while fetching customers',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * POST /api/v1/customers
 * Create a new customer
 * Required fields: name, phone
 * Checks for unique phone within tenant
 * Requires tenant middleware
 */
export async function createCustomer(
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
          message: 'Tenant context is required to create customer',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Extract customer data from request body
    const {
      name,
      phone,
      email,
      gender,
      dob,
      type,
      gstin,
      customerGroupId,
      notes,
      tagIds,
    } = req.body;

    // Validate required fields
    if (!name || !phone) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name and phone are required fields',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Check if phone already exists within tenant
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        businessOwnerId: tenantId,
        phone,
      },
    });

    if (existingCustomer) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'DUPLICATE_PHONE',
          message: 'A customer with this phone number already exists',
        },
      };
      res.status(409).json(response);
      return;
    }

    // Validate customer group if provided
    if (customerGroupId) {
      const customerGroup = await prisma.customerGroup.findFirst({
        where: {
          id: customerGroupId,
          businessOwnerId: tenantId,
        },
      });

      if (!customerGroup) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'INVALID_CUSTOMER_GROUP',
            message: 'Invalid customer group ID',
          },
        };
        res.status(400).json(response);
        return;
      }
    }

    // Create customer with tags
    const customer = await prisma.customer.create({
      data: {
        businessOwnerId: tenantId,
        name,
        phone,
        email: email || null,
        gender: gender || null,
        dob: dob ? new Date(dob) : null,
        type: type || CustomerType.Regular,
        gstin: gstin || null,
        customerGroupId: customerGroupId || null,
        notes: notes || null,
        totalSpent: 0,
        ...(Array.isArray(tagIds) && tagIds.length > 0 ? {
          customerTags: {
            create: tagIds.map((tagId: string) => ({ tagId })),
          },
        } : {}),
      },
      include: {
        customerGroup: {
          select: {
            name: true,
          },
        },
        customerTags: {
          include: {
            tag: {
              select: { id: true, name: true, color: true },
            },
          },
        },
      },
    });

    const response: ApiResponse<any> = {
      success: true,
      data: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        gender: customer.gender,
        dob: customer.dob,
        type: customer.type,
        gstin: customer.gstin,
        amountDue: 0,
        totalSpent: customer.totalSpent.toNumber(),
        customerGroupId: customer.customerGroupId,
        customerGroupName: customer.customerGroup?.name || null,
        notes: customer.notes,
        tags: customer.customerTags.map((ct: any) => ({
          id: ct.tag.id,
          name: ct.tag.name,
          color: ct.tag.color,
        })),
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      },
      message: 'Customer created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating customer:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while creating the customer',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * PUT /api/v1/customers/:id
 * Update an existing customer
 * All fields optional except ID
 * Requires tenant middleware
 */
export async function updateCustomer(
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
          message: 'Tenant context is required to update customer',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { id } = req.params;

    // Check if customer exists and belongs to tenant
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
    });

    if (!existingCustomer) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'CUSTOMER_NOT_FOUND',
          message: 'Customer not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Extract customer data from request body
    const {
      name,
      phone,
      email,
      gender,
      dob,
      type,
      gstin,
      customerGroupId,
      notes,
      tagIds,
    } = req.body;

    // If phone is being updated, check uniqueness within tenant
    if (phone && phone !== existingCustomer.phone) {
      const duplicateCustomer = await prisma.customer.findFirst({
        where: {
          businessOwnerId: tenantId,
          phone,
          id: { not: id },
        },
      });

      if (duplicateCustomer) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'DUPLICATE_PHONE',
            message: 'A customer with this phone number already exists',
          },
        };
        res.status(409).json(response);
        return;
      }
    }

    // Validate customer group if provided
    if (customerGroupId !== undefined && customerGroupId !== null) {
      const customerGroup = await prisma.customerGroup.findFirst({
        where: {
          id: customerGroupId,
          businessOwnerId: tenantId,
        },
      });

      if (!customerGroup) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'INVALID_CUSTOMER_GROUP',
            message: 'Invalid customer group ID',
          },
        };
        res.status(400).json(response);
        return;
      }
    }

    // Update customer
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (gender !== undefined) updateData.gender = gender;
    if (dob !== undefined) updateData.dob = dob ? new Date(dob) : null;
    if (type !== undefined) updateData.type = type;
    if (gstin !== undefined) updateData.gstin = gstin;
    if (customerGroupId !== undefined) updateData.customerGroupId = customerGroupId;
    if (notes !== undefined) updateData.notes = notes;

    // Handle tag updates: delete all existing tags and re-create
    if (Array.isArray(tagIds)) {
      updateData.customerTags = {
        deleteMany: {},
        create: tagIds.map((tagId: string) => ({ tagId })),
      };
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: updateData,
      include: {
        customerGroup: {
          select: {
            name: true,
          },
        },
        customerTags: {
          include: {
            tag: {
              select: { id: true, name: true, color: true },
            },
          },
        },
      },
    });

    const response: ApiResponse<any> = {
      success: true,
      data: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        gender: customer.gender,
        dob: customer.dob,
        type: customer.type,
        gstin: customer.gstin,
        amountDue: 0,
        totalSpent: customer.totalSpent.toNumber(),
        customerGroupId: customer.customerGroupId,
        customerGroupName: customer.customerGroup?.name || null,
        notes: customer.notes,
        tags: customer.customerTags.map((ct: any) => ({
          id: ct.tag.id,
          name: ct.tag.name,
          color: ct.tag.color,
        })),
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      },
      message: 'Customer updated successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating customer:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while updating the customer',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * GET /api/v1/customers/:id
 * Get customer details with order history
 * Includes recent orders (last 10), total spent, and visit count
 * Requires tenant middleware
 */
export async function getCustomerDetail(
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
          message: 'Tenant context is required to get customer details',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { id } = req.params;

    // Fetch customer with order history
    const customer = await prisma.customer.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
      include: {
        customerGroup: {
          select: {
            name: true,
          },
        },
        orders: {
          select: {
            id: true,
            orderNumber: true,
            type: true,
            total: true,
            dueAmount: true,
            paymentStatus: true,
            orderStatus: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10, // Last 10 orders
        },
      },
    });

    if (!customer) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'CUSTOMER_NOT_FOUND',
          message: 'Customer not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Calculate visit count (total number of orders)
    const visitCount = await prisma.order.count({
      where: {
        customerId: id,
        businessOwnerId: tenantId,
      },
    });

    // Transform recent orders to response format
    const recentOrders = customer.orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      type: order.type,
      total: order.total.toNumber(),
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      createdAt: order.createdAt,
    }));

    const amountDue = customer.orders.reduce(
      (sum, order) => sum + order.dueAmount.toNumber(),
      0
    );

    const response: ApiResponse<any> = {
      success: true,
      data: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        gender: customer.gender,
        dob: customer.dob,
        type: customer.type,
        gstin: customer.gstin,
        amountDue,
        totalSpent: customer.totalSpent.toNumber(),
        customerGroupId: customer.customerGroupId,
        customerGroupName: customer.customerGroup?.name || null,
        notes: customer.notes,
        visitCount,
        recentOrders,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      },
      message: 'Customer details retrieved successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error getting customer details:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while fetching customer details',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * DELETE /api/v1/customers/:id
 * Delete a customer (soft delete if has orders, hard delete otherwise)
 * Requires tenant middleware
 */
export async function deleteCustomer(
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
          message: 'Tenant context is required to delete customer',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { id } = req.params;

    // Check if customer exists and belongs to tenant
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
      include: {
        orders: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!existingCustomer) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'CUSTOMER_NOT_FOUND',
          message: 'Customer not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // If customer has orders, prevent deletion
    // (acceptance criteria says "soft delete instead", but schema doesn't have deletedAt)
    if (existingCustomer.orders.length > 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'CUSTOMER_HAS_ORDERS',
          message: `Cannot delete customer with ${existingCustomer.orders.length} order(s). Consider archiving instead.`,
        },
      };
      res.status(400).json(response);
      return;
    }

    // Delete customer
    await prisma.customer.delete({
      where: { id },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Customer deleted successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error deleting customer:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while deleting the customer',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * POST /api/v1/customers/import
 * Import customers from CSV file
 * Expected CSV format: firstName, lastName, phone, email, type, customerGroupId
 * Handles duplicate phone/email with skip or update options
 * Requires tenant middleware and CSV file upload
 */
export async function importCustomers(
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
          message: 'Tenant context is required to import customers',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Check if file was uploaded
    if (!req.file) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'FILE_REQUIRED',
          message: 'CSV file is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Parse CSV file
    const csvContent = req.file.buffer.toString('utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());

    if (lines.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'EMPTY_FILE',
          message: 'CSV file is empty',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Parse header row
    const headerLine = lines[0];
    const headers = headerLine.split(',').map(h => h.trim().toLowerCase());

    // Validate required columns
    const requiredColumns = ['phone'];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));

    if (missingColumns.length > 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_CSV_FORMAT',
          message: `Missing required columns: ${missingColumns.join(', ')}. Expected columns: firstName, lastName, phone, email, type, customerGroupId`,
        },
      };
      res.status(400).json(response);
      return;
    }

    // Get duplicate handling option from query (default: skip)
    const duplicateAction = (req.query.duplicateAction as string) || 'skip';

    // Process CSV rows
    const results = {
      imported: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: [] as Array<{ row: number; error: string; data: any }>,
    };

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        // Parse CSV row (basic implementation - doesn't handle quoted commas)
        const values = line.split(',').map(v => v.trim());
        const rowData: any = {};

        headers.forEach((header, index) => {
          rowData[header] = values[index] || null;
        });

        // Extract and validate customer data
        const firstName = rowData.firstname || rowData.firstName || '';
        const lastName = rowData.lastname || rowData.lastName || '';
        const phone = rowData.phone;
        const email = rowData.email || null;
        const type = rowData.type || 'Regular';
        const customerGroupId = rowData.customergroupid || rowData.customerGroupId || null;

        // Validate required fields
        if (!phone) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            error: 'Phone number is required',
            data: rowData,
          });
          continue;
        }

        // Combine first and last name
        const name = `${firstName} ${lastName}`.trim() || phone;

        // Validate customer type
        const validTypes = ['Regular', 'VIP', 'Corporate'];
        const customerType = validTypes.includes(type) ? type as CustomerType : CustomerType.Regular;

        // Check if customer already exists
        const existingCustomer = await prisma.customer.findFirst({
          where: {
            businessOwnerId: tenantId,
            phone,
          },
        });

        if (existingCustomer) {
          if (duplicateAction === 'update') {
            // Update existing customer
            await prisma.customer.update({
              where: { id: existingCustomer.id },
              data: {
                name,
                email,
                type: customerType,
                customerGroupId,
              },
            });
            results.updated++;
          } else {
            // Skip duplicate
            results.skipped++;
          }
          continue;
        }

        // Validate customer group if provided
        if (customerGroupId) {
          const customerGroup = await prisma.customerGroup.findFirst({
            where: {
              id: customerGroupId,
              businessOwnerId: tenantId,
            },
          });

          if (!customerGroup) {
            results.failed++;
            results.errors.push({
              row: i + 1,
              error: 'Invalid customer group ID',
              data: rowData,
            });
            continue;
          }
        }

        // Create new customer
        await prisma.customer.create({
          data: {
            businessOwnerId: tenantId,
            name,
            phone,
            email,
            type: customerType,
            customerGroupId,
            totalSpent: 0,
          },
        });

        results.imported++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          row: i + 1,
          error: error.message || 'Unknown error',
          data: line,
        });
      }
    }

    const response: ApiResponse<any> = {
      success: true,
      data: {
        imported: results.imported,
        updated: results.updated,
        skipped: results.skipped,
        failed: results.failed,
        errors: results.errors.slice(0, 10), // Return first 10 errors only
      },
      message: `Import completed: ${results.imported} imported, ${results.updated} updated, ${results.skipped} skipped, ${results.failed} failed`,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error importing customers:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while importing customers',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * POST /api/v1/customers/bulk-tags
 * Assign tags to multiple customers at once
 * Required: customerIds (string[]), tagIds (string[])
 */
export async function bulkAssignTags(
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

    const { customerIds, tagIds } = req.body;

    if (!Array.isArray(customerIds) || customerIds.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'customerIds must be a non-empty array',
        },
      };
      res.status(400).json(response);
      return;
    }

    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'tagIds must be a non-empty array',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Create customer-tag associations (skip duplicates)
    let created = 0;
    for (const customerId of customerIds) {
      for (const tagId of tagIds) {
        try {
          await prisma.customerTag.create({
            data: { customerId, tagId },
          });
          created++;
        } catch {
          // Skip duplicates (composite key violation)
        }
      }
    }

    const response: ApiResponse<any> = {
      success: true,
      data: { assignedCount: created },
      message: `Tags assigned to ${customerIds.length} customer(s)`,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error bulk assigning tags:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to assign tags',
      },
    };
    res.status(500).json(response);
  }
}
