import { prisma } from './db.service';

// ============================================
// Type Definitions
// ============================================

export interface ProductTrend {
  productId: string;
  productName: string;
  categoryName: string | null;
  growthPercent: number; // week-over-week or month-over-month growth
  trend: 'up' | 'stable' | 'down';
  velocity7d: number;  // avg daily sales last 7 days
  velocity30d: number; // avg daily sales last 30 days
  velocity90d: number; // avg daily sales last 90 days
  totalRevenue: number;
  totalQuantity: number;
  sparkline: number[]; // 30 daily data points for sparkline chart
}

export interface ProductTrendsResult {
  trendingUp: ProductTrend[];
  trendingDown: ProductTrend[];
  summary: {
    totalProductsAnalyzed: number;
    trendingUpCount: number;
    stableCount: number;
    trendingDownCount: number;
    topGrower: string | null;
    topDecliner: string | null;
  };
  modelInfo: {
    dataPointsUsed: number;
    method: string;
    periodDays: number;
  };
}

// ============================================
// Main Function
// ============================================

export async function getProductTrends(
  businessOwnerId: string,
  branchId?: string,
  days: number = 30
): Promise<ProductTrendsResult> {
  const now = new Date();
  const periodEnd = now;
  const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const prevPeriodStart = new Date(periodStart.getTime() - days * 24 * 60 * 60 * 1000);

  // Also need 90 days back for velocity
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const earliestDate = ninetyDaysAgo < prevPeriodStart ? ninetyDaysAgo : prevPeriodStart;

  // Get all products for this business owner
  const products = await prisma.product.findMany({
    where: { businessOwnerId, status: 'active' },
    select: {
      id: true,
      name: true,
      categoryId: true,
    },
  });

  // Fetch category names for mapping
  const categoryIds = [...new Set(products.map(p => p.categoryId).filter(Boolean))] as string[];
  const categories = categoryIds.length > 0
    ? await prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true },
      })
    : [];
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));

  // Get all order items in the full time range
  const orderItemWhere: any = {
    order: {
      businessOwnerId,
      orderStatus: { in: ['Completed', 'Served'] },
      createdAt: { gte: earliestDate, lte: periodEnd },
    },
  };
  if (branchId) {
    orderItemWhere.order.branchId = branchId;
  }

  const allOrderItems = await prisma.orderItem.findMany({
    where: orderItemWhere,
    select: {
      productId: true,
      quantity: true,
      totalPrice: true,
      order: { select: { createdAt: true } },
    },
  });

  // Aggregate by product and date
  const productDailyData = new Map<string, Map<string, { quantity: number; revenue: number }>>();

  for (const item of allOrderItems) {
    const dateKey = item.order.createdAt.toISOString().split('T')[0];
    if (!productDailyData.has(item.productId)) {
      productDailyData.set(item.productId, new Map());
    }
    const dailyMap = productDailyData.get(item.productId)!;
    const existing = dailyMap.get(dateKey) || { quantity: 0, revenue: 0 };
    existing.quantity += item.quantity;
    existing.revenue += parseFloat(item.totalPrice.toString());
    dailyMap.set(dateKey, existing);
  }

  // Calculate trends for each product
  const trends: ProductTrend[] = [];
  let totalDataPoints = 0;

  for (const product of products) {
    const dailyMap = productDailyData.get(product.id);
    if (!dailyMap || dailyMap.size === 0) continue;

    // Calculate current period revenue
    let currentRevenue = 0;
    let currentQuantity = 0;
    let prevRevenue = 0;

    for (const [dateStr, data] of dailyMap) {
      const date = new Date(dateStr);
      if (date >= periodStart && date <= periodEnd) {
        currentRevenue += data.revenue;
        currentQuantity += data.quantity;
      } else if (date >= prevPeriodStart && date < periodStart) {
        prevRevenue += data.revenue;
      }
    }

    // Skip products with no sales in current period
    if (currentQuantity === 0) continue;

    totalDataPoints += dailyMap.size;

    // Calculate growth percentage
    let growthPercent = 0;
    if (prevRevenue > 0) {
      growthPercent = Math.round(((currentRevenue - prevRevenue) / prevRevenue) * 100);
    } else if (currentRevenue > 0) {
      growthPercent = 100; // New product, 100% growth
    }

    // Determine trend
    let trend: 'up' | 'stable' | 'down' = 'stable';
    if (growthPercent > 20) trend = 'up';
    else if (growthPercent < -20) trend = 'down';

    // Calculate velocities (avg daily sales)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let qty7d = 0, qty30d = 0, qty90d = 0;
    for (const [dateStr, data] of dailyMap) {
      const date = new Date(dateStr);
      if (date >= sevenDaysAgo) qty7d += data.quantity;
      if (date >= thirtyDaysAgo) qty30d += data.quantity;
      if (date >= ninetyDaysAgo) qty90d += data.quantity;
    }

    const velocity7d = Math.round((qty7d / 7) * 10) / 10;
    const velocity30d = Math.round((qty30d / 30) * 10) / 10;
    const velocity90d = Math.round((qty90d / 90) * 10) / 10;

    // Build 30-day sparkline (daily revenue for last 30 days)
    const sparkline: number[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      const dayData = dailyMap.get(key);
      sparkline.push(dayData ? Math.round(dayData.revenue * 100) / 100 : 0);
    }

    trends.push({
      productId: product.id,
      productName: product.name,
      categoryName: product.categoryId ? categoryMap.get(product.categoryId) || null : null,
      growthPercent,
      trend,
      velocity7d,
      velocity30d,
      velocity90d,
      totalRevenue: Math.round(currentRevenue * 100) / 100,
      totalQuantity: currentQuantity,
      sparkline,
    });
  }

  // Sort and split into trending up and down
  const trendingUp = trends
    .filter(t => t.trend === 'up')
    .sort((a, b) => b.growthPercent - a.growthPercent)
    .slice(0, 10);

  const trendingDown = trends
    .filter(t => t.trend === 'down')
    .sort((a, b) => a.growthPercent - b.growthPercent)
    .slice(0, 10);

  const upCount = trends.filter(t => t.trend === 'up').length;
  const downCount = trends.filter(t => t.trend === 'down').length;
  const stableCount = trends.filter(t => t.trend === 'stable').length;

  return {
    trendingUp,
    trendingDown,
    summary: {
      totalProductsAnalyzed: trends.length,
      trendingUpCount: upCount,
      stableCount,
      trendingDownCount: downCount,
      topGrower: trendingUp.length > 0 ? trendingUp[0].productName : null,
      topDecliner: trendingDown.length > 0 ? trendingDown[0].productName : null,
    },
    modelInfo: {
      dataPointsUsed: totalDataPoints,
      method: 'Period-over-Period Growth Analysis',
      periodDays: days,
    },
  };
}

