import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { prisma } from '../services/db.service';
import { cacheService } from '../services/cache.service';
import { Prisma, OrderType } from '@prisma/client';
import { connectionManager } from '../websocket/connectionManager';
import { WebSocketEventType, OrderCreatedPayload, OrderUpdatedPayload, TableStatusChangedPayload, PaymentReceivedPayload } from '../types/websocket.types';
import { broadcastDashboardMetrics } from '../services/websocket.metrics.service';
import { syncInvoice as syncTallyInvoice } from '../services/integrations/tally.service';
import { syncInvoice as syncQuickBooksInvoice } from '../services/integrations/quickbooks.service';
import { syncInvoice as syncZohoInvoice } from '../services/integrations/zohoBooks.service';
import { calculateOrderTax } from '../services/tax.service';
import { calculateOrderCharges, updateOrderCharges } from '../services/charges.service';

/**
 * GET /api/v1/pos/products
 * Get active products for POS with variants, addons, and pricing
 */
export const getPOSProducts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.businessOwnerId;
    const { branchId, categoryId, channelType = 'DineIn' } = req.query;

    // Validate branchId if provided
    if (branchId) {
      const branch = await prisma.branch.findFirst({
        where: {
          id: branchId as string,
          businessOwnerId: tenantId,
        },
      });

      if (!branch) {
        res.status(404).json({
          success: false,
          error: {
            code: 'BRANCH_NOT_FOUND',
            message: 'Branch not found',
          },
        } as ApiResponse);
        return;
      }
    }

    // Build query filters
    const whereClause: Prisma.ProductWhereInput = {
      businessOwnerId: tenantId,
      status: 'active',
    };

    if (categoryId) {
      whereClause.categoryId = categoryId as string;
    }

    // Fetch active products with related data
    const products: any = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            sortOrder: true,
          },
        },
        subCategory: {
          select: {
            id: true,
            name: true,
          },
        },
        variants: {
          where: {
            status: 'active',
          },
          orderBy: {
            additionalPrice: 'asc',
          },
        },
        addons: {
          where: {
            status: 'active',
          },
          orderBy: {
            price: 'asc',
          },
        },
        prices: {
          where: {
            channelType: channelType as string,
          },
          include: {
            taxGroup: {
              include: {
                taxGroupItems: {
                  select: {
                    tax: {
                      select: {
                        id: true,
                        name: true,
                        percentage: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        images: {
          where: {
            isPrimary: true,
          },
          take: 1,
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
      orderBy: [
        {
          category: {
            sortOrder: 'asc',
          },
        },
        {
          name: 'asc',
        },
      ],
    });

    // Group products by category
    const groupedProducts: any = {};

    for (const product of products) {
      const categoryId = product.category?.id || 'uncategorized';
      const categoryName = product.category?.name || 'Uncategorized';

      if (!groupedProducts[categoryId]) {
        groupedProducts[categoryId] = {
          categoryId,
          categoryName,
          products: [],
        };
      }

      // Get base price from prices array
      const basePrice = product.prices.find((p: any) => p.variantId === null);

      groupedProducts[categoryId].products.push({
        id: product.id,
        name: product.name,
        sku: product.sku,
        type: product.type,
        description: product.description,
        shortCode: product.shortCode,
        preparationTime: product.preparationTime,
        servesCount: product.servesCount,
        isVeg: product.isVeg,
        categoryId: product.categoryId,
        categoryName: product.category?.name,
        subCategoryId: product.subCategoryId,
        subCategoryName: product.subCategory?.name,
        basePrice: basePrice?.basePrice || 0,
        discountPrice: basePrice?.discountPrice,
        taxGroupId: basePrice?.taxGroupId,
        taxGroup: basePrice?.taxGroup,
        image: product.images[0]?.url || null,
        variants: product.variants.map((v: any) => {
          const variantPrice = product.prices.find((p: any) => p.variantId === v.id);
          return {
            id: v.id,
            name: v.name,
            sku: v.sku,
            additionalPrice: v.additionalPrice,
            basePrice: variantPrice?.basePrice || (basePrice?.basePrice || 0) + v.additionalPrice,
            discountPrice: variantPrice?.discountPrice,
            taxGroupId: variantPrice?.taxGroupId,
          };
        }),
        addons: product.addons.map((a: any) => ({
          id: a.id,
          name: a.name,
          price: a.price,
        })),
      });
    }

    // Convert grouped object to array
    const result = Object.values(groupedProducts);

    res.status(200).json({
      success: true,
      data: result,
      message: 'POS products fetched successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching POS products:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while fetching POS products',
      },
    } as ApiResponse);
  }
};

/**
 * POST /api/v1/pos/orders
 * Create a new order
 */
export const createOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.businessOwnerId as string;
    const { branchId, type, staffId, tableId, customerId, notes } = req.body;

    // Validate required fields
    if (!branchId || !type || !staffId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'branchId, type, and staffId are required',
        },
      } as ApiResponse);
      return;
    }

    // Validate order type
    const validOrderTypes = ['DineIn', 'TakeAway', 'Delivery', 'Catering', 'Subscription'];
    if (!validOrderTypes.includes(type)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ORDER_TYPE',
          message: `Invalid order type. Must be one of: ${validOrderTypes.join(', ')}`,
        },
      } as ApiResponse);
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
      res.status(404).json({
        success: false,
        error: {
          code: 'BRANCH_NOT_FOUND',
          message: 'Branch not found',
        },
      } as ApiResponse);
      return;
    }

    // Verify staff exists and belongs to tenant
    const staff = await prisma.staff.findFirst({
      where: {
        id: staffId,
        businessOwnerId: tenantId,
      },
    });

    if (!staff) {
      res.status(404).json({
        success: false,
        error: {
          code: 'STAFF_NOT_FOUND',
          message: 'Staff not found',
        },
      } as ApiResponse);
      return;
    }

    // If tableId provided, verify it exists and update status
    if (tableId) {
      const table = await prisma.table.findFirst({
        where: {
          id: tableId,
        },
        include: {
          floor: {
            include: {
              branch: true,
            },
          },
        },
      });

      if (!table) {
        res.status(404).json({
          success: false,
          error: {
            code: 'TABLE_NOT_FOUND',
            message: 'Table not found',
          },
        } as ApiResponse);
        return;
      }

      // Verify table belongs to the branch
      if (table.floor.branch.id !== branchId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'TABLE_BRANCH_MISMATCH',
            message: 'Table does not belong to the specified branch',
          },
        } as ApiResponse);
        return;
      }

      // Check if table is available
      if (table.status === 'running') {
        res.status(400).json({
          success: false,
          error: {
            code: 'TABLE_ALREADY_IN_USE',
            message: 'Table is already in use',
          },
        } as ApiResponse);
        return;
      }
    }

    // If customerId provided, verify it exists
    if (customerId) {
      const customer = await prisma.customer.findFirst({
        where: {
          id: customerId,
          businessOwnerId: tenantId,
        },
      });

      if (!customer) {
        res.status(404).json({
          success: false,
          error: {
            code: 'CUSTOMER_NOT_FOUND',
            message: 'Customer not found',
          },
        } as ApiResponse);
        return;
      }
    }

    // Generate unique order number
    const today = new Date();
    const dateString = today.toISOString().slice(0, 10).replace(/-/g, '');

    // Get count of orders today to generate sequence number
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));

    const todayOrderCount = await prisma.order.count({
      where: {
        businessOwnerId: tenantId,
        branchId: branchId,
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    const sequenceNumber = String(todayOrderCount + 1).padStart(4, '0');
    const orderNumber = `ORD-${dateString}-${sequenceNumber}`;

    // Create the order
    const order = await prisma.order.create({
      data: {
        businessOwnerId: tenantId!,
        branchId: branchId as string,
        orderNumber,
        type: type as OrderType,
        staffId: staffId as string,
        tableId: tableId ? (tableId as string) : null,
        customerId: customerId ? (customerId as string) : null,
        subtotal: 0,
        discountAmount: 0,
        chargesAmount: 0,
        taxAmount: 0,
        total: 0,
        paidAmount: 0,
        dueAmount: 0,
        paymentStatus: 'Unpaid',
        orderStatus: 'Pending',
        notes: notes ? (notes as string) : null,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        table: {
          select: {
            id: true,
            label: true,
            floor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    // If tableId provided, update table status to 'running'
    if (tableId) {
      await prisma.table.update({
        where: { id: tableId },
        data: { status: 'running' },
      });

      // Emit TABLE_STATUS_CHANGED WebSocket event
      try {
        const tablePayload: TableStatusChangedPayload = {
          tableId,
          tableName: order.table?.label || tableId,
          status: 'running',
          previousStatus: 'available',
          floorId: order.table?.floor?.id || '',
          floorName: order.table?.floor?.name || '',
          updatedAt: new Date().toISOString(),
        };
        connectionManager.broadcastToBranch(tenantId, branchId, WebSocketEventType.TABLE_STATUS_CHANGED, tablePayload);
      } catch (wsError) {
        console.error('Failed to emit TABLE_STATUS_CHANGED WebSocket event:', wsError);
      }
    }

    // Create initial timeline entry
    await prisma.orderTimeline.create({
      data: {
        orderId: order.id,
        action: 'created',
        description: `Order ${orderNumber} created`,
        staffId,
      },
    });

    // Invalidate dashboard cache when new order is created
    await cacheService.invalidateDashboardCache(tenantId);

    // Emit ORDER_CREATED WebSocket event to branch
    try {
      const payload: OrderCreatedPayload = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        tableId: order.table?.id,
        tableName: order.table?.label,
        items: [],
        orderType: order.type,
        createdAt: order.createdAt.toISOString(),
      };
      connectionManager.broadcastToBranch(tenantId, branchId, WebSocketEventType.ORDER_CREATED, payload);

      // Broadcast updated dashboard metrics after order creation
      await broadcastDashboardMetrics(tenantId, branchId);
    } catch (wsError) {
      console.error('Failed to emit ORDER_CREATED WebSocket event:', wsError);
    }

    res.status(201).json({
      success: true,
      data: { order },
      message: 'Order created successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while creating order',
      },
    } as ApiResponse);
  }
};

/**
 * POST /api/v1/pos/orders/:orderId/items
 * Add item to an order
 */
export const addOrderItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.businessOwnerId as string;
    const { orderId } = req.params;
    const { productId, quantity, variantId, addons, notes } = req.body;

    // Validate required fields
    if (!productId || !quantity) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'productId and quantity are required',
        },
      } as ApiResponse);
      return;
    }

    // Verify order exists and belongs to tenant
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        businessOwnerId: tenantId,
      },
    });

    if (!order) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found',
        },
      } as ApiResponse);
      return;
    }

    // Verify product exists and belongs to tenant
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        businessOwnerId: tenantId,
      },
      include: {
        prices: {
          where: {
            channelType: order.type,
            variantId: variantId || null,
          },
        },
        variants: true,
        addons: true,
      },
    });

    if (!product) {
      res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found',
        },
      } as ApiResponse);
      return;
    }

    // Verify variant if provided
    if (variantId) {
      const variant = product.variants.find((v: any) => v.id === variantId);
      if (!variant) {
        res.status(404).json({
          success: false,
          error: {
            code: 'VARIANT_NOT_FOUND',
            message: 'Product variant not found',
          },
        } as ApiResponse);
        return;
      }
    }

    // Calculate unit price
    let unitPrice = 0;

    // Get base price for product
    const productPrice = product.prices.find((p: any) => p.variantId === null);
    if (productPrice) {
      unitPrice = Number(productPrice.basePrice);
    }

    // Add variant price if applicable
    if (variantId) {
      const variant = product.variants.find((v: any) => v.id === variantId);
      if (variant) {
        unitPrice += Number(variant.additionalPrice);
      }
    }

    // Add addon prices if provided
    let addonTotal = 0;
    const validAddons: any[] = [];
    if (addons && Array.isArray(addons) && addons.length > 0) {
      for (const addonId of addons) {
        const addon = product.addons.find((a: any) => a.id === addonId);
        if (addon) {
          addonTotal += Number(addon.price);
          validAddons.push(addon);
        }
      }
    }
    unitPrice += addonTotal;

    // Calculate total price
    const totalPrice = unitPrice * quantity;

    // Create order item
    const orderItem = await prisma.orderItem.create({
      data: {
        orderId,
        productId,
        variantId: variantId || null,
        name: product.name,
        quantity,
        unitPrice,
        totalPrice,
        notes: notes || null,
      },
    });

    // Create order item addons
    if (validAddons.length > 0) {
      await prisma.orderItemAddon.createMany({
        data: validAddons.map((addon) => ({
          orderItemId: orderItem.id,
          addonId: addon.id,
          name: addon.name,
          price: Number(addon.price),
        })),
      });
    }

    // Recalculate order totals
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId },
    });

    const subtotal = orderItems.reduce((sum, item) => sum + Number(item.totalPrice), 0);

    // Calculate tax using tax service
    const taxResult = await calculateOrderTax(orderId, order.branchId);
    const taxAmount = taxResult.taxAmount;

    // Charges not yet implemented - will be added when charges service is built
    const chargesAmount = 0;

    const total = subtotal - Number(order.discountAmount) + chargesAmount + taxAmount;
    const dueAmount = total - Number(order.paidAmount);

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        subtotal,
        taxAmount,
        chargesAmount,
        total,
        dueAmount,
      },
      include: {
        items: {
          include: {
            addons: true,
            product: {
              select: {
                id: true,
                name: true,
                isVeg: true,
                categoryId: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        table: {
          select: {
            id: true,
            label: true,
            floor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: updatedOrder,
      message: 'Order item added successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('Error adding order item:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while adding order item',
      },
    } as ApiResponse);
  }
};

/**
 * PUT /api/v1/pos/orders/:orderId/items/:itemId
 * Update an order item
 */
export const updateOrderItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.businessOwnerId as string;
    const { orderId, itemId } = req.params;
    const { quantity, notes, addons } = req.body;

    // Verify order exists and belongs to tenant
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        businessOwnerId: tenantId,
      },
    });

    if (!order) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found',
        },
      } as ApiResponse);
      return;
    }

    // Verify order item exists
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        id: itemId,
        orderId,
      },
      include: {
        product: {
          include: {
            prices: true,
            variants: true,
            addons: true,
          },
        },
        variant: true,
        addons: true,
      },
    });

    if (!orderItem) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_ITEM_NOT_FOUND',
          message: 'Order item not found',
        },
      } as ApiResponse);
      return;
    }

    // Only allow updates if item status is 'Pending'
    if (orderItem.status !== 'Pending') {
      res.status(400).json({
        success: false,
        error: {
          code: 'ITEM_CANNOT_BE_UPDATED',
          message: 'Only pending items can be updated',
        },
      } as ApiResponse);
      return;
    }

    // Prepare update data
    const updateData: any = {};

    // Update quantity if provided
    if (quantity !== undefined) {
      if (quantity <= 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_QUANTITY',
            message: 'Quantity must be greater than 0',
          },
        } as ApiResponse);
        return;
      }
      updateData.quantity = quantity;
    }

    // Update notes if provided
    if (notes !== undefined) {
      updateData.notes = notes || null;
    }

    // Handle addon modifications if provided
    if (addons !== undefined) {
      // Delete existing addons
      await prisma.orderItemAddon.deleteMany({
        where: { orderItemId: itemId },
      });

      // Add new addons if any
      if (Array.isArray(addons) && addons.length > 0) {
        const validAddons: any[] = [];
        let addonTotal = 0;

        for (const addonId of addons) {
          const addon = orderItem.product.addons.find((a: any) => a.id === addonId);
          if (addon) {
            addonTotal += Number(addon.price);
            validAddons.push({
              orderItemId: itemId,
              addonId: addon.id,
              name: addon.name,
              price: Number(addon.price),
            });
          }
        }

        if (validAddons.length > 0) {
          await prisma.orderItemAddon.createMany({
            data: validAddons,
          });
        }

        // Recalculate unit price with new addons
        let unitPrice = 0;

        // Get base price for product
        const productPrice = orderItem.product.prices.find(
          (p: any) => p.variantId === null && p.channelType === order.type
        );
        if (productPrice) {
          unitPrice = Number(productPrice.basePrice);
        }

        // Add variant price if applicable
        if (orderItem.variantId && orderItem.variant) {
          unitPrice += Number(orderItem.variant.additionalPrice);
        }

        // Add addon prices
        unitPrice += addonTotal;

        updateData.unitPrice = unitPrice;
        updateData.totalPrice = unitPrice * (quantity !== undefined ? quantity : orderItem.quantity);
      } else {
        // No addons - recalculate without them
        let unitPrice = 0;

        const productPrice = orderItem.product.prices.find(
          (p: any) => p.variantId === null && p.channelType === order.type
        );
        if (productPrice) {
          unitPrice = Number(productPrice.basePrice);
        }

        if (orderItem.variantId && orderItem.variant) {
          unitPrice += Number(orderItem.variant.additionalPrice);
        }

        updateData.unitPrice = unitPrice;
        updateData.totalPrice = unitPrice * (quantity !== undefined ? quantity : orderItem.quantity);
      }
    } else if (quantity !== undefined) {
      // Only quantity changed, recalculate total price
      updateData.totalPrice = Number(orderItem.unitPrice) * quantity;
    }

    // Update order item if there are changes
    if (Object.keys(updateData).length > 0) {
      await prisma.orderItem.update({
        where: { id: itemId },
        data: updateData,
      });
    }

    // Recalculate order totals
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId },
    });

    const subtotal = orderItems.reduce((sum, item) => sum + Number(item.totalPrice), 0);

    // Calculate tax using tax service
    const taxResult = await calculateOrderTax(orderId, order.branchId);
    const taxAmount = taxResult.taxAmount;

    // Charges not yet implemented - will be added when charges service is built
    const chargesAmount = 0;

    const total = subtotal - Number(order.discountAmount) + chargesAmount + taxAmount;
    const dueAmount = total - Number(order.paidAmount);

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        subtotal,
        taxAmount,
        chargesAmount,
        total,
        dueAmount,
      },
      include: {
        items: {
          include: {
            addons: true,
            product: {
              select: {
                id: true,
                name: true,
                isVeg: true,
                categoryId: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        table: {
          select: {
            id: true,
            label: true,
            floor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: updatedOrder,
      message: 'Order item updated successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('Error updating order item:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while updating order item',
      },
    } as ApiResponse);
  }
};

/**
 * DELETE /api/v1/pos/orders/:orderId/items/:itemId
 * Remove an order item
 */
export const removeOrderItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.businessOwnerId as string;
    const { orderId, itemId } = req.params;

    // Verify order exists and belongs to tenant
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        businessOwnerId: tenantId,
      },
    });

    if (!order) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found',
        },
      } as ApiResponse);
      return;
    }

    // Verify order item exists
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        id: itemId,
        orderId,
      },
    });

    if (!orderItem) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_ITEM_NOT_FOUND',
          message: 'Order item not found',
        },
      } as ApiResponse);
      return;
    }

    // Only allow deletion if item status is 'Pending' or 'Cancelled'
    if (orderItem.status !== 'Pending' && orderItem.status !== 'Cancelled') {
      res.status(400).json({
        success: false,
        error: {
          code: 'ITEM_CANNOT_BE_DELETED',
          message: 'Only pending or cancelled items can be deleted',
        },
      } as ApiResponse);
      return;
    }

    // Delete associated order item addons
    await prisma.orderItemAddon.deleteMany({
      where: { orderItemId: itemId },
    });

    // Delete the order item
    await prisma.orderItem.delete({
      where: { id: itemId },
    });

    // Recalculate order totals
    const remainingItems = await prisma.orderItem.findMany({
      where: { orderId },
    });

    const subtotal = remainingItems.reduce((sum, item) => sum + Number(item.totalPrice), 0);

    // Calculate tax using tax service
    const taxResult = await calculateOrderTax(orderId, order.branchId);
    const taxAmount = taxResult.taxAmount;

    // Charges not yet implemented - will be added when charges service is built
    const chargesAmount = 0;

    const total = subtotal - Number(order.discountAmount) + chargesAmount + taxAmount;
    const dueAmount = total - Number(order.paidAmount);

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        subtotal,
        taxAmount,
        chargesAmount,
        total,
        dueAmount,
      },
      include: {
        items: {
          include: {
            addons: true,
            product: {
              select: {
                id: true,
                name: true,
                isVeg: true,
                categoryId: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        table: {
          select: {
            id: true,
            label: true,
            floor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: updatedOrder,
      message: 'Order item removed successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('Error removing order item:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while removing order item',
      },
    } as ApiResponse);
  }
};

/**
 * PATCH /api/v1/pos/orders/:orderId/items/:itemId/status
 * Update order item status
 */
export const updateOrderItemStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.businessOwnerId as string;
    const { orderId, itemId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['Pending', 'Preparing', 'Ready', 'Served', 'Cancelled'];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        },
      } as ApiResponse);
      return;
    }

    // Verify order exists and belongs to tenant
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        businessOwnerId: tenantId,
      },
    });

    if (!order) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found',
        },
      } as ApiResponse);
      return;
    }

    // Verify order item exists in this order
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        id: itemId,
        orderId,
      },
    });

    if (!orderItem) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_ITEM_NOT_FOUND',
          message: 'Order item not found',
        },
      } as ApiResponse);
      return;
    }

    // Update order item status
    await prisma.orderItem.update({
      where: { id: itemId },
      data: { status },
    });

    // Add OrderTimeline entry
    await prisma.orderTimeline.create({
      data: {
        orderId,
        action: 'item_status_update',
        description: `Item "${orderItem.name}" status changed to ${status}`,
        staffId: req.user!.id,
      },
    });

    // Get updated order with all relations
    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            addons: true,
            product: {
              select: {
                id: true,
                name: true,
                isVeg: true,
                categoryId: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        table: {
          select: {
            id: true,
            label: true,
            floor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: updatedOrder,
      message: 'Order item status updated successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('Error updating order item status:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while updating order item status',
      },
    } as ApiResponse);
  }
};

