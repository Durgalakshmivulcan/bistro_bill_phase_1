import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import * as discountController from '../controllers/discount.controller';
import * as advertisementController from '../controllers/advertisement.controller';
import * as feedbackController from '../controllers/feedback.controller';

const router = Router();

// Apply authentication and tenant middleware to all routes
router.use(authenticate);
router.use(tenantMiddleware);

// Discount routes
router.get('/discounts', requirePermission('marketing', 'read'), discountController.getDiscounts);
router.post('/discounts', requirePermission('marketing', 'create'), discountController.createDiscount);
router.post('/discounts/validate', requirePermission('marketing', 'read'), discountController.validateDiscount);
router.put('/discounts/:id', requirePermission('marketing', 'update'), discountController.updateDiscount);
router.delete('/discounts/:id', requirePermission('marketing', 'delete'), discountController.deleteDiscount);

// Advertisement routes
router.get('/advertisements', requirePermission('marketing', 'read'), advertisementController.getAdvertisements);
router.post('/advertisements', requirePermission('marketing', 'create'), advertisementController.createAdvertisement);
router.get('/advertisements/:id', requirePermission('marketing', 'read'), advertisementController.getAdvertisement);
router.put('/advertisements/:id', requirePermission('marketing', 'update'), advertisementController.updateAdvertisement);
router.patch('/advertisements/:id/metrics', requirePermission('marketing', 'update'), advertisementController.updateMetrics);
router.delete('/advertisements/:id', requirePermission('marketing', 'delete'), advertisementController.deleteAdvertisement);

// Feedback Form routes
router.get('/feedback-forms', requirePermission('marketing', 'read'), feedbackController.getFeedbackForms);
router.post('/feedback-forms', requirePermission('marketing', 'create'), feedbackController.createFeedbackForm);
router.put('/feedback-forms/:id', requirePermission('marketing', 'update'), feedbackController.updateFeedbackForm);
router.delete('/feedback-forms/:id', requirePermission('marketing', 'delete'), feedbackController.deleteFeedbackForm);
router.get('/feedback-forms/:formId/responses', requirePermission('marketing', 'read'), feedbackController.getFeedbackResponses);

export default router;
