/**
 * Permission Utility Functions
 *
 * This module provides permission checking utilities for enforcing role-based access control (RBAC)
 * in the UI layer. Permissions are defined at the role level and stored in the backend.
 *
 * Permission Structure (from backend):
 * {
 *   catalog: { view: true, create: true, update: true, delete: false },
 *   inventory: { view: true, create: false, update: false, delete: false },
 *   staff: { view: false, create: false, update: false, delete: false },
 *   ...
 * }
 */

/**
 * Permission modules and actions
 */
export type PermissionModule =
  | 'catalog'
  | 'inventory'
  | 'pos'
  | 'orders'
  | 'customers'
  | 'staff'
  | 'analytics'
  | 'marketing'
  | 'settings'
  | 'purchase_orders'
  | 'reservations';

export type PermissionAction = 'view' | 'create' | 'update' | 'delete';

/**
 * User role with permissions
 */
export interface UserRole {
  id: string;
  name: string;
  permissions: Record<string, Record<string, boolean>>;
}

/**
 * Current user info stored in localStorage
 * TODO: Replace with proper auth context when implemented
 */
export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  permissions: Record<string, Record<string, boolean>>;
}

/**
 * Get current user from localStorage
 * Returns null if no user is logged in
 *
 * @returns CurrentUser | null
 */
export function getCurrentUser(): CurrentUser | null {
  try {
    const userJson = localStorage.getItem('currentUser');
    if (!userJson) return null;
    return JSON.parse(userJson) as CurrentUser;
  } catch (error) {
    console.error('Error parsing current user from localStorage:', error);
    return null;
  }
}

/**
 * Set current user in localStorage
 * Should be called during login/authentication
 *
 * @param user - User data including permissions
 */
export function setCurrentUser(user: CurrentUser): void {
  try {
    localStorage.setItem('currentUser', JSON.stringify(user));
  } catch (error) {
    console.error('Error saving current user to localStorage:', error);
  }
}

/**
 * Clear current user from localStorage
 * Should be called during logout
 */
export function clearCurrentUser(): void {
  localStorage.removeItem('currentUser');
}

/**
 * Check if user has permission to perform an action on a module
 *
 * @param module - The module to check (e.g., 'catalog', 'staff')
 * @param action - The action to check (e.g., 'view', 'create', 'delete')
 * @returns true if user has permission, false otherwise
 *
 * @example
 * if (hasPermission('staff', 'delete')) {
 *   // Show delete button
 * }
 */
export function hasPermission(
  module: PermissionModule,
  action: PermissionAction
): boolean {
  const user = getCurrentUser();

  // If no user is logged in, deny all permissions
  if (!user) return false;

  // If user has no permissions object, deny
  if (!user.permissions) return false;

  // Check if module exists in permissions
  const modulePermissions = user.permissions[module];
  if (!modulePermissions) return false;

  // Check if action is allowed
  return modulePermissions[action] === true;
}

/**
 * Check if user has ANY of the specified permissions
 * Useful for "show if user can do A OR B"
 *
 * @param checks - Array of [module, action] tuples to check
 * @returns true if user has at least one of the permissions
 *
 * @example
 * if (hasAnyPermission([['catalog', 'create'], ['catalog', 'update']])) {
 *   // Show "Manage Catalog" button
 * }
 */
export function hasAnyPermission(
  checks: Array<[PermissionModule, PermissionAction]>
): boolean {
  return checks.some(([module, action]) => hasPermission(module, action));
}

/**
 * Check if user has ALL of the specified permissions
 * Useful for "show only if user can do A AND B"
 *
 * @param checks - Array of [module, action] tuples to check
 * @returns true if user has all of the permissions
 *
 * @example
 * if (hasAllPermissions([['catalog', 'view'], ['inventory', 'view']])) {
 *   // Show combined catalog + inventory report
 * }
 */
export function hasAllPermissions(
  checks: Array<[PermissionModule, PermissionAction]>
): boolean {
  return checks.every(([module, action]) => hasPermission(module, action));
}

/**
 * Get permission denied message
 * Returns a user-friendly message when permission is denied
 *
 * @param module - The module that was denied
 * @param action - The action that was denied
 * @returns User-friendly error message
 */
export function getPermissionDeniedMessage(
  module: PermissionModule,
  action: PermissionAction
): string {
  const actionText = {
    view: 'view',
    create: 'create',
    update: 'update',
    delete: 'delete',
  }[action];

  const moduleText = module.replace('_', ' ');

  return `You don't have permission to ${actionText} ${moduleText}. Please contact your administrator.`;
}

/**
 * Check if current user is admin/superadmin
 * Admins typically have all permissions
 *
 * @returns true if user is admin
 */
export function isAdmin(): boolean {
  const user = getCurrentUser();
  if (!user) return false;

  // Check if role name contains 'admin' (case-insensitive)
  const roleName = user.roleName.toLowerCase();
  return roleName.includes('admin') || roleName.includes('superadmin');
}

/**
 * Get all permissions for current user
 * Useful for debugging or displaying permission summary
 *
 * @returns User's full permission object or empty object
 */
export function getAllPermissions(): Record<string, Record<string, boolean>> {
  const user = getCurrentUser();
  return user?.permissions || {};
}