/**
 * POST /api/v1/pos/orders/:orderId/discount
 * Apply a discount to an order
 */
export const applyDiscount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.businessOwnerId as string;
    const { orderId } = req.params;
    const { discountId, reason, amount } = req.body;

    // Verify order exists and belongs to tenant
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        businessOwnerId: tenantId,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                categoryId: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found',
        },
      } as ApiResponse);
      return;
    }

    let discountAmount = 0;
    let discountIdToUse: string | null = null;

    // Enforce single discount per order
    if (order.discountId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'DISCOUNT_ALREADY_APPLIED',
          message: 'Only one discount can be applied. Remove the existing discount before applying another.',
        },
      } as ApiResponse);
      return;
    }

    // Handle discount by ID
    if (discountId) {
      // Fetch and validate the discount
      const discount = await prisma.discount.findFirst({
        where: {
          id: discountId,
          businessOwnerId: tenantId,
        },
        include: {
          discountProducts: {
            select: {
              productId: true,
            },
          },
          discountCategories: {
            select: {
              categoryId: true,
            },
          },
        },
      });

      if (!discount) {
        res.status(404).json({
          success: false,
          error: {
            code: 'DISCOUNT_NOT_FOUND',
            message: 'Discount not found',
          },
        } as ApiResponse);
        return;
      }

      // Validate discount status
      if (discount.status !== 'active') {
        res.status(400).json({
          success: false,
          error: {
            code: 'INACTIVE_DISCOUNT',
            message: 'This discount is not active',
          },
        } as ApiResponse);
        return;
      }

      // Check date range
      const now = new Date();
      if (discount.startDate && now < discount.startDate) {
        res.status(400).json({
          success: false,
          error: {
            code: 'DISCOUNT_NOT_STARTED',
            message: 'This discount is not yet active',
          },
        } as ApiResponse);
        return;
      }

      if (discount.endDate && now > discount.endDate) {
        res.status(400).json({
          success: false,
          error: {
            code: 'DISCOUNT_EXPIRED',
            message: 'This discount has expired',
          },
        } as ApiResponse);
        return;
      }

      // Check usage limit
      if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
        res.status(400).json({
          success: false,
          error: {
            code: 'USAGE_LIMIT_REACHED',
            message: 'This discount has reached its usage limit',
          },
        } as ApiResponse);
        return;
      }

      // Check minimum order amount
      const orderTotal = Number(order.subtotal);
      if (discount.minOrderAmount && orderTotal < Number(discount.minOrderAmount)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MIN_ORDER_NOT_MET',
            message: `Minimum order amount of ${discount.minOrderAmount} required`,
          },
        } as ApiResponse);
        return;
      }

      // Check product/category restrictions if type is ProductCategory
      if (discount.type === 'ProductCategory' && order.items.length > 0) {
        const productIds = discount.discountProducts.map((dp) => dp.productId);
        const categoryIds = discount.discountCategories.map((dc) => dc.categoryId);

        let hasMatchingItem = false;
        for (const item of order.items) {
          if (productIds.includes(item.product.id) || (item.product.categoryId && categoryIds.includes(item.product.categoryId))) {
            hasMatchingItem = true;
            break;
          }
        }

        if (!hasMatchingItem) {
          res.status(400).json({
            success: false,
            error: {
              code: 'NO_MATCHING_ITEMS',
              message: 'This discount does not apply to any items in your order',
            },
          } as ApiResponse);
          return;
        }
      }

      // Calculate discount amount based on type
      if (discount.valueType === 'Percentage') {
        discountAmount = (orderTotal * Number(discount.value)) / 100;
        // Apply max discount if specified
        if (discount.maxDiscount && discountAmount > Number(discount.maxDiscount)) {
          discountAmount = Number(discount.maxDiscount);
        }
      } else if (discount.valueType === 'Fixed') {
        discountAmount = Number(discount.value);
      } else if (discount.valueType === 'BOGO') {
        // For BOGO, we'll apply a simple calculation - in real implementation this would be more complex
        // For now, just set discountAmount to 0 and let frontend handle BOGO logic
        discountAmount = 0;
      }

      discountIdToUse = discount.id;

      // Increment discount used count
      await prisma.discount.update({
        where: { id: discount.id },
        data: {
          usedCount: discount.usedCount + 1,
        },
      });
    } else if (reason && amount !== undefined) {
      // Manual discount
      if (amount <= 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_AMOUNT',
            message: 'Discount amount must be greater than 0',
          },
        } as ApiResponse);
        return;
      }
      discountAmount = amount;
    } else {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Either discountId OR (reason and amount) are required',
        },
      } as ApiResponse);
      return;
    }

    // Calculate tax using tax service
    const taxResult = await calculateOrderTax(orderId, order.branchId);
    const taxAmount = taxResult.taxAmount;

    // Charges not yet implemented - will be added when charges service is built
    const chargesAmount = 0;

    // Recalculate order total
    const total = Number(order.subtotal) - discountAmount + chargesAmount + taxAmount;
    const dueAmount = total - Number(order.paidAmount);

    // Update order with discount
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        discountId: discountIdToUse,
        discountAmount,
        taxAmount,
        chargesAmount,
        total,
        dueAmount,
      },
      include: {
        items: {
          include: {
            addons: true,
            product: {
              select: {
                id: true,
                name: true,
                isVeg: true,
                categoryId: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        discount: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
            valueType: true,
            value: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        table: {
          select: {
            id: true,
            label: true,
            floor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    // Add OrderTimeline entry
    await prisma.orderTimeline.create({
      data: {
        orderId,
        action: 'discount_applied',
        description: discountId ? `Discount applied: ${discountAmount}` : `Manual discount applied: ${discountAmount} (Reason: ${reason})`,
        staffId: req.user!.id,
      },
    });

    res.status(200).json({
      success: true,
      data: updatedOrder,
      message: 'Discount applied successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('Error applying discount:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while applying discount',
      },
    } as ApiResponse);
  }
};

// Remove discount from order
export const removeDiscount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.businessOwnerId as string;
    const { orderId } = req.params;

    // Verify order exists and belongs to tenant
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        businessOwnerId: tenantId,
      },
    });

    if (!order) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found',
        },
      } as ApiResponse);
      return;
    }

    // Store the discount ID before clearing (for decrementing usedCount)
    const previousDiscountId = order.discountId;
    const previousDiscountAmount = Number(order.discountAmount);

    // Calculate tax using tax service
    const taxResult = await calculateOrderTax(orderId, order.branchId);
    const taxAmount = taxResult.taxAmount;

    // Charges not yet implemented - will be added when charges service is built
    const chargesAmount = 0;

    // Recalculate order total without discount
    const total = Number(order.subtotal) + chargesAmount + taxAmount;
    const dueAmount = total - Number(order.paidAmount);

    // Update order to remove discount
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        discountId: null,
        discountAmount: 0,
        taxAmount,
        chargesAmount,
        total,
        dueAmount,
      },
      include: {
        items: {
          include: {
            addons: true,
            product: {
              select: {
                id: true,
                name: true,
                isVeg: true,
                categoryId: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        discount: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
            valueType: true,
            value: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        table: {
          select: {
            id: true,
            label: true,
            floor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    // Decrement discount usedCount if a discount was applied
    if (previousDiscountId) {
      const discount = await prisma.discount.findUnique({
        where: { id: previousDiscountId },
      });

      if (discount && discount.usedCount > 0) {
        await prisma.discount.update({
          where: { id: previousDiscountId },
          data: {
            usedCount: discount.usedCount - 1,
          },
        });
      }
    }

    // Add OrderTimeline entry
    await prisma.orderTimeline.create({
      data: {
        orderId,
        action: 'discount_removed',
        description: `Discount removed: ${previousDiscountAmount}`,
        staffId: req.user!.id,
      },
    });

    res.status(200).json({
      success: true,
      data: updatedOrder,
      message: 'Discount removed successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('Error removing discount:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while removing discount',
      },
    } as ApiResponse);
  }
};

/**
 * POST /api/v1/pos/orders/:orderId/payments
 * Record a payment for an order
 */
export const addPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.businessOwnerId as string;
    const { orderId } = req.params;
    const { paymentOptionId, amount, reference } = req.body;

    // Validate required fields
    if (!paymentOptionId || !amount) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'paymentOptionId and amount are required',
        },
      } as ApiResponse);
      return;
    }

    // Validate amount is positive
    if (amount <= 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_AMOUNT',
          message: 'Payment amount must be greater than 0',
        },
      } as ApiResponse);
      return;
    }

    // Verify order exists and belongs to tenant
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        businessOwnerId: tenantId,
      },
    });

    if (!order) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found',
        },
      } as ApiResponse);
      return;
    }

    // Verify payment option exists and belongs to tenant
    const paymentOption = await prisma.paymentOption.findFirst({
      where: {
        id: paymentOptionId,
        businessOwnerId: tenantId,
        status: 'active',
      },
    });

    if (!paymentOption) {
      res.status(404).json({
        success: false,
        error: {
          code: 'PAYMENT_OPTION_NOT_FOUND',
          message: 'Payment option not found or inactive',
        },
      } as ApiResponse);
      return;
    }

    // Check if payment amount exceeds due amount
    const currentDueAmount = Number(order.dueAmount);
    if (amount > currentDueAmount) {
      res.status(400).json({
        success: false,
        error: {
          code: 'AMOUNT_EXCEEDS_DUE',
          message: `Payment amount (${amount}) exceeds due amount (${currentDueAmount})`,
        },
      } as ApiResponse);
      return;
    }

    // Create payment record
    await prisma.orderPayment.create({
      data: {
        orderId,
        paymentOptionId,
        amount,
        reference: reference || null,
      },
    });

    // Calculate new totals
    const newPaidAmount = Number(order.paidAmount) + amount;
    const newDueAmount = Number(order.total) - newPaidAmount;

    // Determine payment status
    let paymentStatus: 'Unpaid' | 'PartiallyPaid' | 'Paid';
    if (newDueAmount === 0) {
      paymentStatus = 'Paid';
    } else if (newPaidAmount > 0) {
      paymentStatus = 'PartiallyPaid';
    } else {
      paymentStatus = 'Unpaid';
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paidAmount: newPaidAmount,
        dueAmount: newDueAmount,
        paymentStatus,
      },
      include: {
        items: {
          include: {
            addons: true,
            product: {
              select: {
                id: true,
                name: true,
                isVeg: true,
                categoryId: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        payments: {
          include: {
            paymentOption: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        table: {
          select: {
            id: true,
            label: true,
            floor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    // Add OrderTimeline entry
    await prisma.orderTimeline.create({
      data: {
        orderId,
        action: 'payment_added',
        description: `Payment of ${amount} recorded via ${paymentOption.name}${reference ? ` (Ref: ${reference})` : ''}`,
        staffId: req.user!.id,
      },
    });

    // Emit PAYMENT_RECEIVED WebSocket event
    try {
      const branchId = updatedOrder.branchId;
      // Get today's running totals for the branch
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const todayAgg = await prisma.order.aggregate({
        where: {
          businessOwnerId: tenantId,
          branchId,
          createdAt: { gte: todayStart, lte: todayEnd },
          orderStatus: { notIn: ['Cancelled'] },
        },
        _sum: { total: true },
        _count: { _all: true },
      });

      const paymentPayload: PaymentReceivedPayload = {
        paymentId: orderId,
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        amount,
        paymentMode: paymentOption.name,
        todayRevenue: Number(todayAgg._sum?.total ?? 0),
        todayOrderCount: todayAgg._count?._all ?? 0,
        receivedAt: new Date().toISOString(),
      };

      connectionManager.broadcastToBranch(
        tenantId,
        branchId,
        WebSocketEventType.PAYMENT_RECEIVED,
        paymentPayload
      );

      // Broadcast updated dashboard metrics
      await broadcastDashboardMetrics(tenantId, branchId);
    } catch (wsError) {
      console.error('Failed to emit PAYMENT_RECEIVED WebSocket event:', wsError);
    }

    res.status(200).json({
      success: true,
      data: updatedOrder,
      message: 'Payment recorded successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('Error adding payment:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while recording payment',
      },
    } as ApiResponse);
  }
};

/**
 * PATCH /api/v1/pos/orders/:orderId/status
 * Update overall order status with validation and workflow logic
 */
export const updateOrderStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.businessOwnerId as string;
    const { orderId } = req.params;
    const { status, reason } = req.body;

    // Debug log to trace incoming payload and user context
    console.log('UPDATE STATUS REQUEST:', {
      orderId,
      status,
      user: req.user ? { id: req.user.id, type: (req.user as any).userType } : null,
    });

    // Normalize incoming status to canonical enum values
    const normalizedStatus = typeof status === 'string' ? status.trim() : status;
    const statusMap: Record<string, string> = {
      hold: 'OnHold',
      onhold: 'OnHold',
      'on_hold': 'OnHold',
      'on-hold': 'OnHold',
      cancelled: 'Cancelled',
      canceled: 'Cancelled',
      completed: 'Completed',
      draft: 'Draft',
      pending: 'Pending',
      confirmed: 'Confirmed',
      preparing: 'Preparing',
      ready: 'Ready',
      served: 'Served',
    };
    const mappedStatus =
      typeof normalizedStatus === 'string'
        ? statusMap[normalizedStatus.toLowerCase()] || normalizedStatus
        : normalizedStatus;

    // Validate required fields
    if (!mappedStatus) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'status is required',
        },
      } as ApiResponse);
      return;
    }

    // Validate status value
    const validStatuses = [
      'Draft', 'Pending', 'Confirmed', 'Preparing',
      'OnHold', 'Ready', 'Served', 'Completed', 'Cancelled',
    ];
    if (!validStatuses.includes(mappedStatus as string)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: `Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`,
        },
      } as ApiResponse);
      return;
    }

    // Verify order exists and belongs to tenant
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        businessOwnerId: tenantId,
      },
      include: {
        table: true,
      },
    });

    if (!order) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found',
        },
      } as ApiResponse);
      return;
    }

    // Validate status transitions (prevent invalid state changes)
    const currentStatus = order.orderStatus;

    // Cannot change status from Completed or Cancelled back to earlier states
    if ((currentStatus === 'Completed' || currentStatus === 'Cancelled') &&
        mappedStatus !== currentStatus) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: `Cannot change status from ${currentStatus} to ${mappedStatus}`,
        },
      } as ApiResponse);
      return;
    }

    // Business logic validations
    if (mappedStatus === 'Completed') {
      // Require payment to be completed before marking order as completed
      if (order.paymentStatus !== 'Paid') {
        res.status(400).json({
          success: false,
          error: {
            code: 'PAYMENT_NOT_COMPLETED',
            message: 'Order must be fully paid before marking as completed',
          },
        } as ApiResponse);
        return;
      }
    }

    if (mappedStatus === 'Cancelled' && !reason) {
      res.status(400).json({
        success: false,
        error: {
          code: 'REASON_REQUIRED',
          message: 'Reason is required when cancelling an order',
        },
      } as ApiResponse);
      return;
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        orderStatus: mappedStatus as any,
      },
      include: {
        items: {
          include: {
            addons: true,
            product: {
              select: {
                id: true,
                name: true,
                isVeg: true,
                categoryId: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        payments: {
          include: {
            paymentOption: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        discount: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
            valueType: true,
            value: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        table: {
          select: {
            id: true,
            label: true,
            floor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    // Release table if order is completed or cancelled (for DineIn orders)
    if ((mappedStatus === 'Completed' || mappedStatus === 'Cancelled') && order.tableId) {
      await prisma.table.update({
        where: { id: order.tableId },
        data: {
          status: 'available',
        },
      });

      // Emit TABLE_STATUS_CHANGED WebSocket event
      try {
        const tablePayload: TableStatusChangedPayload = {
          tableId: order.tableId,
          tableName: updatedOrder.table?.label || order.tableId,
          status: 'available',
          previousStatus: 'running',
          floorId: updatedOrder.table?.floor?.id || '',
          floorName: updatedOrder.table?.floor?.name || '',
          updatedAt: new Date().toISOString(),
        };
        connectionManager.broadcastToBranch(tenantId, updatedOrder.branchId, WebSocketEventType.TABLE_STATUS_CHANGED, tablePayload);
      } catch (wsError) {
        console.error('Failed to emit TABLE_STATUS_CHANGED WebSocket event:', wsError);
      }
    }

    // Add OrderTimeline entry
    const timelineDescription = mappedStatus === 'Cancelled'
      ? `Order cancelled. Reason: ${reason}`
      : `Order status updated to ${mappedStatus}`;

    try {
      await prisma.orderTimeline.create({
        data: {
          orderId,
          action: 'order_status_update',
          description: timelineDescription,
          staffId: req.user?.id || null,
        },
      });
    } catch (timelineError) {
      console.error('Timeline error:', timelineError);
    }

    // Invalidate dashboard cache when order status changes to Completed or Cancelled
    if (mappedStatus === 'Completed' || mappedStatus === 'Cancelled') {
      await cacheService.invalidateDashboardCache(tenantId);
    }

    // Emit ORDER_UPDATED WebSocket event to branch
    try {
      const payload: OrderUpdatedPayload = {
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: mappedStatus as any,
        previousStatus: currentStatus,
        updatedAt: new Date().toISOString(),
      };
      connectionManager.broadcastToBranch(tenantId, updatedOrder.branchId, WebSocketEventType.ORDER_UPDATED, payload);

      // Broadcast updated dashboard metrics after order status change
      await broadcastDashboardMetrics(tenantId, updatedOrder.branchId);
    } catch (wsError) {
      console.error('Failed to emit ORDER_UPDATED WebSocket event:', wsError);
    }

    // Trigger automatic accounting sync when order is completed
    if (status === 'Completed') {
      try {
        const accountingIntegrations = await prisma.integration.findMany({
          where: {
            businessOwnerId: tenantId,
            type: 'accounting',
            status: 'active',
          },
        });

        for (const integration of accountingIntegrations) {
          try {
            if (integration.provider === 'tally') {
              await syncTallyInvoice(orderId);
            } else if (integration.provider === 'quickbooks') {
              await syncQuickBooksInvoice(orderId);
            } else if (integration.provider === 'zoho_books') {
              await syncZohoInvoice(orderId);
            }
          } catch (syncError) {
            console.error(`Accounting sync failed for ${integration.provider}:`, syncError);
            // Log failure but don't block order completion
          }
        }
      } catch (integrationError) {
        console.error('Error checking accounting integrations:', integrationError);
        // Don't block order completion if integration check fails
      }
    }

    res.status(200).json({
      success: true,
      data: { order: updatedOrder },
      message: 'Order status updated successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while updating order status',
      },
    } as ApiResponse);
  }
};

/**
 * GET /api/v1/pos/orders/:orderId
 * Get complete order details with timeline and breakdowns
 */
export const getOrderDetail = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const tenantId = req.user!.businessOwnerId;

    // Fetch order with all relations
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        businessOwnerId: tenantId,
      },
      include: {
        items: {
          include: {
            addons: true,
            product: {
              select: {
                id: true,
                name: true,
                isVeg: true,
                categoryId: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        payments: {
          include: {
            paymentOption: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        discount: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
            valueType: true,
            value: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        table: {
          select: {
            id: true,
            label: true,
            floor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        timeline: {
          include: {
            staff: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!order) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found',
        },
      } as ApiResponse);
      return;
    }

    // Calculate tax breakdown
    const taxBreakdown: any[] = [];
    for (const item of order.items) {
      // Find product price with tax group
      const productPrice = await prisma.productPrice.findFirst({
        where: {
          productId: item.productId,
          variantId: item.variantId,
          channelType: order.type,
        },
        include: {
          taxGroup: {
            include: {
              taxGroupItems: {
                include: {
                  tax: true,
                },
              },
            },
          },
        },
      });

      if (productPrice?.taxGroup) {
        for (const taxGroupItem of productPrice.taxGroup.taxGroupItems) {
          const tax = taxGroupItem.tax;
          if (tax.status === 'active') {
            const taxAmount = Number(item.totalPrice) * (Number(tax.percentage) / 100);
            const existingTax = taxBreakdown.find(t => t.taxId === tax.id);
            if (existingTax) {
              existingTax.amount += taxAmount;
            } else {
              taxBreakdown.push({
                taxId: tax.id,
                taxName: tax.name,
                rate: Number(tax.percentage),
                amount: taxAmount,
              });
            }
          }
        }
      }
    }

    // Round tax amounts
    taxBreakdown.forEach(tax => {
      tax.amount = Math.round(tax.amount * 100) / 100;
    });

    // Calculate charges breakdown
    const chargesBreakdown: any[] = [];
    const charges = await prisma.charge.findMany({
      where: {
        businessOwnerId: tenantId,
        status: 'active',
        OR: [
          { applyTo: 'All' },
          { applyTo: order.type as any },
        ],
      },
    });

    for (const charge of charges) {
      let chargeAmount = 0;
      if (charge.type === 'Fixed') {
        chargeAmount = Number(charge.value);
      } else if (charge.type === 'Percentage') {
        chargeAmount = Number(order.subtotal) * (Number(charge.value) / 100);
      }

      chargesBreakdown.push({
        chargeId: charge.id,
        chargeName: charge.name,
        type: charge.type,
        value: Number(charge.value),
        amount: Math.round(chargeAmount * 100) / 100,
      });
    }

    // Build eligible discounts for payment summary
    const now = new Date();
    const activeDiscounts = await prisma.discount.findMany({
      where: {
        businessOwnerId: tenantId,
        status: 'active',
      },
      include: {
        discountProducts: { select: { productId: true } },
        discountCategories: { select: { categoryId: true } },
      },
    });

    const orderProductIds = order.items.map((item) => item.productId);
    const orderCategoryIds = order.items
      .map((item) => item.product?.categoryId)
      .filter((id): id is string => Boolean(id));

    const eligibleDiscounts = activeDiscounts
      .filter((discount) => {
        if (discount.startDate && now < discount.startDate) return false;
        if (discount.endDate && now > discount.endDate) return false;
        if (discount.usageLimit && discount.usedCount >= discount.usageLimit) return false;
        if (discount.minOrderAmount && Number(order.subtotal) < Number(discount.minOrderAmount)) return false;

        if (discount.type === 'ProductCategory') {
          const matchesProduct = discount.discountProducts.some((dp) => orderProductIds.includes(dp.productId));
          const matchesCategory = discount.discountCategories.some((dc) => orderCategoryIds.includes(dc.categoryId));
          if (!matchesProduct && !matchesCategory) return false;
        }

        return true;
      })
      .map((discount) => ({
        id: discount.id,
        code: discount.code,
        name: discount.name,
        type: discount.type,
        valueType: discount.valueType,
        value: discount.value,
        maxDiscount: discount.maxDiscount,
        minOrderAmount: discount.minOrderAmount,
        startDate: discount.startDate,
        endDate: discount.endDate,
        usageLimit: discount.usageLimit,
        usedCount: discount.usedCount,
      }));

    res.status(200).json({
      success: true,
      data: {
        ...order,
        taxBreakdown,
        chargesBreakdown,
        eligibleDiscounts,
      },
      message: 'Order details retrieved successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while fetching order details',
      },
    } as ApiResponse);
  }
};

/**
 * GET /api/v1/pos/orders
 * Get paginated orders with filters
 */
export const getOrders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.businessOwnerId;
    const {
      branchId,
      status,
      paymentStatus,
      type,
      startDate,
      endDate,
      page = '1',
      limit = '20',
    } = req.query;

    // Build where clause
    const whereClause: Prisma.OrderWhereInput = {
      businessOwnerId: tenantId,
    };

    // Apply branchId filter with scope enforcement
    if (req.branchScope !== null && req.branchScope !== undefined) {
      if (branchId) {
        if (!req.branchScope.includes(branchId as string)) {
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
        whereClause.branchId = branchId as string;
      } else {
        whereClause.branchId = { in: req.branchScope };
      }
    } else if (branchId) {
      whereClause.branchId = branchId as string;
    }

    // Default to today's orders only when no filters are supplied
    const hasDateFilter = Boolean(startDate || endDate);
    const hasStatusFilter = Boolean(status);
    const hasOtherFilters = Boolean(paymentStatus || type);
    if (!branchId && !hasDateFilter && !hasStatusFilter && !hasOtherFilters) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      whereClause.createdAt = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    // Helper to turn comma-separated values into Prisma filters
    const parseList = (value?: unknown) =>
      typeof value === 'string' && value.includes(',')
        ? value.split(',').map((v) => v.trim()).filter(Boolean)
        : value;

    // Apply status filter (supports comma-separated list) and always use { in: [] }
    const statusList = parseList(status);
    if (statusList) {
      const statuses = Array.isArray(statusList) ? statusList : [statusList];
      const validStatuses = [
        'Draft',
        'Pending',
        'Confirmed',
        'Preparing',
        'OnHold',
        'Ready',
        'Served',
        'Completed',
        'Cancelled',
      ];

      const filteredStatuses = statuses.filter((s) => validStatuses.includes(s as string));

      if (filteredStatuses.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ORDER_STATUS',
            message: `Invalid order status. Must be one of: ${validStatuses.join(', ')}`,
          },
        } as ApiResponse);
        return;
      }

      whereClause.orderStatus = { in: filteredStatuses as any[] };
    }

    // Apply payment status filter (supports comma-separated list)
    const paymentList = parseList(paymentStatus);
    if (Array.isArray(paymentList)) {
      whereClause.paymentStatus = { in: paymentList as any[] };
    } else if (paymentList) {
      whereClause.paymentStatus = paymentList as any;
    }

    // Apply order type filter (supports comma-separated list) with UI→backend mapping
    const typeMap: Record<string, string> = {
      Online: 'Delivery', // UI label "Online Orders" maps to Delivery in enum
      Delivery: 'Delivery',
      TakeAway: 'TakeAway',
      DineIn: 'DineIn',
      Catering: 'Catering',
      Subscription: 'Subscription',
    };
    const validTypes = new Set(Object.values(typeMap));
    const typeList = parseList(type);
    if (Array.isArray(typeList)) {
      const mapped = typeList
        .map((t) => typeMap[t] || t)
        .filter((t) => validTypes.has(t));
      if (mapped.length > 0) {
        whereClause.type = { in: mapped as any[] };
      }
    } else if (typeList) {
      const mapped = typeMap[typeList as string] || typeList;
      if (validTypes.has(mapped as string)) {
        whereClause.type = mapped as any;
      }
    }

    // Apply date range filter
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        const endDateTime = new Date(endDate as string);
        endDateTime.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = endDateTime;
      }
    }

    // Calculate pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Fetch orders and total count
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          table: {
            select: {
              id: true,
              label: true,
              floor: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          items: {
            select: {
              id: true,
              quantity: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limitNum,
      }),
      prisma.order.count({
        where: whereClause,
      }),
    ]);

    // Calculate item count for each order
    const ordersWithItemCount = orders.map((order) => ({
      ...order,
      itemCount: order.items.length,
      items: undefined, // Remove items array, only keep count
    }));

    res.status(200).json({
      success: true,
      data: {
        orders: ordersWithItemCount,
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
      },
      message: 'Orders retrieved successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while fetching orders',
      },
    } as ApiResponse);
  }
};

/**
 * GET /api/v1/pos/orders/active
 * Get all currently active orders (not Completed or Cancelled)
 */
export const getActiveOrders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.businessOwnerId;
    const { branchId } = req.query;

    // Build where clause
    const whereClause: Prisma.OrderWhereInput = {
      businessOwnerId: tenantId,
      orderStatus: {
        notIn: ['Completed', 'Cancelled'],
      },
    };

    // Apply branchId filter with scope enforcement
    if (req.branchScope !== null && req.branchScope !== undefined) {
      if (branchId) {
        if (!req.branchScope.includes(branchId as string)) {
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
        whereClause.branchId = branchId as string;
      } else {
        whereClause.branchId = { in: req.branchScope };
      }
    } else if (branchId) {
      whereClause.branchId = branchId as string;
    }

    // Fetch active orders
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        table: {
          select: {
            id: true,
            label: true,
            floor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        items: {
          select: {
            id: true,
            quantity: true,
            status: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc', // Oldest orders first
      },
    });

    // Group orders by status for overview
    const groupedByStatus = orders.reduce((acc: any, order: any) => {
      const status = order.orderStatus;
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push({
        ...order,
        itemCount: order.items.length,
      });
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        orders,
        groupedByStatus,
        totalActive: orders.length,
      },
      message: 'Active orders retrieved successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching active orders:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while fetching active orders',
      },
    } as ApiResponse);
  }
};

