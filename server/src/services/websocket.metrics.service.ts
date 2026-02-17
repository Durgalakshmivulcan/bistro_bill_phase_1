import { prisma } from './db.service';
import { connectionManager } from '../websocket/connectionManager';
import { WebSocketEventType, DashboardMetricsUpdatedPayload } from '../types/websocket.types';

/**
 * WebSocket Metrics Service
 *
 * Aggregates dashboard metrics (today's revenue, order count, avg order value)
 * and broadcasts them via WebSocket to all connections for a branch.
 */

/**
 * Calculate today's dashboard metrics for a branch and broadcast via WebSocket.
 */
export async function broadcastDashboardMetrics(
  businessOwnerId: string,
  branchId: string
): Promise<void> {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Aggregate today's non-cancelled orders for the branch
    const result = await prisma.order.aggregate({
      where: {
        businessOwnerId,
        branchId,
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
        orderStatus: { notIn: ['Cancelled'] },
      },
      _sum: { total: true },
      _count: { _all: true },
      _avg: { total: true },
    });

    const totalRevenue = Number(result._sum?.total ?? 0);
    const orderCount = result._count?._all ?? 0;
    const averageOrderValue = Number(result._avg?.total ?? 0);

    const payload: DashboardMetricsUpdatedPayload = {
      totalRevenue,
      orderCount,
      averageOrderValue,
      updatedAt: new Date().toISOString(),
    };

    connectionManager.broadcastToBranch(
      businessOwnerId,
      branchId,
      WebSocketEventType.DASHBOARD_METRICS_UPDATED,
      payload
    );
  } catch (error) {
    console.error('[WS Metrics] Failed to broadcast dashboard metrics:', error);
  }
}
