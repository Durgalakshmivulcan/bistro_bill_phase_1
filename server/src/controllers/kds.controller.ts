import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { PrismaClient, OrderKOT, Order, Table, Floor, OrderItem, Product, ProductVariant, OrderItemAddon, ProductAddon } from '@prisma/client';
import { connectionManager } from '../websocket/connectionManager';
import { WebSocketEventType } from '../types/websocket.types';

const prisma = new PrismaClient();

type KOTWithOrder = OrderKOT & {
  order: Order & {
    table: (Table & { floor: Floor | null }) | null;
    items: (OrderItem & {
      product: Product | null;
      variant: ProductVariant | null;
      addons: (OrderItemAddon & { addon: ProductAddon | null })[];
    })[];
  };
};

/**
 * GET /api/v1/kds/:kitchenId/orders
 * Get all orders assigned to a kitchen, grouped by KOT status
 */
export const getKitchenOrderBoard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { kitchenId } = req.params;
    const businessOwnerId = req.user?.businessOwnerId;

    // Verify kitchen exists and belongs to tenant
    const kitchen = await prisma.kitchen.findFirst({
      where: {
        id: kitchenId,
        branch: {
          businessOwnerId: businessOwnerId,
        },
      },
      include: {
        branch: true,
      },
    });

    if (!kitchen) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'KITCHEN_NOT_FOUND',
          message: 'Kitchen not found',
        },
      });
    }

    // Set up date range for Served/Cancelled (today only to limit results)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch active OrderKOTs (New, Preparing, Ready)
    const activeKots: KOTWithOrder[] = await prisma.orderKOT.findMany({
      where: {
        kitchenId: kitchenId,
        status: {
          in: ['New', 'Preparing', 'Ready'],
        },
      },
      include: {
        order: {
          include: {
            table: {
              include: {
                floor: true,
              },
            },
            items: {
              include: {
                product: true,
                variant: true,
                addons: {
                  include: {
                    addon: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Fetch Served KOTs (created today only)
    const servedKots: KOTWithOrder[] = await prisma.orderKOT.findMany({
      where: {
        kitchenId: kitchenId,
        status: 'Served',
        createdAt: {
          gte: today,
        },
      },
      include: {
        order: {
          include: {
            table: {
              include: {
                floor: true,
              },
            },
            items: {
              include: {
                product: true,
                variant: true,
                addons: {
                  include: {
                    addon: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    // Note: KOTStatus enum doesn't include 'Cancelled' - only OrderItemStatus does.
    // Cancelled column will be empty for now until KOT cancellation is implemented.

    const kots = [...activeKots, ...servedKots];

    // Calculate elapsed time for each KOT
    const kotsWithElapsedTime = kots.map((kot: KOTWithOrder) => {
      const elapsedMinutes = Math.floor((Date.now() - new Date(kot.createdAt).getTime()) / 1000 / 60);

      return {
        ...kot,
        elapsedMinutes,
        tableNumber: kot.order.table?.label || null,
        floorName: kot.order.table?.floor?.name || null,
        itemCount: kot.order.items.length,
      };
    });

    // Group by KOT status
    const groupedByStatus = {
      New: kotsWithElapsedTime.filter((kot: any) => kot.status === 'New'),
      Preparing: kotsWithElapsedTime.filter((kot: any) => kot.status === 'Preparing'),
      Ready: kotsWithElapsedTime.filter((kot: any) => kot.status === 'Ready'),
      Served: kotsWithElapsedTime.filter((kot: any) => kot.status === 'Served'),
      Cancelled: [] as typeof kotsWithElapsedTime, // KOTStatus has no Cancelled state yet
    };

    return res.json({
      success: true,
      data: {
        kitchen: {
          id: kitchen.id,
          name: kitchen.name,
          branchId: kitchen.branchId,
          branchName: kitchen.branch.name,
        },
        kots: kotsWithElapsedTime,
        groupedByStatus,
        summary: {
          totalNew: groupedByStatus.New.length,
          totalPreparing: groupedByStatus.Preparing.length,
          totalReady: groupedByStatus.Ready.length,
          totalServed: groupedByStatus.Served.length,
          totalCancelled: groupedByStatus.Cancelled.length,
          totalKots: activeKots.length,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching kitchen order board:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch kitchen order board',
      },
    });
  }
};

/**
 * PATCH /api/v1/kds/items/:orderItemId/status
 * Update order item status (Preparing, Ready)
 */
export const updateKDSItemStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderItemId } = req.params;
    const { status } = req.body;
    const businessOwnerId = req.user?.businessOwnerId;
    const staffId = req.user?.id;

    // Validate status
    if (!status || !['Preparing', 'Ready'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Status must be either "Preparing" or "Ready"',
        },
      });
    }

    // Fetch the order item with its order and kitchen info
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        id: orderItemId,
      },
      include: {
        order: {
          include: {
            branch: true,
          },
        },
        product: true,
        variant: true,
        addons: {
          include: {
            addon: true,
          },
        },
      },
    });

    if (!orderItem) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_ITEM_NOT_FOUND',
          message: 'Order item not found',
        },
      });
    }

    // Verify the order belongs to the tenant
    if (orderItem.order.branch.businessOwnerId !== businessOwnerId) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_ITEM_NOT_FOUND',
          message: 'Order item not found',
        },
      });
    }

    // Update the order item status
    const updatedItem = await prisma.orderItem.update({
      where: {
        id: orderItemId,
      },
      data: {
        status,
      },
      include: {
        product: true,
        variant: true,
        addons: {
          include: {
            addon: true,
          },
        },
      },
    });

    // Create timeline entry
    await prisma.orderTimeline.create({
      data: {
        orderId: orderItem.orderId,
        action: 'item_status_updated',
        description: `${orderItem.name} status updated to ${status}`,
        staffId: staffId || null,
      },
    });

    return res.json({
      success: true,
      data: updatedItem,
    });
  } catch (error) {
    console.error('Error updating KDS item status:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to update item status',
      },
    });
  }
};