/**
 * GET /api/v1/pos/tables/:branchId
 * Get table status overview for a branch, grouped by floor
 */
export const getTableStatusOverview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.businessOwnerId;
    const { branchId } = req.params;

    // Validate branch exists and belongs to tenant
    const branch = await prisma.branch.findFirst({
      where: {
        id: branchId,
        businessOwnerId: tenantId,
      },
    });

    if (!branch) {
      res.status(404).json({
        success: false,
        error: {
          code: 'BRANCH_NOT_FOUND',
          message: 'Branch not found',
        },
      } as ApiResponse);
      return;
    }

    // Fetch all floors with tables for this branch
    const floors = await prisma.floor.findMany({
      where: {
        branch: {
          id: branchId,
          businessOwnerId: tenantId,
        },
        status: 'active',
      },
      include: {
        tables: {
          include: {
            orders: {
              where: {
                orderStatus: {
                  notIn: ['Completed', 'Cancelled'],
                },
              },
              select: {
                id: true,
                orderNumber: true,
                orderStatus: true,
                total: true,
                createdAt: true,
                customer: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                items: {
                  select: {
                    id: true,
                    name: true,
                    quantity: true,
                    status: true,
                  },
                },
              },
              take: 1, // Get the current active order for the table
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
          orderBy: {
            label: 'asc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Format the response with table status and current order info
    const floorsWithTables = floors.map((floor) => ({
      id: floor.id,
      name: floor.name,
      type: floor.type,
      tables: floor.tables.map((table) => {
        const currentOrder = table.orders[0] || null;
        return {
          id: table.id,
          label: table.label,
          shape: table.shape,
          chairs: table.chairs,
          status: table.status,
          currentOrder: currentOrder ? {
            id: currentOrder.id,
            orderNumber: currentOrder.orderNumber,
            status: currentOrder.orderStatus,
            total: currentOrder.total,
            customerName: currentOrder.customer?.name || 'Walk-in',
            itemCount: currentOrder.items.length,
            elapsedTime: Math.floor((Date.now() - new Date(currentOrder.createdAt).getTime()) / 60000), // minutes
          } : null,
        };
      }),
      tableCount: floor.tables.length,
      availableCount: floor.tables.filter((t) => t.status === 'available').length,
      runningCount: floor.tables.filter((t) => t.status === 'running').length,
      reservedCount: floor.tables.filter((t) => t.status === 'reserved').length,
    }));

    // Calculate overall stats
    const totalTables = floorsWithTables.reduce((sum, floor) => sum + floor.tableCount, 0);
    const availableTables = floorsWithTables.reduce((sum, floor) => sum + floor.availableCount, 0);
    const runningTables = floorsWithTables.reduce((sum, floor) => sum + floor.runningCount, 0);
    const reservedTables = floorsWithTables.reduce((sum, floor) => sum + floor.reservedCount, 0);

    res.status(200).json({
      success: true,
      data: {
        branchId,
        branchName: branch.name,
        floors: floorsWithTables,
        summary: {
          totalTables,
          availableTables,
          runningTables,
          reservedTables,
        },
      },
      message: 'Table status overview retrieved successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching table status overview:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while fetching table status',
      },
    } as ApiResponse);
  }
};

/**
 * POST /api/v1/pos/orders/:orderId/kot
 * Generate Kitchen Order Ticket (KOT) for an order
 */
export const generateKOT = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.businessOwnerId;
    const { orderId } = req.params;
    const { kitchenId } = req.body;

    // Validate order exists and belongs to tenant
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        businessOwnerId: tenantId,
      },
      include: {
        items: {
          where: {
            status: 'Pending',
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                productKitchens: {
                  select: {
                    kitchenId: true,
                  },
                },
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
              },
            },
            addons: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
        table: {
          select: {
            id: true,
            label: true,
          },
        },
      },
    });

    if (!order) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found',
        },
      } as ApiResponse);
      return;
    }

    // Determine kitchen ID: use provided kitchenId, or auto-detect from first product's kitchen assignment
    let resolvedKitchenId = kitchenId;
    if (!resolvedKitchenId && order.items.length > 0) {
      const firstItem = order.items[0] as any;
      if (firstItem.product?.productKitchens?.length > 0) {
        resolvedKitchenId = firstItem.product.productKitchens[0].kitchenId;
      }
    }

    if (!resolvedKitchenId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'KITCHEN_ID_REQUIRED',
          message: 'Kitchen ID is required. Assign products to kitchens or provide a kitchen ID.',
        },
      } as ApiResponse);
      return;
    }

    // Validate kitchen exists and belongs to the branch
    const kitchen = await prisma.kitchen.findFirst({
      where: {
        id: resolvedKitchenId,
      },
      include: {
        branch: {
          select: {
            id: true,
            businessOwnerId: true,
          },
        },
      },
    });

    if (!kitchen || kitchen.branch.businessOwnerId !== tenantId) {
      res.status(404).json({
        success: false,
        error: {
          code: 'KITCHEN_NOT_FOUND',
          message: 'Kitchen not found',
        },
      } as ApiResponse);
      return;
    }

    // Check if there are pending items
    if (order.items.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'NO_PENDING_ITEMS',
          message: 'No pending items to generate KOT',
        },
      } as ApiResponse);
      return;
    }

    // Generate KOT number (format: KOT-XXXX)
    // Get the latest KOT number for the tenant
    const latestKOT = await prisma.orderKOT.findFirst({
      where: {
        order: {
          businessOwnerId: tenantId,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        kotNumber: true,
      },
    });

    let kotNumber = 'KOT-0001';
    if (latestKOT) {
      // Extract number from KOT-XXXX format
      const lastNumber = parseInt(latestKOT.kotNumber.split('-')[1]);
      const nextNumber = lastNumber + 1;
      kotNumber = `KOT-${nextNumber.toString().padStart(4, '0')}`;
    }

    // Create OrderKOT record
    const kot = await prisma.orderKOT.create({
      data: {
        orderId,
        kitchenId: resolvedKitchenId,
        kotNumber,
        status: 'New',
        printedAt: new Date(),
      },
      include: {
        order: {
          include: {
            items: {
              where: {
                status: 'Pending',
              },
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                variant: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                addons: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                  },
                },
              },
            },
            table: {
              select: {
                id: true,
                label: true,
              },
            },
          },
        },
        kitchen: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Emit KOT_STATUS_CHANGED WebSocket event (new KOT created with status 'New')
    try {
      const kotPayload = {
        kotId: kot.id,
        orderId: kot.orderId,
        orderNumber: kot.order.orderNumber,
        status: 'New',
        previousStatus: '',
        kitchenId: resolvedKitchenId,
        items: kot.order.items.map((item: any) => ({
          productId: item.product?.id || item.productId,
          productName: item.product?.name || item.name,
          quantity: item.quantity,
        })),
        updatedAt: new Date().toISOString(),
      };
      connectionManager.broadcastToBranch(
        tenantId!,
        kitchen.branch.id,
        WebSocketEventType.KOT_STATUS_CHANGED,
        kotPayload
      );
    } catch (wsError) {
      console.error('Failed to emit KOT_STATUS_CHANGED WebSocket event:', wsError);
    }

    res.status(201).json({
      success: true,
      data: kot,
      message: 'KOT generated successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('Error generating KOT:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while generating KOT',
      },
    } as ApiResponse);
  }
};

