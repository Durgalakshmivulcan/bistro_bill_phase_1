import { PrismaClient } from '@prisma/client';

interface PermissionDef {
  module: string;
  action: string;
  resource: string | null;
  description: string;
}

const PERMISSIONS: PermissionDef[] = [
  // ── Catalog ──────────────────────────────────────────────
  { module: 'catalog', action: 'create', resource: 'product', description: 'Create new products' },
  { module: 'catalog', action: 'read', resource: 'product', description: 'View products' },
  { module: 'catalog', action: 'update', resource: 'product', description: 'Edit products' },
  { module: 'catalog', action: 'delete', resource: 'product', description: 'Delete products' },
  { module: 'catalog', action: 'create', resource: 'category', description: 'Create categories' },
  { module: 'catalog', action: 'read', resource: 'category', description: 'View categories' },
  { module: 'catalog', action: 'update', resource: 'category', description: 'Edit categories' },
  { module: 'catalog', action: 'delete', resource: 'category', description: 'Delete categories' },
  { module: 'catalog', action: 'create', resource: 'brand', description: 'Create brands' },
  { module: 'catalog', action: 'read', resource: 'brand', description: 'View brands' },
  { module: 'catalog', action: 'update', resource: 'brand', description: 'Edit brands' },
  { module: 'catalog', action: 'delete', resource: 'brand', description: 'Delete brands' },
  { module: 'catalog', action: 'create', resource: 'menu', description: 'Create channel menus' },
  { module: 'catalog', action: 'read', resource: 'menu', description: 'View channel menus' },
  { module: 'catalog', action: 'update', resource: 'menu', description: 'Edit channel menus' },
  { module: 'catalog', action: 'delete', resource: 'menu', description: 'Delete channel menus' },
  { module: 'catalog', action: 'export', resource: null, description: 'Export catalog data' },

  // ── Inventory ────────────────────────────────────────────
  { module: 'inventory', action: 'create', resource: 'stock', description: 'Create stock entries' },
  { module: 'inventory', action: 'read', resource: 'stock', description: 'View stock levels' },
  { module: 'inventory', action: 'update', resource: 'stock', description: 'Adjust stock levels' },
  { module: 'inventory', action: 'delete', resource: 'stock', description: 'Delete stock entries' },
  { module: 'inventory', action: 'create', resource: 'item', description: 'Create inventory items' },
  { module: 'inventory', action: 'read', resource: 'item', description: 'View inventory items' },
  { module: 'inventory', action: 'update', resource: 'item', description: 'Edit inventory items' },
  { module: 'inventory', action: 'delete', resource: 'item', description: 'Delete inventory items' },
  { module: 'inventory', action: 'export', resource: null, description: 'Export inventory data' },
  { module: 'inventory', action: 'approve', resource: 'adjustment', description: 'Approve stock adjustments' },

  // ── Orders ───────────────────────────────────────────────
  { module: 'orders', action: 'create', resource: 'order', description: 'Create new orders' },
  { module: 'orders', action: 'read', resource: 'order', description: 'View orders' },
  { module: 'orders', action: 'update', resource: 'order', description: 'Edit orders' },
  { module: 'orders', action: 'delete', resource: 'order', description: 'Cancel/delete orders' },
  { module: 'orders', action: 'approve', resource: 'order', description: 'Approve orders' },
  { module: 'orders', action: 'create', resource: 'refund', description: 'Initiate refunds' },
  { module: 'orders', action: 'read', resource: 'refund', description: 'View refund history' },
  { module: 'orders', action: 'export', resource: null, description: 'Export order data' },
  { module: 'orders', action: 'create', resource: 'kot', description: 'Create KOT (Kitchen Order Ticket)' },
  { module: 'orders', action: 'update', resource: 'kot', description: 'Update KOT status' },

  // ── POS ──────────────────────────────────────────────────
  { module: 'pos', action: 'create', resource: 'order', description: 'Take POS orders' },
  { module: 'pos', action: 'read', resource: 'order', description: 'View POS orders' },
  { module: 'pos', action: 'update', resource: 'order', description: 'Edit POS orders' },
  { module: 'pos', action: 'delete', resource: 'order', description: 'Void POS orders' },
  { module: 'pos', action: 'create', resource: 'payment', description: 'Process POS payments' },
  { module: 'pos', action: 'create', resource: 'discount', description: 'Apply discounts at POS' },
  { module: 'pos', action: 'read', resource: 'table', description: 'View table status at POS' },
  { module: 'pos', action: 'update', resource: 'table', description: 'Manage table assignments at POS' },
  { module: 'pos', action: 'create', resource: 'kot', description: 'Send to kitchen from POS' },
  { module: 'pos', action: 'read', resource: 'dashboard', description: 'Access POS dashboard' },

  // ── Customers ────────────────────────────────────────────
  { module: 'customers', action: 'create', resource: 'customer', description: 'Add new customers' },
  { module: 'customers', action: 'read', resource: 'customer', description: 'View customers' },
  { module: 'customers', action: 'update', resource: 'customer', description: 'Edit customer details' },
  { module: 'customers', action: 'delete', resource: 'customer', description: 'Delete customers' },
  { module: 'customers', action: 'create', resource: 'group', description: 'Create customer groups' },
  { module: 'customers', action: 'read', resource: 'group', description: 'View customer groups' },
  { module: 'customers', action: 'update', resource: 'group', description: 'Edit customer groups' },
  { module: 'customers', action: 'delete', resource: 'group', description: 'Delete customer groups' },
  { module: 'customers', action: 'export', resource: null, description: 'Export customer data' },

  // ── Staff ────────────────────────────────────────────────
  { module: 'staff', action: 'create', resource: 'staff', description: 'Add new staff members' },
  { module: 'staff', action: 'read', resource: 'staff', description: 'View staff members' },
  { module: 'staff', action: 'update', resource: 'staff', description: 'Edit staff details' },
  { module: 'staff', action: 'delete', resource: 'staff', description: 'Deactivate/delete staff' },
  { module: 'staff', action: 'create', resource: 'role', description: 'Create staff roles' },
  { module: 'staff', action: 'read', resource: 'role', description: 'View staff roles' },
  { module: 'staff', action: 'update', resource: 'role', description: 'Edit staff roles' },
  { module: 'staff', action: 'delete', resource: 'role', description: 'Delete staff roles' },
  { module: 'staff', action: 'create', resource: 'attendance', description: 'Record staff attendance' },
  { module: 'staff', action: 'read', resource: 'attendance', description: 'View staff attendance' },

  // ── KDS (Kitchen Display System) ─────────────────────────
  { module: 'kds', action: 'read', resource: 'order', description: 'View kitchen orders' },
  { module: 'kds', action: 'update', resource: 'order', description: 'Update kitchen order status' },
  { module: 'kds', action: 'read', resource: 'dashboard', description: 'Access KDS dashboard' },
  { module: 'kds', action: 'update', resource: 'settings', description: 'Configure KDS settings' },

  // ── Purchase Orders ──────────────────────────────────────
  { module: 'purchase_orders', action: 'create', resource: 'order', description: 'Create purchase orders' },
  { module: 'purchase_orders', action: 'read', resource: 'order', description: 'View purchase orders' },
  { module: 'purchase_orders', action: 'update', resource: 'order', description: 'Edit purchase orders' },
  { module: 'purchase_orders', action: 'delete', resource: 'order', description: 'Delete purchase orders' },
  { module: 'purchase_orders', action: 'approve', resource: 'order', description: 'Approve purchase orders' },
  { module: 'purchase_orders', action: 'create', resource: 'supplier', description: 'Add suppliers' },
  { module: 'purchase_orders', action: 'read', resource: 'supplier', description: 'View suppliers' },
  { module: 'purchase_orders', action: 'update', resource: 'supplier', description: 'Edit suppliers' },
  { module: 'purchase_orders', action: 'delete', resource: 'supplier', description: 'Delete suppliers' },
  { module: 'purchase_orders', action: 'export', resource: null, description: 'Export purchase order data' },

  // ── Payments ─────────────────────────────────────────────
  { module: 'payments', action: 'create', resource: 'payment', description: 'Process payments' },
  { module: 'payments', action: 'read', resource: 'payment', description: 'View payment records' },
  { module: 'payments', action: 'update', resource: 'payment', description: 'Edit payment records' },
  { module: 'payments', action: 'create', resource: 'refund', description: 'Process refunds' },
  { module: 'payments', action: 'read', resource: 'option', description: 'View payment methods' },
  { module: 'payments', action: 'create', resource: 'option', description: 'Add payment methods' },
  { module: 'payments', action: 'update', resource: 'option', description: 'Edit payment methods' },
  { module: 'payments', action: 'delete', resource: 'option', description: 'Remove payment methods' },
  { module: 'payments', action: 'read', resource: 'reconciliation', description: 'View payment reconciliation' },
  { module: 'payments', action: 'export', resource: null, description: 'Export payment data' },

  // ── Taxes ────────────────────────────────────────────────
  { module: 'taxes', action: 'create', resource: 'tax', description: 'Create tax rules' },
  { module: 'taxes', action: 'read', resource: 'tax', description: 'View tax configuration' },
  { module: 'taxes', action: 'update', resource: 'tax', description: 'Edit tax rules' },
  { module: 'taxes', action: 'delete', resource: 'tax', description: 'Delete tax rules' },
  { module: 'taxes', action: 'create', resource: 'group', description: 'Create tax groups' },
  { module: 'taxes', action: 'read', resource: 'group', description: 'View tax groups' },
  { module: 'taxes', action: 'update', resource: 'group', description: 'Edit tax groups' },
  { module: 'taxes', action: 'delete', resource: 'group', description: 'Delete tax groups' },

  // ── Marketing ────────────────────────────────────────────
  { module: 'marketing', action: 'create', resource: 'discount', description: 'Create discounts' },
  { module: 'marketing', action: 'read', resource: 'discount', description: 'View discounts' },
  { module: 'marketing', action: 'update', resource: 'discount', description: 'Edit discounts' },
  { module: 'marketing', action: 'delete', resource: 'discount', description: 'Delete discounts' },
  { module: 'marketing', action: 'create', resource: 'advertisement', description: 'Create advertisements' },
  { module: 'marketing', action: 'read', resource: 'advertisement', description: 'View advertisements' },
  { module: 'marketing', action: 'update', resource: 'advertisement', description: 'Edit advertisements' },
  { module: 'marketing', action: 'delete', resource: 'advertisement', description: 'Delete advertisements' },
  { module: 'marketing', action: 'create', resource: 'feedback', description: 'Create feedback forms' },
  { module: 'marketing', action: 'read', resource: 'feedback', description: 'View customer feedback' },
  { module: 'marketing', action: 'update', resource: 'feedback', description: 'Edit feedback forms' },
  { module: 'marketing', action: 'delete', resource: 'feedback', description: 'Delete feedback entries' },
  { module: 'marketing', action: 'export', resource: null, description: 'Export marketing data' },

  // ── Reports & Analytics ──────────────────────────────────
  { module: 'reports', action: 'read', resource: 'sales', description: 'View sales reports' },
  { module: 'reports', action: 'read', resource: 'inventory', description: 'View inventory reports' },
  { module: 'reports', action: 'read', resource: 'financial', description: 'View financial reports' },
  { module: 'reports', action: 'read', resource: 'staff', description: 'View staff reports' },
  { module: 'reports', action: 'read', resource: 'customer', description: 'View customer reports' },
  { module: 'reports', action: 'read', resource: 'gst', description: 'View GST reports' },
  { module: 'reports', action: 'read', resource: 'audit', description: 'View audit logs' },
  { module: 'reports', action: 'read', resource: 'dashboard', description: 'Access analytics dashboard' },
  { module: 'reports', action: 'export', resource: null, description: 'Export reports' },

  // ── Settings ─────────────────────────────────────────────
  { module: 'settings', action: 'read', resource: 'business', description: 'View business settings' },
  { module: 'settings', action: 'update', resource: 'business', description: 'Edit business settings' },
  { module: 'settings', action: 'read', resource: 'preferences', description: 'View preferences' },
  { module: 'settings', action: 'update', resource: 'preferences', description: 'Edit preferences' },
  { module: 'settings', action: 'read', resource: 'sales', description: 'View sales settings' },
  { module: 'settings', action: 'update', resource: 'sales', description: 'Edit sales settings' },
  { module: 'settings', action: 'read', resource: 'integrations', description: 'View integrations' },
  { module: 'settings', action: 'update', resource: 'integrations', description: 'Configure integrations' },

  // ── Resources (Branches, Kitchens, Floors, Tables) ───────
  { module: 'resources', action: 'create', resource: 'branch', description: 'Create branches' },
  { module: 'resources', action: 'read', resource: 'branch', description: 'View branches' },
  { module: 'resources', action: 'update', resource: 'branch', description: 'Edit branches' },
  { module: 'resources', action: 'delete', resource: 'branch', description: 'Delete branches' },
  { module: 'resources', action: 'create', resource: 'kitchen', description: 'Create kitchens' },
  { module: 'resources', action: 'read', resource: 'kitchen', description: 'View kitchens' },
  { module: 'resources', action: 'update', resource: 'kitchen', description: 'Edit kitchens' },
  { module: 'resources', action: 'delete', resource: 'kitchen', description: 'Delete kitchens' },
  { module: 'resources', action: 'create', resource: 'floor', description: 'Create floor plans' },
  { module: 'resources', action: 'read', resource: 'floor', description: 'View floor plans' },
  { module: 'resources', action: 'update', resource: 'floor', description: 'Edit floor plans' },
  { module: 'resources', action: 'delete', resource: 'floor', description: 'Delete floor plans' },
  { module: 'resources', action: 'create', resource: 'table', description: 'Create tables' },
  { module: 'resources', action: 'read', resource: 'table', description: 'View tables' },
  { module: 'resources', action: 'update', resource: 'table', description: 'Edit tables' },
  { module: 'resources', action: 'delete', resource: 'table', description: 'Delete tables' },

  // ── Reservations ─────────────────────────────────────────
  { module: 'reservations', action: 'create', resource: 'reservation', description: 'Create reservations' },
  { module: 'reservations', action: 'read', resource: 'reservation', description: 'View reservations' },
  { module: 'reservations', action: 'update', resource: 'reservation', description: 'Edit reservations' },
  { module: 'reservations', action: 'delete', resource: 'reservation', description: 'Cancel reservations' },

  // ── Dashboard ────────────────────────────────────────────
  { module: 'dashboard', action: 'read', resource: 'overview', description: 'View dashboard overview' },
  { module: 'dashboard', action: 'read', resource: 'analytics', description: 'View dashboard analytics' },
  { module: 'dashboard', action: 'read', resource: 'alerts', description: 'View dashboard alerts' },

  // ── Blog ─────────────────────────────────────────────────
  { module: 'blog', action: 'create', resource: 'post', description: 'Create blog posts' },
  { module: 'blog', action: 'read', resource: 'post', description: 'View blog posts' },
  { module: 'blog', action: 'update', resource: 'post', description: 'Edit blog posts' },
  { module: 'blog', action: 'delete', resource: 'post', description: 'Delete blog posts' },

  // ── Online Orders ────────────────────────────────────────
  { module: 'online_orders', action: 'read', resource: 'order', description: 'View online orders' },
  { module: 'online_orders', action: 'update', resource: 'order', description: 'Update online order status' },
  { module: 'online_orders', action: 'read', resource: 'settings', description: 'View online order settings' },
  { module: 'online_orders', action: 'update', resource: 'settings', description: 'Configure online ordering' },

  // ── Super Admin ──────────────────────────────────────────
  { module: 'super_admin', action: 'read', resource: 'business_owners', description: 'View all business owners' },
  { module: 'super_admin', action: 'create', resource: 'business_owners', description: 'Create business owners' },
  { module: 'super_admin', action: 'update', resource: 'business_owners', description: 'Edit business owners' },
  { module: 'super_admin', action: 'delete', resource: 'business_owners', description: 'Delete business owners' },
  { module: 'super_admin', action: 'read', resource: 'subscriptions', description: 'View subscriptions' },
  { module: 'super_admin', action: 'update', resource: 'subscriptions', description: 'Manage subscriptions' },
  { module: 'super_admin', action: 'read', resource: 'platform_analytics', description: 'View platform analytics' },
  { module: 'super_admin', action: 'update', resource: 'platform_settings', description: 'Edit platform settings' },
];

export async function seedPermissions(prisma: PrismaClient): Promise<number> {
  console.log('Seeding permissions...');

  const result = await prisma.permission.createMany({
    data: PERMISSIONS.map((perm) => ({
      module: perm.module,
      action: perm.action,
      resource: perm.resource,
      description: perm.description,
    })),
    skipDuplicates: true,
  });

  const modules = new Set(PERMISSIONS.map((p) => p.module));
  console.log(`Seeded ${result.count} new permissions (${PERMISSIONS.length} total defined across ${modules.size} modules).`);
  return PERMISSIONS.length;
}