// ============================================
// Menu Engineering Matrix
// ============================================

export type MenuQuadrant = 'Star' | 'Plow' | 'Puzzle' | 'Dog';

export interface MenuEngineeringItem {
  productId: string;
  productName: string;
  categoryName: string | null;
  quantitySold: number;
  totalRevenue: number;
  costPerUnit: number;
  pricePerUnit: number;
  profitMargin: number; // percentage
  popularityScore: number; // percentile vs average
  profitabilityScore: number; // percentile vs average
  quadrant: MenuQuadrant;
  recommendation: string;
}

export interface MenuEngineeringResult {
  items: MenuEngineeringItem[];
  summary: {
    totalProductsAnalyzed: number;
    stars: number;
    plows: number;
    puzzles: number;
    dogs: number;
    avgPopularity: number;
    avgProfitMargin: number;
  };
  modelInfo: {
    dataPointsUsed: number;
    method: string;
    periodDays: number;
  };
}

const QUADRANT_RECOMMENDATIONS: Record<MenuQuadrant, string> = {
  Star: 'Promote heavily - high popularity and high profit. Keep prominent on menu.',
  Plow: 'Increase price gradually or reduce portion cost. Popular but low margin.',
  Puzzle: 'Promote more or reposition on menu. High profit but low popularity.',
  Dog: 'Consider removing or replacing. Low popularity and low profit.',
};