/**
 * PATCH /api/v1/pos/orders/:orderId/transfer-table
 * Transfer an order from one table to another
 */
export const transferTable = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.businessOwnerId;
    const { orderId } = req.params;
    const { newTableId } = req.body;

    // Validate required field
    if (!newTableId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'NEW_TABLE_ID_REQUIRED',
          message: 'New table ID is required',
        },
      } as ApiResponse);
      return;
    }

    // Validate order exists and belongs to tenant
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        businessOwnerId: tenantId,
      },
      include: {
        table: true,
      },
    });

    if (!order) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found',
        },
      } as ApiResponse);
      return;
    }

    // Validate order has a table assigned
    if (!order.tableId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'ORDER_NO_TABLE',
          message: 'Order does not have a table assigned',
        },
      } as ApiResponse);
      return;
    }

    // Validate new table exists and is available
    const newTable = await prisma.table.findFirst({
      where: {
        id: newTableId,
      },
      include: {
        floor: {
          include: {
            branch: true,
          },
        },
      },
    });

    if (!newTable) {
      res.status(404).json({
        success: false,
        error: {
          code: 'TABLE_NOT_FOUND',
          message: 'New table not found',
        },
      } as ApiResponse);
      return;
    }

    // Verify new table belongs to the same branch
    if (newTable.floor.branch.id !== order.branchId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'TABLE_BRANCH_MISMATCH',
          message: 'New table does not belong to the same branch as the order',
        },
      } as ApiResponse);
      return;
    }

    // Verify new table is available or reserved
    if (newTable.status !== 'available' && newTable.status !== 'reserved') {
      res.status(400).json({
        success: false,
        error: {
          code: 'TABLE_NOT_AVAILABLE',
          message: 'New table is not available',
        },
      } as ApiResponse);
      return;
    }

    // Verify not transferring to the same table
    if (order.tableId === newTableId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'SAME_TABLE',
          message: 'Cannot transfer order to the same table',
        },
      } as ApiResponse);
      return;
    }

    // Update order with new table
    await prisma.order.update({
      where: { id: orderId },
      data: {
        tableId: newTableId,
      },
    });

    // Update old table status to available
    await prisma.table.update({
      where: { id: order.tableId },
      data: { status: 'available' },
    });

    // Update new table status to running
    await prisma.table.update({
      where: { id: newTableId },
      data: { status: 'running' },
    });

    // Emit TABLE_STATUS_CHANGED WebSocket events for both tables
    try {
      const wsBranchId = newTable.floor.branch.id;
      // Old table → available
      const oldTablePayload: TableStatusChangedPayload = {
        tableId: order.tableId!,
        tableName: order.table?.label || order.tableId!,
        status: 'available',
        previousStatus: 'running',
        floorId: order.table?.floorId || '',
        floorName: '',
        updatedAt: new Date().toISOString(),
      };
      connectionManager.broadcastToBranch(tenantId!, wsBranchId, WebSocketEventType.TABLE_STATUS_CHANGED, oldTablePayload);

      // New table → running
      const newTablePayload: TableStatusChangedPayload = {
        tableId: newTableId,
        tableName: newTable.label,
        status: 'running',
        previousStatus: newTable.status,
        floorId: newTable.floor.id,
        floorName: newTable.floor.name,
        updatedAt: new Date().toISOString(),
      };
      connectionManager.broadcastToBranch(tenantId!, wsBranchId, WebSocketEventType.TABLE_STATUS_CHANGED, newTablePayload);
    } catch (wsError) {
      console.error('Failed to emit TABLE_STATUS_CHANGED WebSocket event:', wsError);
    }

    // Get updated order with full details using existing function logic
    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        table: true,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        order: updatedOrder,
      },
      message: 'Order transferred to new table successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('Error transferring table:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while transferring table',
      },
    } as ApiResponse);
  }
};

