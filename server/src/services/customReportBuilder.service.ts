import { prisma } from './db.service';
import { Prisma } from '@prisma/client';

// ============================================
// Type Definitions
// ============================================

export type ReportType = 'Sales' | 'Products' | 'Customers' | 'Inventory' | 'StaffPerformance';

export interface ReportFilter {
  dateRange?: { startDate: string; endDate: string };
  branchId?: string;
  categoryId?: string;
  paymentMode?: string;
  customerGroup?: string;
}

export interface ReportColumn {
  id: string;
  label: string;
  field: string;
  visible: boolean;
  isCurrency?: boolean;
  isDate?: boolean;
  isPercentage?: boolean;
}

export interface CustomReportData {
  name: string;
  description?: string;
  reportType: ReportType;
  filters: ReportFilter;
  columns: ReportColumn[];
  schedule?: ScheduleConfig | null;
}

export interface ScheduleConfig {
  frequency: 'Daily' | 'Weekly' | 'Monthly';
  time: string; // HH:MM
  dayOfWeek?: number; // 0-6
  dayOfMonth?: number; // 1-31
  emails: string[];
  format: 'CSV' | 'PDF' | 'Both';
}

export interface CustomReportResult {
  id: string;
  businessOwnerId: string;
  name: string;
  description: string | null;
  reportType: string;
  filters: ReportFilter;
  columns: ReportColumn[];
  schedule: ScheduleConfig | null;
  createdBy: string;
  lastRunAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportExecutionResult {
  reportId: string;
  reportName: string;
  reportType: string;
  data: Record<string, unknown>[];
  columns: ReportColumn[];
  summary: {
    totalRecords: number;
    generatedAt: string;
    dateRange: { startDate: string; endDate: string };
  };
}

export interface ReportTemplateResult {
  id: string;
  name: string;
  description: string | null;
  reportType: string;
  filters: ReportFilter;
  columns: ReportColumn[];
  isDefault: boolean;
}

// ============================================
// Available Columns by Report Type
// ============================================

const AVAILABLE_COLUMNS: Record<ReportType, ReportColumn[]> = {
  Sales: [
    { id: 'orderNumber', label: 'Order Number', field: 'orderNumber', visible: true },
    { id: 'date', label: 'Date', field: 'createdAt', visible: true, isDate: true },
    { id: 'customerName', label: 'Customer', field: 'customerName', visible: true },
    { id: 'orderType', label: 'Order Type', field: 'orderType', visible: true },
    { id: 'subtotal', label: 'Subtotal', field: 'subtotal', visible: true, isCurrency: true },
    { id: 'taxAmount', label: 'Tax', field: 'taxAmount', visible: true, isCurrency: true },
    { id: 'discountAmount', label: 'Discount', field: 'discountAmount', visible: false, isCurrency: true },
    { id: 'totalAmount', label: 'Total', field: 'totalAmount', visible: true, isCurrency: true },
    { id: 'paymentMode', label: 'Payment Mode', field: 'paymentMode', visible: true },
    { id: 'status', label: 'Status', field: 'status', visible: true },
    { id: 'branchName', label: 'Branch', field: 'branchName', visible: false },
  ],
  Products: [
    { id: 'productName', label: 'Product Name', field: 'productName', visible: true },
    { id: 'sku', label: 'SKU', field: 'sku', visible: true },
    { id: 'categoryName', label: 'Category', field: 'categoryName', visible: true },
    { id: 'quantitySold', label: 'Qty Sold', field: 'quantitySold', visible: true },
    { id: 'revenue', label: 'Revenue', field: 'revenue', visible: true, isCurrency: true },
    { id: 'avgPrice', label: 'Avg Price', field: 'avgPrice', visible: true, isCurrency: true },
    { id: 'orderCount', label: 'Order Count', field: 'orderCount', visible: true },
    { id: 'returnCount', label: 'Returns', field: 'returnCount', visible: false },
  ],
  Customers: [
    { id: 'customerName', label: 'Name', field: 'customerName', visible: true },
    { id: 'email', label: 'Email', field: 'email', visible: true },
    { id: 'phone', label: 'Phone', field: 'phone', visible: true },
    { id: 'totalOrders', label: 'Total Orders', field: 'totalOrders', visible: true },
    { id: 'totalSpent', label: 'Total Spent', field: 'totalSpent', visible: true, isCurrency: true },
    { id: 'avgOrderValue', label: 'Avg Order Value', field: 'avgOrderValue', visible: true, isCurrency: true },
    { id: 'lastOrderDate', label: 'Last Order', field: 'lastOrderDate', visible: true, isDate: true },
    { id: 'customerGroup', label: 'Group', field: 'customerGroup', visible: false },
  ],
  Inventory: [
    { id: 'productName', label: 'Product Name', field: 'productName', visible: true },
    { id: 'sku', label: 'SKU', field: 'sku', visible: true },
    { id: 'currentStock', label: 'Current Stock', field: 'currentStock', visible: true },
    { id: 'reorderLevel', label: 'Reorder Level', field: 'reorderLevel', visible: true },
    { id: 'unitCost', label: 'Unit Cost', field: 'unitCost', visible: true, isCurrency: true },
    { id: 'totalValue', label: 'Total Value', field: 'totalValue', visible: true, isCurrency: true },
    { id: 'supplier', label: 'Supplier', field: 'supplier', visible: false },
    { id: 'lastRestockedAt', label: 'Last Restocked', field: 'lastRestockedAt', visible: false, isDate: true },
  ],
  StaffPerformance: [
    { id: 'staffName', label: 'Staff Name', field: 'staffName', visible: true },
    { id: 'role', label: 'Role', field: 'role', visible: true },
    { id: 'ordersHandled', label: 'Orders Handled', field: 'ordersHandled', visible: true },
    { id: 'totalRevenue', label: 'Revenue Generated', field: 'totalRevenue', visible: true, isCurrency: true },
    { id: 'avgOrderValue', label: 'Avg Order Value', field: 'avgOrderValue', visible: true, isCurrency: true },
    { id: 'hoursWorked', label: 'Hours Worked', field: 'hoursWorked', visible: false },
    { id: 'revenuePerHour', label: 'Revenue/Hour', field: 'revenuePerHour', visible: false, isCurrency: true },
  ],
};

// ============================================
// Pre-built Report Templates
// ============================================

const DEFAULT_TEMPLATES: Omit<ReportTemplateResult, 'id'>[] = [
  {
    name: 'Daily Sales Summary',
    description: 'Overview of daily sales with totals, tax, and payment breakdown',
    reportType: 'Sales',
    filters: { dateRange: { startDate: '', endDate: '' } },
    columns: AVAILABLE_COLUMNS.Sales.filter(c => c.visible),
    isDefault: true,
  },
  {
    name: 'Top Selling Products',
    description: 'Products ranked by quantity sold and revenue generated',
    reportType: 'Products',
    filters: { dateRange: { startDate: '', endDate: '' } },
    columns: AVAILABLE_COLUMNS.Products.filter(c => c.visible),
    isDefault: true,
  },
  {
    name: 'Customer Spending Analysis',
    description: 'Customer spending patterns including order frequency and average value',
    reportType: 'Customers',
    filters: { dateRange: { startDate: '', endDate: '' } },
    columns: AVAILABLE_COLUMNS.Customers.filter(c => c.visible),
    isDefault: true,
  },
  {
    name: 'Inventory Status Report',
    description: 'Current stock levels with reorder alerts and valuation',
    reportType: 'Inventory',
    filters: {},
    columns: AVAILABLE_COLUMNS.Inventory.filter(c => c.visible),
    isDefault: true,
  },
  {
    name: 'Staff Performance Report',
    description: 'Staff performance metrics including orders handled and revenue',
    reportType: 'StaffPerformance',
    filters: { dateRange: { startDate: '', endDate: '' } },
    columns: AVAILABLE_COLUMNS.StaffPerformance.filter(c => c.visible),
    isDefault: true,
  },
];

// ============================================
// CRUD Operations
// ============================================

/**
 * Create a new custom report definition
 */
export async function createCustomReport(
  businessOwnerId: string,
  createdBy: string,
  data: CustomReportData
): Promise<CustomReportResult> {
  const report = await prisma.customReport.create({
    data: {
      businessOwnerId,
      name: data.name,
      description: data.description || null,
      reportType: data.reportType,
      filters: data.filters as unknown as Prisma.InputJsonValue,
      columns: data.columns as unknown as Prisma.InputJsonValue,
      schedule: data.schedule ? (data.schedule as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
      createdBy,
    },
  });

  return formatReport(report);
}

/**
 * Get all custom reports for a business owner
 */
export async function getCustomReports(
  businessOwnerId: string,
  reportType?: string
): Promise<CustomReportResult[]> {
  const where: Prisma.CustomReportWhereInput = { businessOwnerId };
  if (reportType) {
    where.reportType = reportType;
  }

  const reports = await prisma.customReport.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
  });

