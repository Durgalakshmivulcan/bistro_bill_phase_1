import { prisma } from './db.service';

// ============================================
// Type Definitions
// ============================================

export interface CohortSegment {
  cohortMonth: string; // e.g., "2025-01"
  cohortSize: number;
  revenue: number;
  retention: number[]; // retention % for each subsequent month (Month 0, 1, 2, ...)
  absoluteCounts: number[]; // absolute customer counts per month
}

export interface CohortAnalysisResult {
  cohorts: CohortSegment[];
  maxMonthsTracked: number;
  summary: {
    totalCustomers: number;
    averageRetentionMonth1: number;
    averageRetentionMonth3: number;
    bestCohort: string;
    worstCohort: string;
  };
  modelInfo: {
    dataPointsUsed: number;
    method: string;
  };
}

// ============================================
// Main Cohort Analysis Function
// ============================================

export async function getCohortAnalysis(
  businessOwnerId: string,
  startDate?: string,
  endDate?: string
): Promise<CohortAnalysisResult> {
  // Default to last 12 months if no dates provided
  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate
    ? new Date(startDate)
    : new Date(new Date().setMonth(end.getMonth() - 11));

  // Set to first day of month for start, last day of month for end
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  end.setMonth(end.getMonth() + 1, 0); // last day of end month
  end.setHours(23, 59, 59, 999);

  // Fetch all customers who signed up in the range
  const customers = await prisma.customer.findMany({
    where: {
      businessOwnerId,
      createdAt: { gte: start, lte: end },
    },
    select: {
      id: true,
      createdAt: true,
      totalSpent: true,
    },
  });

  if (customers.length === 0) {
    return {
      cohorts: [],
      maxMonthsTracked: 0,
      summary: {
        totalCustomers: 0,
        averageRetentionMonth1: 0,
        averageRetentionMonth3: 0,
        bestCohort: '',
        worstCohort: '',
      },
      modelInfo: { dataPointsUsed: 0, method: 'Cohort Retention Analysis' },
    };
  }

  const customerIds = customers.map((c) => c.id);

  // Fetch all orders for these customers
  const orders = await prisma.order.findMany({
    where: {
      businessOwnerId,
      customerId: { in: customerIds },
      orderStatus: { in: ['Completed', 'Served'] },
    },
    select: {
      customerId: true,
      createdAt: true,
      total: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Group customers by sign-up month (cohort)
  const cohortMap = new Map<string, Set<string>>();
  const customerCohort = new Map<string, string>();

  for (const customer of customers) {
    const cohortKey = formatMonthKey(customer.createdAt);
    if (!cohortMap.has(cohortKey)) {
      cohortMap.set(cohortKey, new Set());
    }
    cohortMap.get(cohortKey)!.add(customer.id);
    customerCohort.set(customer.id, cohortKey);
  }

  // Build a map of customer → set of months in which they ordered
  const customerOrderMonths = new Map<string, Set<string>>();
  for (const order of orders) {
    if (!order.customerId) continue;
    const monthKey = formatMonthKey(order.createdAt);
    if (!customerOrderMonths.has(order.customerId)) {
      customerOrderMonths.set(order.customerId, new Set());
    }
    customerOrderMonths.get(order.customerId)!.add(monthKey);
  }

  // Calculate revenue per cohort
  const cohortRevenue = new Map<string, number>();
  for (const order of orders) {
    if (!order.customerId) continue;
    const cohortKey = customerCohort.get(order.customerId);
    if (!cohortKey) continue;
    const revenue = parseFloat(order.total.toString());
    cohortRevenue.set(cohortKey, (cohortRevenue.get(cohortKey) || 0) + revenue);
  }

  // Now is the current month
  const now = new Date();
  const currentMonthKey = formatMonthKey(now);

  // Sort cohort keys chronologically
  const sortedCohortKeys = Array.from(cohortMap.keys()).sort();

  // Calculate max months we can track
  const maxMonthsTracked = sortedCohortKeys.length > 0
    ? monthDiff(new Date(sortedCohortKeys[0] + '-01'), now) + 1
    : 0;

  // Build cohort segments
  const cohorts: CohortSegment[] = [];

  for (const cohortKey of sortedCohortKeys) {
    const customerSet = cohortMap.get(cohortKey)!;
    const cohortSize = customerSet.size;
    const cohortStartDate = new Date(cohortKey + '-01');
    const monthsAvailable = monthDiff(cohortStartDate, now) + 1;

    const retention: number[] = [];
    const absoluteCounts: number[] = [];

    for (let m = 0; m < monthsAvailable; m++) {
      const targetMonth = addMonths(cohortStartDate, m);
      const targetMonthKey = formatMonthKey(targetMonth);

      // Don't track beyond current month
      if (targetMonthKey > currentMonthKey) break;

      // Count how many customers from this cohort ordered in targetMonth
      let activeCount = 0;
      for (const customerId of customerSet) {
        const orderMonths = customerOrderMonths.get(customerId);
        if (orderMonths && orderMonths.has(targetMonthKey)) {
          activeCount++;
        }
      }

      retention.push(cohortSize > 0 ? Math.round((activeCount / cohortSize) * 100) : 0);
      absoluteCounts.push(activeCount);
    }

    cohorts.push({
      cohortMonth: cohortKey,
      cohortSize,
      revenue: Math.round((cohortRevenue.get(cohortKey) || 0) * 100) / 100,
      retention,
      absoluteCounts,
    });
  }

  // Calculate summary statistics
  const month1Retentions = cohorts
    .filter((c) => c.retention.length > 1)
    .map((c) => c.retention[1]);
  const month3Retentions = cohorts
    .filter((c) => c.retention.length > 3)
    .map((c) => c.retention[3]);

  const averageRetentionMonth1 = month1Retentions.length > 0
    ? Math.round(month1Retentions.reduce((a, b) => a + b, 0) / month1Retentions.length)
    : 0;
  const averageRetentionMonth3 = month3Retentions.length > 0
    ? Math.round(month3Retentions.reduce((a, b) => a + b, 0) / month3Retentions.length)
    : 0;

  // Best/worst cohort by Month 1 retention
  let bestCohort = '';
  let worstCohort = '';
  let bestRetention = -1;
  let worstRetention = 101;

  for (const cohort of cohorts) {
    if (cohort.retention.length > 1) {
      if (cohort.retention[1] > bestRetention) {
        bestRetention = cohort.retention[1];
        bestCohort = cohort.cohortMonth;
      }
      if (cohort.retention[1] < worstRetention) {
        worstRetention = cohort.retention[1];
        worstCohort = cohort.cohortMonth;
      }
    }
  }

  return {
    cohorts,
    maxMonthsTracked,
    summary: {
      totalCustomers: customers.length,
      averageRetentionMonth1,
      averageRetentionMonth3,
      bestCohort,
      worstCohort,
    },
    modelInfo: {
      dataPointsUsed: customers.length,
      method: 'Cohort Retention Analysis',
    },
  };
}

// ============================================
// Helper Functions
// ============================================

function formatMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function monthDiff(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

// ============================================
// Customer Lifetime Value Analysis
// ============================================

export interface CustomerLTV {
  customerId: string;
  name: string;
  phone: string;
  email: string | null;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  ordersPerMonth: number;
  predictedAnnualValue: number;
  segment: 'High' | 'Medium' | 'Low';
  lastOrderDate: string | null;
  firstOrderDate: string | null;
  isAtRisk: boolean; // declining order frequency
}

export interface CustomerLTVResult {
  customers: CustomerLTV[];
  summary: {
    totalCustomersAnalyzed: number;
    highValueCount: number;
    mediumValueCount: number;
    lowValueCount: number;
    atRiskCount: number;
    averageLTV: number;
  };
  modelInfo: {
    dataPointsUsed: number;
    method: string;
  };
}

export async function getCustomerLTV(
  businessOwnerId: string
): Promise<CustomerLTVResult> {
  // Fetch all customers with their orders
  const customers = await prisma.customer.findMany({
    where: { businessOwnerId },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      totalSpent: true,
      createdAt: true,
    },
  });

  if (customers.length === 0) {
    return {
      customers: [],
      summary: {
        totalCustomersAnalyzed: 0,
        highValueCount: 0,
        mediumValueCount: 0,
        lowValueCount: 0,
        atRiskCount: 0,
        averageLTV: 0,
      },
      modelInfo: { dataPointsUsed: 0, method: 'Customer Lifetime Value Analysis' },
    };
  }

  const customerIds = customers.map((c) => c.id);

  // Fetch all completed orders for these customers
  const orders = await prisma.order.findMany({
    where: {
      businessOwnerId,
      customerId: { in: customerIds },
      orderStatus: { in: ['Completed', 'Served'] },
    },
    select: {
      customerId: true,
      total: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Group orders by customer
  const customerOrders = new Map<string, { total: number; createdAt: Date }[]>();
  for (const order of orders) {
    if (!order.customerId) continue;
    if (!customerOrders.has(order.customerId)) {
      customerOrders.set(order.customerId, []);
    }
    customerOrders.get(order.customerId)!.push({
      total: parseFloat(order.total.toString()),
      createdAt: order.createdAt,
    });
  }

  const now = new Date();

  // Build LTV data for each customer
  const ltvData: CustomerLTV[] = [];

  for (const customer of customers) {
    const orders = customerOrders.get(customer.id) || [];
    const totalOrders = orders.length;

    if (totalOrders === 0) continue; // Skip customers with no orders

    const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
    const averageOrderValue = totalSpent / totalOrders;

    const firstOrderDate = orders[0].createdAt;
    const lastOrderDate = orders[orders.length - 1].createdAt;

    // Calculate months since first order (min 1)
    const monthsSinceFirst = Math.max(
      1,
      (now.getFullYear() - firstOrderDate.getFullYear()) * 12 +
        (now.getMonth() - firstOrderDate.getMonth())
    );

    const ordersPerMonth = totalOrders / monthsSinceFirst;

    // Predict annual value = average monthly spend * 12
    const monthlySpend = totalSpent / monthsSinceFirst;
    const predictedAnnualValue = Math.round(monthlySpend * 12 * 100) / 100;

    // Detect at-risk: check if recent order frequency is declining
    // Compare order frequency in last 3 months vs previous 3 months
    let isAtRisk = false;
    if (totalOrders >= 3) {
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const recentOrders = orders.filter((o) => o.createdAt >= threeMonthsAgo).length;
      const previousOrders = orders.filter(
        (o) => o.createdAt >= sixMonthsAgo && o.createdAt < threeMonthsAgo
      ).length;

      // At risk if recent orders are less than half of previous period
      if (previousOrders > 0 && recentOrders < previousOrders * 0.5) {
        isAtRisk = true;
      }
      // Also at risk if no orders in last 30 days and they used to order regularly
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (ordersPerMonth >= 1 && lastOrderDate < thirtyDaysAgo) {
        isAtRisk = true;
      }
    }

    ltvData.push({
      customerId: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      totalOrders,
      totalSpent: Math.round(totalSpent * 100) / 100,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      ordersPerMonth: Math.round(ordersPerMonth * 100) / 100,
      predictedAnnualValue,
      segment: 'Medium', // will be assigned below
      lastOrderDate: lastOrderDate.toISOString(),
      firstOrderDate: firstOrderDate.toISOString(),
      isAtRisk,
    });
  }

  // Sort by totalSpent descending
  ltvData.sort((a, b) => b.totalSpent - a.totalSpent);

  // Segment customers: top 20% = High, 20-80% = Medium, bottom 20% = Low
  const total = ltvData.length;
  const top20 = Math.ceil(total * 0.2);
  const bottom20 = Math.floor(total * 0.8);

  for (let i = 0; i < ltvData.length; i++) {
    if (i < top20) {
      ltvData[i].segment = 'High';
    } else if (i >= bottom20) {
      ltvData[i].segment = 'Low';
    } else {
      ltvData[i].segment = 'Medium';
    }
  }

  // Return top 50 by CLV
  const top50 = ltvData.slice(0, 50);

  const highValueCount = ltvData.filter((c) => c.segment === 'High').length;
  const mediumValueCount = ltvData.filter((c) => c.segment === 'Medium').length;
  const lowValueCount = ltvData.filter((c) => c.segment === 'Low').length;
  const atRiskCount = ltvData.filter((c) => c.isAtRisk).length;
  const averageLTV =
    ltvData.length > 0
      ? Math.round((ltvData.reduce((sum, c) => sum + c.totalSpent, 0) / ltvData.length) * 100) / 100
      : 0;

  return {
    customers: top50,
    summary: {
      totalCustomersAnalyzed: total,
      highValueCount,
      mediumValueCount,
      lowValueCount,
      atRiskCount,
      averageLTV,
    },
    modelInfo: {
      dataPointsUsed: total,
      method: 'Customer Lifetime Value Analysis',
    },
  };
}

// ============================================
// Predictive Customer Churn Analysis
// ============================================

export interface ChurnCustomer {
  customerId: string;
  name: string;
  phone: string;
  email: string | null;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  daysSinceLastOrder: number;
  orderFrequencyDecline: number; // percentage decline in order frequency
  avgOrderValueDecline: number; // percentage decline in average order value
  churnRiskScore: number; // 0-100
  riskLevel: 'High' | 'Medium' | 'Low';
  recommendedAction: string;
  lastOrderDate: string;
  firstOrderDate: string;
}

export interface ChurnPredictionResult {
  atRiskCustomers: ChurnCustomer[];
  summary: {
    totalAnalyzed: number;
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
    averageChurnScore: number;
  };
  modelInfo: {
    dataPointsUsed: number;
    method: string;
  };
}

export async function predictChurn(
  businessOwnerId: string
): Promise<ChurnPredictionResult> {
  // Fetch customers who have ordered at least 3 times
  const customers = await prisma.customer.findMany({
    where: { businessOwnerId },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      totalSpent: true,
      createdAt: true,
    },
  });

  if (customers.length === 0) {
    return {
      atRiskCustomers: [],
      summary: {
        totalAnalyzed: 0,
        highRiskCount: 0,
        mediumRiskCount: 0,
        lowRiskCount: 0,
        averageChurnScore: 0,
      },
      modelInfo: { dataPointsUsed: 0, method: 'Predictive Customer Churn Analysis' },
    };
  }

  const customerIds = customers.map((c) => c.id);

  // Fetch all completed orders
  const allOrders = await prisma.order.findMany({
    where: {
      businessOwnerId,
      customerId: { in: customerIds },
      orderStatus: { in: ['Completed', 'Served'] },
    },
    select: {
      customerId: true,
      total: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Group orders by customer
  const customerOrders = new Map<string, { total: number; createdAt: Date }[]>();
  for (const order of allOrders) {
    if (!order.customerId) continue;
    if (!customerOrders.has(order.customerId)) {
      customerOrders.set(order.customerId, []);
    }
    customerOrders.get(order.customerId)!.push({
      total: parseFloat(order.total.toString()),
      createdAt: order.createdAt,
    });
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const churnCustomers: ChurnCustomer[] = [];

  for (const customer of customers) {
    const orders = customerOrders.get(customer.id) || [];

    // Only analyze customers with at least 3 orders
    if (orders.length < 3) continue;

    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
    const averageOrderValue = totalSpent / totalOrders;
    const lastOrderDate = orders[orders.length - 1].createdAt;
    const firstOrderDate = orders[0].createdAt;

    const daysSinceLastOrder = Math.floor(
      (now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Only consider customers who haven't ordered in 30+ days
    if (daysSinceLastOrder < 30) continue;

    // Calculate order frequency decline
    // Split orders into two halves: first half vs second half
    const midpoint = Math.floor(totalOrders / 2);
    const firstHalfOrders = orders.slice(0, midpoint);
    const secondHalfOrders = orders.slice(midpoint);

    const firstHalfSpan = Math.max(
      1,
      (firstHalfOrders[firstHalfOrders.length - 1].createdAt.getTime() - firstHalfOrders[0].createdAt.getTime()) /
        (1000 * 60 * 60 * 24 * 30)
    ); // months
    const secondHalfSpan = Math.max(
      1,
      (secondHalfOrders[secondHalfOrders.length - 1].createdAt.getTime() - secondHalfOrders[0].createdAt.getTime()) /
        (1000 * 60 * 60 * 24 * 30)
    ); // months

    const firstHalfFreq = firstHalfOrders.length / firstHalfSpan;
    const secondHalfFreq = secondHalfOrders.length / secondHalfSpan;

    const orderFrequencyDecline =
      firstHalfFreq > 0
        ? Math.max(0, Math.round(((firstHalfFreq - secondHalfFreq) / firstHalfFreq) * 100))
        : 0;

    // Calculate AOV decline
    const firstHalfAOV =
      firstHalfOrders.reduce((sum, o) => sum + o.total, 0) / firstHalfOrders.length;
    const secondHalfAOV =
      secondHalfOrders.reduce((sum, o) => sum + o.total, 0) / secondHalfOrders.length;

    const avgOrderValueDecline =
      firstHalfAOV > 0
        ? Math.max(0, Math.round(((firstHalfAOV - secondHalfAOV) / firstHalfAOV) * 100))
        : 0;

    // Calculate churn risk score (0-100)
    // Weighted factors:
    // - Days since last order: 40% weight (30 days = 30 score, 60+ days = 40 score)
    // - Order frequency decline: 35% weight
    // - AOV decline: 25% weight
    const daysFactor = Math.min(40, (daysSinceLastOrder / 60) * 40);
    const frequencyFactor = (orderFrequencyDecline / 100) * 35;
    const aovFactor = (avgOrderValueDecline / 100) * 25;

    const churnRiskScore = Math.min(100, Math.round(daysFactor + frequencyFactor + aovFactor));

    // Classify risk level
    let riskLevel: 'High' | 'Medium' | 'Low';
    if (churnRiskScore > 70) {
      riskLevel = 'High';
    } else if (churnRiskScore >= 40) {
      riskLevel = 'Medium';
    } else {
      riskLevel = 'Low';
    }

    // Recommend retention action based on risk factors
    let recommendedAction: string;
    if (riskLevel === 'High' && avgOrderValueDecline > 30) {
      recommendedAction = 'Send personalized discount offer on favorite items';
    } else if (riskLevel === 'High') {
      recommendedAction = 'Reach out with a loyalty reward or special promotion';
    } else if (riskLevel === 'Medium' && orderFrequencyDecline > 50) {
      recommendedAction = 'Send a "We miss you" message with a comeback offer';
    } else if (riskLevel === 'Medium') {
      recommendedAction = 'Include in next marketing campaign with targeted offers';
    } else {
      recommendedAction = 'Monitor and include in regular engagement communications';
    }

    churnCustomers.push({
      customerId: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      totalOrders,
      totalSpent: Math.round(totalSpent * 100) / 100,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      daysSinceLastOrder,
      orderFrequencyDecline,
      avgOrderValueDecline,
      churnRiskScore,
      riskLevel,
      recommendedAction,
      lastOrderDate: lastOrderDate.toISOString(),
      firstOrderDate: firstOrderDate.toISOString(),
    });
  }

  // Sort by churn risk score descending (highest risk first)
  churnCustomers.sort((a, b) => b.churnRiskScore - a.churnRiskScore);

  const highRiskCount = churnCustomers.filter((c) => c.riskLevel === 'High').length;
  const mediumRiskCount = churnCustomers.filter((c) => c.riskLevel === 'Medium').length;
  const lowRiskCount = churnCustomers.filter((c) => c.riskLevel === 'Low').length;
  const averageChurnScore =
    churnCustomers.length > 0
      ? Math.round(
          (churnCustomers.reduce((sum, c) => sum + c.churnRiskScore, 0) / churnCustomers.length) * 100
        ) / 100
      : 0;

  return {
    atRiskCustomers: churnCustomers,
    summary: {
      totalAnalyzed: churnCustomers.length,
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
      averageChurnScore,
    },
    modelInfo: {
      dataPointsUsed: customers.length,
      method: 'Predictive Customer Churn Analysis',
    },
  };
}
