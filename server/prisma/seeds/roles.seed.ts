import { PrismaClient } from '@prisma/client';

interface RoleDef {
  name: string;
  description: string;
  level: number;
  parentName: string | null; // name of parent role for hierarchy
  /** Module permissions granted to this role. null = all modules/actions */
  permissions: '*' | { module: string; actions: string[] }[];
}

/**
 * Role hierarchy:
 *   Super Admin (1) → Business Owner (2) → Branch Manager (3) → Department Manager (4) → Staff (5)
 *
 * Specialised roles at level 5 (Staff tier):
 *   Waiter  – POS orders, table management only
 *   Cashier – Payments, invoices only
 *
 * Kitchen Manager sits at level 4 (Department Manager tier):
 *   KDS, Inventory, Staff within kitchen scope
 */
const ROLE_DEFS: RoleDef[] = [
  {
    name: 'Super Admin',
    description: 'Platform-wide administrator with full access to all modules',
    level: 1,
    parentName: null,
    permissions: '*', // all permissions
  },
  {
    name: 'Business Owner',
    description: 'Owner of the business with full access within their organization',
    level: 2,
    parentName: 'Super Admin',
    permissions: '*', // all permissions except super_admin module
  },
  {
    name: 'Branch Manager',
    description: 'Manager of a specific branch with full operational access',
    level: 3,
    parentName: 'Business Owner',
    permissions: [
      { module: 'catalog', actions: ['create', 'read', 'update', 'delete', 'export'] },
      { module: 'inventory', actions: ['create', 'read', 'update', 'delete', 'export', 'approve'] },
      { module: 'orders', actions: ['create', 'read', 'update', 'delete', 'approve', 'export'] },
      { module: 'pos', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'customers', actions: ['create', 'read', 'update', 'delete', 'export'] },
      { module: 'staff', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'kds', actions: ['read', 'update'] },
      { module: 'purchase_orders', actions: ['create', 'read', 'update', 'delete', 'approve', 'export'] },
      { module: 'payments', actions: ['create', 'read', 'update', 'export'] },
      { module: 'taxes', actions: ['read'] },
      { module: 'marketing', actions: ['create', 'read', 'update', 'delete', 'export'] },
      { module: 'reports', actions: ['read', 'export'] },
      { module: 'settings', actions: ['read', 'update'] },
      { module: 'resources', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'reservations', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'dashboard', actions: ['read'] },
      { module: 'online_orders', actions: ['read', 'update'] },
    ],
  },
  {
    name: 'Kitchen Manager',
    description: 'Manager of a kitchen area with KDS, inventory, and staff access',
    level: 4,
    parentName: 'Branch Manager',
    permissions: [
      { module: 'kds', actions: ['read', 'update'] },
      { module: 'inventory', actions: ['create', 'read', 'update'] },
      { module: 'staff', actions: ['read'] },
      { module: 'orders', actions: ['read', 'update'] },
      { module: 'catalog', actions: ['read'] },
      { module: 'dashboard', actions: ['read'] },
    ],
  },
  {
    name: 'Waiter',
    description: 'Front-of-house staff with POS order and table management access',
    level: 5,
    parentName: 'Branch Manager',
    permissions: [
      { module: 'pos', actions: ['create', 'read', 'update'] },
      { module: 'orders', actions: ['create', 'read', 'update'] },
      { module: 'customers', actions: ['create', 'read'] },
      { module: 'reservations', actions: ['create', 'read', 'update'] },
      { module: 'resources', actions: ['read'] },
      { module: 'catalog', actions: ['read'] },
      { module: 'kds', actions: ['read'] },
    ],
  },
  {
    name: 'Cashier',
    description: 'Payment processing staff with access to payments and invoices',
    level: 5,
    parentName: 'Branch Manager',
    permissions: [
      { module: 'payments', actions: ['create', 'read', 'update'] },
      { module: 'orders', actions: ['read'] },
      { module: 'pos', actions: ['read'] },
      { module: 'customers', actions: ['read'] },
      { module: 'reports', actions: ['read'] },
      { module: 'dashboard', actions: ['read'] },
    ],
  },
];

export async function seedRoles(prisma: PrismaClient, businessOwnerId: string): Promise<number> {
  console.log('Seeding default roles with permission assignments...');

  // 1. Fetch all permissions from DB
  const allPermissions = await prisma.permission.findMany();
  if (allPermissions.length === 0) {
    console.warn('⚠ No permissions found – run seedPermissions first.');
    return 0;
  }

  // Build a lookup: "module:action" → permission id
  const permLookup = new Map<string, string>();
  for (const p of allPermissions) {
    permLookup.set(`${p.module}:${p.action}`, p.id);
  }

  // Super-admin excluded modules: Business Owner doesn't get super_admin perms
  const superAdminModules = new Set(['super_admin']);

  // 2. Create roles in hierarchy order (parents first)
  const roleIdByName = new Map<string, string>();
  let totalRolePermissions = 0;

  for (const def of ROLE_DEFS) {
    const parentRoleId = def.parentName ? roleIdByName.get(def.parentName) ?? null : null;

    // Upsert role by name + businessOwnerId to be idempotent
    const role = await prisma.role.upsert({
      where: {
        // Use the unique constraint-like lookup — there isn't a compound unique, so
        // find first matching, then upsert by id.
        id: (
          await prisma.role.findFirst({
            where: { businessOwnerId, name: def.name, isSystem: true },
            select: { id: true },
          })
        )?.id ?? 'non-existent-placeholder',
      },
      update: {
        description: def.description,
        level: def.level,
        parentRoleId: parentRoleId,
        status: 'active',
      },
      create: {
        businessOwnerId,
        name: def.name,
        description: def.description,
        permissions: {}, // legacy JSON field – empty for new RBAC roles
        isSystem: true,
        parentRoleId: parentRoleId,
        level: def.level,
        status: 'active',
      },
    });

    roleIdByName.set(def.name, role.id);

    // 3. Resolve which permission IDs this role gets
    let permissionIds: string[];

    if (def.permissions === '*') {
      if (def.name === 'Business Owner') {
        // Business Owner gets everything except super_admin module
        permissionIds = allPermissions
          .filter((p) => !superAdminModules.has(p.module))
          .map((p) => p.id);
      } else {
        // Super Admin gets ALL permissions
        permissionIds = allPermissions.map((p) => p.id);
      }
    } else {
      permissionIds = [];
      for (const grant of def.permissions) {
        for (const action of grant.actions) {
          const key = `${grant.module}:${action}`;
          const permId = permLookup.get(key);
          if (permId) {
            permissionIds.push(permId);
          }
        }
      }
    }

    // 4. Create RolePermission entries (skip duplicates)
    if (permissionIds.length > 0) {
      const result = await prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId: role.id,
          permissionId,
          granted: true,
        })),
        skipDuplicates: true,
      });
      totalRolePermissions += result.count;
    }

    console.log(
      `  ✓ Role "${def.name}" (level ${def.level}) → ${permissionIds.length} permissions`
    );
  }

  console.log(
    `Seeded ${ROLE_DEFS.length} roles with ${totalRolePermissions} new role-permission links.`
  );
  return ROLE_DEFS.length;
}
