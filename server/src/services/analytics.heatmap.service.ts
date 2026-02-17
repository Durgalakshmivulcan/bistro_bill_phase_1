import { prisma } from './db.service';

// ============================================
// Type Definitions
// ============================================

export interface HeatmapCell {
  orderCount: number;
  revenue: number;
  avgOrderValue: number;
  percentile: number;
}

export interface SalesHeatmapResult {
  heatmap: HeatmapCell[][]; // 7 rows (days) x 24 cols (hours)
  dayLabels: string[];
  hourLabels: string[];
  summary: {
    peakDay: string;
    peakHour: number;
    peakRevenue: number;
    totalOrders: number;
    totalRevenue: number;
  };
  modelInfo: {
    dataPointsUsed: number;
    method: string;
  };
}

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ============================================
// Main Heatmap Function
// ============================================

export async function getSalesHeatmap(
  businessOwnerId: string,
  branchId?: string,
  startDate?: string,
  endDate?: string
): Promise<SalesHeatmapResult> {
  // Default to last 30 days if no dates provided
  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Build where clause
  const where: any = {
    businessOwnerId,
    orderStatus: { in: ['Completed', 'Served'] },
    createdAt: { gte: start, lte: end },
  };
  if (branchId) {
    where.branchId = branchId;
  }

  const orders = await prisma.order.findMany({
    where,
    select: {
      total: true,
      createdAt: true,
    },
  });

  // Initialize 7x24 grid
  const grid: { orderCount: number; revenue: number }[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => ({ orderCount: 0, revenue: 0 }))
  );

  // Aggregate orders into grid
  for (const order of orders) {
    const day = order.createdAt.getDay(); // 0=Sun, 6=Sat
    const hour = order.createdAt.getHours(); // 0-23
    const revenue = parseFloat(order.total.toString());
    grid[day][hour].orderCount += 1;
    grid[day][hour].revenue += revenue;
  }

  // Collect all non-zero order counts for percentile calculation
  const allCounts: number[] = [];
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      if (grid[d][h].orderCount > 0) {
        allCounts.push(grid[d][h].orderCount);
      }
    }
  }
  allCounts.sort((a, b) => a - b);

  // Calculate percentile for each cell
  const heatmap: HeatmapCell[][] = grid.map(dayRow =>
    dayRow.map(cell => {
      const avgOrderValue = cell.orderCount > 0
        ? Math.round((cell.revenue / cell.orderCount) * 100) / 100
        : 0;

      let percentile = 0;
      if (cell.orderCount > 0 && allCounts.length > 0) {
        const rank = allCounts.filter(c => c <= cell.orderCount).length;
        percentile = Math.round((rank / allCounts.length) * 100);
      }

      return {
        orderCount: cell.orderCount,
        revenue: Math.round(cell.revenue * 100) / 100,
        avgOrderValue,
        percentile,
      };
    })
  );

  // Find peak day/hour
  let peakDay = 0;
  let peakHour = 0;
  let peakRevenue = 0;
  let totalOrders = 0;
  let totalRevenue = 0;

  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      totalOrders += heatmap[d][h].orderCount;
      totalRevenue += heatmap[d][h].revenue;
      if (heatmap[d][h].revenue > peakRevenue) {
        peakRevenue = heatmap[d][h].revenue;
        peakDay = d;
        peakHour = h;
      }
    }
  }

  // Generate hour labels
  const hourLabels = Array.from({ length: 24 }, (_, i) => {
    if (i === 0) return '12 AM';
    if (i < 12) return `${i} AM`;
    if (i === 12) return '12 PM';
    return `${i - 12} PM`;
  });

  return {
    heatmap,
    dayLabels: DAY_LABELS,
    hourLabels,
    summary: {
      peakDay: DAY_LABELS[peakDay],
      peakHour,
      peakRevenue: Math.round(peakRevenue * 100) / 100,
      totalOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
    },
    modelInfo: {
      dataPointsUsed: orders.length,
      method: 'Hourly Sales Aggregation with Percentile Ranking',
    },
  };
}
