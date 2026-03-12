import { useState, useEffect } from 'react';
import {
  PermissionModule,
  PermissionAction,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isAdmin,
  getCurrentUser,
  getPermissionDeniedMessage,
  getAllPermissions,
} from '../utils/permissions';

/**
 * React Hook for Permission Checking
 *
 * This hook provides reactive permission checking that updates when user changes.
 * It's more convenient than importing the utility functions directly.
 *
 * @example
 * function ProductList() {
 *   const { canDelete, canCreate, check } = usePermissions('catalog');
 *
 *   return (
 *     <>
 *       {canCreate && <button>Add Product</button>}
 *       {canDelete && <button>Delete</button>}
 *       {check('update') && <button>Edit</button>}
 *     </>
 *   );
 * }
 */
export function usePermissions(
  module?: PermissionModule,
  resource?: string
){
  const [user, setUser] = useState(getCurrentUser());

  // Listen for localStorage changes (e.g., login/logout)
  useEffect(() => {
    const handleStorageChange = () => {
      setUser(getCurrentUser());
    };

    // Listen for storage events from other tabs/windows
    window.addEventListener('storage', handleStorageChange);

    // Custom event for same-tab updates (dispatch this on login/logout)
    window.addEventListener('userChanged', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userChanged', handleStorageChange);
    };
  }, []);

  /**
   * Check if user has permission for a specific action on the module
   */
 const check = (action: PermissionAction): boolean => {
  if (isAdmin()) return true;
  if (!module) return false;
  return hasPermission(module, action, resource);
};

  /**
   * Check permission on any module
   */
 const checkModule = (
  targetModule: PermissionModule,
  action: PermissionAction,
  targetResource?: string
): boolean => {
  return hasPermission(targetModule, action, targetResource);
};

  return {
    // Current user info
    user,
    isLoggedIn: user !== null,
    isAdmin: isAdmin(),

    // Module-specific permissions (if module provided)
  canCreate: module ? (isAdmin() || hasPermission(module, 'create', resource)) : false,
canUpdate: module ? (isAdmin() || hasPermission(module, 'update', resource)) : false,
canDelete: module ? (isAdmin() || hasPermission(module, 'delete', resource)) : false,
canView: module ? (isAdmin() || hasPermission(module, 'read', resource)) : false,

    // Generic permission checking
    check,
    checkModule,
    hasAnyPermission,
    hasAllPermissions,

    // Utilities
    getPermissionDeniedMessage,
    getAllPermissions,
  };
}

/**
 * Hook to check multiple permissions at once
 * Returns an object with permission results
 *
 * @example
 * const perms = usePermissionsCheck({
 *   canManageCatalog: ['catalog', 'update'],
 *   canDeleteStaff: ['staff', 'delete'],
 *   canViewReports: ['analytics', 'view'],
 * });
 *
 * if (perms.canManageCatalog) { ... }
 */
export function usePermissionsCheck(
  checks: Record<string, [PermissionModule, PermissionAction]>
): Record<string, boolean> {
  // Track user state for reactive updates
  const [, setUser] = useState(getCurrentUser());

  useEffect(() => {
    const handleStorageChange = () => {
      setUser(getCurrentUser());
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userChanged', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userChanged', handleStorageChange);
    };
  }, []);

  const results: Record<string, boolean> = {};

  for (const [key, [module, action]] of Object.entries(checks)) {
    results[key] = hasPermission(module, action);
  }

  return results;
}

/**
 * Hook that throws or redirects if user doesn't have required permission
 * Useful for protecting entire pages/routes
 *
 * @example
 * function StaffManagementPage() {
 *   useRequirePermission('staff', 'view', '/dashboard');
 *   // Rest of component only renders if user has permission
 * }
 */
export function useRequirePermission(
  module: PermissionModule,
  action: PermissionAction,
  redirectTo?: string
): void {
  const [user, setUser] = useState(getCurrentUser());

  useEffect(() => {
    const handleStorageChange = () => {
      setUser(getCurrentUser());
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userChanged', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userChanged', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (!hasPermission(module, action)) {
      if (redirectTo) {
        // Redirect to specified path
        window.location.href = redirectTo;
      } else {
        // Show error (you could also throw an error to be caught by error boundary)
        console.error(
          `Permission denied: User does not have ${action} permission for ${module}`
        );
      }
    }
  }, [module, action, redirectTo, user]);
}
