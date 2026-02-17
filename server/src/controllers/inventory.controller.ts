import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse, PaginationMeta } from '../types';
import { prisma } from '../services/db.service';
import { Prisma, InventoryProduct, Branch, Supplier, AuditUserType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { deleteFromS3, extractKeyFromUrl } from '../services/s3.service';

/**
 * Input interface for creating inventory product
 */
interface CreateInventoryProductInput {
  name: string;
  branchId: string;
  unit: string;
  image?: string;
  supplierId?: string;
  inStock?: number;
  restockAlert?: number;
  costPrice?: number;
  sellingPrice?: number;
  expiryDate?: string;
  status?: string;
}

/**
 * Helper function to convert Prisma Decimal to number
 */
function decimalToNumber(value: Decimal | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return value.toNumber();
}

/**
 * Supplier Info for inventory product
 */
interface SupplierInfo {
  id: string;
  code: string | null;
  name: string;
}

/**
 * Branch Info for inventory product
 */
interface BranchInfo {
  id: string;
  name: string;
  code: string | null;
}

/**
 * Inventory Product with relations type
 */
type InventoryProductWithRelations = InventoryProduct & {
  branch: Pick<Branch, 'id' | 'name' | 'code'>;
  supplier: Pick<Supplier, 'id' | 'code' | 'name'> | null;
};

/**
 * Inventory Product Response Interface
 */
interface InventoryProductResponse {
  id: string;
  name: string;
  image: string | null;
  inStock: number;
  quantitySold: number;
  restockAlert: number | null;
  costPrice: number;
  sellingPrice: number;
  expiryDate: Date | null;
  unit: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  branch: BranchInfo;
  supplier: SupplierInfo | null;
}

/**
 * Inventory Product List Response
 */
interface InventoryProductListResponse {
  inventoryProducts: InventoryProductResponse[];
  pagination: PaginationMeta;
}

/**
 * GET /api/v1/inventory/products
 * List all inventory products for the authenticated tenant
 * Requires tenant middleware
 * Supports filters: branchId, supplierId, status, lowStock (boolean)
 */
export async function listInventoryProducts(
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
          message: 'Tenant context is required to list inventory products',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Parse query parameters
    const {
      branchId,
      supplierId,
      status,
      lowStock,
      search,
      page = '1',
      limit = '10',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const whereClause: Prisma.InventoryProductWhereInput = {
      businessOwnerId: tenantId,
    };

    // Apply branch scope filter
    if (req.branchScope !== null && req.branchScope !== undefined) {
      if (branchId && typeof branchId === 'string') {
        // Validate requested branch is within user's scope
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
        whereClause.branchId = branchId;
      } else {
        whereClause.branchId = { in: req.branchScope };
      }
    } else if (branchId && typeof branchId === 'string') {
      whereClause.branchId = branchId;
    }

    // Filter by supplierId
    if (supplierId && typeof supplierId === 'string') {
      whereClause.supplierId = supplierId;
    }

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

    // Filter by lowStock (items where inStock <= restockAlert)
    if (lowStock === 'true') {
      // Use raw condition: inStock <= restockAlert
      // Prisma doesn't support comparing two columns directly, so we use a workaround
      // We'll filter in-memory after fetching, or use raw query
      // For better performance, we'll add the condition and filter in memory
      whereClause.restockAlert = {
        not: null,
      };
    }

    // Search filter (search by name)
    if (search && typeof search === 'string' && search.trim()) {
      const searchTerm = search.trim();
      whereClause.name = {
        contains: searchTerm,
        mode: 'insensitive',
      };
    }

    // Count total matching records
    // Note: If lowStock filter is active, we need to count after fetching
    let total: number;
    let inventoryProducts: InventoryProductWithRelations[];

    if (lowStock === 'true') {
      // Fetch all matching records first for low stock filtering
      const allProducts = await prisma.inventoryProduct.findMany({
        where: whereClause,
        include: {
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          supplier: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
        orderBy: [
          { name: 'asc' },
        ],
      });

      // Filter for low stock items (inStock <= restockAlert)
      const lowStockProducts = allProducts.filter((product) => {
        if (!product.restockAlert) return false;
        return product.inStock.lessThanOrEqualTo(product.restockAlert);
      });

      total = lowStockProducts.length;
      // Apply pagination to filtered results
      inventoryProducts = lowStockProducts.slice(skip, skip + limitNum);
    } else {
      // Normal pagination
      total = await prisma.inventoryProduct.count({
        where: whereClause,
      });

      inventoryProducts = await prisma.inventoryProduct.findMany({
        where: whereClause,
        include: {
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          supplier: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
        orderBy: [
          { name: 'asc' },
        ],
        skip,
        take: limitNum,
      });
    }

    // Transform to response format
    const inventoryProductResponses: InventoryProductResponse[] = inventoryProducts.map((product) => ({
      id: product.id,
      name: product.name,
      image: product.image,
      inStock: decimalToNumber(product.inStock) ?? 0,
      quantitySold: decimalToNumber(product.quantitySold) ?? 0,
      restockAlert: decimalToNumber(product.restockAlert),
      costPrice: decimalToNumber(product.costPrice) ?? 0,
      sellingPrice: decimalToNumber(product.sellingPrice) ?? 0,
      expiryDate: product.expiryDate,
      unit: product.unit,
      status: product.status,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      branch: {
        id: product.branch.id,
        name: product.branch.name,
        code: product.branch.code,
      },
      supplier: product.supplier
        ? {
            id: product.supplier.id,
            code: product.supplier.code,
            name: product.supplier.name,
          }
        : null,
    }));

    const totalPages = Math.ceil(total / limitNum);

    const response: ApiResponse<InventoryProductListResponse> = {
      success: true,
      data: {
        inventoryProducts: inventoryProductResponses,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
        },
      },
      message: 'Inventory products retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error listing inventory products:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve inventory products',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * POST /api/v1/inventory/products
 * Create a new inventory product
 * Requires tenant middleware
 * Required: name, branchId, unit
 * Optional: image, supplierId, inStock, restockAlert, costPrice, sellingPrice, expiryDate
 */
export async function createInventoryProduct(
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
          message: 'Tenant context is required to create an inventory product',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Extract fields from body
    const {
      name,
      branchId,
      unit,
      image,
      supplierId,
      inStock,
      restockAlert,
      costPrice,
      sellingPrice,
      expiryDate,
      status,
    } = req.body as CreateInventoryProductInput;

    // Validate required fields
    const missingFields: string[] = [];

    if (!name || typeof name !== 'string' || name.trim() === '') {
      missingFields.push('name');
    }

    if (!branchId || typeof branchId !== 'string') {
      missingFields.push('branchId');
    }

    if (!unit || typeof unit !== 'string' || unit.trim() === '') {
      missingFields.push('unit');
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

    // Validate branch exists and belongs to tenant
    const branch = await prisma.branch.findFirst({
      where: {
        id: branchId,
        businessOwnerId: tenantId,
      },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });

    if (!branch) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Branch not found or does not belong to your business',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Validate supplierId if provided
    let supplier: Pick<Supplier, 'id' | 'code' | 'name'> | null = null;
    if (supplierId) {
      supplier = await prisma.supplier.findFirst({
        where: {
          id: supplierId,
          businessOwnerId: tenantId,
        },
        select: {
          id: true,
          code: true,
          name: true,
        },
      });

      if (!supplier) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Supplier not found or does not belong to your business',
          },
        };
        res.status(400).json(response);
        return;
      }
    }

    // Validate status if provided
    const validStatuses = ['active', 'inactive'];
    const productStatus = status || 'active';
    if (!validStatuses.includes(productStatus)) {
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

    // Parse numeric values with defaults
    const inStockValue = inStock !== undefined && inStock !== null ? Number(inStock) : 0;
    const costPriceValue = costPrice !== undefined && costPrice !== null ? Number(costPrice) : 0;
    const sellingPriceValue = sellingPrice !== undefined && sellingPrice !== null ? Number(sellingPrice) : 0;
    const restockAlertValue = restockAlert !== undefined && restockAlert !== null ? Number(restockAlert) : null;

    // Validate numeric values
    if (isNaN(inStockValue) || inStockValue < 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'inStock must be a non-negative number',
        },
      };
      res.status(400).json(response);
      return;
    }

    if (isNaN(costPriceValue) || costPriceValue < 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'costPrice must be a non-negative number',
        },
      };
      res.status(400).json(response);
      return;
    }

    if (isNaN(sellingPriceValue) || sellingPriceValue < 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'sellingPrice must be a non-negative number',
        },
      };
      res.status(400).json(response);
      return;
    }

    if (restockAlertValue !== null && (isNaN(restockAlertValue) || restockAlertValue < 0)) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'restockAlert must be a non-negative number',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Parse expiry date if provided
    let parsedExpiryDate: Date | null = null;
    if (expiryDate) {
      parsedExpiryDate = new Date(expiryDate);
      if (isNaN(parsedExpiryDate.getTime())) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid expiryDate format',
          },
        };
        res.status(400).json(response);
        return;
      }
    }

    // Create inventory product
    const inventoryProduct = await prisma.inventoryProduct.create({
      data: {
        businessOwnerId: tenantId,
        branchId,
        name: name.trim(),
        image: image || null,
        supplierId: supplierId || null,
        inStock: inStockValue,
        quantitySold: 0,
        restockAlert: restockAlertValue,
        costPrice: costPriceValue,
        sellingPrice: sellingPriceValue,
        expiryDate: parsedExpiryDate,
        unit: unit.trim(),
        status: productStatus,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        supplier: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    // Transform to response format
    const inventoryProductResponse: InventoryProductResponse = {
      id: inventoryProduct.id,
      name: inventoryProduct.name,
      image: inventoryProduct.image,
      inStock: decimalToNumber(inventoryProduct.inStock) ?? 0,
      quantitySold: decimalToNumber(inventoryProduct.quantitySold) ?? 0,
      restockAlert: decimalToNumber(inventoryProduct.restockAlert),
      costPrice: decimalToNumber(inventoryProduct.costPrice) ?? 0,
      sellingPrice: decimalToNumber(inventoryProduct.sellingPrice) ?? 0,
      expiryDate: inventoryProduct.expiryDate,
      unit: inventoryProduct.unit,
      status: inventoryProduct.status,
      createdAt: inventoryProduct.createdAt,
      updatedAt: inventoryProduct.updatedAt,
      branch: {
        id: inventoryProduct.branch.id,
        name: inventoryProduct.branch.name,
        code: inventoryProduct.branch.code,
      },
      supplier: inventoryProduct.supplier
        ? {
            id: inventoryProduct.supplier.id,
            code: inventoryProduct.supplier.code,
            name: inventoryProduct.supplier.name,
          }
        : null,
    };

    const response: ApiResponse<InventoryProductResponse> = {
      success: true,
      data: inventoryProductResponse,
      message: 'Inventory product created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating inventory product:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create inventory product',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Input interface for updating inventory product
 */
interface UpdateInventoryProductInput {
  name?: string;
  branchId?: string;
  unit?: string;
  image?: string;
  supplierId?: string | null;
  inStock?: number;
  restockAlert?: number | null;
  costPrice?: number;
  sellingPrice?: number;
  expiryDate?: string | null;
  status?: string;
}

/**
 * PUT /api/v1/inventory/products/:id
 * Update an existing inventory product
 * Requires tenant middleware
 * All fields optional
 */
export async function updateInventoryProduct(
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
          message: 'Tenant context is required to update an inventory product',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Get product ID from route params
    const { id } = req.params;

    if (!id) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Product ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Find existing inventory product
    const existingProduct = await prisma.inventoryProduct.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
    });

    if (!existingProduct) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Inventory product not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Extract update fields from body
    const {
      name,
      branchId,
      unit,
      image,
      supplierId,
      inStock,
      restockAlert,
      costPrice,
      sellingPrice,
      expiryDate,
      status,
    } = req.body as UpdateInventoryProductInput;

    // Build update data object
    const updateData: Prisma.InventoryProductUpdateInput = {};

    // Validate and add name if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
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

    // Validate and add unit if provided
    if (unit !== undefined) {
      if (typeof unit !== 'string' || unit.trim() === '') {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Unit must be a non-empty string',
          },
        };
        res.status(400).json(response);
        return;
      }
      updateData.unit = unit.trim();
    }

    // Validate and add branchId if provided
    if (branchId !== undefined) {
      const branch = await prisma.branch.findFirst({
        where: {
          id: branchId,
          businessOwnerId: tenantId,
        },
        select: {
          id: true,
        },
      });

      if (!branch) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Branch not found or does not belong to your business',
          },
        };
        res.status(400).json(response);
        return;
      }
      updateData.branch = { connect: { id: branchId } };
    }

    // Validate and add supplierId if provided
    if (supplierId !== undefined) {
      if (supplierId === null) {
        // Disconnect supplier
        updateData.supplier = { disconnect: true };
      } else {
        const supplier = await prisma.supplier.findFirst({
          where: {
            id: supplierId,
            businessOwnerId: tenantId,
          },
          select: {
            id: true,
          },
        });

        if (!supplier) {
          const response: ApiResponse = {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Supplier not found or does not belong to your business',
            },
          };
          res.status(400).json(response);
          return;
        }
        updateData.supplier = { connect: { id: supplierId } };
      }
    }

    // Validate and add image if provided
    if (image !== undefined) {
      updateData.image = image || null;
    }

    // Validate and add inStock if provided
    if (inStock !== undefined) {
      const inStockValue = Number(inStock);
      if (isNaN(inStockValue) || inStockValue < 0) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'inStock must be a non-negative number',
          },
        };
        res.status(400).json(response);
        return;
      }
      updateData.inStock = inStockValue;
    }

    // Validate and add restockAlert if provided
    if (restockAlert !== undefined) {
      if (restockAlert === null) {
        updateData.restockAlert = null;
      } else {
        const restockAlertValue = Number(restockAlert);
        if (isNaN(restockAlertValue) || restockAlertValue < 0) {
          const response: ApiResponse = {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'restockAlert must be a non-negative number',
            },
          };
          res.status(400).json(response);
          return;
        }
        updateData.restockAlert = restockAlertValue;
      }
    }

    // Validate and add costPrice if provided
    if (costPrice !== undefined) {
      const costPriceValue = Number(costPrice);
      if (isNaN(costPriceValue) || costPriceValue < 0) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'costPrice must be a non-negative number',
          },
        };
        res.status(400).json(response);
        return;
      }
      updateData.costPrice = costPriceValue;
    }

    // Validate and add sellingPrice if provided
    if (sellingPrice !== undefined) {
      const sellingPriceValue = Number(sellingPrice);
      if (isNaN(sellingPriceValue) || sellingPriceValue < 0) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'sellingPrice must be a non-negative number',
          },
        };
        res.status(400).json(response);
        return;
      }
      updateData.sellingPrice = sellingPriceValue;
    }

    // Validate and add expiryDate if provided
    if (expiryDate !== undefined) {
      if (expiryDate === null) {
        updateData.expiryDate = null;
      } else {
        const parsedExpiryDate = new Date(expiryDate);
        if (isNaN(parsedExpiryDate.getTime())) {
          const response: ApiResponse = {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid expiryDate format',
            },
          };
          res.status(400).json(response);
          return;
        }
        updateData.expiryDate = parsedExpiryDate;
      }
    }

    // Validate and add status if provided
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
      updateData.status = status;
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'No fields to update',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Update inventory product
    const updatedProduct = await prisma.inventoryProduct.update({
      where: {
        id,
      },
      data: updateData,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        supplier: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    // Transform to response format
    const inventoryProductResponse: InventoryProductResponse = {
      id: updatedProduct.id,
      name: updatedProduct.name,
      image: updatedProduct.image,
      inStock: decimalToNumber(updatedProduct.inStock) ?? 0,
      quantitySold: decimalToNumber(updatedProduct.quantitySold) ?? 0,
      restockAlert: decimalToNumber(updatedProduct.restockAlert),
      costPrice: decimalToNumber(updatedProduct.costPrice) ?? 0,
      sellingPrice: decimalToNumber(updatedProduct.sellingPrice) ?? 0,
      expiryDate: updatedProduct.expiryDate,
      unit: updatedProduct.unit,
      status: updatedProduct.status,
      createdAt: updatedProduct.createdAt,
      updatedAt: updatedProduct.updatedAt,
      branch: {
        id: updatedProduct.branch.id,
        name: updatedProduct.branch.name,
        code: updatedProduct.branch.code,
      },
      supplier: updatedProduct.supplier
        ? {
            id: updatedProduct.supplier.id,
            code: updatedProduct.supplier.code,
            name: updatedProduct.supplier.name,
          }
        : null,
    };

    const response: ApiResponse<InventoryProductResponse> = {
      success: true,
      data: inventoryProductResponse,
      message: 'Inventory product updated successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating inventory product:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update inventory product',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Input interface for stock adjustment
 */
interface StockAdjustmentInput {
  adjustment: number;
  reason?: string;
}

/**
 * Response interface for stock adjustment
 */
interface StockAdjustmentResponse {
  id: string;
  name: string;
  oldStock: number;
  newStock: number;
  adjustment: number;
  reason: string | null;
  updatedAt: Date;
  branch: BranchInfo;
  supplier: SupplierInfo | null;
}

/**
 * PATCH /api/v1/inventory/products/:id/stock
 * Manually adjust stock levels for an inventory product
 * Requires tenant middleware
 * Required: adjustment (positive/negative number)
 * Optional: reason (string explaining the adjustment)
 * Logs adjustment to AuditLog with old/new values
 */
export async function adjustInventoryStock(
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
          message: 'Tenant context is required to adjust inventory stock',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Get product ID from route params
    const { id } = req.params;

    if (!id) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Product ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Extract adjustment data from body
    const { adjustment, reason } = req.body as StockAdjustmentInput;

    // Validate adjustment is provided and is a number
    if (adjustment === undefined || adjustment === null) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Adjustment value is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    const adjustmentValue = Number(adjustment);
    if (isNaN(adjustmentValue)) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Adjustment must be a number (positive or negative)',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Find existing inventory product
    const existingProduct = await prisma.inventoryProduct.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        supplier: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    if (!existingProduct) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Inventory product not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Calculate old and new stock values
    const oldStock = decimalToNumber(existingProduct.inStock) ?? 0;
    const newStock = oldStock + adjustmentValue;

    // Validate new stock is not negative
    if (newStock < 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Cannot reduce stock below zero. Current stock: ${oldStock}, Adjustment: ${adjustmentValue}`,
        },
      };
      res.status(400).json(response);
      return;
    }

    // Determine user type for audit log
    const userType = req.user?.userType as AuditUserType;
    const userId = req.user?.id;

    // Update stock, create stock adjustment record, and audit log in a transaction
    const [updatedProduct] = await prisma.$transaction([
      // Update inventory product stock
      prisma.inventoryProduct.update({
        where: {
          id,
        },
        data: {
          inStock: newStock,
        },
        include: {
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          supplier: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      }),
      // Create stock adjustment history record
      prisma.stockAdjustment.create({
        data: {
          inventoryProductId: id,
          businessOwnerId: tenantId,
          userId: userId || 'unknown',
          userType: userType || 'Staff',
          oldStock,
          newStock,
          adjustment: adjustmentValue,
          reason: reason?.trim() || null,
        },
      }),
      // Create audit log entry
      prisma.auditLog.create({
        data: {
          businessOwnerId: tenantId,
          userId: userId || 'unknown',
          userType: userType || 'Staff',
          action: 'STOCK_ADJUSTMENT',
          entityType: 'InventoryProduct',
          entityId: id,
          oldValue: {
            inStock: oldStock,
          },
          newValue: {
            inStock: newStock,
            adjustment: adjustmentValue,
            reason: reason?.trim() || null,
          },
        },
      }),
    ]);

    // Prepare response
    const stockAdjustmentResponse: StockAdjustmentResponse = {
      id: updatedProduct.id,
      name: updatedProduct.name,
      oldStock,
      newStock: decimalToNumber(updatedProduct.inStock) ?? 0,
      adjustment: adjustmentValue,
      reason: reason?.trim() || null,
      updatedAt: updatedProduct.updatedAt,
      branch: {
        id: updatedProduct.branch.id,
        name: updatedProduct.branch.name,
        code: updatedProduct.branch.code,
      },
      supplier: updatedProduct.supplier
        ? {
            id: updatedProduct.supplier.id,
            code: updatedProduct.supplier.code,
            name: updatedProduct.supplier.name,
          }
        : null,
    };

    const response: ApiResponse<StockAdjustmentResponse> = {
      success: true,
      data: stockAdjustmentResponse,
      message: `Stock adjusted successfully. ${adjustmentValue >= 0 ? 'Added' : 'Removed'} ${Math.abs(adjustmentValue)} units`,
    };

    res.json(response);
  } catch (error) {
    console.error('Error adjusting inventory stock:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to adjust inventory stock',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Low stock item response for grouping by branch
 */
interface LowStockItemResponse {
  id: string;
  name: string;
  image: string | null;
  inStock: number;
  restockAlert: number;
  shortage: number;
  unit: string | null;
  costPrice: number;
  sellingPrice: number;
  expiryDate: Date | null;
  status: string;
  supplier: SupplierInfo | null;
}

/**
 * Low stock grouped by branch
 */
interface LowStockByBranch {
  branch: BranchInfo;
  itemCount: number;
  items: LowStockItemResponse[];
}

/**
 * Low stock alert response
 */
interface LowStockAlertResponse {
  totalItems: number;
  branches: LowStockByBranch[];
}

/**
 * GET /api/v1/inventory/low-stock
 * Returns all items that need restocking (inStock <= restockAlert)
 * Grouped by branch for easy management
 * Includes supplier info for easy reordering
 * Requires tenant middleware
 */
export async function getLowStockAlerts(
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
          message: 'Tenant context is required to view low stock alerts',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Fetch all inventory products with restockAlert set
    // We need to filter in memory since Prisma doesn't support comparing two columns directly
    const allProducts = await prisma.inventoryProduct.findMany({
      where: {
        businessOwnerId: tenantId,
        restockAlert: {
          not: null,
        },
        status: 'active', // Only consider active products
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        supplier: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy: [
        { branch: { name: 'asc' } },
        { name: 'asc' },
      ],
    });

    // Filter for low stock items (inStock <= restockAlert)
    const lowStockProducts = allProducts.filter((product) => {
      if (!product.restockAlert) return false;
      return product.inStock.lessThanOrEqualTo(product.restockAlert);
    });

    // Group by branch
    const branchMap = new Map<string, {
      branch: BranchInfo;
      items: LowStockItemResponse[];
    }>();

    for (const product of lowStockProducts) {
      const branchId = product.branch.id;
      const inStock = decimalToNumber(product.inStock) ?? 0;
      const restockAlert = decimalToNumber(product.restockAlert) ?? 0;

      if (!branchMap.has(branchId)) {
        branchMap.set(branchId, {
          branch: {
            id: product.branch.id,
            name: product.branch.name,
            code: product.branch.code,
          },
          items: [],
        });
      }

      const branchData = branchMap.get(branchId)!;
      branchData.items.push({
        id: product.id,
        name: product.name,
        image: product.image,
        inStock,
        restockAlert,
        shortage: Math.max(0, restockAlert - inStock),
        unit: product.unit,
        costPrice: decimalToNumber(product.costPrice) ?? 0,
        sellingPrice: decimalToNumber(product.sellingPrice) ?? 0,
        expiryDate: product.expiryDate,
        status: product.status,
        supplier: product.supplier
          ? {
              id: product.supplier.id,
              code: product.supplier.code,
              name: product.supplier.name,
            }
          : null,
      });
    }

    // Convert map to array and sort by branch name
    const branchesArray: LowStockByBranch[] = Array.from(branchMap.values())
      .map((data) => ({
        branch: data.branch,
        itemCount: data.items.length,
        items: data.items,
      }))
      .sort((a, b) => a.branch.name.localeCompare(b.branch.name));

    const totalItems = lowStockProducts.length;

    const responseData: LowStockAlertResponse = {
      totalItems,
      branches: branchesArray,
    };

    const response: ApiResponse<LowStockAlertResponse> = {
      success: true,
      data: responseData,
      message: totalItems > 0
        ? `Found ${totalItems} item${totalItems === 1 ? '' : 's'} needing restock across ${branchesArray.length} branch${branchesArray.length === 1 ? '' : 'es'}`
        : 'No items currently need restocking',
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting low stock alerts:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve low stock alerts',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * DELETE /api/v1/inventory/products/:id
 * Delete an inventory product
 * Requires tenant middleware
 * Deletes associated image from S3
 * Prevents deletion if item is in pending PO
 */
export async function deleteInventoryProduct(
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
          message: 'Tenant context is required to delete an inventory product',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Get product ID from route params
    const { id } = req.params;

    if (!id) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Product ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Find existing inventory product
    const existingProduct = await prisma.inventoryProduct.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
      select: {
        id: true,
        name: true,
        image: true,
      },
    });

    if (!existingProduct) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Inventory product not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Check if item is in any pending purchase orders
    const pendingPOItems = await prisma.purchaseOrderItem.count({
      where: {
        inventoryProductId: id,
        purchaseOrder: {
          status: 'Pending',
        },
      },
    });

    if (pendingPOItems > 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'DELETION_NOT_ALLOWED',
          message: `Cannot delete inventory product. It is referenced in ${pendingPOItems} pending purchase order(s). Please approve, decline, or delete those purchase orders first.`,
        },
      };
      res.status(400).json(response);
      return;
    }

    // Delete the inventory product
    await prisma.inventoryProduct.delete({
      where: {
        id,
      },
    });

    // Delete associated image from S3 if it exists
    if (existingProduct.image) {
      const s3Key = extractKeyFromUrl(existingProduct.image);
      if (s3Key) {
        try {
          await deleteFromS3(s3Key);
        } catch (s3Error) {
          // Log S3 deletion error but don't fail the request
          // The database record is already deleted
          console.error('Error deleting image from S3:', s3Error);
        }
      }
    }

    const response: ApiResponse<{ id: string; name: string }> = {
      success: true,
      data: {
        id: existingProduct.id,
        name: existingProduct.name,
      },
      message: 'Inventory product deleted successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting inventory product:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete inventory product',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Import Inventory Products Response
 */
interface ImportInventoryProductsResponse {
  imported: number;
  failed: number;
  errors?: string[];
}

/**
 * POST /api/v1/inventory/products/import
 * Import inventory products from CSV file
 * CSV Format: Name, Branch, Supplier, Unit, In Stock, Restock Alert, Cost Price, Selling Price, Expiry Date, Status
 * Required columns: Name, Branch, Unit
 * Auto-creates branches and suppliers if they don't exist
 */
export async function importInventoryProducts(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<ImportInventoryProductsResponse>>
): Promise<void> {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse<ImportInventoryProductsResponse> = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Tenant context is required',
        },
      };
      res.status(401).json(response);
      return;
    }

    // Check if file was uploaded
    if (!req.file) {
      const response: ApiResponse<ImportInventoryProductsResponse> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'CSV file is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Parse CSV
    const { parseCSV, sanitizeCSVValue, parseCSVNumber } = await import('../services/import.service');
    const rows = await parseCSV(req.file.buffer);

    if (rows.length === 0) {
      const response: ApiResponse<ImportInventoryProductsResponse> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'CSV file is empty',
        },
      };
      res.status(400).json(response);
      return;
    }

    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 because CSV is 1-indexed and row 1 is header

      try {
        // Required fields
        const name = sanitizeCSVValue(row['Name'] || row['name']);
        const branchName = sanitizeCSVValue(row['Branch'] || row['branch']);
        const unit = sanitizeCSVValue(row['Unit'] || row['unit']);

        if (!name || !branchName || !unit) {
          errors.push(`Row ${rowNum}: Missing required fields (Name, Branch, Unit)`);
          failed++;
          continue;
        }

        // Find or create branch
        let branch = await prisma.branch.findFirst({
          where: {
            businessOwnerId: tenantId,
            name: branchName,
          },
        });

        if (!branch) {
          // Auto-create branch
          branch = await prisma.branch.create({
            data: {
              name: branchName,
              businessOwnerId: tenantId,
              code: `BR-${branchName.substring(0, 3).toUpperCase()}`,
              address: '',
              status: 'active',
            },
          });
        }

        // Find or create supplier (if provided)
        let supplierId: string | undefined = undefined;
        const supplierName = sanitizeCSVValue(row['Supplier'] || row['supplier']);

        if (supplierName) {
          let supplier = await prisma.supplier.findFirst({
            where: {
              businessOwnerId: tenantId,
              name: supplierName,
            },
          });

          if (!supplier) {
            // Auto-create supplier
            supplier = await prisma.supplier.create({
              data: {
                name: supplierName,
                businessOwnerId: tenantId,
                code: `SUP-${supplierName.substring(0, 3).toUpperCase()}`,
                phone: '0000000000', // Default phone number
                status: 'active',
              },
            });
          }

          supplierId = supplier.id;
        }

        // Optional fields
        const inStock = parseCSVNumber(row['In Stock'] || row['in stock'] || row['inStock'], 0);
        const restockAlert = parseCSVNumber(row['Restock Alert'] || row['restock alert'] || row['restockAlert'], 0);
        const costPrice = parseCSVNumber(row['Cost Price'] || row['cost price'] || row['costPrice'], 0);
        const sellingPrice = parseCSVNumber(row['Selling Price'] || row['selling price'] || row['sellingPrice'], 0);
        const expiryDateStr = sanitizeCSVValue(row['Expiry Date'] || row['expiry date'] || row['expiryDate']);
        const status = sanitizeCSVValue(row['Status'] || row['status'])?.toLowerCase() || 'active';

        // Parse expiry date if provided
        let expiryDate: Date | undefined = undefined;
        if (expiryDateStr) {
          const parsed = new Date(expiryDateStr);
          if (!isNaN(parsed.getTime())) {
            expiryDate = parsed;
          }
        }

        // Create inventory product
        await prisma.inventoryProduct.create({
          data: {
            name,
            branchId: branch.id,
            supplierId,
            unit,
            inStock,
            quantitySold: 0,
            restockAlert: restockAlert > 0 ? restockAlert : null,
            costPrice: new Prisma.Decimal(costPrice),
            sellingPrice: new Prisma.Decimal(sellingPrice),
            expiryDate,
            status,
            businessOwnerId: tenantId,
          },
        });

        imported++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Row ${rowNum}: ${errorMessage}`);
        failed++;
      }
    }

    const response: ApiResponse<ImportInventoryProductsResponse> = {
      success: true,
      data: {
        imported,
        failed,
        errors: errors.length > 0 ? errors : undefined,
      },
      message: `Import completed: ${imported} imported, ${failed} failed`,
    };

    res.json(response);
  } catch (error) {
    console.error('Error importing inventory products:', error);
    const response: ApiResponse<ImportInventoryProductsResponse> = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to import inventory products',
      },
    };
    res.status(500).json(response);
  }
}

