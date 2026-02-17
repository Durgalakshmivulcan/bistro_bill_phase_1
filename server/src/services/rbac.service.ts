import { prisma } from './db.service';

/**
 * Cached permission entry with TTL
 */
interface CachedPermissions {
  permissions: PermissionEntry[];
  timestamp: number;
}

/**
 * A resolved permission from the Permission table
 */
export interface PermissionEntry {
  module: string;
  action: string;
  resource: string | null;
  granted: boolean;
}

const permissionCache = new Map<string, CachedPermissions>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Clear cached permissions for a specific user or all users.
 */
export function clearPermissionCache(userId?: string): void {
  if (userId) {
    permissionCache.delete(userId);
  } else {
    permissionCache.clear();
  }
}

/**
 * Get all permissions for a user by traversing:
 * UserRoleAssignment → Role (+ parent roles via hierarchy) → RolePermission → Permission
 *
 * Returns an array of PermissionEntry objects including inherited permissions.
 * Only active, non-expired role assignments are considered.
 */
export async function getUserPermissions(userId: string): Promise<PermissionEntry[]> {
  // Check cache
  const cached = permissionCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.permissions;
  }

  // Get all active, non-expired role assignments for this user
  const assignments = await prisma.userRoleAssignment.findMany({
    where: {
      userId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  // Collect role IDs including parent roles (for hierarchy inheritance)
  const roleIds = new Set<string>();
  for (const assignment of assignments) {
    roleIds.add(assignment.roleId);
  }

  // Walk up the role hierarchy to collect inherited roles
  const rolesToCheck = [...roleIds];
  while (rolesToCheck.length > 0) {
    const currentRoleId = rolesToCheck.pop()!;
    const role = await prisma.role.findUnique({
      where: { id: currentRoleId },
      select: { parentRoleId: true },
    });
    if (role?.parentRoleId && !roleIds.has(role.parentRoleId)) {
      roleIds.add(role.parentRoleId);
      rolesToCheck.push(role.parentRoleId);
    }
  }

  // Fetch all RolePermissions for all collected role IDs
  const rolePermissions = await prisma.rolePermission.findMany({
    where: {
      roleId: { in: [...roleIds] },
    },
    include: {
      permission: true,
    },
  });

  // Build permission map (module+action+resource → granted)
  // If any role grants a permission, it's granted (union of all roles)
  const permMap = new Map<string, PermissionEntry>();
  for (const rp of rolePermissions) {
    const key = `${rp.permission.module}:${rp.permission.action}:${rp.permission.resource ?? ''}`;
    const existing = permMap.get(key);
    // Grant wins over deny (if any role grants it, it's granted)
    if (!existing || (rp.granted && !existing.granted)) {
      permMap.set(key, {
        module: rp.permission.module,
        action: rp.permission.action,
        resource: rp.permission.resource,
        granted: rp.granted,
      });
    }
  }

  const permissions = [...permMap.values()];

  // Cache the result
  permissionCache.set(userId, { permissions, timestamp: Date.now() });

  return permissions;
}

/**
 * Check if a user has a specific permission (module + action).
 * Queries UserRoleAssignment → Role → RolePermission → Permission.
 * Uses cached permissions when available.
 */
export async function hasPermission(
  userId: string,
  module: string,
  action: string
): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions.some(
    (p) => p.module === module && p.action === action && p.granted
  );
}

/**
 * Assign a role to a user, optionally scoped to a branch and/or kitchen.
 * Creates a UserRoleAssignment record.
 * Clears the user's permission cache after assignment.
 */
export async function assignRole(
  userId: string,
  roleId: string,
  branchId?: string,
  kitchenId?: string
): Promise<void> {
  await prisma.userRoleAssignment.create({
    data: {
      userId,
      roleId,
      branchId: branchId ?? null,
      kitchenId: kitchenId ?? null,
    },
  });

  // Invalidate cache for this user
  clearPermissionCache(userId);
}

/**
 * Revoke a role from a user.
 * Deletes the UserRoleAssignment record matching userId + roleId.
 * Clears the user's permission cache after revocation.
 */
export async function revokeRole(
  userId: string,
  roleId: string
): Promise<void> {
  await prisma.userRoleAssignment.deleteMany({
    where: {
      userId,
      roleId,
    },
  });

  // Invalidate cache for this user
  clearPermissionCache(userId);
}

/**
 * Get the branch IDs a user is allowed to access based on their role assignments.
 *
 * - SuperAdmin: returns null (all branches across all tenants)
 * - BusinessOwner: returns all branches for their business
 * - Staff with branch-scoped role assignments: returns assigned branch IDs
 * - Staff with no branch-scoped assignments: returns all branches for their tenant
 */
export async function getBranchScope(
  userId: string,
  userType: 'SuperAdmin' | 'BusinessOwner' | 'Staff',
  businessOwnerId?: string
): Promise<string[] | null> {
  // SuperAdmin can access everything
  if (userType === 'SuperAdmin') {
    return null;
  }

  // BusinessOwner gets all their branches
  if (userType === 'BusinessOwner') {
    const branches = await prisma.branch.findMany({
      where: { businessOwnerId: userId },
      select: { id: true },
    });
    return branches.map((b) => b.id);
  }

  // Staff: check branch-scoped role assignments
  const assignments = await prisma.userRoleAssignment.findMany({
    where: {
      userId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    select: { branchId: true },
  });

  // Collect unique non-null branch IDs
  const branchIds = [
    ...new Set(
      assignments
        .map((a) => a.branchId)
        .filter((id): id is string => id !== null)
    ),
  ];

  // If staff has branch-scoped assignments, restrict to those branches
  if (branchIds.length > 0) {
    return branchIds;
  }

  // If no branch-scoped assignments, default to all tenant branches
  if (businessOwnerId) {
    const branches = await prisma.branch.findMany({
      where: { businessOwnerId },
      select: { id: true },
    });
    return branches.map((b) => b.id);
  }

  return [];
}

/**
 * Get the kitchen IDs a user is allowed to access based on their role assignments.
 *
 * - SuperAdmin: returns null (all kitchens)
 * - BusinessOwner: returns all kitchens for their branches
 * - Staff with kitchen-scoped role assignments: returns assigned kitchen IDs
 * - Staff with branch-scoped (but no kitchen-scoped) assignments: returns all kitchens in those branches
 * - Staff with no scoped assignments: returns all kitchens for their tenant
 */
export async function getKitchenScope(
  userId: string,
  userType: 'SuperAdmin' | 'BusinessOwner' | 'Staff',
  businessOwnerId?: string
): Promise<string[] | null> {
  // SuperAdmin can access everything
  if (userType === 'SuperAdmin') {
    return null;
  }

  // BusinessOwner gets all kitchens across their branches
  if (userType === 'BusinessOwner') {
    const kitchens = await prisma.kitchen.findMany({
      where: { branch: { businessOwnerId: userId } },
      select: { id: true },
    });
    return kitchens.map((k) => k.id);
  }

  // Staff: check kitchen-scoped role assignments
  const assignments = await prisma.userRoleAssignment.findMany({
    where: {
      userId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    select: { branchId: true, kitchenId: true },
  });

  // Collect unique non-null kitchen IDs
  const kitchenIds = [
    ...new Set(
      assignments
        .map((a) => a.kitchenId)
        .filter((id): id is string => id !== null)
    ),
  ];

  // If staff has kitchen-scoped assignments, restrict to those kitchens
  if (kitchenIds.length > 0) {
    return kitchenIds;
  }

  // If staff has branch-scoped assignments, return all kitchens in those branches
  const branchIds = [
    ...new Set(
      assignments
        .map((a) => a.branchId)
        .filter((id): id is string => id !== null)
    ),
  ];

  if (branchIds.length > 0) {
    const kitchens = await prisma.kitchen.findMany({
      where: { branchId: { in: branchIds } },
      select: { id: true },
    });
    return kitchens.map((k) => k.id);
  }

  // No scoped assignments — return all kitchens for tenant
  if (businessOwnerId) {
    const kitchens = await prisma.kitchen.findMany({
      where: { branch: { businessOwnerId } },
      select: { id: true },
    });
    return kitchens.map((k) => k.id);
  }

  return [];
}