/**
 * POST /api/v1/pos/orders/:orderId/sync-accounting
 * Manually trigger accounting sync for a completed order
 */
export const syncOrderToAccounting = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.businessOwnerId as string;
    const { orderId } = req.params;

    // Verify order exists and belongs to tenant
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        businessOwnerId: tenantId,
      },
    });

    if (!order) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found',
        },
      } as ApiResponse);
      return;
    }

    if (order.orderStatus !== 'Completed') {
      res.status(400).json({
        success: false,
        error: {
          code: 'ORDER_NOT_COMPLETED',
          message: 'Only completed orders can be synced to accounting',
        },
      } as ApiResponse);
      return;
    }

    // Find active accounting integrations for this business
    const accountingIntegrations = await prisma.integration.findMany({
      where: {
        businessOwnerId: tenantId,
        type: 'accounting',
        status: 'active',
      },
    });

    if (accountingIntegrations.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'NO_ACCOUNTING_INTEGRATION',
          message: 'No active accounting integration found. Configure one in Business Settings > Integrations.',
        },
      } as ApiResponse);
      return;
    }

    const results: Array<{ provider: string; success: boolean; message: string }> = [];

    for (const integration of accountingIntegrations) {
      try {
        let syncResult: { success: boolean; message: string };
        if (integration.provider === 'tally') {
          syncResult = await syncTallyInvoice(orderId);
        } else if (integration.provider === 'quickbooks') {
          syncResult = await syncQuickBooksInvoice(orderId);
        } else if (integration.provider === 'zoho_books') {
          syncResult = await syncZohoInvoice(orderId);
        } else {
          syncResult = { success: false, message: `Unknown accounting provider: ${integration.provider}` };
        }
        results.push({ provider: integration.provider, ...syncResult });
      } catch (syncError) {
        const errorMessage = syncError instanceof Error ? syncError.message : 'Unknown error';
        console.error(`Accounting sync failed for ${integration.provider}:`, syncError);
        results.push({ provider: integration.provider, success: false, message: errorMessage });
      }
    }

    const allSucceeded = results.every(r => r.success);
    const anySucceeded = results.some(r => r.success);

    res.status(anySucceeded ? 200 : 500).json({
      success: anySucceeded,
      data: { results },
      message: allSucceeded
        ? 'Order synced to accounting successfully'
        : anySucceeded
          ? 'Some accounting syncs completed with errors'
          : 'Accounting sync failed',
    } as ApiResponse);
  } catch (error) {
    console.error('Error syncing order to accounting:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while syncing to accounting',
      },
    } as ApiResponse);
  }
};

/**
 * POST /api/v1/pos/orders/:orderId/charges
 * Calculate and apply charges to an order based on business charge rules
 */
export const applyOrderCharges = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.businessOwnerId;
    const { orderId } = req.params;
    const branchId = req.user!.branchId || (req.query.branchId as string);

    if (!branchId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_BRANCH_ID',
          message: 'branchId is required',
        },
      } as ApiResponse);
      return;
    }

    // Verify the order belongs to this tenant
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        branch: { businessOwnerId: tenantId },
      },
    });

    if (!order) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found',
        },
      } as ApiResponse);
      return;
    }

    // Calculate charges and update the order
    const chargesAmount = await updateOrderCharges(orderId, branchId);
    const breakdown = (await calculateOrderCharges(orderId, branchId)).breakdown;

    res.status(200).json({
      success: true,
      data: {
        orderId,
        chargesAmount,
        breakdown,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Error applying order charges:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CHARGES_CALCULATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to calculate order charges',
      },
    } as ApiResponse);
  }
};
