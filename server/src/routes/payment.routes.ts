import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireTenantContext } from '../middleware/tenant.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import {
  createPaymentOrder,
  verifyPayment,
  initiateRefund,
  processSplitPayment,
  getPaymentDetails,
  getPaymentByOrderId,
  handleWebhook,
  runReconciliation,
  listReconciliations,
  resolveReconciliation,
  createAutoPaySubscription,
  cancelAutoPaySubscription,
  listAutoPaySubscriptions,
  getAutoPaySubscription,
  retrySubscriptionCharge,
  listGatewayConfigs,
  upsertGatewayConfig,
  toggleGatewayConfig,
  testGatewayConnection,
} from '../controllers/payment.controller';

/**
 * Authenticated payment routes
 * All routes under /api/v1/payments require authentication (except webhook)
 */
const router = Router();

// Webhook route - NO authentication (called by payment gateways)
router.post('/webhook/:provider', handleWebhook);

// All other routes require authentication and tenant context
router.use(authenticate);
router.use(requireTenantContext);

/**
 * POST /api/v1/payments/create-order
 * Create a payment gateway order
 * Body: { orderId, provider, currency? }
 */
router.post('/create-order', requirePermission('payments', 'create'), createPaymentOrder);

/**
 * POST /api/v1/payments/verify
 * Verify payment after completion
 * Body: { paymentId, orderId, signature, provider }
 */
router.post('/verify', requirePermission('payments', 'create'), verifyPayment);

/**
 * POST /api/v1/payments/refund
 * Initiate a refund
 * Body: { paymentId, amount, reason? }
 */
router.post('/refund', requirePermission('payments', 'create'), initiateRefund);

/**
 * POST /api/v1/payments/split
 * Process split payment across multiple methods
 * Body: { orderId, splits: [{ provider, amount, paymentMethod }] }
 */
router.post('/split', requirePermission('payments', 'create'), processSplitPayment);

/**
 * POST /api/v1/payments/reconciliation/run
 * Run reconciliation for a provider and settlement date
 * Body: { provider, settlementDate }
 */
router.post('/reconciliation/run', requirePermission('payments', 'update'), runReconciliation);

/**
 * GET /api/v1/payments/reconciliation
 * List reconciliation records with optional filters
 * Query: { provider?, status?, startDate?, endDate? }
 */
router.get('/reconciliation', requirePermission('payments', 'read'), listReconciliations);

/**
 * PATCH /api/v1/payments/reconciliation/:id/resolve
 * Mark a disputed reconciliation as resolved
 */
router.patch('/reconciliation/:id/resolve', requirePermission('payments', 'update'), resolveReconciliation);

/**
 * POST /api/v1/payments/subscriptions/create
 * Create a UPI AutoPay subscription
 * Body: { planId, customerId?, upiId?, totalCount? }
 */
router.post('/subscriptions/create', requirePermission('payments', 'create'), createAutoPaySubscription);

/**
 * GET /api/v1/payments/subscriptions
 * List UPI AutoPay subscriptions
 * Query: { status?, planId? }
 */
router.get('/subscriptions', requirePermission('payments', 'read'), listAutoPaySubscriptions);

/**
 * GET /api/v1/payments/subscriptions/:id
 * Get subscription details
 */
router.get('/subscriptions/:id', requirePermission('payments', 'read'), getAutoPaySubscription);

/**
 * POST /api/v1/payments/subscriptions/:id/cancel
 * Cancel a UPI AutoPay subscription
 */
router.post('/subscriptions/:id/cancel', requirePermission('payments', 'update'), cancelAutoPaySubscription);

/**
 * POST /api/v1/payments/subscriptions/:id/retry
 * Retry a failed subscription charge
 */
router.post('/subscriptions/:id/retry', requirePermission('payments', 'update'), retrySubscriptionCharge);

/**
 * GET /api/v1/payments/gateway-config
 * List all gateway configurations for the business
 */
router.get('/gateway-config', requirePermission('payments', 'read'), listGatewayConfigs);

/**
 * POST /api/v1/payments/gateway-config
 * Create or update a gateway configuration
 * Body: { provider, apiKey, apiSecret, webhookSecret?, isActive?, isTestMode? }
 */
router.post('/gateway-config', requirePermission('payments', 'update'), upsertGatewayConfig);

/**
 * PATCH /api/v1/payments/gateway-config/:id/toggle
 * Toggle gateway active status
 */
router.patch('/gateway-config/:id/toggle', requirePermission('payments', 'update'), toggleGatewayConfig);

/**
 * POST /api/v1/payments/gateway-config/:id/test
 * Test connection for a gateway configuration
 */
router.post('/gateway-config/:id/test', requirePermission('payments', 'update'), testGatewayConnection);

/**
 * GET /api/v1/payments/order/:orderId
 * Get payment details by order ID
 */
router.get('/order/:orderId', requirePermission('payments', 'read'), getPaymentByOrderId);

/**
 * GET /api/v1/payments/:id
 * Get payment details
 */
router.get('/:id', requirePermission('payments', 'read'), getPaymentDetails);

export default router;