export async function getMenuEngineeringMatrix(
  businessOwnerId: string,
  branchId?: string,
  days: number = 90
): Promise<MenuEngineeringResult> {
  const now = new Date();
  const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // Get all active products with prices
  const products = await prisma.product.findMany({
    where: { businessOwnerId, status: 'active' },
    select: {
      id: true,
      name: true,
      categoryId: true,
      prices: {
        select: { basePrice: true, channelType: true },
        take: 1,
      },
    },
  });

  // Get category names
  const categoryIds = [...new Set(products.map(p => p.categoryId).filter(Boolean))] as string[];
  const categories = categoryIds.length > 0
    ? await prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true },
      })
    : [];
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));

  // Get order items for the period
  const orderItemWhere: any = {
    order: {
      businessOwnerId,
      orderStatus: { in: ['Completed', 'Served'] },
      createdAt: { gte: periodStart, lte: now },
    },
  };
  if (branchId) {
    orderItemWhere.order.branchId = branchId;
  }

  const orderItems = await prisma.orderItem.findMany({
    where: orderItemWhere,
    select: {
      productId: true,
      quantity: true,
      unitPrice: true,
      totalPrice: true,
    },
  });

  // Try to get cost prices from InventoryProduct
  const inventoryProducts = await prisma.inventoryProduct.findMany({
    where: { businessOwnerId },
    select: {
      name: true,
      costPrice: true,
      sellingPrice: true,
    },
  });
  // Map by name since InventoryProduct doesn't FK to Product
  const costMap = new Map<string, number>();
  for (const inv of inventoryProducts) {
    costMap.set(inv.name.toLowerCase(), parseFloat(inv.costPrice.toString()));
  }

  // Aggregate by product
  const productSales = new Map<string, { quantity: number; revenue: number; avgUnitPrice: number }>();
  for (const item of orderItems) {
    const existing = productSales.get(item.productId) || { quantity: 0, revenue: 0, avgUnitPrice: 0 };
    existing.quantity += item.quantity;
    existing.revenue += parseFloat(item.totalPrice.toString());
    existing.avgUnitPrice = parseFloat(item.unitPrice.toString());
    productSales.set(item.productId, existing);
  }

  // Build items with profitability
  const items: MenuEngineeringItem[] = [];
  let totalDataPoints = 0;

  for (const product of products) {
    const sales = productSales.get(product.id);
    if (!sales || sales.quantity === 0) continue;

    totalDataPoints += sales.quantity;

    const pricePerUnit = sales.avgUnitPrice || (product.prices[0] ? parseFloat(product.prices[0].basePrice.toString()) : 0);
    // Use inventory cost if available, otherwise estimate as 35% of selling price
    const costPerUnit = costMap.get(product.name.toLowerCase()) || pricePerUnit * 0.35;
    const profitMargin = pricePerUnit > 0 ? ((pricePerUnit - costPerUnit) / pricePerUnit) * 100 : 0;

    items.push({
      productId: product.id,
      productName: product.name,
      categoryName: product.categoryId ? categoryMap.get(product.categoryId) || null : null,
      quantitySold: sales.quantity,
      totalRevenue: Math.round(sales.revenue * 100) / 100,
      costPerUnit: Math.round(costPerUnit * 100) / 100,
      pricePerUnit: Math.round(pricePerUnit * 100) / 100,
      profitMargin: Math.round(profitMargin * 10) / 10,
      popularityScore: 0, // calculated below
      profitabilityScore: 0, // calculated below
      quadrant: 'Dog', // calculated below
      recommendation: '',
    });
  }

  if (items.length === 0) {
    return {
      items: [],
      summary: {
        totalProductsAnalyzed: 0,
        stars: 0,
        plows: 0,
        puzzles: 0,
        dogs: 0,
        avgPopularity: 0,
        avgProfitMargin: 0,
      },
      modelInfo: { dataPointsUsed: 0, method: 'Menu Engineering Matrix (BCG)', periodDays: days },
    };
  }

  // Calculate averages for classification
  const avgQuantity = items.reduce((sum, i) => sum + i.quantitySold, 0) / items.length;
  const avgMargin = items.reduce((sum, i) => sum + i.profitMargin, 0) / items.length;

  // Classify items
  let stars = 0, plows = 0, puzzles = 0, dogs = 0;

  for (const item of items) {
    item.popularityScore = Math.round((item.quantitySold / avgQuantity) * 100);
    item.profitabilityScore = Math.round((item.profitMargin / avgMargin) * 100);

    const highPopularity = item.quantitySold >= avgQuantity;
    const highProfit = item.profitMargin >= avgMargin;

    if (highPopularity && highProfit) {
      item.quadrant = 'Star';
      stars++;
    } else if (highPopularity && !highProfit) {
      item.quadrant = 'Plow';
      plows++;
    } else if (!highPopularity && highProfit) {
      item.quadrant = 'Puzzle';
      puzzles++;
    } else {
      item.quadrant = 'Dog';
      dogs++;
    }

    item.recommendation = QUADRANT_RECOMMENDATIONS[item.quadrant];
  }

  return {
    items,
    summary: {
      totalProductsAnalyzed: items.length,
      stars,
      plows,
      puzzles,
      dogs,
      avgPopularity: Math.round(avgQuantity),
      avgProfitMargin: Math.round(avgMargin * 10) / 10,
    },
    modelInfo: {
      dataPointsUsed: totalDataPoints,
      method: 'Menu Engineering Matrix (BCG)',
      periodDays: days,
    },
  };
}