// ============================================
// Stock Adjustment History & Undo
// ============================================

/**
 * Stock adjustment history item response
 */
interface StockAdjustmentHistoryItem {
  id: string;
  oldStock: number;
  newStock: number;
  adjustment: number;
  reason: string | null;
  undone: boolean;
  undoneAt: string | null;
  undoneBy: string | null;
  createdAt: string;
  userId: string;
  userType: string;
}

/**
 * Get stock adjustment history for an inventory product
 * GET /api/v1/inventory/products/:id/adjustments
 * Returns last 10 adjustments, most recent first
 */
export async function getStockAdjustmentHistory(
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
    if (!id) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Product ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Verify product belongs to tenant
    const product = await prisma.inventoryProduct.findFirst({
      where: { id, businessOwnerId: tenantId },
    });

    if (!product) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Inventory product not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Get last 10 adjustments, most recent first
    const adjustments = await prisma.stockAdjustment.findMany({
      where: {
        inventoryProductId: id,
        businessOwnerId: tenantId,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const historyItems: StockAdjustmentHistoryItem[] = adjustments.map((adj) => ({
      id: adj.id,
      oldStock: decimalToNumber(adj.oldStock) ?? 0,
      newStock: decimalToNumber(adj.newStock) ?? 0,
      adjustment: decimalToNumber(adj.adjustment) ?? 0,
      reason: adj.reason,
      undone: adj.undone,
      undoneAt: adj.undoneAt?.toISOString() || null,
      undoneBy: adj.undoneBy,
      createdAt: adj.createdAt.toISOString(),
      userId: adj.userId,
      userType: adj.userType,
    }));

    const response: ApiResponse<{ adjustments: StockAdjustmentHistoryItem[] }> = {
      success: true,
      data: { adjustments: historyItems },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching stock adjustment history:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch stock adjustment history',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Undo a stock adjustment
 * POST /api/v1/inventory/adjustments/:adjustmentId/undo
 * Reverses the adjustment by applying the opposite change
 * Logs the undo action in audit trail
 */
export async function undoStockAdjustment(
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

    const { adjustmentId } = req.params;
    if (!adjustmentId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Adjustment ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Find the adjustment
    const adjustment = await prisma.stockAdjustment.findFirst({
      where: {
        id: adjustmentId,
        businessOwnerId: tenantId,
      },
    });

    if (!adjustment) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Stock adjustment not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    if (adjustment.undone) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'ALREADY_UNDONE',
          message: 'This adjustment has already been undone',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Get current product stock
    const product = await prisma.inventoryProduct.findFirst({
      where: {
        id: adjustment.inventoryProductId,
        businessOwnerId: tenantId,
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        supplier: { select: { id: true, code: true, name: true } },
      },
    });

    if (!product) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Inventory product not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    const currentStock = decimalToNumber(product.inStock) ?? 0;
    const adjustmentValue = decimalToNumber(adjustment.adjustment) ?? 0;
    const reverseAdjustment = -adjustmentValue;
    const newStock = currentStock + reverseAdjustment;

    // Validate new stock is not negative
    if (newStock < 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Cannot undo: would result in negative stock. Current stock: ${currentStock}, Reverse adjustment: ${reverseAdjustment}`,
        },
      };
      res.status(400).json(response);
      return;
    }

    const userType = req.user?.userType as AuditUserType;
    const userId = req.user?.id || 'unknown';

    // Perform undo in a transaction
    const [updatedProduct] = await prisma.$transaction([
      // Update product stock
      prisma.inventoryProduct.update({
        where: { id: adjustment.inventoryProductId },
        data: { inStock: newStock },
        include: {
          branch: { select: { id: true, name: true, code: true } },
          supplier: { select: { id: true, code: true, name: true } },
        },
      }),
      // Mark adjustment as undone
      prisma.stockAdjustment.update({
        where: { id: adjustmentId },
        data: {
          undone: true,
          undoneAt: new Date(),
          undoneBy: userId,
        },
      }),
      // Create audit log for undo action
      prisma.auditLog.create({
        data: {
          businessOwnerId: tenantId,
          userId,
          userType: userType || 'Staff',
          action: 'STOCK_ADJUSTMENT_UNDO',
          entityType: 'InventoryProduct',
          entityId: adjustment.inventoryProductId,
          oldValue: { inStock: currentStock },
          newValue: {
            inStock: newStock,
            adjustment: reverseAdjustment,
            undoneAdjustmentId: adjustmentId,
          },
        },
      }),
    ]);

    const undoResponse: StockAdjustmentResponse = {
      id: updatedProduct.id,
      name: updatedProduct.name,
      oldStock: currentStock,
      newStock: decimalToNumber(updatedProduct.inStock) ?? 0,
      adjustment: reverseAdjustment,
      reason: `Undo: ${adjustment.reason || 'stock adjustment'}`,
      updatedAt: updatedProduct.updatedAt,
      branch: {
        id: updatedProduct.branch.id,
        name: updatedProduct.branch.name,
        code: updatedProduct.branch.code,
      },
      supplier: updatedProduct.supplier
        ? {
            id: updatedProduct.supplier.id,
            code: updatedProduct.supplier.code,
            name: updatedProduct.supplier.name,
          }
        : null,
    };

    const response: ApiResponse<StockAdjustmentResponse> = {
      success: true,
      data: undoResponse,
      message: `Stock adjustment undone. Reversed ${Math.abs(adjustmentValue)} units`,
    };

    res.json(response);
  } catch (error) {
    console.error('Error undoing stock adjustment:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to undo stock adjustment',
      },
    };
    res.status(500).json(response);
  }
}
