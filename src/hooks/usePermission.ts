import { useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PermissionModule, PermissionAction } from '../utils/permissions';
import { StaffUser } from '../services/authService';

/**
 * Permission data cached from AuthContext user
 * Permissions come from the user object fetched via GET /api/v1/auth/me
 */
type Permissions = Record<string, Record<string, boolean>>;

/**
 * Extract permissions from the authenticated user.
 * - SuperAdmin: all permissions granted
 * - BusinessOwner: all permissions granted
 * - Staff: permissions from role
 */
function extractPermissions(user: ReturnType<typeof useAuth>['user']): Permissions {
  if (!user) return {};

  if (user.userType === 'SuperAdmin' || user.userType === 'BusinessOwner') {
    // SuperAdmin and BusinessOwner have full access
    return {};
  }

  // Staff user - extract permissions from role
  const staffUser = user as StaffUser;
  if (staffUser.role?.permissions && typeof staffUser.role.permissions === 'object') {
    return staffUser.role.permissions as Permissions;
  }

  return {};
}

/**
 * Check if user type has implicit full access
 */
function hasFullAccess(user: ReturnType<typeof useAuth>['user']): boolean {
  if (!user) return false;
  return user.userType === 'SuperAdmin' || user.userType === 'BusinessOwner';
}

/**
 * React Hook for Permission Checking (API-driven via AuthContext)
 *
 * Uses the user data from AuthContext (fetched via GET /api/v1/auth/me on mount)
 * and caches permissions in React context via useMemo.
 *
 * @example
 * function ProductList() {
 *   const { hasPermission, permissions } = usePermission();
 *
 *   return (
 *     <>
 *       {hasPermission('catalog', 'create') && <button>Add Product</button>}
 *       {hasPermission('catalog', 'delete') && <button>Delete</button>}
 *     </>
 *   );
 * }
 */
export function usePermission() {
  const { user, loading } = useAuth();

  // Cache permissions extracted from user object
  const permissions = useMemo(() => extractPermissions(user), [user]);
  const isFullAccess = useMemo(() => hasFullAccess(user), [user]);

  /**
   * Check if user has permission for a specific module and action
   */
  const hasPermissionFn = useCallback(
    (module: PermissionModule, action: PermissionAction): boolean => {
      // No user = no permissions
      if (!user) return false;

      // SuperAdmin and BusinessOwner have full access
      if (isFullAccess) return true;

      // Check specific permission
      const modulePerms = permissions[module];
      if (!modulePerms) return false;
      return modulePerms[action] === true;
    },
    [user, isFullAccess, permissions]
  );

  /**
   * Check if user has ANY of the specified permissions
   */
  const hasAnyPermission = useCallback(
    (checks: Array<[PermissionModule, PermissionAction]>): boolean => {
      return checks.some(([mod, act]) => hasPermissionFn(mod, act));
    },
    [hasPermissionFn]
  );

  /**
   * Check if user has ALL of the specified permissions
   */
  const hasAllPermissions = useCallback(
    (checks: Array<[PermissionModule, PermissionAction]>): boolean => {
      return checks.every(([mod, act]) => hasPermissionFn(mod, act));
    },
    [hasPermissionFn]
  );

  return {
    /** All permissions for the current user */
    permissions,
    /** Whether permissions are still loading (auth loading) */
    loading,
    /** Check single permission */
    hasPermission: hasPermissionFn,
    /** Check if user has any of the given permissions */
    hasAnyPermission,
    /** Check if user has all of the given permissions */
    hasAllPermissions,
    /** Whether the user is an admin with full access */
    isFullAccess,
  };
}

export default usePermission;
