import { Router } from 'express';
import { getPublicFeedbackForm, submitFeedbackResponse } from '../controllers/feedback.controller';
import { viewSharedReport } from '../controllers/reports.controller';

const router = Router();

/**
 * @route GET /api/v1/public/feedback/:formId
 * @desc Get feedback form details for public/mobile submission
 * @access Public
 */
router.get('/feedback/:formId', getPublicFeedbackForm);

/**
 * @route POST /api/v1/public/feedback/:formId
 * @desc Submit a feedback response (no authentication required)
 * @access Public
 */
router.post('/feedback/:formId', submitFeedbackResponse);

/**
 * @route GET /api/v1/public/shared-reports/:token
 * @desc View a shared report (no authentication required)
 * @access Public
 */
router.get('/shared-reports/:token', viewSharedReport);

export default router;
