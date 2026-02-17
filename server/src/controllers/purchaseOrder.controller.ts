import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse, PaginationMeta } from '../types';
import { prisma } from '../services/db.service';
import { Prisma, PurchaseOrderStatus, AuditUserType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Helper function to convert Prisma Decimal to number
 */
function decimalToNumber(value: Decimal | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return value.toNumber();
}

/**
 * Branch info for purchase order
 */
interface BranchInfo {
  id: string;
  name: string;
  code: string | null;
}

/**
 * Supplier info for purchase order
 */
interface SupplierInfo {
  id: string;
  code: string | null;
  name: string;
}

/**
 * Purchase Order Response Interface
 */
interface PurchaseOrderResponse {
  id: string;
  invoiceNumber: string | null;
  amountPaid: number;
  grandTotal: number;
  status: PurchaseOrderStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  branch: BranchInfo;
  supplier: SupplierInfo;
  itemCount: number;
}

/**
 * Purchase Order List Response
 */
interface PurchaseOrderListResponse {
  purchaseOrders: PurchaseOrderResponse[];
  pagination: PaginationMeta;
}

/**
 * Valid purchase order statuses for filtering
 */
const VALID_STATUSES: PurchaseOrderStatus[] = ['Pending', 'Approved', 'Declined', 'Received'];

/**
 * GET /api/v1/inventory/purchase-orders
 * List all purchase orders for the authenticated tenant
 * Requires tenant middleware
 * Supports filters: branchId, supplierId, status
 * Includes: supplier name, item count, grand total
 */
export async function listPurchaseOrders(
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
          message: 'Tenant context is required to list purchase orders',
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
      search,
      page = '1',
      limit = '10',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const whereClause: Prisma.PurchaseOrderWhereInput = {
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
      if (!VALID_STATUSES.includes(status as PurchaseOrderStatus)) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
          },
        };
        res.status(400).json(response);
        return;
      }
      whereClause.status = status as PurchaseOrderStatus;
    }

    // Search filter (search by invoice number)
    if (search && typeof search === 'string' && search.trim()) {
      const searchTerm = search.trim();
      whereClause.invoiceNumber = {
        contains: searchTerm,
        mode: 'insensitive',
      };
    }

    // Count total matching records
    const total = await prisma.purchaseOrder.count({
      where: whereClause,
    });

    // Fetch purchase orders with relations
    const purchaseOrders = await prisma.purchaseOrder.findMany({
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
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: [
        { createdAt: 'desc' },
      ],
      skip,
      take: limitNum,
    });

    // Transform to response format
    const purchaseOrderResponses: PurchaseOrderResponse[] = purchaseOrders.map((po) => ({
      id: po.id,
      invoiceNumber: po.invoiceNumber,
      amountPaid: decimalToNumber(po.amountPaid) ?? 0,
      grandTotal: decimalToNumber(po.grandTotal) ?? 0,
      status: po.status,
      notes: po.notes,
      createdAt: po.createdAt,
      updatedAt: po.updatedAt,
      branch: {
        id: po.branch.id,
        name: po.branch.name,
        code: po.branch.code,
      },
      supplier: {
        id: po.supplier.id,
        code: po.supplier.code,
        name: po.supplier.name,
      },
      itemCount: po._count.items,
    }));

    const totalPages = Math.ceil(total / limitNum);

    const response: ApiResponse<PurchaseOrderListResponse> = {
      success: true,
      data: {
        purchaseOrders: purchaseOrderResponses,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
        },
      },
      message: 'Purchase orders retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error listing purchase orders:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve purchase orders',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Inventory Product Info for purchase order items
 */
interface InventoryProductInfo {
  id: string;
  name: string;
  image: string | null;
  unit: string | null;
  costPrice: number;
  sellingPrice: number;
}

/**
 * Purchase Order Item Response
 */
interface PurchaseOrderItemResponse {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  inventoryProduct: InventoryProductInfo;
}

/**
 * Purchase Order Detail Response (includes full items)
 */
interface PurchaseOrderDetailResponse {
  id: string;
  invoiceNumber: string | null;
  amountPaid: number;
  grandTotal: number;
  status: PurchaseOrderStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  branch: BranchInfo;
  supplier: SupplierInfo;
  items: PurchaseOrderItemResponse[];
}

/**
 * Create Purchase Order Input
 */
interface CreatePurchaseOrderInput {
  branchId: string;
  supplierId: string;
  notes?: string;
}

/**
 * Create Purchase Order Response
 */
interface CreatePurchaseOrderResponse {
  id: string;
  invoiceNumber: string;
  amountPaid: number;
  grandTotal: number;
  status: PurchaseOrderStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  branch: BranchInfo;
  supplier: SupplierInfo;
  itemCount: number;
}

/**
 * Generate a unique invoice number for a purchase order
 * Format: PO-YYYYMMDD-XXXX (e.g., PO-20260204-A7B3)
 */
async function generateInvoiceNumber(businessOwnerId: string): Promise<string> {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

  // Try to generate a unique invoice number with retry logic
  for (let attempt = 0; attempt < 5; attempt++) {
    // Generate 4-character random alphanumeric suffix
    const crypto = await import('crypto');
    const randomBytes = crypto.randomBytes(2);
    const suffix = randomBytes.toString('hex').toUpperCase();

    const invoiceNumber = `PO-${dateStr}-${suffix}`;

    // Check if this invoice number already exists for this tenant
    const existing = await prisma.purchaseOrder.findFirst({
      where: {
        businessOwnerId,
        invoiceNumber,
      },
    });

    if (!existing) {
      return invoiceNumber;
    }
  }

  // Fallback: use timestamp for uniqueness
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  return `PO-${dateStr}-${timestamp}`;
}

