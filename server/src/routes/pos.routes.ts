import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { branchScopeMiddleware } from '../middleware/branchScope.middleware';
import {
  getPOSProducts,
  createOrder,
  addOrderItem,
  updateOrderItem,
  removeOrderItem,
  updateOrderItemStatus,
  applyDiscount,
  removeDiscount,
  addPayment,
  updateOrderStatus,
  getOrderDetail,
  getOrders,
  getActiveOrders,
  getTableStatusOverview,
  generateKOT,
  transferTable,
  syncOrderToAccounting,
  applyOrderCharges,
} from '../controllers/pos.controller';

const router = Router();

// Apply authentication, tenant, and branch scope middleware to all POS routes
router.use(authenticate);
router.use(tenantMiddleware);
router.use(branchScopeMiddleware);

/**
 * GET /api/v1/pos/products
 * Get active products for POS with variants, addons, and pricing
 * Query params: branchId, categoryId, channelType
 */
router.get('/products', requirePermission('pos', 'read'), getPOSProducts);

/**
 * POST /api/v1/pos/orders
 * Create a new order
 * Body: branchId, type, staffId, tableId?, customerId?, notes?
 */
router.post('/orders', requirePermission('pos', 'create'), createOrder);

/**
 * GET /api/v1/pos/orders
 * Get paginated orders with filters
 * Query params: branchId, status, paymentStatus, type, startDate, endDate, page, limit
 */
router.get('/orders', requirePermission('pos', 'read'), getOrders);

/**
 * GET /api/v1/pos/orders/active
 * Get all currently active orders (not Completed or Cancelled)
 * Query params: branchId
 */
router.get('/orders/active', requirePermission('pos', 'read'), getActiveOrders);

/**
 * POST /api/v1/pos/orders/:orderId/items
 * Add item to an order
 * Body: productId, quantity, variantId?, addons?, notes?
 */
router.post('/orders/:orderId/items', requirePermission('pos', 'create'), addOrderItem);

/**
 * PUT /api/v1/pos/orders/:orderId/items/:itemId
 * Update an order item
 * Body: quantity?, notes?, addons?
 */
router.put('/orders/:orderId/items/:itemId', requirePermission('pos', 'update'), updateOrderItem);

/**
 * DELETE /api/v1/pos/orders/:orderId/items/:itemId
 * Remove an order item
 */
router.delete('/orders/:orderId/items/:itemId', requirePermission('pos', 'delete'), removeOrderItem);

/**
 * PATCH /api/v1/pos/orders/:orderId/items/:itemId/status
 * Update order item status
 * Body: status
 */
router.patch('/orders/:orderId/items/:itemId/status', requirePermission('pos', 'update'), updateOrderItemStatus);

/**
 * POST /api/v1/pos/orders/:orderId/discount
 * Apply a discount to an order
 * Body: discountId OR (reason, amount)
 */
router.post('/orders/:orderId/discount', requirePermission('pos', 'create'), applyDiscount);

/**
 * DELETE /api/v1/pos/orders/:orderId/discount
 * Remove discount from an order
 */
router.delete('/orders/:orderId/discount', requirePermission('pos', 'update'), removeDiscount);

/**
 * POST /api/v1/pos/orders/:orderId/payments
 * Record a payment for an order
 * Body: paymentOptionId, amount, reference?
 */
router.post('/orders/:orderId/payments', requirePermission('pos', 'create'), addPayment);

/**
 * PATCH /api/v1/pos/orders/:orderId/status
 * Update overall order status
 * Body: status, reason? (required for Cancelled status)
 */
router.patch('/orders/:orderId/status', requirePermission('pos', 'update'), updateOrderStatus);

/**
 * POST /api/v1/pos/orders/:orderId/charges
 * Calculate and apply charges to an order
 * Query: branchId (if not in auth context)
 */
router.post('/orders/:orderId/charges', requirePermission('pos', 'update'), applyOrderCharges);

/**
 * POST /api/v1/pos/orders/:orderId/kot
 * Generate Kitchen Order Ticket (KOT) for an order
 * Body: kitchenId
 */
router.post('/orders/:orderId/kot', requirePermission('pos', 'create'), generateKOT);

/**
 * PATCH /api/v1/pos/orders/:orderId/transfer-table
 * Transfer an order from one table to another
 * Body: newTableId
 */
router.patch('/orders/:orderId/transfer-table', requirePermission('pos', 'update'), transferTable);

/**
 * POST /api/v1/pos/orders/:orderId/sync-accounting
 * Manually trigger accounting sync for a completed order
 */
router.post('/orders/:orderId/sync-accounting', requirePermission('pos', 'update'), syncOrderToAccounting);

/**
 * GET /api/v1/pos/orders/:orderId
 * Get complete order details with timeline and breakdowns
 */
router.get('/orders/:orderId', requirePermission('pos', 'read'), getOrderDetail);

/**
 * GET /api/v1/pos/tables/:branchId
 * Get table status overview for a branch, grouped by floor
 * Returns tables with current order info if status is 'running'
 */
router.get('/tables/:branchId', requirePermission('pos', 'read'), getTableStatusOverview);

export default router;
