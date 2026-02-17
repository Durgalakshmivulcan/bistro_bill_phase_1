import { Router } from 'express';
import { submitFeedbackResponse } from '../controllers/feedback.controller';
import { viewSharedReport } from '../controllers/reports.controller';

const router = Router();

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
