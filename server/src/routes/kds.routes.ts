import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireTenantContext } from '../middleware/tenant.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { getKitchenOrderBoard, updateKDSItemStatus, updateKOTStatus, getKitchenStats } from '../controllers/kds.controller';

const router = Router();

// All KDS routes require authentication and tenant context
router.use(authenticate);
router.use(requireTenantContext);

// GET /api/v1/kds/:kitchenId/orders - Get kitchen order board
router.get('/:kitchenId/orders', requirePermission('kds', 'read'), getKitchenOrderBoard);

// PATCH /api/v1/kds/items/:orderItemId/status - Update order item status
router.patch('/items/:orderItemId/status', requirePermission('kds', 'update'), updateKDSItemStatus);

// PATCH /api/v1/kds/kot/:kotId/status - Update KOT status
router.patch('/kot/:kotId/status', requirePermission('kds', 'update'), updateKOTStatus);

// GET /api/v1/kds/:kitchenId/stats - Get kitchen statistics
router.get('/:kitchenId/stats', requirePermission('kds', 'read'), getKitchenStats);

export default router;