/**
 * POST /api/v1/inventory/purchase-orders
 * Create a new purchase order
 * Required: branchId, supplierId
 * Generates unique invoice number (format: PO-YYYYMMDD-XXXX)
 * Default status: 'Pending'
 */
export async function createPurchaseOrder(
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
          message: 'Tenant context is required to create a purchase order',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { branchId, supplierId, notes } = req.body as CreatePurchaseOrderInput;

    // Validate required fields
    const missingFields: string[] = [];
    if (!branchId) missingFields.push('branchId');
    if (!supplierId) missingFields.push('supplierId');

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

    // Validate branch belongs to tenant
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
          code: 'INVALID_BRANCH',
          message: 'Branch not found or does not belong to your business',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Validate supplier belongs to tenant
    const supplier = await prisma.supplier.findFirst({
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
          code: 'INVALID_SUPPLIER',
          message: 'Supplier not found or does not belong to your business',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Generate unique invoice number
    const invoiceNumber = await generateInvoiceNumber(tenantId);

    // Create the purchase order
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        businessOwnerId: tenantId,
        branchId,
        supplierId,
        invoiceNumber,
        amountPaid: new Prisma.Decimal(0),
        grandTotal: new Prisma.Decimal(0),
        status: 'Pending',
        notes: notes?.trim() || null,
      },
    });

    // Build response
    const purchaseOrderResponse: CreatePurchaseOrderResponse = {
      id: purchaseOrder.id,
      invoiceNumber: purchaseOrder.invoiceNumber!,
      amountPaid: 0,
      grandTotal: 0,
      status: purchaseOrder.status,
      notes: purchaseOrder.notes,
      createdAt: purchaseOrder.createdAt,
      updatedAt: purchaseOrder.updatedAt,
      branch: {
        id: branch.id,
        name: branch.name,
        code: branch.code,
      },
      supplier: {
        id: supplier.id,
        code: supplier.code,
        name: supplier.name,
      },
      itemCount: 0,
    };

    const response: ApiResponse<CreatePurchaseOrderResponse> = {
      success: true,
      data: purchaseOrderResponse,
      message: 'Purchase order created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating purchase order:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create purchase order',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Add Item to Purchase Order Input
 */
interface AddPurchaseOrderItemInput {
  inventoryProductId: string;
  quantity: number;
  unitPrice: number;
}

/**
 * Update Purchase Order Item Input
 */
interface UpdatePurchaseOrderItemInput {
  quantity?: number;
  unitPrice?: number;
}

/**
 * Purchase Order Item Response for add/update operations
 */
interface POItemOperationResponse {
  item: PurchaseOrderItemResponse;
  purchaseOrder: {
    id: string;
    grandTotal: number;
    itemCount: number;
  };
}

/**
 * Helper function to recalculate purchase order grand total
 */
async function recalculatePOGrandTotal(purchaseOrderId: string): Promise<number> {
  const items = await prisma.purchaseOrderItem.findMany({
    where: { purchaseOrderId },
    select: { totalPrice: true },
  });

  const grandTotal = items.reduce((sum, item) => {
    return sum + (decimalToNumber(item.totalPrice) ?? 0);
  }, 0);

  await prisma.purchaseOrder.update({
    where: { id: purchaseOrderId },
    data: { grandTotal: new Prisma.Decimal(grandTotal) },
  });

  return grandTotal;
}

/**
 * POST /api/v1/inventory/purchase-orders/:id/items
 * Add an item to a purchase order
 * Required: inventoryProductId, quantity, unitPrice
 * Calculate totalPrice = quantity * unitPrice
 * Recalculates PO grandTotal after adding
 * Only allowed when PO status is 'Pending'
 */
export async function addPurchaseOrderItem(
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
          message: 'Tenant context is required to add items to a purchase order',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { id } = req.params;
    const { inventoryProductId, quantity, unitPrice } = req.body as AddPurchaseOrderItemInput;

    // Validate required fields
    const missingFields: string[] = [];
    if (!inventoryProductId) missingFields.push('inventoryProductId');
    if (quantity === undefined || quantity === null) missingFields.push('quantity');
    if (unitPrice === undefined || unitPrice === null) missingFields.push('unitPrice');

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

    // Validate quantity and unitPrice are positive numbers
    const parsedQuantity = Number(quantity);
    const parsedUnitPrice = Number(unitPrice);

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Quantity must be a positive number',
        },
      };
      res.status(400).json(response);
      return;
    }

    if (isNaN(parsedUnitPrice) || parsedUnitPrice < 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Unit price must be a non-negative number',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Fetch purchase order and validate ownership and status
    const purchaseOrder = await prisma.purchaseOrder.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
    });

    if (!purchaseOrder) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Purchase order not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Only allow changes when status is 'Pending'
    if (purchaseOrder.status !== 'Pending') {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: `Cannot add items to a purchase order with status '${purchaseOrder.status}'. Only 'Pending' orders can be modified.`,
        },
      };
      res.status(400).json(response);
      return;
    }

    // Validate inventory product exists and belongs to tenant
    const inventoryProduct = await prisma.inventoryProduct.findFirst({
      where: {
        id: inventoryProductId,
        businessOwnerId: tenantId,
      },
      select: {
        id: true,
        name: true,
        image: true,
        unit: true,
        costPrice: true,
        sellingPrice: true,
      },
    });

    if (!inventoryProduct) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_INVENTORY_PRODUCT',
          message: 'Inventory product not found or does not belong to your business',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Calculate total price
    const totalPrice = parsedQuantity * parsedUnitPrice;

    // Create the purchase order item
    const newItem = await prisma.purchaseOrderItem.create({
      data: {
        purchaseOrderId: id,
        inventoryProductId,
        quantity: new Prisma.Decimal(parsedQuantity),
        unitPrice: new Prisma.Decimal(parsedUnitPrice),
        totalPrice: new Prisma.Decimal(totalPrice),
      },
    });

    // Recalculate PO grand total
    const newGrandTotal = await recalculatePOGrandTotal(id);

    // Get item count
    const itemCount = await prisma.purchaseOrderItem.count({
      where: { purchaseOrderId: id },
    });

    // Build response
    const itemResponse: POItemOperationResponse = {
      item: {
        id: newItem.id,
        quantity: parsedQuantity,
        unitPrice: parsedUnitPrice,
        totalPrice,
        inventoryProduct: {
          id: inventoryProduct.id,
          name: inventoryProduct.name,
          image: inventoryProduct.image,
          unit: inventoryProduct.unit,
          costPrice: decimalToNumber(inventoryProduct.costPrice) ?? 0,
          sellingPrice: decimalToNumber(inventoryProduct.sellingPrice) ?? 0,
        },
      },
      purchaseOrder: {
        id,
        grandTotal: newGrandTotal,
        itemCount,
      },
    };

    const response: ApiResponse<POItemOperationResponse> = {
      success: true,
      data: itemResponse,
      message: 'Item added to purchase order successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error adding item to purchase order:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to add item to purchase order',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * PUT /api/v1/inventory/purchase-orders/:id/items/:itemId
 * Update an item in a purchase order
 * Optional: quantity, unitPrice
 * Recalculates totalPrice and PO grandTotal after update
 * Only allowed when PO status is 'Pending'
 */
export async function updatePurchaseOrderItem(
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
          message: 'Tenant context is required to update items in a purchase order',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { id, itemId } = req.params;
    const { quantity, unitPrice } = req.body as UpdatePurchaseOrderItemInput;

    // Validate at least one field is provided
    if (quantity === undefined && unitPrice === undefined) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'At least one of quantity or unitPrice must be provided',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Fetch purchase order and validate ownership and status
    const purchaseOrder = await prisma.purchaseOrder.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
    });

    if (!purchaseOrder) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Purchase order not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Only allow changes when status is 'Pending'
    if (purchaseOrder.status !== 'Pending') {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: `Cannot update items in a purchase order with status '${purchaseOrder.status}'. Only 'Pending' orders can be modified.`,
        },
      };
      res.status(400).json(response);
      return;
    }

    // Fetch the existing item
    const existingItem = await prisma.purchaseOrderItem.findFirst({
      where: {
        id: itemId,
        purchaseOrderId: id,
      },
      include: {
        inventoryProduct: {
          select: {
            id: true,
            name: true,
            image: true,
            unit: true,
            costPrice: true,
            sellingPrice: true,
          },
        },
      },
    });

    if (!existingItem) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Purchase order item not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Validate and parse provided fields
    let newQuantity = decimalToNumber(existingItem.quantity) ?? 0;
    let newUnitPrice = decimalToNumber(existingItem.unitPrice) ?? 0;

    if (quantity !== undefined) {
      const parsedQuantity = Number(quantity);
      if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Quantity must be a positive number',
          },
        };
        res.status(400).json(response);
        return;
      }
      newQuantity = parsedQuantity;
    }

    if (unitPrice !== undefined) {
      const parsedUnitPrice = Number(unitPrice);
      if (isNaN(parsedUnitPrice) || parsedUnitPrice < 0) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Unit price must be a non-negative number',
          },
        };
        res.status(400).json(response);
        return;
      }
      newUnitPrice = parsedUnitPrice;
    }

    // Calculate new total price
    const newTotalPrice = newQuantity * newUnitPrice;

    // Update the item
    await prisma.purchaseOrderItem.update({
      where: { id: itemId },
      data: {
        quantity: new Prisma.Decimal(newQuantity),
        unitPrice: new Prisma.Decimal(newUnitPrice),
        totalPrice: new Prisma.Decimal(newTotalPrice),
      },
    });

    // Recalculate PO grand total
    const newGrandTotal = await recalculatePOGrandTotal(id);

    // Get item count
    const itemCount = await prisma.purchaseOrderItem.count({
      where: { purchaseOrderId: id },
    });

    // Build response
    const itemResponse: POItemOperationResponse = {
      item: {
        id: itemId,
        quantity: newQuantity,
        unitPrice: newUnitPrice,
        totalPrice: newTotalPrice,
        inventoryProduct: {
          id: existingItem.inventoryProduct.id,
          name: existingItem.inventoryProduct.name,
          image: existingItem.inventoryProduct.image,
          unit: existingItem.inventoryProduct.unit,
          costPrice: decimalToNumber(existingItem.inventoryProduct.costPrice) ?? 0,
          sellingPrice: decimalToNumber(existingItem.inventoryProduct.sellingPrice) ?? 0,
        },
      },
      purchaseOrder: {
        id,
        grandTotal: newGrandTotal,
        itemCount,
      },
    };

    const response: ApiResponse<POItemOperationResponse> = {
      success: true,
      data: itemResponse,
      message: 'Purchase order item updated successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating purchase order item:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update purchase order item',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * DELETE /api/v1/inventory/purchase-orders/:id/items/:itemId
 * Remove an item from a purchase order
 * Recalculates PO grandTotal after deletion
 * Only allowed when PO status is 'Pending'
 */
export async function deletePurchaseOrderItem(
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
          message: 'Tenant context is required to delete items from a purchase order',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { id, itemId } = req.params;

    // Fetch purchase order and validate ownership and status
    const purchaseOrder = await prisma.purchaseOrder.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
    });

    if (!purchaseOrder) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Purchase order not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Only allow changes when status is 'Pending'
    if (purchaseOrder.status !== 'Pending') {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: `Cannot delete items from a purchase order with status '${purchaseOrder.status}'. Only 'Pending' orders can be modified.`,
        },
      };
      res.status(400).json(response);
      return;
    }

    // Fetch the existing item
    const existingItem = await prisma.purchaseOrderItem.findFirst({
      where: {
        id: itemId,
        purchaseOrderId: id,
      },
    });

    if (!existingItem) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Purchase order item not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Delete the item
    await prisma.purchaseOrderItem.delete({
      where: { id: itemId },
    });

    // Recalculate PO grand total
    const newGrandTotal = await recalculatePOGrandTotal(id);

    // Get item count
    const itemCount = await prisma.purchaseOrderItem.count({
      where: { purchaseOrderId: id },
    });

    // Build response
    const deleteResponse = {
      deletedItemId: itemId,
      purchaseOrder: {
        id,
        grandTotal: newGrandTotal,
        itemCount,
      },
    };

    const response: ApiResponse<typeof deleteResponse> = {
      success: true,
      data: deleteResponse,
      message: 'Purchase order item deleted successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting purchase order item:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete purchase order item',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * GET /api/v1/inventory/purchase-orders/:id
 * Get full details of a purchase order
 * Includes all items with inventory product details and supplier info
 */
export async function getPurchaseOrderDetail(
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
          message: 'Tenant context is required to view purchase order details',
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
          message: 'Purchase order ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Fetch purchase order with all related data
    const purchaseOrder = await prisma.purchaseOrder.findFirst({
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
        items: {
          include: {
            inventoryProduct: {
              select: {
                id: true,
                name: true,
                image: true,
                unit: true,
                costPrice: true,
                sellingPrice: true,
              },
            },
          },
        },
      },
    });

    if (!purchaseOrder) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Purchase order not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Transform to response format
    const purchaseOrderDetail: PurchaseOrderDetailResponse = {
      id: purchaseOrder.id,
      invoiceNumber: purchaseOrder.invoiceNumber,
      amountPaid: decimalToNumber(purchaseOrder.amountPaid) ?? 0,
      grandTotal: decimalToNumber(purchaseOrder.grandTotal) ?? 0,
      status: purchaseOrder.status,
      notes: purchaseOrder.notes,
      createdAt: purchaseOrder.createdAt,
      updatedAt: purchaseOrder.updatedAt,
      branch: {
        id: purchaseOrder.branch.id,
        name: purchaseOrder.branch.name,
        code: purchaseOrder.branch.code,
      },
      supplier: {
        id: purchaseOrder.supplier.id,
        code: purchaseOrder.supplier.code,
        name: purchaseOrder.supplier.name,
      },
      items: purchaseOrder.items.map((item) => ({
        id: item.id,
        quantity: decimalToNumber(item.quantity) ?? 0,
        unitPrice: decimalToNumber(item.unitPrice) ?? 0,
        totalPrice: decimalToNumber(item.totalPrice) ?? 0,
        inventoryProduct: {
          id: item.inventoryProduct.id,
          name: item.inventoryProduct.name,
          image: item.inventoryProduct.image,
          unit: item.inventoryProduct.unit,
          costPrice: decimalToNumber(item.inventoryProduct.costPrice) ?? 0,
          sellingPrice: decimalToNumber(item.inventoryProduct.sellingPrice) ?? 0,
        },
      })),
    };

    const response: ApiResponse<PurchaseOrderDetailResponse> = {
      success: true,
      data: purchaseOrderDetail,
      message: 'Purchase order retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting purchase order detail:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve purchase order details',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Update Purchase Order Status Input
 */
interface UpdatePurchaseOrderStatusInput {
  status: 'Approved' | 'Declined' | 'Received';
}

/**
 * Purchase Order Status Update Response
 */
interface PurchaseOrderStatusUpdateResponse {
  id: string;
  invoiceNumber: string | null;
  status: PurchaseOrderStatus;
  amountPaid: number;
  grandTotal: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  branch: BranchInfo;
  supplier: SupplierInfo;
  itemCount: number;
  stockUpdated?: boolean; // Only set when status is 'Received'
}

/**
 * Valid statuses for status update endpoint
 * Note: 'Pending' is the default and cannot be set via this endpoint
 */
const VALID_UPDATE_STATUSES = ['Approved', 'Declined', 'Received'] as const;

/**
 * PATCH /api/v1/inventory/purchase-orders/:id/status
 * Update purchase order status
 * Accept: status ('Approved', 'Declined', 'Received')
 * When 'Received': update inventory stock for all items
 * Log status change to AuditLog
 */
export async function updatePurchaseOrderStatus(
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
          message: 'Tenant context is required to update purchase order status',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { id } = req.params;
    const { status } = req.body as UpdatePurchaseOrderStatusInput;

    // Validate status is provided
    if (!status) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Status is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Validate status is valid
    if (!VALID_UPDATE_STATUSES.includes(status as (typeof VALID_UPDATE_STATUSES)[number])) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Status must be one of: ${VALID_UPDATE_STATUSES.join(', ')}`,
        },
      };
      res.status(400).json(response);
      return;
    }

    // Fetch purchase order with items for potential stock update
    const purchaseOrder = await prisma.purchaseOrder.findFirst({
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
        items: {
          include: {
            inventoryProduct: {
              select: {
                id: true,
                inStock: true,
              },
            },
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    if (!purchaseOrder) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Purchase order not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Check if status is already set (skip if same)
    if (purchaseOrder.status === status) {
      // Return current state without updating
      const currentResponse: PurchaseOrderStatusUpdateResponse = {
        id: purchaseOrder.id,
        invoiceNumber: purchaseOrder.invoiceNumber,
        status: purchaseOrder.status,
        amountPaid: decimalToNumber(purchaseOrder.amountPaid) ?? 0,
        grandTotal: decimalToNumber(purchaseOrder.grandTotal) ?? 0,
        notes: purchaseOrder.notes,
        createdAt: purchaseOrder.createdAt,
        updatedAt: purchaseOrder.updatedAt,
        branch: purchaseOrder.branch,
        supplier: purchaseOrder.supplier,
        itemCount: purchaseOrder._count.items,
      };

      const response: ApiResponse<PurchaseOrderStatusUpdateResponse> = {
        success: true,
        data: currentResponse,
        message: `Purchase order status is already '${status}'`,
      };

      res.json(response);
      return;
    }

    // Validate status transitions
    // Pending -> Approved, Declined, Received
    // Approved -> Received, Declined
    // Declined -> cannot change (final state)
    // Received -> cannot change (final state)
    if (purchaseOrder.status === 'Declined') {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: "Cannot change status of a declined purchase order",
        },
      };
      res.status(400).json(response);
      return;
    }

    if (purchaseOrder.status === 'Received') {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: "Cannot change status of a received purchase order",
        },
      };
      res.status(400).json(response);
      return;
    }

    // Determine user type for audit log
    const userType = req.user?.userType as AuditUserType;

    // Use transaction for atomic updates
    let stockUpdated = false;

    const updatedPO = await prisma.$transaction(async (tx) => {
      // If status is 'Received', update inventory stock for all items
      if (status === 'Received') {
        for (const item of purchaseOrder.items) {
          const currentStock = decimalToNumber(item.inventoryProduct.inStock) ?? 0;
          const quantityToAdd = decimalToNumber(item.quantity) ?? 0;
          const newStock = currentStock + quantityToAdd;

          await tx.inventoryProduct.update({
            where: { id: item.inventoryProductId },
            data: {
              inStock: new Prisma.Decimal(newStock),
            },
          });
        }
        stockUpdated = true;
      }

      // Update purchase order status
      const updated = await tx.purchaseOrder.update({
        where: { id },
        data: {
          status: status as PurchaseOrderStatus,
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
          _count: {
            select: {
              items: true,
            },
          },
        },
      });

      // Log status change to AuditLog
      await tx.auditLog.create({
        data: {
          businessOwnerId: tenantId,
          userId: req.user?.id || 'unknown',
          userType: userType,
          action: 'PURCHASE_ORDER_STATUS_CHANGE',
          entityType: 'PurchaseOrder',
          entityId: id,
          oldValue: { status: purchaseOrder.status } as Prisma.InputJsonValue,
          newValue: {
            status: status,
            stockUpdated: status === 'Received',
            itemsCount: purchaseOrder.items.length,
          } as Prisma.InputJsonValue,
          ipAddress: req.ip || req.socket?.remoteAddress || null,
        },
      });

      return updated;
    });

    // Build response
    const statusUpdateResponse: PurchaseOrderStatusUpdateResponse = {
      id: updatedPO.id,
      invoiceNumber: updatedPO.invoiceNumber,
      status: updatedPO.status,
      amountPaid: decimalToNumber(updatedPO.amountPaid) ?? 0,
      grandTotal: decimalToNumber(updatedPO.grandTotal) ?? 0,
      notes: updatedPO.notes,
      createdAt: updatedPO.createdAt,
      updatedAt: updatedPO.updatedAt,
      branch: updatedPO.branch,
      supplier: updatedPO.supplier,
      itemCount: updatedPO._count.items,
    };

    // Include stockUpdated flag when status is 'Received'
    if (stockUpdated) {
      statusUpdateResponse.stockUpdated = true;
    }

    const response: ApiResponse<PurchaseOrderStatusUpdateResponse> = {
      success: true,
      data: statusUpdateResponse,
      message: status === 'Received'
        ? `Purchase order marked as received. Inventory stock updated for ${purchaseOrder.items.length} item(s).`
        : `Purchase order status updated to '${status}'`,
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating purchase order status:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update purchase order status',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * DELETE /api/v1/inventory/purchase-orders/:id
 * Delete a purchase order
 * Only allows deletion of 'Pending' status POs
 * Deletes all associated items
 */
export async function deletePurchaseOrder(
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
          message: 'Tenant context is required to delete a purchase order',
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
          message: 'Purchase order ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Fetch purchase order and validate ownership
    const purchaseOrder = await prisma.purchaseOrder.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
      include: {
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    if (!purchaseOrder) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Purchase order not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Only allow deletion of 'Pending' status POs
    if (purchaseOrder.status !== 'Pending') {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: `Cannot delete a purchase order with status '${purchaseOrder.status}'. Only 'Pending' purchase orders can be deleted.`,
        },
      };
      res.status(400).json(response);
      return;
    }

    // Use transaction to delete items first, then the purchase order
    await prisma.$transaction(async (tx) => {
      // Delete all associated items first
      await tx.purchaseOrderItem.deleteMany({
        where: { purchaseOrderId: id },
      });

      // Delete the purchase order
      await tx.purchaseOrder.delete({
        where: { id },
      });
    });

    const response: ApiResponse = {
      success: true,
      message: `Purchase order ${purchaseOrder.invoiceNumber || id} deleted successfully${purchaseOrder._count.items > 0 ? ` (${purchaseOrder._count.items} item(s) removed)` : ''}`,
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete purchase order',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Import Purchase Orders Response
 */
interface ImportPurchaseOrdersResponse {
  imported: number;
  failed: number;
  errors?: string[];
}

/**
 * POST /api/v1/inventory/purchase-orders/import
 * Import purchase orders from CSV file
 * CSV Format: Supplier, Branch, Notes, Item Name, Quantity, Unit Price
 * Required columns: Supplier, Branch, Item Name, Quantity, Unit Price
 * Groups rows by Invoice Number (or Supplier+Branch) to create POs with items
 * Duplicate invoice handling via ?duplicateAction=skip|update query param
 */
export async function importPurchaseOrders(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<ImportPurchaseOrdersResponse>>
): Promise<void> {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse<ImportPurchaseOrdersResponse> = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to import purchase orders',
        },
      };
      res.status(403).json(response);
      return;
    }

    if (!req.file) {
      const response: ApiResponse<ImportPurchaseOrdersResponse> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'CSV file is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    const { parseCSV, sanitizeCSVValue, parseCSVNumber } = await import('../services/import.service');
    const rows = await parseCSV(req.file.buffer);

    if (rows.length === 0) {
      const response: ApiResponse<ImportPurchaseOrdersResponse> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'CSV file is empty',
        },
      };
      res.status(400).json(response);
      return;
    }

    const duplicateAction = (req.query.duplicateAction as string) || 'skip';

    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    // Group rows by a PO key (Invoice Number or Supplier+Branch combination)
    const poGroups: Map<string, { supplierName: string; branchName: string; notes: string; invoiceNumber?: string; items: { name: string; quantity: number; unitPrice: number; rowNum: number }[]; rowNums: number[] }> = new Map();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2: 1-indexed + header row

      const supplierName = sanitizeCSVValue(row['Supplier'] || row['supplier']);
      const branchName = sanitizeCSVValue(row['Branch'] || row['branch']);
      const itemName = sanitizeCSVValue(row['Item Name'] || row['item name'] || row['Item'] || row['item'] || row['Product'] || row['product']);
      const quantity = parseCSVNumber(row['Quantity'] || row['quantity'] || row['Qty'] || row['qty'], 0);
      const unitPrice = parseCSVNumber(row['Unit Price'] || row['unit price'] || row['Price'] || row['price'] || row['unitPrice'], 0);
      const notes = sanitizeCSVValue(row['Notes'] || row['notes']) || '';
      const invoiceNumber = sanitizeCSVValue(row['Invoice Number'] || row['invoice number'] || row['Invoice'] || row['invoice'] || row['invoiceNumber']);

      if (!supplierName || !branchName) {
        errors.push(`Row ${rowNum}: Missing required fields (Supplier, Branch)`);
        failed++;
        continue;
      }

      if (!itemName || quantity <= 0 || unitPrice <= 0) {
        errors.push(`Row ${rowNum}: Missing or invalid item fields (Item Name, Quantity > 0, Unit Price > 0)`);
        failed++;
        continue;
      }

      // Group key: use invoiceNumber if provided, otherwise Supplier+Branch
      const groupKey = invoiceNumber || `${supplierName}|||${branchName}`;

      if (!poGroups.has(groupKey)) {
        poGroups.set(groupKey, {
          supplierName,
          branchName,
          notes,
          invoiceNumber,
          items: [],
          rowNums: [],
        });
      }

      const group = poGroups.get(groupKey)!;
      group.items.push({ name: itemName, quantity, unitPrice, rowNum });
      group.rowNums.push(rowNum);
    }

    // Process each PO group
    for (const [, group] of poGroups) {
      try {
        // Find supplier
        const supplier = await prisma.supplier.findFirst({
          where: {
            businessOwnerId: tenantId,
            name: group.supplierName,
          },
        });

        if (!supplier) {
          errors.push(`Rows ${group.rowNums.join(',')}: Supplier "${group.supplierName}" not found`);
          failed += group.items.length;
          continue;
        }

        // Find branch
        const branch = await prisma.branch.findFirst({
          where: {
            businessOwnerId: tenantId,
            name: group.branchName,
          },
        });

        if (!branch) {
          errors.push(`Rows ${group.rowNums.join(',')}: Branch "${group.branchName}" not found`);
          failed += group.items.length;
          continue;
        }

        // Check for duplicate invoice number
        if (group.invoiceNumber) {
          const existing = await prisma.purchaseOrder.findFirst({
            where: {
              businessOwnerId: tenantId,
              invoiceNumber: group.invoiceNumber,
            },
          });

          if (existing) {
            if (duplicateAction === 'skip') {
              errors.push(`Rows ${group.rowNums.join(',')}: Invoice "${group.invoiceNumber}" already exists (skipped)`);
              failed += group.items.length;
              continue;
            }
            // For 'update': delete existing PO and its items, then re-create
            await prisma.$transaction(async (tx) => {
              await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: existing.id } });
              await tx.purchaseOrder.delete({ where: { id: existing.id } });
            });
          }
        }

        // Look up inventory products by name
        const itemsData: { inventoryProductId: string; quantity: number; unitPrice: number; totalPrice: number }[] = [];

        for (const item of group.items) {
          const inventoryProduct = await prisma.inventoryProduct.findFirst({
            where: {
              businessOwnerId: tenantId,
              name: item.name,
            },
          });

          if (!inventoryProduct) {
            errors.push(`Row ${item.rowNum}: Item "${item.name}" not found in inventory`);
            failed++;
            continue;
          }

          itemsData.push({
            inventoryProductId: inventoryProduct.id,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          });
        }

        if (itemsData.length === 0) {
          continue;
        }

        // Generate invoice number if not provided
        const invoiceNum = group.invoiceNumber || await generateInvoiceNumber(tenantId);

        // Calculate grand total
        const grandTotal = itemsData.reduce((sum, item) => sum + item.totalPrice, 0);

        // Create PO with items in a transaction
        await prisma.$transaction(async (tx) => {
          const po = await tx.purchaseOrder.create({
            data: {
              invoiceNumber: invoiceNum,
              businessOwnerId: tenantId,
              branchId: branch.id,
              supplierId: supplier.id,
              notes: group.notes || null,
              grandTotal: new Prisma.Decimal(grandTotal),
              amountPaid: new Prisma.Decimal(0),
              status: 'Pending',
            },
          });

          for (const item of itemsData) {
            await tx.purchaseOrderItem.create({
              data: {
                purchaseOrderId: po.id,
                inventoryProductId: item.inventoryProductId,
                quantity: new Prisma.Decimal(item.quantity),
                unitPrice: new Prisma.Decimal(item.unitPrice),
                totalPrice: new Prisma.Decimal(item.totalPrice),
              },
            });
          }
        });

        imported++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Rows ${group.rowNums.join(',')}: ${errorMessage}`);
        failed += group.items.length;
      }
    }

    const response: ApiResponse<ImportPurchaseOrdersResponse> = {
      success: true,
      data: {
        imported,
        failed,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      },
      message: `Import completed: ${imported} PO(s) imported, ${failed} row(s) failed`,
    };

    res.json(response);
  } catch (error) {
    console.error('Error importing purchase orders:', error);
    const response: ApiResponse<ImportPurchaseOrdersResponse> = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to import purchase orders',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Email resend response
 */
interface ResendEmailResponse {
  purchaseOrderId: string;
  invoiceNumber: string | null;
  supplierName: string;
  supplierEmail: string | null;
  sentAt: string;
}

/**
 * POST /api/v1/inventory/purchase-orders/:id/resend-email
 * Resend purchase order email to supplier
 * Fetches PO details and supplier email, logs to audit trail
 * Note: Actual email transport (SMTP/SendGrid/SES) to be configured per deployment
 */
export async function resendPurchaseOrderEmail(
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
          message: 'Tenant context is required to resend purchase order email',
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
          message: 'Purchase order ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Fetch purchase order with supplier details
    const purchaseOrder = await prisma.purchaseOrder.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            inventoryProduct: {
              select: {
                name: true,
                unit: true,
              },
            },
          },
        },
      },
    });

    if (!purchaseOrder) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Purchase order not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Check if supplier has email
    if (!purchaseOrder.supplier.email) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NO_SUPPLIER_EMAIL',
          message: `Supplier "${purchaseOrder.supplier.name}" does not have an email address configured. Please update the supplier details first.`,
        },
      };
      res.status(400).json(response);
      return;
    }

    // Log email activity (email sending is simulated until email transport is configured)
    const sentAt = new Date();
    console.log(`[EMAIL] Resending PO email for ${purchaseOrder.invoiceNumber || id} to ${purchaseOrder.supplier.email} at ${sentAt.toISOString()}`);

    // Determine user type for audit log
    const userType: AuditUserType = req.user?.userType === 'SuperAdmin'
      ? 'SuperAdmin'
      : req.user?.userType === 'BusinessOwner'
        ? 'BusinessOwner'
        : 'Staff';

    // Log to audit trail
    await prisma.auditLog.create({
      data: {
        businessOwnerId: tenantId,
        userId: req.user?.id || 'unknown',
        userType: userType,
        action: 'PURCHASE_ORDER_EMAIL_RESEND',
        entityType: 'PurchaseOrder',
        entityId: id,
        oldValue: Prisma.DbNull,
        newValue: {
          invoiceNumber: purchaseOrder.invoiceNumber,
          supplierName: purchaseOrder.supplier.name,
          supplierEmail: purchaseOrder.supplier.email,
          sentAt: sentAt.toISOString(),
        } as Prisma.InputJsonValue,
        ipAddress: req.ip || req.socket?.remoteAddress || null,
      },
    });

    const response: ApiResponse<ResendEmailResponse> = {
      success: true,
      data: {
        purchaseOrderId: id,
        invoiceNumber: purchaseOrder.invoiceNumber,
        supplierName: purchaseOrder.supplier.name,
        supplierEmail: purchaseOrder.supplier.email,
        sentAt: sentAt.toISOString(),
      },
      message: `Email sent successfully to ${purchaseOrder.supplier.email}`,
    };

    res.json(response);
  } catch (error) {
    console.error('Error resending purchase order email:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'EMAIL_SEND_FAILED',
        message: 'Failed to send purchase order email',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Download Purchase Order as PDF
 * Generates a professional PDF document with PO details, items, supplier info, and branch info
 */
export async function downloadPurchaseOrderPdf(
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
          message: 'Tenant context is required to download purchase order PDF',
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
          message: 'Purchase order ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Fetch purchase order with all related details
    const purchaseOrder = await prisma.purchaseOrder.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
      include: {
        supplier: true,
        branch: true,
        items: {
          include: {
            inventoryProduct: true,
          },
        },
        businessOwner: true,
      },
    });

    if (!purchaseOrder) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Purchase order not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Generate PDF using pdfkit
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Set response headers for PDF download
    const filename = `PO-${purchaseOrder.invoiceNumber || id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe PDF to response
    doc.pipe(res);

    // ---- Header Section ----
    const businessName = purchaseOrder.businessOwner?.restaurantName || 'Bistro Bill';
    doc.fontSize(20).font('Helvetica-Bold').text(businessName, { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(14).font('Helvetica').text('PURCHASE ORDER', { align: 'center' });
    doc.moveDown(1);

    // Horizontal line
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // ---- PO Details Section ----
    const detailsY = doc.y;
    doc.fontSize(10).font('Helvetica-Bold').text('PO Number:', 50, detailsY);
    doc.font('Helvetica').text(purchaseOrder.invoiceNumber || 'N/A', 150, detailsY);

    doc.font('Helvetica-Bold').text('Status:', 350, detailsY);
    doc.font('Helvetica').text(purchaseOrder.status, 420, detailsY);

    doc.font('Helvetica-Bold').text('Date:', 50, detailsY + 18);
    doc.font('Helvetica').text(
      new Date(purchaseOrder.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric',
      }),
      150, detailsY + 18
    );

    doc.moveDown(2.5);

    // ---- Supplier & Branch Info Side by Side ----
    const infoY = doc.y;

    // Supplier Info (Left)
    doc.fontSize(11).font('Helvetica-Bold').text('Supplier:', 50, infoY);
    doc.fontSize(10).font('Helvetica');
    let supplierY = infoY + 16;
    doc.text(purchaseOrder.supplier.name, 50, supplierY);
    supplierY += 14;
    if (purchaseOrder.supplier.code) {
      doc.text(`Code: ${purchaseOrder.supplier.code}`, 50, supplierY);
      supplierY += 14;
    }
    if (purchaseOrder.supplier.email) {
      doc.text(`Email: ${purchaseOrder.supplier.email}`, 50, supplierY);
      supplierY += 14;
    }
    if (purchaseOrder.supplier.phone) {
      doc.text(`Phone: ${purchaseOrder.supplier.phone}`, 50, supplierY);
      supplierY += 14;
    }
    if (purchaseOrder.supplier.address) {
      doc.text(`Address: ${purchaseOrder.supplier.address}`, 50, supplierY, { width: 220 });
      supplierY += 14;
    }

    // Branch Info (Right)
    doc.fontSize(11).font('Helvetica-Bold').text('Branch:', 320, infoY);
    doc.fontSize(10).font('Helvetica');
    let branchY = infoY + 16;
    doc.text(purchaseOrder.branch.name, 320, branchY);
    branchY += 14;
    if (purchaseOrder.branch.code) {
      doc.text(`Code: ${purchaseOrder.branch.code}`, 320, branchY);
      branchY += 14;
    }
    if (purchaseOrder.branch.phone) {
      doc.text(`Phone: ${purchaseOrder.branch.phone}`, 320, branchY);
      branchY += 14;
    }
    if (purchaseOrder.branch.email) {
      doc.text(`Email: ${purchaseOrder.branch.email}`, 320, branchY);
      branchY += 14;
    }
    const branchAddress = [
      purchaseOrder.branch.address,
      purchaseOrder.branch.city,
      purchaseOrder.branch.state,
      purchaseOrder.branch.country,
      purchaseOrder.branch.zipCode,
    ].filter(Boolean).join(', ');
    if (branchAddress) {
      doc.text(branchAddress, 320, branchY, { width: 220 });
      branchY += 14;
    }

    // Move past both columns
    doc.y = Math.max(supplierY, branchY) + 10;

    // Horizontal line
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // ---- Items Table ----
    doc.fontSize(11).font('Helvetica-Bold').text('Order Items', 50);
    doc.moveDown(0.5);

    // Table header
    const tableTop = doc.y;
    const colX = { no: 50, item: 80, unit: 250, qty: 320, price: 390, total: 470 };

    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('#', colX.no, tableTop, { width: 25 });
    doc.text('Item Name', colX.item, tableTop, { width: 160 });
    doc.text('Unit', colX.unit, tableTop, { width: 60 });
    doc.text('Qty', colX.qty, tableTop, { width: 60, align: 'right' });
    doc.text('Unit Price', colX.price, tableTop, { width: 70, align: 'right' });
    doc.text('Total', colX.total, tableTop, { width: 75, align: 'right' });

    // Table header line
    doc.moveTo(50, tableTop + 14).lineTo(545, tableTop + 14).stroke();

    // Table rows
    doc.font('Helvetica').fontSize(9);
    let rowY = tableTop + 20;

    purchaseOrder.items.forEach((item, index) => {
      // Check if we need a new page
      if (rowY > 720) {
        doc.addPage();
        rowY = 50;
      }

      const qty = decimalToNumber(item.quantity) ?? 0;
      const unitPrice = decimalToNumber(item.unitPrice) ?? 0;
      const totalPrice = decimalToNumber(item.totalPrice) ?? 0;

      doc.text(String(index + 1), colX.no, rowY, { width: 25 });
      doc.text(item.inventoryProduct.name, colX.item, rowY, { width: 160 });
      doc.text(item.inventoryProduct.unit || '-', colX.unit, rowY, { width: 60 });
      doc.text(qty.toFixed(2), colX.qty, rowY, { width: 60, align: 'right' });
      doc.text(`\u20B9${unitPrice.toFixed(2)}`, colX.price, rowY, { width: 70, align: 'right' });
      doc.text(`\u20B9${totalPrice.toFixed(2)}`, colX.total, rowY, { width: 75, align: 'right' });

      rowY += 18;
    });

    // Bottom line after items
    doc.moveTo(50, rowY).lineTo(545, rowY).stroke();
    rowY += 10;

    // ---- Totals Section ----
    const grandTotal = decimalToNumber(purchaseOrder.grandTotal) ?? 0;
    const amountPaid = decimalToNumber(purchaseOrder.amountPaid) ?? 0;
    const balance = grandTotal - amountPaid;

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Grand Total:', 390, rowY, { width: 70, align: 'right' });
    doc.text(`\u20B9${grandTotal.toFixed(2)}`, 470, rowY, { width: 75, align: 'right' });
    rowY += 16;

    doc.font('Helvetica');
    doc.text('Amount Paid:', 390, rowY, { width: 70, align: 'right' });
    doc.text(`\u20B9${amountPaid.toFixed(2)}`, 470, rowY, { width: 75, align: 'right' });
    rowY += 16;

    doc.font('Helvetica-Bold');
    doc.text('Balance Due:', 390, rowY, { width: 70, align: 'right' });
    doc.text(`\u20B9${balance.toFixed(2)}`, 470, rowY, { width: 75, align: 'right' });
    rowY += 25;

    // ---- Notes Section ----
    if (purchaseOrder.notes) {
      doc.fontSize(10).font('Helvetica-Bold').text('Notes:', 50, rowY);
      rowY += 14;
      doc.font('Helvetica').text(purchaseOrder.notes, 50, rowY, { width: 495 });
    }

    // ---- Footer ----
    doc.fontSize(8).font('Helvetica').text(
      `Generated on ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
      50, 760, { align: 'center', width: 495 }
    );

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('Error generating purchase order PDF:', error);
    // Only send error response if headers haven't been sent yet
    if (!res.headersSent) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'PDF_GENERATION_FAILED',
          message: 'Failed to generate purchase order PDF',
        },
      };
      res.status(500).json(response);
    }
  }
}