/**
 * PATCH /api/v1/kds/kot/:kotId/status
 * Update KOT status (Preparing, Ready, Served)
 */
export const updateKOTStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { kotId } = req.params;
    const { status } = req.body;
    const businessOwnerId = req.user?.businessOwnerId;
    const staffId = req.user?.id;

    // Validate status
    if (!status || !['Preparing', 'Ready', 'Served'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Status must be one of "Preparing", "Ready", or "Served"',
        },
      });
    }

    // Fetch the KOT with its order and items
    const kot = await prisma.orderKOT.findFirst({
      where: {
        id: kotId,
      },
      include: {
        kitchen: {
          include: {
            branch: true,
          },
        },
        order: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!kot) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'KOT_NOT_FOUND',
          message: 'KOT not found',
        },
      });
    }

    // Verify the KOT belongs to the tenant
    if (kot.kitchen.branch.businessOwnerId !== businessOwnerId) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'KOT_NOT_FOUND',
          message: 'KOT not found',
        },
      });
    }

    // If status is 'Ready', update all items in the KOT to 'Ready'
    if (status === 'Ready') {
      await prisma.orderItem.updateMany({
        where: {
          orderId: kot.orderId,
          status: {
            notIn: ['Served', 'Cancelled'],
          },
        },
        data: {
          status: 'Ready',
        },
      });
    }

    // Update the KOT status
    const updatedKOT = await prisma.orderKOT.update({
      where: {
        id: kotId,
      },
      data: {
        status,
      },
      include: {
        kitchen: true,
        order: {
          include: {
            items: {
              include: {
                product: true,
                variant: true,
                addons: {
                  include: {
                    addon: true,
                  },
                },
              },
            },
            table: {
              include: {
                floor: true,
              },
            },
          },
        },
      },
    });

    // Create timeline entry
    await prisma.orderTimeline.create({
      data: {
        orderId: kot.orderId,
        action: 'kot_status_updated',
        description: `KOT ${kot.kotNumber} status updated to ${status}`,
        staffId: staffId || null,
      },
    });

    // Emit KOT_STATUS_CHANGED WebSocket event
    try {
      const previousStatus = kot.status;
      const kotPayload = {
        kotId: updatedKOT.id,
        orderId: updatedKOT.orderId,
        orderNumber: updatedKOT.order.orderNumber,
        status,
        previousStatus,
        kitchenId: updatedKOT.kitchenId,
        items: updatedKOT.order.items.map((item: any) => ({
          productId: item.product?.id || '',
          productName: item.product?.name || item.name || '',
          quantity: item.quantity,
        })),
        updatedAt: new Date().toISOString(),
      };
      connectionManager.broadcastToBranch(
        businessOwnerId,
        kot.kitchen.branch.id,
        WebSocketEventType.KOT_STATUS_CHANGED,
        kotPayload
      );
    } catch (wsError) {
      console.error('Failed to emit KOT_STATUS_CHANGED WebSocket event:', wsError);
    }

    return res.json({
      success: true,
      data: updatedKOT,
    });
  } catch (error) {
    console.error('Error updating KOT status:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to update KOT status',
      },
    });
  }
};

