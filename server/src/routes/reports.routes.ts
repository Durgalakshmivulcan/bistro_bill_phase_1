import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { saBusinessOwnerOverride } from '../middleware/saBusinessOwnerOverride.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import {
  createCustomReport,
  getCustomReports,
  getCustomReportById,
  updateCustomReport,
  deleteCustomReport,
  executeReport,
  getReportTemplates,
  getAvailableColumns,
} from '../controllers/customReport.controller';
import {
  getSalesSummary,
  getSalesByPeriod,
  getSalesByType,
  getSalesByPayment,
  getTopProducts,
  getLeastProducts,
  getProductSales,
  getCustomerReport,
  getStaffPerformance,
  getInventoryReport,
  getGstB2bReport,
  getGstB2cReport,
  getGstHsnReport,
  getDiscountUsageReport,
  getAuditLogs,
  exportReport,
  getSalesSummaryByChannel,
  getSalesTrend,
  getSalesTransactions,
  getCancelledTransactions,
  getSalesAuditTransactions,
  getPaymentTransactions,
  getSalesTargets,
  getSalesForecast,
  getInventoryStockoutPredictions,
  getCustomerCohortAnalysis,
  getSalesHeatmapReport,
  getProductTrendsReport,
  getCustomerLTVReport,
  getChurnPrediction,
  getMenuEngineeringReport,
  getSalesAnomalies,
  resolveSalesAnomaly,
  createReportShare,
  getReportShares,
  deleteReportShare,
  createReportComment,
  getReportComments,
  updateReportComment,
  deleteReportComment,
  getTeamMembers,
} from '../controllers/reports.controller';

const router = Router();

// All reports routes require authentication and tenant context
router.use(authenticate);
router.use(tenantMiddleware);
router.use(saBusinessOwnerOverride);

// Sales Reports
router.get('/sales/summary', requirePermission('reports', 'read'), getSalesSummary);
router.get('/sales/summary-by-channel', requirePermission('reports', 'read'), getSalesSummaryByChannel);
router.get('/sales/trend', requirePermission('reports', 'read'), getSalesTrend);
router.get('/sales/transactions', requirePermission('reports', 'read'), getSalesTransactions);
router.get('/sales/cancelled', requirePermission('reports', 'read'), getCancelledTransactions);
router.get('/sales/audit', requirePermission('reports', 'read'), getSalesAuditTransactions);
router.get('/sales/targets', requirePermission('reports', 'read'), getSalesTargets);
router.get('/sales/forecast', requirePermission('reports', 'read'), getSalesForecast);
router.get('/sales/heatmap', requirePermission('reports', 'read'), getSalesHeatmapReport);
router.get('/sales/anomalies', requirePermission('reports', 'read'), getSalesAnomalies);
router.post('/sales/anomalies/:id/resolve', requirePermission('reports', 'update'), resolveSalesAnomaly);
router.get('/sales/by-period', requirePermission('reports', 'read'), getSalesByPeriod);
router.get('/sales/by-type', requirePermission('reports', 'read'), getSalesByType);
router.get('/sales/by-payment', requirePermission('reports', 'read'), getSalesByPayment);

// Product Reports
router.get('/products/top', requirePermission('reports', 'read'), getTopProducts);
router.get('/products/least', requirePermission('reports', 'read'), getLeastProducts);
router.get('/products/sales', requirePermission('reports', 'read'), getProductSales);
router.get('/products/trends', requirePermission('reports', 'read'), getProductTrendsReport);
router.get('/products/menu-engineering', requirePermission('reports', 'read'), getMenuEngineeringReport);

// Customer Reports
router.get('/customers', requirePermission('reports', 'read'), getCustomerReport);

// Staff Reports
router.get('/staff/performance', requirePermission('reports', 'read'), getStaffPerformance);

// Inventory Reports
router.get('/inventory', requirePermission('reports', 'read'), getInventoryReport);
router.get('/inventory/stockout-predictions', requirePermission('reports', 'read'), getInventoryStockoutPredictions);

// GST Reports
router.get('/gst/b2b', requirePermission('reports', 'read'), getGstB2bReport);
router.get('/gst/b2c', requirePermission('reports', 'read'), getGstB2cReport);
router.get('/gst/hsn', requirePermission('reports', 'read'), getGstHsnReport);

// Discount Reports
router.get('/discounts', requirePermission('reports', 'read'), getDiscountUsageReport);

// Audit Logs
router.get('/audit-logs', requirePermission('reports', 'read'), getAuditLogs);

// Payment Reports
router.get('/payments', requirePermission('reports', 'read'), getPaymentTransactions);

// Customer Analytics
router.get('/customers/cohort-analysis', requirePermission('reports', 'read'), getCustomerCohortAnalysis);
router.get('/customers/ltv', requirePermission('reports', 'read'), getCustomerLTVReport);
router.get('/customers/churn-prediction', requirePermission('reports', 'read'), getChurnPrediction);

// Export Reports
router.post('/export', requirePermission('reports', 'export'), exportReport);

// Report Sharing (US-219)
router.post('/share', requirePermission('reports', 'read'), createReportShare);
router.get('/share', requirePermission('reports', 'read'), getReportShares);
router.delete('/share/:id', requirePermission('reports', 'update'), deleteReportShare);

// Report Comments (US-220)
router.post('/comments', requirePermission('reports', 'read'), createReportComment);
router.get('/comments', requirePermission('reports', 'read'), getReportComments);
router.get('/comments/team', requirePermission('reports', 'read'), getTeamMembers);
router.put('/comments/:id', requirePermission('reports', 'update'), updateReportComment);
router.delete('/comments/:id', requirePermission('reports', 'update'), deleteReportComment);

// Report Templates & Available Columns (US-005)
router.get('/templates', requirePermission('reports', 'read'), getReportTemplates);
router.get('/columns', requirePermission('reports', 'read'), getAvailableColumns);

// Custom Reports CRUD (US-004)
router.post('/custom', requirePermission('reports', 'create'), createCustomReport);
router.get('/custom', requirePermission('reports', 'read'), getCustomReports);
router.get('/custom/:reportId', requirePermission('reports', 'read'), getCustomReportById);
router.put('/custom/:reportId', requirePermission('reports', 'update'), updateCustomReport);
router.delete('/custom/:reportId', requirePermission('reports', 'delete'), deleteCustomReport);

// Custom Report Execution (US-005)
router.post('/custom/:reportId/execute', requirePermission('reports', 'read'), executeReport);

export default router;