  return reports.map(formatReport);
}

/**
 * Get a single custom report by ID
 */
export async function getCustomReportById(
  businessOwnerId: string,
  reportId: string
): Promise<CustomReportResult | null> {
  const report = await prisma.customReport.findFirst({
    where: { id: reportId, businessOwnerId },
  });

  return report ? formatReport(report) : null;
}

/**
 * Update an existing custom report
 */
export async function updateCustomReport(
  businessOwnerId: string,
  reportId: string,
  data: Partial<CustomReportData>
): Promise<CustomReportResult | null> {
  const existing = await prisma.customReport.findFirst({
    where: { id: reportId, businessOwnerId },
  });

  if (!existing) return null;

  const updateData: Prisma.CustomReportUpdateInput = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.reportType !== undefined) updateData.reportType = data.reportType;
  if (data.filters !== undefined) updateData.filters = data.filters as unknown as Prisma.InputJsonValue;
  if (data.columns !== undefined) updateData.columns = data.columns as unknown as Prisma.InputJsonValue;
  if (data.schedule !== undefined) {
    updateData.schedule = data.schedule ? (data.schedule as unknown as Prisma.InputJsonValue) : Prisma.JsonNull;
  }

  const report = await prisma.customReport.update({
    where: { id: reportId },
    data: updateData,
  });

  return formatReport(report);
}