/**
 * GET /api/v1/kds/:kitchenId/stats
 * Get kitchen performance statistics
 */
export const getKitchenStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { kitchenId } = req.params;
    const { startDate, endDate } = req.query;
    const businessOwnerId = req.user?.businessOwnerId;

    // Verify kitchen exists and belongs to tenant
    const kitchen = await prisma.kitchen.findFirst({
      where: {
        id: kitchenId,
        branch: {
          businessOwnerId: businessOwnerId,
        },
      },
      include: {
        branch: true,
      },
    });

    if (!kitchen) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'KITCHEN_NOT_FOUND',
          message: 'Kitchen not found',
        },
      });
    }

    // Set up date range filters
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Date filter for queries
    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    } else {
      // Default to today
      dateFilter.createdAt = {
        gte: today,
        lt: tomorrow,
      };
    }

    // Fetch all completed KOTs for this kitchen in the date range
    const completedKOTs = await prisma.orderKOT.findMany({
      where: {
        kitchenId: kitchenId,
        status: 'Served',
        ...dateFilter,
      },
      include: {
        order: {
          include: {
            items: true,
          },
        },
      },
    });

    // Calculate average preparation time
    // We'll calculate based on when items were marked as Ready
    let totalPrepTime = 0;
    let itemsWithPrepTime = 0;

    completedKOTs.forEach((kot) => {
      kot.order.items.forEach((item) => {
        // Calculate prep time from order creation to item ready
        if (item.status === 'Ready' || item.status === 'Served') {
          const prepTimeMs = item.updatedAt.getTime() - kot.createdAt.getTime();
          const prepTimeMinutes = Math.floor(prepTimeMs / 1000 / 60);
          if (prepTimeMinutes >= 0) {
            totalPrepTime += prepTimeMinutes;
            itemsWithPrepTime++;
          }
        }
      });
    });

    const avgPreparationTime = itemsWithPrepTime > 0
      ? Math.round(totalPrepTime / itemsWithPrepTime)
      : 0;

    // Count orders completed today
    const ordersCompletedToday = completedKOTs.length;

    // Count pending orders (KOTs that are not Served)
    const pendingKOTs = await prisma.orderKOT.count({
      where: {
        kitchenId: kitchenId,
        status: {
          notIn: ['Served'],
        },
      },
    });

    // Total items prepared
    const totalItemsPrepared = completedKOTs.reduce((sum, kot) => {
      return sum + kot.order.items.length;
    }, 0);

    return res.json({
      success: true,
      data: {
        kitchen: {
          id: kitchen.id,
          name: kitchen.name,
          branchId: kitchen.branchId,
          branchName: kitchen.branch.name,
        },
        stats: {
          avgPreparationTime,
          ordersCompletedToday,
          pendingOrders: pendingKOTs,
          totalItemsPrepared,
          dateRange: {
            start: startDate || today.toISOString(),
            end: endDate || tomorrow.toISOString(),
          },
        },
      },
    });
  } catch (error) {
    console.error('Error fetching kitchen stats:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch kitchen statistics',
      },
    });
  }
};
