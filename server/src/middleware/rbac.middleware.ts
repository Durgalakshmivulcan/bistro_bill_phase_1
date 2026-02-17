import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import {
  hasPermission as checkPermission,
  clearPermissionCache as clearCache,
} from '../services/rbac.service';

/**
 * Re-export clearPermissionCache for backward compatibility
 */
export const clearPermissionCache = clearCache;

/**
 * RBAC middleware that checks if the user has the required permission.
 *
 * Permission checks:
 * - SuperAdmin (role level 1): Bypasses all permission checks
 * - BusinessOwner: Bypasses all permission checks (full access to own tenant)
 * - Staff: Permission checked via UserRoleAssignment → Role → RolePermission → Permission
 *
 * @param module - The module name (e.g., 'catalog', 'inventory', 'pos')
 * @param action - The action name (e.g., 'create', 'read', 'update', 'delete')
 *
 * Usage:
 * ```
 * router.post('/products',
 *   authenticate,
 *   tenantMiddleware,
 *   requirePermission('catalog', 'create'),
 *   createProduct
 * );
 * ```
 */
export function requirePermission(module: string, action: string) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Authentication required',
        },
      };
      res.status(401).json(response);
      return;
    }

    // SuperAdmin bypasses all permission checks (role level 1)
    if (req.user.userType === 'SuperAdmin') {
      next();
      return;
    }

    // BusinessOwner has full access to their own tenant
    if (req.user.userType === 'BusinessOwner') {
      next();
      return;
    }

    // For Staff, check permissions via RBAC service
    if (req.user.userType === 'Staff') {
      const granted = await checkPermission(req.user.id, module, action);

      if (!granted) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: `Permission denied: ${module}.${action}`,
          },
        };
        res.status(403).json(response);
        return;
      }

      next();
      return;
    }

    // Unknown user type - deny access
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INVALID_USER_TYPE',
        message: 'Invalid user type',
      },
    };
    res.status(403).json(response);
  };
}

/**
 * RBAC middleware that checks if the user has ANY of the required permissions.
 *
 * @param permissions - Array of [module, action] tuples
 */
export function requireAnyPermission(permissions: [string, string][]) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Authentication required',
        },
      };
      res.status(401).json(response);
      return;
    }

    if (req.user.userType === 'SuperAdmin' || req.user.userType === 'BusinessOwner') {
      next();
      return;
    }

    if (req.user.userType === 'Staff') {
      const results = await Promise.all(
        permissions.map(([mod, act]) => checkPermission(req.user!.id, mod, act))
      );

      if (!results.some(Boolean)) {
        const permStr = permissions.map(([m, a]) => `${m}.${a}`).join(', ');
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: `Permission denied. Required: one of [${permStr}]`,
          },
        };
        res.status(403).json(response);
        return;
      }

      next();
      return;
    }

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INVALID_USER_TYPE',
        message: 'Invalid user type',
      },
    };
    res.status(403).json(response);
  };
}

/**
 * RBAC middleware that checks if the user has ALL of the required permissions.
 *
 * @param permissions - Array of [module, action] tuples
 */
export function requireAllPermissions(permissions: [string, string][]) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Authentication required',
        },
      };
      res.status(401).json(response);
      return;
    }

    if (req.user.userType === 'SuperAdmin' || req.user.userType === 'BusinessOwner') {
      next();
      return;
    }

    if (req.user.userType === 'Staff') {
      const results = await Promise.all(
        permissions.map(([mod, act]) => checkPermission(req.user!.id, mod, act))
      );

      const missing = permissions.filter((_, i) => !results[i]);
      if (missing.length > 0) {
        const permStr = missing.map(([m, a]) => `${m}.${a}`).join(', ');
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: `Missing required permissions: [${permStr}]`,
          },
        };
        res.status(403).json(response);
        return;
      }

      next();
      return;
    }

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INVALID_USER_TYPE',
        message: 'Invalid user type',
      },
    };
    res.status(403).json(response);
  };
}
