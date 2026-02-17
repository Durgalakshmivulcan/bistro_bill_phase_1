import { ReactNode } from 'react';
import { PermissionModule, PermissionAction } from '../../utils/permissions';
import { usePermission } from '../../hooks/usePermission';

/**
 * PermissionGate Component
 *
 * Renders children only if the current user has the specified permission.
 * Uses the usePermission hook which derives permissions from AuthContext
 * (fetched via GET /api/v1/auth/me).
 *
 * @example
 * <PermissionGate module="catalog" action="create">
 *   <button>Add Product</button>
 * </PermissionGate>
 *
 * @example
 * <PermissionGate module="customers" action="delete" fallback={<span>No access</span>}>
 *   <button>Delete Customer</button>
 * </PermissionGate>
 */
interface PermissionGateProps {
  /** The permission module to check */
  module: PermissionModule;
  /** The permission action to check */
  action: PermissionAction;
  /** Content to render if user has permission */
  children: ReactNode;
  /** Optional content to render if user does NOT have permission */
  fallback?: ReactNode;
}

export function PermissionGate({
  module,
  action,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { hasPermission } = usePermission();

  if (hasPermission(module, action)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

export default PermissionGate;
