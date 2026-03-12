import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';

/**
 * Multi-tenant middleware that ensures all queries are scoped to the authenticated tenant.
 *
 * Extracts businessOwnerId from req.user and attaches it to req.tenantId for use
 * in data access layer to scope queries.
 *
 * - SuperAdmin users bypass tenant check (tenantId remains undefined)
 * - BusinessOwner and Staff users must have a valid businessOwnerId
 *
 * Use AFTER authenticate middleware.
 */
export function tenantMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const resolveTenantOverride = (): string | undefined => {
    const queryTenantId =
      (req.query.tenantId as string | undefined) ||
      (req.query.boId as string | undefined) ||
      (req.query.businessOwnerId as string | undefined);

    const bodyTenantId =
      req.body?.tenantId ||
      req.body?.boId ||
      req.body?.businessOwnerId;

    const headerTenantId =
      (req.headers['x-tenant-id'] as string | undefined) ||
      (req.headers['x-bo-id'] as string | undefined) ||
      (req.headers['x-business-owner-id'] as string | undefined);

    return queryTenantId || bodyTenantId || headerTenantId;
  };

  // Check if user is authenticated
  if (!req.user) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'NOT_AUTHENTICATED',
        message: 'Authentication required for tenant context',
      },
    };
    res.status(401).json(response);
    return;
  }

  // SuperAdmin can optionally impersonate a tenant via query/body/header override.
  // If not provided, tenantId remains undefined.
  if (req.user.userType === 'SuperAdmin') {
    const overrideTenantId = resolveTenantOverride();
    if (overrideTenantId) {
      req.tenantId = overrideTenantId;
    }
    next();
    return;
  }

  // For BusinessOwner and Staff, businessOwnerId is required
  if (!req.user.businessOwnerId) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'MISSING_TENANT_CONTEXT',
        message: 'Tenant context is required but not available',
      },
    };
    res.status(403).json(response);
    return;
  }

  // Attach tenantId to request for data scoping
  req.tenantId = req.user.businessOwnerId;

  next();
}

/**
 * Middleware that requires tenant context to be present.
 *
 * Use when a route must have a tenant context (no SuperAdmin access).
 * SuperAdmin should use specific routes that pass tenantId explicitly.
 */
export function requireTenantContext(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  // Check if user is authenticated
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

  // For all users including SuperAdmin, tenantId must be set
  // SuperAdmin must pass tenantId explicitly via query/params for these routes
  if (!req.tenantId) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'TENANT_CONTEXT_REQUIRED',
        message: 'This endpoint requires tenant context',
      },
    };
    res.status(403).json(response);
    return;
  }

  next();
}

/**
 * Middleware that allows SuperAdmin to impersonate a tenant by passing tenantId.
 *
 * Use AFTER tenantMiddleware. If req.tenantId is already set, this does nothing.
 * If SuperAdmin passes tenantId in query/body, it will be used.
 */
export function allowTenantOverride(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  // If tenantId is already set, skip
  if (req.tenantId) {
    next();
    return;
  }

  // Only SuperAdmin can override tenant
  if (req.user?.userType === 'SuperAdmin') {
    const tenantIdFromQuery =
      (req.query.tenantId as string | undefined) ||
      (req.query.boId as string | undefined) ||
      (req.query.businessOwnerId as string | undefined);
    const tenantIdFromBody =
      req.body?.tenantId ||
      req.body?.boId ||
      req.body?.businessOwnerId;
    const tenantIdFromHeader =
      (req.headers['x-tenant-id'] as string | undefined) ||
      (req.headers['x-bo-id'] as string | undefined) ||
      (req.headers['x-business-owner-id'] as string | undefined);

    const overrideTenantId = tenantIdFromQuery || tenantIdFromBody || tenantIdFromHeader;

    if (overrideTenantId) {
      req.tenantId = overrideTenantId;
    }
  }

  next();
}
