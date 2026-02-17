import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';

/**
 * Middleware that allows SuperAdmin to access tenant-scoped data by providing a boId query param.
 *
 * When a SuperAdmin provides ?boId=<businessOwnerId>, this middleware:
 * - Sets req.user.businessOwnerId to the provided boId
 * - Sets req.tenantId to the provided boId (for tenant-scoped controllers)
 * - Clears req.user.branchId (SA sees all branches for that BO)
 *
 * Does nothing if user is not SuperAdmin or boId is not provided.
 * Use AFTER authenticate and tenantMiddleware.
 */
export function saBusinessOwnerOverride(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  if (req.user?.userType === 'SuperAdmin' && req.query.boId) {
    const boId = req.query.boId as string;
    req.user.businessOwnerId = boId;
    req.tenantId = boId;
    req.user.branchId = undefined;
  }

  next();
}
