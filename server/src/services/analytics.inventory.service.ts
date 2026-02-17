import { prisma } from './db.service';

// ============================================
// Type Definitions
// ============================================

export interface ABCClassificationItem {
  productId: string;
  productName: string;
  classification: 'A' | 'B' | 'C';
  revenue90Days: number;
  revenuePercentage: number;
  cumulativePercentage: number;
  sellingPrice: number;
  quantitySold: number;
  recommendedReorderFrequency: 'weekly' | 'bi-weekly' | 'monthly';
}

export interface ABCClassificationResult {
  items: ABCClassificationItem[];
  summary: {
    classA: { count: number; revenueShare: number };
    classB: { count: number; revenueShare: number };
    classC: { count: number; revenueShare: number };
    totalProducts: number;
    totalRevenue: number;
  };
  modelInfo: {
    method: string;
    lookbackDays: number;
  };
}

export interface StockoutPrediction {
  productId: string;
  productName: string;
  currentStock: number;
  unit: string | null;
  dailyUsageRate: number;
  daysUntilStockout: number;
  suggestedReorderQty: number;
  status: 'Critical' | 'Low' | 'Safe';
  supplierName: string | null;
  supplierId: string | null;
  restockAlert: number | null;
}

export interface StockoutPredictionResult {
  predictions: StockoutPrediction[];
  summary: {
    criticalCount: number;
    lowCount: number;
    safeCount: number;
    totalProducts: number;
  };
  modelInfo: {
    dataPointsUsed: number;
    method: string;
    lookbackDays: number;
  };
}

// ============================================
// Main Stockout Prediction Function
// ============================================

