import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { getBranchScope, getKitchenScope } from '../services/rbac.service';

/**
 * Middleware that injects `req.branchScope` and `req.kitchenScope` arrays
 * based on the user's role assignments.
 *
 * - SuperAdmin: branchScope = null (unrestricted)
 * - BusinessOwner: branchScope = all branches for their business
 * - Staff (branch-scoped role): branchScope = assigned branch IDs only
 * - Staff (no branch scope): branchScope = all tenant branches
 *
 * Must be placed AFTER authenticate and tenantMiddleware.
 */
export async function branchScopeMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    next();
    return;
  }

  const { id, userType, businessOwnerId } = req.user;

  req.branchScope = await getBranchScope(id, userType, businessOwnerId);
  req.kitchenScope = await getKitchenScope(id, userType, businessOwnerId);

  next();
}