/**
 * Delete a custom report
 */
export async function deleteCustomReport(
  businessOwnerId: string,
  reportId: string
): Promise<boolean> {
  const existing = await prisma.customReport.findFirst({
    where: { id: reportId, businessOwnerId },
  });

  if (!existing) return false;

  await prisma.customReport.delete({ where: { id: reportId } });
  return true;
}

// ============================================
// Report Execution
// ============================================

/**
 * Execute a report query based on report definition and date range
 */
export async function executeReport(
  businessOwnerId: string,
  reportId: string,
  dateRange: { startDate: string; endDate: string }
): Promise<ReportExecutionResult> {
  const report = await prisma.customReport.findFirst({
    where: { id: reportId, businessOwnerId },
  });

  if (!report) {
    throw new Error('Report not found');
  }

  const filters = report.filters as unknown as ReportFilter;
  const columns = report.columns as unknown as ReportColumn[];
  const effectiveDateRange = dateRange || filters.dateRange;
  const start = new Date(effectiveDateRange.startDate);
  const end = new Date(effectiveDateRange.endDate);
  end.setHours(23, 59, 59, 999);

  let data: Record<string, unknown>[] = [];

  switch (report.reportType as ReportType) {
    case 'Sales':
      data = await executeSalesReport(businessOwnerId, start, end, filters);
      break;
    case 'Products':
      data = await executeProductsReport(businessOwnerId, start, end, filters);
      break;
    case 'Customers':
      data = await executeCustomersReport(businessOwnerId, start, end, filters);
      break;
    case 'Inventory':
      data = await executeInventoryReport(businessOwnerId, filters);
      break;
    case 'StaffPerformance':
      data = await executeStaffPerformanceReport(businessOwnerId, start, end, filters);
      break;
  }

  // Update lastRunAt
  await prisma.customReport.update({
    where: { id: reportId },
    data: { lastRunAt: new Date() },
  });

  return {
    reportId: report.id,
    reportName: report.name,
    reportType: report.reportType,
    data,
    columns,
    summary: {
      totalRecords: data.length,
      generatedAt: new Date().toISOString(),
      dateRange: effectiveDateRange,
    },
  };
}

