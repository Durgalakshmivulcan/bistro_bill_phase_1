import { Router } from 'express';
import {
  getCameras,
  getFootageLink,
  getOrderFootage,
  getVoiceOrderingStatus,
  handleFulfillment,
  linkCustomerAccount,
  getRecentVoiceOrders,
  printReceipt,
  openCashDrawer,
  getHardwareStatus,
} from '../controllers/integration.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route GET /api/v1/integrations/cctv/cameras
 * @description Get all security cameras for a branch
 * @access Private
 * @query branchId - Filter cameras by branch
 */
router.get('/cctv/cameras', authenticate, getCameras);

/**
 * @route GET /api/v1/integrations/cctv/footage
 * @description Get footage link for a specific camera (stub)
 * @access Private
 * @query cameraId - Camera ID
 * @query timestamp - Timestamp for footage
 * @query duration - Duration in minutes
 */
router.get('/cctv/footage', authenticate, getFootageLink);

/**
 * @route GET /api/v1/integrations/cctv/order-footage/:orderId
 * @description Get footage for a specific order (stub)
 * @access Private
 */
router.get('/cctv/order-footage/:orderId', authenticate, getOrderFootage);

/**
 * @route GET /api/v1/integrations/voice-ordering/status
 * @description Get voice ordering integration status (stub)
 * @access Private
 */
router.get('/voice-ordering/status', authenticate, getVoiceOrderingStatus);

/**
 * @route POST /api/v1/integrations/voice-ordering/fulfillment
 * @description Handle voice ordering fulfillment (stub)
 * @access Private
 */
router.post('/voice-ordering/fulfillment', authenticate, handleFulfillment);

/**
 * @route POST /api/v1/integrations/voice-ordering/link-account
 * @description Link customer account to voice ordering (stub)
 * @access Private
 */
router.post('/voice-ordering/link-account', authenticate, linkCustomerAccount);

/**
 * @route GET /api/v1/integrations/voice-ordering/recent-orders
 * @description Get recent voice orders (stub)
 * @access Private
 */
router.get('/voice-ordering/recent-orders', authenticate, getRecentVoiceOrders);

/**
 * @route POST /api/v1/integrations/pos-hardware/print-receipt
 * @description Print a receipt (stub)
 * @access Private
 */
router.post('/pos-hardware/print-receipt', authenticate, printReceipt);

/**
 * @route POST /api/v1/integrations/pos-hardware/open-drawer
 * @description Open cash drawer (stub)
 * @access Private
 */
router.post('/pos-hardware/open-drawer', authenticate, openCashDrawer);

/**
 * @route GET /api/v1/integrations/pos-hardware/status
 * @description Get POS hardware connection status (stub)
 * @access Private
 */
router.get('/pos-hardware/status', authenticate, getHardwareStatus);

export default router;
