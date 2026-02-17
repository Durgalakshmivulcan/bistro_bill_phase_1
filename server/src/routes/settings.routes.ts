import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireTenantContext } from '../middleware/tenant.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { imageUpload, uploadToS3Middleware } from '../middleware/upload.middleware';
import {
  getTaxes,
  createTax,
  updateTax,
  deleteTax,
  getTaxGroups,
  createTaxGroup,
  updateTaxGroup,
  deleteTaxGroup,
  getPaymentOptions,
  createPaymentOption,
  updatePaymentOption,
  deletePaymentOption,
  getCharges,
  createCharge,
  updateCharge,
  deleteCharge,
  getReasons,
  createReason,
  updateReason,
  deleteReason,
  getPreferences,
  updatePreferences,
  getProfile,
  updateProfile,
  getSalesChannels,
  updateSalesChannel,
  getAggregators,
  updateAggregator,
} from '../controllers/settings.controller';

const router = Router();

// All settings routes require authentication and tenant context
router.use(authenticate);
router.use(requireTenantContext);

// Tax Routes
router.get('/taxes', requirePermission('taxes', 'read'), getTaxes);
router.post('/taxes', requirePermission('taxes', 'create'), createTax);
router.put('/taxes/:id', requirePermission('taxes', 'update'), updateTax);
router.delete('/taxes/:id', requirePermission('taxes', 'delete'), deleteTax);

// Tax Group Routes
router.get('/tax-groups', requirePermission('taxes', 'read'), getTaxGroups);
router.post('/tax-groups', requirePermission('taxes', 'create'), createTaxGroup);
router.put('/tax-groups/:id', requirePermission('taxes', 'update'), updateTaxGroup);
router.delete('/tax-groups/:id', requirePermission('taxes', 'delete'), deleteTaxGroup);

// Payment Option Routes
router.get('/payment-options', requirePermission('payments', 'read'), getPaymentOptions);
router.post('/payment-options', requirePermission('payments', 'create'), createPaymentOption);
router.put('/payment-options/:id', requirePermission('payments', 'update'), updatePaymentOption);
router.delete('/payment-options/:id', requirePermission('payments', 'delete'), deletePaymentOption);

// Charge Routes
router.get('/charges', requirePermission('settings', 'read'), getCharges);
router.post('/charges', requirePermission('settings', 'update'), createCharge);
router.put('/charges/:id', requirePermission('settings', 'update'), updateCharge);
router.delete('/charges/:id', requirePermission('settings', 'update'), deleteCharge);

// Reason Routes
router.get('/reasons', requirePermission('settings', 'read'), getReasons);
router.post('/reasons', requirePermission('settings', 'update'), createReason);
router.put('/reasons/:id', requirePermission('settings', 'update'), updateReason);
router.delete('/reasons/:id', requirePermission('settings', 'update'), deleteReason);

// Business Preferences Routes
router.get('/preferences', requirePermission('settings', 'read'), getPreferences);
router.put('/preferences', requirePermission('settings', 'update'), updatePreferences);

// Business Profile Routes
router.get('/profile', requirePermission('settings', 'read'), getProfile);
router.put('/profile', requirePermission('settings', 'update'), imageUpload.single('avatar'), uploadToS3Middleware(), updateProfile);

// Sales Channel Routes
router.get('/sales-channels', requirePermission('settings', 'read'), getSalesChannels);
router.put('/sales-channels/:id', requirePermission('settings', 'update'), updateSalesChannel);

// Aggregator Routes
router.get('/aggregators', requirePermission('settings', 'read'), getAggregators);
router.put('/aggregators/:id', requirePermission('settings', 'update'), updateAggregator);

export default router;