export async function predictStockouts(
  businessOwnerId: string,
  branchId: string
): Promise<StockoutPredictionResult> {
  const lookbackDays = 30;
  const leadTimeDays = 7; // Assumed supplier lead time for reorder qty calculation

  // Fetch all active inventory products for this branch
  const inventoryProducts = await prisma.inventoryProduct.findMany({
    where: {
      businessOwnerId,
      branchId,
      status: 'active',
    },
    include: {
      supplier: { select: { id: true, name: true } },
    },
  });

  const predictions: StockoutPrediction[] = [];

  for (const product of inventoryProducts) {
    const currentStock = parseFloat(product.inStock.toString());
    const totalSold = parseFloat(product.quantitySold.toString());

    // Calculate daily usage rate from quantitySold over the product lifetime
    // Use the product creation date to determine days active
    const daysSinceCreation = Math.max(
      1,
      Math.floor((Date.now() - product.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Daily usage rate = total sold / days since product was created
    const dailyUsageRate = daysSinceCreation > 0 ? totalSold / daysSinceCreation : 0;

    // Days until stockout
    const daysUntilStockout = dailyUsageRate > 0
      ? Math.floor(currentStock / dailyUsageRate)
      : currentStock > 0 ? 999 : 0; // If no usage, stock lasts indefinitely (or is already 0)

    // Determine status
    let status: 'Critical' | 'Low' | 'Safe';
    if (daysUntilStockout < 7) {
      status = 'Critical';
    } else if (daysUntilStockout < 14) {
      status = 'Low';
    } else {
      status = 'Safe';
    }

    // Suggested reorder quantity: enough to last lead time + 14 days buffer
    const suggestedReorderQty = dailyUsageRate > 0
      ? Math.ceil(dailyUsageRate * (leadTimeDays + 14))
      : 0;

    predictions.push({
      productId: product.id,
      productName: product.name,
      currentStock: Math.round(currentStock * 100) / 100,
      unit: product.unit,
      dailyUsageRate: Math.round(dailyUsageRate * 100) / 100,
      daysUntilStockout,
      suggestedReorderQty,
      status,
      supplierName: product.supplier?.name || null,
      supplierId: product.supplier?.id || null,
      restockAlert: product.restockAlert ? parseFloat(product.restockAlert.toString()) : null,
    });
  }

  // Sort by days until stockout (ascending) - most urgent first
  predictions.sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);

  const criticalCount = predictions.filter(p => p.status === 'Critical').length;
  const lowCount = predictions.filter(p => p.status === 'Low').length;
  const safeCount = predictions.filter(p => p.status === 'Safe').length;

  return {
    predictions,
    summary: {
      criticalCount,
      lowCount,
      safeCount,
      totalProducts: predictions.length,
    },
    modelInfo: {
      dataPointsUsed: inventoryProducts.length,
      method: 'Daily Usage Rate Projection',
      lookbackDays,
    },
  };
}

// ============================================
// ABC Classification
// ============================================

export async function getABCClassification(
  businessOwnerId: string,
  branchId: string
): Promise<ABCClassificationResult> {
  const lookbackDays = 90;
  const now = new Date();

  // Fetch all active inventory products for this branch
  const inventoryProducts = await prisma.inventoryProduct.findMany({
    where: {
      businessOwnerId,
      branchId,
      status: 'active',
    },
  });

  // Calculate estimated 90-day revenue for each product
  const productRevenues = inventoryProducts.map((product) => {
    const sellingPrice = parseFloat(product.sellingPrice.toString());
    const totalSold = parseFloat(product.quantitySold.toString());
    const createdAt = product.createdAt;

    // Calculate proportion of sales within the 90-day window
    const daysSinceCreation = Math.max(
      1,
      Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
    );

    // If product is older than 90 days, prorate; otherwise use total
    const effectiveDays = Math.min(daysSinceCreation, lookbackDays);
    const dailyRate = totalSold / daysSinceCreation;
    const estimatedQtySold90 = dailyRate * effectiveDays;
    const revenue90Days = estimatedQtySold90 * sellingPrice;

    return {
      productId: product.id,
      productName: product.name,
      sellingPrice,
      quantitySold: Math.round(estimatedQtySold90 * 100) / 100,
      revenue90Days: Math.round(revenue90Days * 100) / 100,
    };
  });

  // Sort by revenue descending
  productRevenues.sort((a, b) => b.revenue90Days - a.revenue90Days);

  const totalRevenue = productRevenues.reduce((sum, p) => sum + p.revenue90Days, 0);
  const totalProducts = productRevenues.length;

  // Calculate cumulative percentages and assign classifications
  let cumulativeRevenue = 0;
  const classifiedItems: ABCClassificationItem[] = productRevenues.map((product, index) => {
    cumulativeRevenue += product.revenue90Days;
    const revenuePercentage = totalRevenue > 0 ? (product.revenue90Days / totalRevenue) * 100 : 0;
    const cumulativePercentage = totalRevenue > 0 ? (cumulativeRevenue / totalRevenue) * 100 : 0;

    // ABC classification based on cumulative revenue contribution
    // Class A: Top 20% of items (by rank), Class B: Next 30%, Class C: Bottom 50%
    const rankPercentile = ((index + 1) / totalProducts) * 100;
    let classification: 'A' | 'B' | 'C';
    let recommendedReorderFrequency: 'weekly' | 'bi-weekly' | 'monthly';

    if (rankPercentile <= 20) {
      classification = 'A';
      recommendedReorderFrequency = 'weekly';
    } else if (rankPercentile <= 50) {
      classification = 'B';
      recommendedReorderFrequency = 'bi-weekly';
    } else {
      classification = 'C';
      recommendedReorderFrequency = 'monthly';
    }

    return {
      productId: product.productId,
      productName: product.productName,
      classification,
      revenue90Days: product.revenue90Days,
      revenuePercentage: Math.round(revenuePercentage * 100) / 100,
      cumulativePercentage: Math.round(cumulativePercentage * 100) / 100,
      sellingPrice: product.sellingPrice,
      quantitySold: product.quantitySold,
      recommendedReorderFrequency,
    };
  });

  // Calculate summary by class
  const classA = classifiedItems.filter(i => i.classification === 'A');
  const classB = classifiedItems.filter(i => i.classification === 'B');
  const classC = classifiedItems.filter(i => i.classification === 'C');

  const classARevenue = classA.reduce((sum, i) => sum + i.revenue90Days, 0);
  const classBRevenue = classB.reduce((sum, i) => sum + i.revenue90Days, 0);
  const classCRevenue = classC.reduce((sum, i) => sum + i.revenue90Days, 0);

  return {
    items: classifiedItems,
    summary: {
      classA: {
        count: classA.length,
        revenueShare: totalRevenue > 0 ? Math.round((classARevenue / totalRevenue) * 10000) / 100 : 0,
      },
      classB: {
        count: classB.length,
        revenueShare: totalRevenue > 0 ? Math.round((classBRevenue / totalRevenue) * 10000) / 100 : 0,
      },
      classC: {
        count: classC.length,
        revenueShare: totalRevenue > 0 ? Math.round((classCRevenue / totalRevenue) * 10000) / 100 : 0,
      },
      totalProducts,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
    },
    modelInfo: {
      method: 'ABC Classification (Pareto Analysis)',
      lookbackDays,
    },
  };
}
