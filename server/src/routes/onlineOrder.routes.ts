import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import {
  receiveOnlineOrder,
  getPendingOnlineOrders,
  acceptOnlineOrder,
  rejectOnlineOrder,
} from '../controllers/onlineOrder.controller';
import { validateWebhookPayload } from '../middleware/validation.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

/**
 * Webhook Routes (No Authentication Required)
 * POST /api/v1/webhooks/online-orders/:aggregator
 * Receives online orders from external aggregator platforms
 */
export const webhookRouter = Router();
webhookRouter.post('/online-orders/:aggregator', validateWebhookPayload, receiveOnlineOrder);

/**
 * Management Routes (Authentication Required)
 * All routes under /api/v1/pos/online-orders require authentication
 */
export const managementRouter = Router();

// Apply authentication and tenant middleware to all management routes
managementRouter.use(authenticate);
managementRouter.use(tenantMiddleware);

/**
 * GET /api/v1/pos/online-orders
 * Get online orders filtered by status and branch
 * Query params: status, branchId
 */
managementRouter.get('/online-orders', requirePermission('online_orders', 'read'), getPendingOnlineOrders);

/**
 * POST /api/v1/pos/online-orders/:id/accept
 * Accept an online order and set delivery/prep times
 * Body: deliveryTime, prepTime
 */
managementRouter.post('/online-orders/:id/accept', requirePermission('online_orders', 'update'), acceptOnlineOrder);

/**
 * POST /api/v1/pos/online-orders/:id/reject
 * Reject an online order with a reason
 * Body: reason
 */
managementRouter.post('/online-orders/:id/reject', requirePermission('online_orders', 'update'), rejectOnlineOrder);

export default { webhookRouter, managementRouter };