// ============================================
// Report Type Execution Functions
// ============================================

async function executeSalesReport(
  businessOwnerId: string,
  startDate: Date,
  endDate: Date,
  filters: ReportFilter
): Promise<Record<string, unknown>[]> {
  const where: Prisma.OrderWhereInput = {
    businessOwnerId,
    createdAt: { gte: startDate, lte: endDate },
  };

  if (filters.branchId) {
    where.branchId = filters.branchId;
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      branch: { select: { name: true } },
      customer: { select: { name: true } },
      payments: { include: { paymentOption: { select: { name: true, type: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return orders.map(order => ({
    orderNumber: order.orderNumber || order.id.slice(0, 8),
    createdAt: order.createdAt.toISOString().split('T')[0],
    customerName: order.customer?.name || 'Walk-in',
    orderType: order.type || 'DineIn',
    subtotal: Number(order.subtotal || 0),
    taxAmount: Number(order.taxAmount || 0),
    discountAmount: Number(order.discountAmount || 0),
    totalAmount: Number(order.total || 0),
    paymentMode: order.payments?.[0]?.paymentOption?.name || 'Cash',
    status: order.orderStatus,
    branchName: order.branch?.name || '',
  }));
}

async function executeProductsReport(
  businessOwnerId: string,
  startDate: Date,
  endDate: Date,
  filters: ReportFilter
): Promise<Record<string, unknown>[]> {
  const orderWhere: Prisma.OrderWhereInput = {
    businessOwnerId,
    createdAt: { gte: startDate, lte: endDate },
  };

  if (filters.branchId) {
    orderWhere.branchId = filters.branchId;
  }

  const orderItems = await prisma.orderItem.findMany({
    where: { order: orderWhere },
    include: {
      product: {
        select: { name: true, sku: true, category: { select: { name: true } } },
      },
    },
  });

  // Aggregate by product
  const productMap = new Map<string, {
    productName: string;
    sku: string;
    categoryName: string;
    quantitySold: number;
    revenue: number;
    orderIds: Set<string>;
  }>();

  for (const item of orderItems) {
    const key = item.productId;
    const existing = productMap.get(key);
    const qty = Number(item.quantity || 0);
    const total = Number(item.totalPrice || 0);

    if (existing) {
      existing.quantitySold += qty;
      existing.revenue += total;
      existing.orderIds.add(item.orderId);
    } else {
      productMap.set(key, {
        productName: item.product?.name || item.name || 'Unknown',
        sku: item.product?.sku || '',
        categoryName: item.product?.category?.name || '',
        quantitySold: qty,
        revenue: total,
        orderIds: new Set([item.orderId]),
      });
    }
  }

  return Array.from(productMap.values()).map(p => ({
    productName: p.productName,
    sku: p.sku,
    categoryName: p.categoryName,
    quantitySold: p.quantitySold,
    revenue: Math.round(p.revenue * 100) / 100,
    avgPrice: p.quantitySold > 0 ? Math.round((p.revenue / p.quantitySold) * 100) / 100 : 0,
    orderCount: p.orderIds.size,
    returnCount: 0,
  }));
}

async function executeCustomersReport(
  businessOwnerId: string,
  startDate: Date,
  endDate: Date,
  filters: ReportFilter
): Promise<Record<string, unknown>[]> {
  const customers = await prisma.customer.findMany({
    where: { businessOwnerId },
    include: {
      customerGroup: { select: { name: true } },
    },
  });

  const results: Record<string, unknown>[] = [];

  for (const customer of customers) {
    const orders = await prisma.order.findMany({
      where: {
        businessOwnerId,
        customerId: customer.id,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        total: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (filters.customerGroup && customer.customerGroup?.name !== filters.customerGroup) {
      continue;
    }

    const totalSpent = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const totalOrders = orders.length;

    results.push({
      customerName: customer.name || 'Unknown',
      email: customer.email || '',
      phone: customer.phone || '',
      totalOrders,
      totalSpent: Math.round(totalSpent * 100) / 100,
      avgOrderValue: totalOrders > 0 ? Math.round((totalSpent / totalOrders) * 100) / 100 : 0,
      lastOrderDate: orders[0]?.createdAt?.toISOString().split('T')[0] || '',
      customerGroup: customer.customerGroup?.name || '',
    });
  }

  return results;
}

async function executeInventoryReport(
  businessOwnerId: string,
  _filters: ReportFilter
): Promise<Record<string, unknown>[]> {
  const where: Prisma.InventoryProductWhereInput = { businessOwnerId };

  const items = await prisma.inventoryProduct.findMany({
    where,
    include: {
      supplier: { select: { name: true } },
    },
  });

  return items.map(item => ({
    productName: item.name || 'Unknown',
    sku: '',
    currentStock: Number(item.inStock || 0),
    reorderLevel: Number(item.restockAlert || 0),
    unitCost: Number(item.costPrice || 0),
    totalValue: Math.round(Number(item.inStock || 0) * Number(item.costPrice || 0) * 100) / 100,
    supplier: item.supplier?.name || '',
    lastRestockedAt: item.updatedAt?.toISOString().split('T')[0] || '',
  }));
}

async function executeStaffPerformanceReport(
  businessOwnerId: string,
  startDate: Date,
  endDate: Date,
  filters: ReportFilter
): Promise<Record<string, unknown>[]> {
  const staffMembers = await prisma.staff.findMany({
    where: { businessOwnerId, status: 'active' },
    include: {
      role: { select: { name: true } },
    },
  });

  const results: Record<string, unknown>[] = [];

  for (const staff of staffMembers) {
    const orderWhere: Prisma.OrderWhereInput = {
      businessOwnerId,
      staffId: staff.id,
      createdAt: { gte: startDate, lte: endDate },
    };

    if (filters.branchId) {
      orderWhere.branchId = filters.branchId;
    }

    const orders = await prisma.order.findMany({
      where: orderWhere,
      select: { total: true },
    });

    const ordersHandled = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);

    results.push({
      staffName: `${staff.firstName || ''} ${staff.lastName || ''}`.trim(),
      role: staff.role?.name || '',
      ordersHandled,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      avgOrderValue: ordersHandled > 0 ? Math.round((totalRevenue / ordersHandled) * 100) / 100 : 0,
      hoursWorked: 0,
      revenuePerHour: 0,
    });
  }

  return results;
}

// ============================================
// Report Templates
// ============================================

/**
 * Get pre-built report templates
 */
export async function getReportTemplates(): Promise<ReportTemplateResult[]> {
  // Check for templates in database first
  const dbTemplates = await prisma.reportTemplate.findMany({
    orderBy: { reportType: 'asc' },
  });

  if (dbTemplates.length > 0) {
    return dbTemplates.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      reportType: t.reportType,
      filters: t.filters as unknown as ReportFilter,
      columns: t.columns as unknown as ReportColumn[],
      isDefault: t.isDefault,
    }));
  }

  // Return defaults with generated IDs
  return DEFAULT_TEMPLATES.map((t, i) => ({
    ...t,
    id: `template-${i + 1}`,
  }));
}

/**
 * Get available columns for a report type
 */
export function getAvailableColumns(reportType: ReportType): ReportColumn[] {
  return AVAILABLE_COLUMNS[reportType] || [];
}

// ============================================
// Helper Functions
// ============================================

function formatReport(report: {
  id: string;
  businessOwnerId: string;
  name: string;
  description: string | null;
  reportType: string;
  filters: Prisma.JsonValue;
  columns: Prisma.JsonValue;
  schedule: Prisma.JsonValue;
  createdBy: string;
  lastRunAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): CustomReportResult {
  return {
    id: report.id,
    businessOwnerId: report.businessOwnerId,
    name: report.name,
    description: report.description,
    reportType: report.reportType,
    filters: report.filters as unknown as ReportFilter,
    columns: report.columns as unknown as ReportColumn[],
    schedule: report.schedule as unknown as ScheduleConfig | null,
    createdBy: report.createdBy,
    lastRunAt: report.lastRunAt?.toISOString() || null,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  };
}
