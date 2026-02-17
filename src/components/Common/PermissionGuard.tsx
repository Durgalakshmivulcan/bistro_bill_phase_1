import { ReactNode } from 'react';
import {
  PermissionModule,
  PermissionAction,
  hasPermission,
  getPermissionDeniedMessage,
} from '../../utils/permissions';

/**
 * PermissionGuard Component
 *
 * Conditionally renders children based on user permissions.
 * Shows fallback UI or nothing if permission is denied.
 *
 * @example
 * <PermissionGuard module="staff" action="delete">
 *   <button>Delete Staff</button>
 * </PermissionGuard>
 *
 * @example
 * <PermissionGuard
 *   module="catalog"
 *   action="create"
 *   fallback={<p>You cannot add products</p>}
 * >
 *   <button>Add Product</button>
 * </PermissionGuard>
 */

interface PermissionGuardProps {
  /** The module to check permission for */
  module: PermissionModule;

  /** The action to check permission for */
  action: PermissionAction;

  /** Content to show if user HAS permission */
  children: ReactNode;

  /** Optional content to show if user DOES NOT have permission */
  fallback?: ReactNode;

  /** If true, shows a permission denied message instead of hiding */
  showDeniedMessage?: boolean;
}

export function PermissionGuard({
  module,
  action,
  children,
  fallback,
  showDeniedMessage = false,
}: PermissionGuardProps) {
  const hasPerm = hasPermission(module, action);

  // User has permission, show children
  if (hasPerm) {
    return <>{children}</>;
  }

  // User doesn't have permission
  if (showDeniedMessage) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p className="font-medium">Access Denied</p>
        <p className="text-sm">{getPermissionDeniedMessage(module, action)}</p>
      </div>
    );
  }

  // Show fallback if provided, otherwise show nothing
  return fallback ? <>{fallback}</> : null;
}

/**
 * Higher-order component that wraps a component with permission check
 * Useful for protecting entire page components
 *
 * @example
 * export default withPermission(StaffManagementPage, 'staff', 'view');
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  module: PermissionModule,
  action: PermissionAction,
  fallback?: ReactNode
) {
  return function PermissionProtectedComponent(props: P) {
    const hasPerm = hasPermission(module, action);

    if (!hasPerm) {
      if (fallback) {
        return <>{fallback}</>;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="bg-white border border-red-200 rounded-lg p-8 max-w-md text-center">
            <div className="text-red-500 text-5xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Access Denied
            </h1>
            <p className="text-gray-600 mb-4">
              {getPermissionDeniedMessage(module, action)}
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-yellow-400 hover:bg-yellow-500 px-6 py-2 rounded font-medium"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

export default PermissionGuard;
