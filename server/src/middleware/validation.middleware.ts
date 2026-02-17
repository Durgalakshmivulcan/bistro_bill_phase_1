import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

/**
 * Middleware to validate webhook payload
 * Ensures required fields are present in the webhook request body
 */
export const validateWebhookPayload = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { body } = req;

  // Check if body exists
  if (!body || typeof body !== 'object') {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_PAYLOAD',
        message: 'Request body must be a valid JSON object',
      },
    } as ApiResponse);
    return;
  }

  // Basic validation - detailed validation happens in controller
  // We just ensure the body is not empty here
  if (Object.keys(body).length === 0) {
    res.status(400).json({
      success: false,
      error: {
        code: 'EMPTY_PAYLOAD',
        message: 'Request body cannot be empty',
      },
    } as ApiResponse);
    return;
  }

  next();
};
