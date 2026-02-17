-- Seed RBAC Permissions, Roles, and RolePermission assignments
-- This migration ONLY inserts seed data into existing tables.
-- All tables (Permission, Role, RolePermission) already exist from prior schema migrations.

-- ============================================
-- 1. PERMISSIONS (167 total)
-- ============================================
-- Using WHERE NOT EXISTS with IS NOT DISTINCT FROM to handle NULL resource values safely,
-- since PostgreSQL unique constraints treat NULL as distinct from NULL.

-- Catalog (17)
INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'catalog', 'create', 'product', 'Create new products', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'catalog' AND "action" = 'create' AND "resource" IS NOT DISTINCT FROM 'product');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'catalog', 'read', 'product', 'View products', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'catalog' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'product');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'catalog', 'update', 'product', 'Edit products', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'catalog' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'product');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'catalog', 'delete', 'product', 'Delete products', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'catalog' AND "action" = 'delete' AND "resource" IS NOT DISTINCT FROM 'product');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'catalog', 'create', 'category', 'Create categories', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'catalog' AND "action" = 'create' AND "resource" IS NOT DISTINCT FROM 'category');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'catalog', 'read', 'category', 'View categories', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'catalog' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'category');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'catalog', 'update', 'category', 'Edit categories', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'catalog' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'category');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'catalog', 'delete', 'category', 'Delete categories', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'catalog' AND "action" = 'delete' AND "resource" IS NOT DISTINCT FROM 'category');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'catalog', 'create', 'brand', 'Create brands', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'catalog' AND "action" = 'create' AND "resource" IS NOT DISTINCT FROM 'brand');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'catalog', 'read', 'brand', 'View brands', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'catalog' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'brand');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'catalog', 'update', 'brand', 'Edit brands', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'catalog' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'brand');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'catalog', 'delete', 'brand', 'Delete brands', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'catalog' AND "action" = 'delete' AND "resource" IS NOT DISTINCT FROM 'brand');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'catalog', 'create', 'menu', 'Create channel menus', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'catalog' AND "action" = 'create' AND "resource" IS NOT DISTINCT FROM 'menu');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'catalog', 'read', 'menu', 'View channel menus', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'catalog' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'menu');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'catalog', 'update', 'menu', 'Edit channel menus', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'catalog' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'menu');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'catalog', 'delete', 'menu', 'Delete channel menus', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'catalog' AND "action" = 'delete' AND "resource" IS NOT DISTINCT FROM 'menu');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'catalog', 'export', NULL, 'Export catalog data', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'catalog' AND "action" = 'export' AND "resource" IS NULL);

-- Inventory (10)
INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'inventory', 'create', 'stock', 'Create stock entries', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'inventory' AND "action" = 'create' AND "resource" IS NOT DISTINCT FROM 'stock');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'inventory', 'read', 'stock', 'View stock levels', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'inventory' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'stock');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'inventory', 'update', 'stock', 'Adjust stock levels', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'inventory' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'stock');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'inventory', 'delete', 'stock', 'Delete stock entries', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'inventory' AND "action" = 'delete' AND "resource" IS NOT DISTINCT FROM 'stock');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'inventory', 'create', 'item', 'Create inventory items', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'inventory' AND "action" = 'create' AND "resource" IS NOT DISTINCT FROM 'item');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'inventory', 'read', 'item', 'View inventory items', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'inventory' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'item');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'inventory', 'update', 'item', 'Edit inventory items', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'inventory' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'item');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'inventory', 'delete', 'item', 'Delete inventory items', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'inventory' AND "action" = 'delete' AND "resource" IS NOT DISTINCT FROM 'item');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'inventory', 'export', NULL, 'Export inventory data', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'inventory' AND "action" = 'export' AND "resource" IS NULL);

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'inventory', 'approve', 'adjustment', 'Approve stock adjustments', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'inventory' AND "action" = 'approve' AND "resource" IS NOT DISTINCT FROM 'adjustment');

-- Orders (10)
INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'orders', 'create', 'order', 'Create new orders', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'orders' AND "action" = 'create' AND "resource" IS NOT DISTINCT FROM 'order');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'orders', 'read', 'order', 'View orders', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'orders' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'order');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'orders', 'update', 'order', 'Edit orders', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'orders' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'order');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'orders', 'delete', 'order', 'Cancel/delete orders', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'orders' AND "action" = 'delete' AND "resource" IS NOT DISTINCT FROM 'order');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'orders', 'approve', 'order', 'Approve orders', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'orders' AND "action" = 'approve' AND "resource" IS NOT DISTINCT FROM 'order');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'orders', 'create', 'refund', 'Initiate refunds', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'orders' AND "action" = 'create' AND "resource" IS NOT DISTINCT FROM 'refund');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'orders', 'read', 'refund', 'View refund history', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'orders' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'refund');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'orders', 'export', NULL, 'Export order data', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'orders' AND "action" = 'export' AND "resource" IS NULL);

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'orders', 'create', 'kot', 'Create KOT (Kitchen Order Ticket)', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'orders' AND "action" = 'create' AND "resource" IS NOT DISTINCT FROM 'kot');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'orders', 'update', 'kot', 'Update KOT status', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'orders' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'kot');

-- POS (10)
INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'pos', 'create', 'order', 'Take POS orders', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'pos' AND "action" = 'create' AND "resource" IS NOT DISTINCT FROM 'order');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'pos', 'read', 'order', 'View POS orders', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'pos' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'order');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'pos', 'update', 'order', 'Edit POS orders', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'pos' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'order');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'pos', 'delete', 'order', 'Void POS orders', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'pos' AND "action" = 'delete' AND "resource" IS NOT DISTINCT FROM 'order');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'pos', 'create', 'payment', 'Process POS payments', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'pos' AND "action" = 'create' AND "resource" IS NOT DISTINCT FROM 'payment');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'pos', 'create', 'discount', 'Apply discounts at POS', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'pos' AND "action" = 'create' AND "resource" IS NOT DISTINCT FROM 'discount');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'pos', 'read', 'table', 'View table status at POS', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'pos' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'table');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'pos', 'update', 'table', 'Manage table assignments at POS', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'pos' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'table');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'pos', 'create', 'kot', 'Send to kitchen from POS', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'pos' AND "action" = 'create' AND "resource" IS NOT DISTINCT FROM 'kot');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'pos', 'read', 'dashboard', 'Access POS dashboard', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'pos' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'dashboard');

-- Customers (9)
INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'customers', 'create', 'customer', 'Add new customers', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'customers' AND "action" = 'create' AND "resource" IS NOT DISTINCT FROM 'customer');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'customers', 'read', 'customer', 'View customers', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'customers' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'customer');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'customers', 'update', 'customer', 'Edit customer details', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'customers' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'customer');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'customers', 'delete', 'customer', 'Delete customers', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'customers' AND "action" = 'delete' AND "resource" IS NOT DISTINCT FROM 'customer');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'customers', 'create', 'group', 'Create customer groups', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'customers' AND "action" = 'create' AND "resource" IS NOT DISTINCT FROM 'group');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'customers', 'read', 'group', 'View customer groups', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'customers' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'group');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'customers', 'update', 'group', 'Edit customer groups', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'customers' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'group');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'customers', 'delete', 'group', 'Delete customer groups', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'customers' AND "action" = 'delete' AND "resource" IS NOT DISTINCT FROM 'group');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'customers', 'export', NULL, 'Export customer data', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'customers' AND "action" = 'export' AND "resource" IS NULL);

-- Staff (10)
INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'staff', 'create', 'staff', 'Add new staff members', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'staff' AND "action" = 'create' AND "resource" IS NOT DISTINCT FROM 'staff');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'staff', 'read', 'staff', 'View staff members', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'staff' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'staff');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'staff', 'update', 'staff', 'Edit staff details', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'staff' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'staff');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'staff', 'delete', 'staff', 'Deactivate/delete staff', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'staff' AND "action" = 'delete' AND "resource" IS NOT DISTINCT FROM 'staff');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'staff', 'create', 'role', 'Create staff roles', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'staff' AND "action" = 'create' AND "resource" IS NOT DISTINCT FROM 'role');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'staff', 'read', 'role', 'View staff roles', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'staff' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'role');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'staff', 'update', 'role', 'Edit staff roles', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'staff' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'role');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'staff', 'delete', 'role', 'Delete staff roles', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'staff' AND "action" = 'delete' AND "resource" IS NOT DISTINCT FROM 'role');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'staff', 'create', 'attendance', 'Record staff attendance', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'staff' AND "action" = 'create' AND "resource" IS NOT DISTINCT FROM 'attendance');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'staff', 'read', 'attendance', 'View staff attendance', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'staff' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'attendance');

-- KDS (4)
INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'kds', 'read', 'order', 'View kitchen orders', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'kds' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'order');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'kds', 'update', 'order', 'Update kitchen order status', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'kds' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'order');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'kds', 'read', 'dashboard', 'Access KDS dashboard', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'kds' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'dashboard');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'kds', 'update', 'settings', 'Configure KDS settings', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'kds' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'settings');

-- Purchase Orders (10)
INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'purchase_orders', 'create', 'order', 'Create purchase orders', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'purchase_orders' AND "action" = 'create' AND "resource" IS NOT DISTINCT FROM 'order');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'purchase_orders', 'read', 'order', 'View purchase orders', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'purchase_orders' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'order');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'purchase_orders', 'update', 'order', 'Edit purchase orders', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'purchase_orders' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'order');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'purchase_orders', 'delete', 'order', 'Delete purchase orders', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'purchase_orders' AND "action" = 'delete' AND "resource" IS NOT DISTINCT FROM 'order');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'purchase_orders', 'approve', 'order', 'Approve purchase orders', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'purchase_orders' AND "action" = 'approve' AND "resource" IS NOT DISTINCT FROM 'order');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'purchase_orders', 'create', 'supplier', 'Add suppliers', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'purchase_orders' AND "action" = 'create' AND "resource" IS NOT DISTINCT FROM 'supplier');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'purchase_orders', 'read', 'supplier', 'View suppliers', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'purchase_orders' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'supplier');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'purchase_orders', 'update', 'supplier', 'Edit suppliers', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'purchase_orders' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'supplier');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'purchase_orders', 'delete', 'supplier', 'Delete suppliers', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'purchase_orders' AND "action" = 'delete' AND "resource" IS NOT DISTINCT FROM 'supplier');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'purchase_orders', 'export', NULL, 'Export purchase order data', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'purchase_orders' AND "action" = 'export' AND "resource" IS NULL);

-- Payments (10)
INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'payments', 'create', 'payment', 'Process payments', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'payments' AND "action" = 'create' AND "resource" IS NOT DISTINCT FROM 'payment');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'payments', 'read', 'payment', 'View payment records', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'payments' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'payment');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'payments', 'update', 'payment', 'Edit payment records', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'payments' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'payment');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'payments', 'create', 'refund', 'Process refunds', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'payments' AND "action" = 'create' AND "resource" IS NOT DISTINCT FROM 'refund');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'payments', 'read', 'option', 'View payment methods', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'payments' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'option');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'payments', 'create', 'option', 'Add payment methods', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'payments' AND "action" = 'create' AND "resource" IS NOT DISTINCT FROM 'option');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'payments', 'update', 'option', 'Edit payment methods', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'payments' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'option');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'payments', 'delete', 'option', 'Remove payment methods', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'payments' AND "action" = 'delete' AND "resource" IS NOT DISTINCT FROM 'option');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'payments', 'read', 'reconciliation', 'View payment reconciliation', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'payments' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'reconciliation');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'payments', 'export', NULL, 'Export payment data', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'payments' AND "action" = 'export' AND "resource" IS NULL);

-- Taxes (8)
INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'taxes', 'create', 'tax', 'Create tax rules', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'taxes' AND "action" = 'create' AND "resource" IS NOT DISTINCT FROM 'tax');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'taxes', 'read', 'tax', 'View tax configuration', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'taxes' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'tax');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'taxes', 'update', 'tax', 'Edit tax rules', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'taxes' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'tax');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'taxes', 'delete', 'tax', 'Delete tax rules', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'taxes' AND "action" = 'delete' AND "resource" IS NOT DISTINCT FROM 'tax');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'taxes', 'create', 'group', 'Create tax groups', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'taxes' AND "action" = 'create' AND "resource" IS NOT DISTINCT FROM 'group');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'taxes', 'read', 'group', 'View tax groups', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'taxes' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'group');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'taxes', 'update', 'group', 'Edit tax groups', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'taxes' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'group');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'taxes', 'delete', 'group', 'Delete tax groups', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'taxes' AND "action" = 'delete' AND "resource" IS NOT DISTINCT FROM 'group');

-- Marketing (13)
INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'marketing', 'create', 'discount', 'Create discounts', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'marketing' AND "action" = 'create' AND "resource" IS NOT DISTINCT FROM 'discount');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'marketing', 'read', 'discount', 'View discounts', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'marketing' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'discount');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'marketing', 'update', 'discount', 'Edit discounts', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'marketing' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'discount');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'marketing', 'delete', 'discount', 'Delete discounts', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'marketing' AND "action" = 'delete' AND "resource" IS NOT DISTINCT FROM 'discount');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'marketing', 'create', 'advertisement', 'Create advertisements', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'marketing' AND "action" = 'create' AND "resource" IS NOT DISTINCT FROM 'advertisement');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'marketing', 'read', 'advertisement', 'View advertisements', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'marketing' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'advertisement');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'marketing', 'update', 'advertisement', 'Edit advertisements', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'marketing' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'advertisement');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'marketing', 'delete', 'advertisement', 'Delete advertisements', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'marketing' AND "action" = 'delete' AND "resource" IS NOT DISTINCT FROM 'advertisement');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'marketing', 'create', 'feedback', 'Create feedback forms', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'marketing' AND "action" = 'create' AND "resource" IS NOT DISTINCT FROM 'feedback');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'marketing', 'read', 'feedback', 'View customer feedback', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'marketing' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'feedback');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'marketing', 'update', 'feedback', 'Edit feedback forms', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'marketing' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'feedback');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'marketing', 'delete', 'feedback', 'Delete feedback entries', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'marketing' AND "action" = 'delete' AND "resource" IS NOT DISTINCT FROM 'feedback');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'marketing', 'export', NULL, 'Export marketing data', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'marketing' AND "action" = 'export' AND "resource" IS NULL);

-- Reports (9)
INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'reports', 'read', 'sales', 'View sales reports', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'reports' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'sales');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'reports', 'read', 'inventory', 'View inventory reports', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'reports' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'inventory');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'reports', 'read', 'financial', 'View financial reports', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'reports' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'financial');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'reports', 'read', 'staff', 'View staff reports', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'reports' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'staff');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'reports', 'read', 'customer', 'View customer reports', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'reports' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'customer');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'reports', 'read', 'gst', 'View GST reports', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'reports' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'gst');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'reports', 'read', 'audit', 'View audit logs', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'reports' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'audit');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'reports', 'read', 'dashboard', 'Access analytics dashboard', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'reports' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'dashboard');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'reports', 'export', NULL, 'Export reports', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'reports' AND "action" = 'export' AND "resource" IS NULL);

-- Settings (8)
INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'settings', 'read', 'business', 'View business settings', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'settings' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'business');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'settings', 'update', 'business', 'Edit business settings', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'settings' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'business');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'settings', 'read', 'preferences', 'View preferences', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'settings' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'preferences');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'settings', 'update', 'preferences', 'Edit preferences', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'settings' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'preferences');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'settings', 'read', 'sales', 'View sales settings', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'settings' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'sales');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'settings', 'update', 'sales', 'Edit sales settings', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'settings' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'sales');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'settings', 'read', 'integrations', 'View integrations', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'settings' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'integrations');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'settings', 'update', 'integrations', 'Configure integrations', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'settings' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'integrations');

-- Resources (16)
INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'resources', 'create', 'branch', 'Create branches', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'resources' AND "action" = 'create' AND "resource" IS NOT DISTINCT FROM 'branch');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'resources', 'read', 'branch', 'View branches', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'resources' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'branch');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'resources', 'update', 'branch', 'Edit branches', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'resources' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'branch');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'resources', 'delete', 'branch', 'Delete branches', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'resources' AND "action" = 'delete' AND "resource" IS NOT DISTINCT FROM 'branch');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'resources', 'create', 'kitchen', 'Create kitchens', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'resources' AND "action" = 'create' AND "resource" IS NOT DISTINCT FROM 'kitchen');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'resources', 'read', 'kitchen', 'View kitchens', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'resources' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'kitchen');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'resources', 'update', 'kitchen', 'Edit kitchens', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'resources' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'kitchen');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'resources', 'delete', 'kitchen', 'Delete kitchens', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'resources' AND "action" = 'delete' AND "resource" IS NOT DISTINCT FROM 'kitchen');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'resources', 'create', 'floor', 'Create floor plans', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'resources' AND "action" = 'create' AND "resource" IS NOT DISTINCT FROM 'floor');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'resources', 'read', 'floor', 'View floor plans', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'resources' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'floor');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'resources', 'update', 'floor', 'Edit floor plans', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'resources' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'floor');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'resources', 'delete', 'floor', 'Delete floor plans', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'resources' AND "action" = 'delete' AND "resource" IS NOT DISTINCT FROM 'floor');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'resources', 'create', 'table', 'Create tables', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'resources' AND "action" = 'create' AND "resource" IS NOT DISTINCT FROM 'table');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'resources', 'read', 'table', 'View tables', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'resources' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'table');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'resources', 'update', 'table', 'Edit tables', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'resources' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'table');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'resources', 'delete', 'table', 'Delete tables', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'resources' AND "action" = 'delete' AND "resource" IS NOT DISTINCT FROM 'table');

-- Reservations (4)
INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'reservations', 'create', 'reservation', 'Create reservations', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'reservations' AND "action" = 'create' AND "resource" IS NOT DISTINCT FROM 'reservation');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'reservations', 'read', 'reservation', 'View reservations', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'reservations' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'reservation');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'reservations', 'update', 'reservation', 'Edit reservations', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'reservations' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'reservation');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'reservations', 'delete', 'reservation', 'Cancel reservations', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'reservations' AND "action" = 'delete' AND "resource" IS NOT DISTINCT FROM 'reservation');

-- Dashboard (3)
INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'dashboard', 'read', 'overview', 'View dashboard overview', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'dashboard' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'overview');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'dashboard', 'read', 'analytics', 'View dashboard analytics', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'dashboard' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'analytics');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'dashboard', 'read', 'alerts', 'View dashboard alerts', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'dashboard' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'alerts');

-- Blog (4)
INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'blog', 'create', 'post', 'Create blog posts', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'blog' AND "action" = 'create' AND "resource" IS NOT DISTINCT FROM 'post');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'blog', 'read', 'post', 'View blog posts', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'blog' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'post');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'blog', 'update', 'post', 'Edit blog posts', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'blog' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'post');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'blog', 'delete', 'post', 'Delete blog posts', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'blog' AND "action" = 'delete' AND "resource" IS NOT DISTINCT FROM 'post');

-- Online Orders (4)
INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'online_orders', 'read', 'order', 'View online orders', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'online_orders' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'order');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'online_orders', 'update', 'order', 'Update online order status', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'online_orders' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'order');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'online_orders', 'read', 'settings', 'View online order settings', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'online_orders' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'settings');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'online_orders', 'update', 'settings', 'Configure online ordering', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'online_orders' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'settings');

-- Super Admin (8)
INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'super_admin', 'read', 'business_owners', 'View all business owners', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'super_admin' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'business_owners');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'super_admin', 'create', 'business_owners', 'Create business owners', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'super_admin' AND "action" = 'create' AND "resource" IS NOT DISTINCT FROM 'business_owners');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'super_admin', 'update', 'business_owners', 'Edit business owners', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'super_admin' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'business_owners');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'super_admin', 'delete', 'business_owners', 'Delete business owners', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'super_admin' AND "action" = 'delete' AND "resource" IS NOT DISTINCT FROM 'business_owners');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'super_admin', 'read', 'subscriptions', 'View subscriptions', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'super_admin' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'subscriptions');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'super_admin', 'update', 'subscriptions', 'Manage subscriptions', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'super_admin' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'subscriptions');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'super_admin', 'read', 'platform_analytics', 'View platform analytics', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'super_admin' AND "action" = 'read' AND "resource" IS NOT DISTINCT FROM 'platform_analytics');

INSERT INTO "Permission" ("id", "module", "action", "resource", "description", "createdAt")
SELECT gen_random_uuid(), 'super_admin', 'update', 'platform_settings', 'Edit platform settings', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "module" = 'super_admin' AND "action" = 'update' AND "resource" IS NOT DISTINCT FROM 'platform_settings');


-- ============================================
-- 2. PLACEHOLDER BUSINESS OWNER
-- ============================================
-- The Role table has a FK to BusinessOwner. We need a placeholder BusinessOwner
-- for system-defined roles. The seed.ts will update these roles later with the
-- actual businessOwnerId.

INSERT INTO "BusinessOwner" ("id", "email", "password", "ownerName", "restaurantName", "status", "createdAt", "updatedAt")
SELECT '00000000-0000-0000-0000-000000000000', 'system@bistrobill.internal', 'SYSTEM_PLACEHOLDER', 'System', 'System', 'active', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "BusinessOwner" WHERE "id" = '00000000-0000-0000-0000-000000000000');


-- ============================================
-- 3. ROLES (6 total, inserted in hierarchy order)
-- ============================================
-- Using a DO block so we can capture generated UUIDs for parent role references.

DO $$
DECLARE
  v_bo_id TEXT := '00000000-0000-0000-0000-000000000000';
  v_super_admin_id TEXT;
  v_business_owner_id TEXT;
  v_branch_manager_id TEXT;
BEGIN
  -- 1. Super Admin (level 1, no parent)
  IF NOT EXISTS (
    SELECT 1 FROM "Role"
    WHERE "name" = 'Super Admin' AND "isSystem" = true AND "businessOwnerId" = v_bo_id
  ) THEN
    INSERT INTO "Role" ("id", "businessOwnerId", "name", "description", "permissions", "isSystem", "parentRoleId", "level", "status", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_bo_id, 'Super Admin', 'Platform-wide administrator with full access to all modules', '{}', true, NULL, 1, 'active', NOW(), NOW())
    RETURNING "id" INTO v_super_admin_id;
  ELSE
    SELECT "id" INTO v_super_admin_id FROM "Role"
    WHERE "name" = 'Super Admin' AND "isSystem" = true AND "businessOwnerId" = v_bo_id;
  END IF;

  -- 2. Business Owner (level 2, parent: Super Admin)
  IF NOT EXISTS (
    SELECT 1 FROM "Role"
    WHERE "name" = 'Business Owner' AND "isSystem" = true AND "businessOwnerId" = v_bo_id
  ) THEN
    INSERT INTO "Role" ("id", "businessOwnerId", "name", "description", "permissions", "isSystem", "parentRoleId", "level", "status", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_bo_id, 'Business Owner', 'Owner of the business with full access within their organization', '{}', true, v_super_admin_id, 2, 'active', NOW(), NOW())
    RETURNING "id" INTO v_business_owner_id;
  ELSE
    SELECT "id" INTO v_business_owner_id FROM "Role"
    WHERE "name" = 'Business Owner' AND "isSystem" = true AND "businessOwnerId" = v_bo_id;
  END IF;

  -- 3. Branch Manager (level 3, parent: Business Owner)
  IF NOT EXISTS (
    SELECT 1 FROM "Role"
    WHERE "name" = 'Branch Manager' AND "isSystem" = true AND "businessOwnerId" = v_bo_id
  ) THEN
    INSERT INTO "Role" ("id", "businessOwnerId", "name", "description", "permissions", "isSystem", "parentRoleId", "level", "status", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_bo_id, 'Branch Manager', 'Manager of a specific branch with full operational access', '{}', true, v_business_owner_id, 3, 'active', NOW(), NOW())
    RETURNING "id" INTO v_branch_manager_id;
  ELSE
    SELECT "id" INTO v_branch_manager_id FROM "Role"
    WHERE "name" = 'Branch Manager' AND "isSystem" = true AND "businessOwnerId" = v_bo_id;
  END IF;

  -- 4. Kitchen Manager (level 4, parent: Branch Manager)
  IF NOT EXISTS (
    SELECT 1 FROM "Role"
    WHERE "name" = 'Kitchen Manager' AND "isSystem" = true AND "businessOwnerId" = v_bo_id
  ) THEN
    INSERT INTO "Role" ("id", "businessOwnerId", "name", "description", "permissions", "isSystem", "parentRoleId", "level", "status", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_bo_id, 'Kitchen Manager', 'Manager of a kitchen area with KDS, inventory, and staff access', '{}', true, v_branch_manager_id, 4, 'active', NOW(), NOW());
  END IF;

  -- 5. Waiter (level 5, parent: Branch Manager)
  IF NOT EXISTS (
    SELECT 1 FROM "Role"
    WHERE "name" = 'Waiter' AND "isSystem" = true AND "businessOwnerId" = v_bo_id
  ) THEN
    INSERT INTO "Role" ("id", "businessOwnerId", "name", "description", "permissions", "isSystem", "parentRoleId", "level", "status", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_bo_id, 'Waiter', 'Front-of-house staff with POS order and table management access', '{}', true, v_branch_manager_id, 5, 'active', NOW(), NOW());
  END IF;

  -- 6. Cashier (level 5, parent: Branch Manager)
  IF NOT EXISTS (
    SELECT 1 FROM "Role"
    WHERE "name" = 'Cashier' AND "isSystem" = true AND "businessOwnerId" = v_bo_id
  ) THEN
    INSERT INTO "Role" ("id", "businessOwnerId", "name", "description", "permissions", "isSystem", "parentRoleId", "level", "status", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), v_bo_id, 'Cashier', 'Payment processing staff with access to payments and invoices', '{}', true, v_branch_manager_id, 5, 'active', NOW(), NOW());
  END IF;
END $$;


-- ============================================
-- 4. ROLE-PERMISSION ASSIGNMENTS
-- ============================================
-- Link roles to permissions using INSERT ... SELECT with JOIN to resolve IDs by name.
-- ON CONFLICT ("roleId", "permissionId") DO NOTHING for idempotency.

-- 4a. Super Admin: ALL permissions (167)
INSERT INTO "RolePermission" ("id", "roleId", "permissionId", "granted")
SELECT gen_random_uuid(), r."id", p."id", true
FROM "Role" r
CROSS JOIN "Permission" p
WHERE r."name" = 'Super Admin'
  AND r."isSystem" = true
  AND r."businessOwnerId" = '00000000-0000-0000-0000-000000000000'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- 4b. Business Owner: ALL permissions EXCEPT super_admin module (159)
INSERT INTO "RolePermission" ("id", "roleId", "permissionId", "granted")
SELECT gen_random_uuid(), r."id", p."id", true
FROM "Role" r
CROSS JOIN "Permission" p
WHERE r."name" = 'Business Owner'
  AND r."isSystem" = true
  AND r."businessOwnerId" = '00000000-0000-0000-0000-000000000000'
  AND p."module" != 'super_admin'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- 4c. Branch Manager: specific module:action combos
INSERT INTO "RolePermission" ("id", "roleId", "permissionId", "granted")
SELECT gen_random_uuid(), r."id", p."id", true
FROM "Role" r
CROSS JOIN "Permission" p
WHERE r."name" = 'Branch Manager'
  AND r."isSystem" = true
  AND r."businessOwnerId" = '00000000-0000-0000-0000-000000000000'
  AND (
    -- catalog: create, read, update, delete, export
    (p."module" = 'catalog' AND p."action" IN ('create', 'read', 'update', 'delete', 'export'))
    -- inventory: create, read, update, delete, export, approve
    OR (p."module" = 'inventory' AND p."action" IN ('create', 'read', 'update', 'delete', 'export', 'approve'))
    -- orders: create, read, update, delete, approve, export
    OR (p."module" = 'orders' AND p."action" IN ('create', 'read', 'update', 'delete', 'approve', 'export'))
    -- pos: create, read, update, delete
    OR (p."module" = 'pos' AND p."action" IN ('create', 'read', 'update', 'delete'))
    -- customers: create, read, update, delete, export
    OR (p."module" = 'customers' AND p."action" IN ('create', 'read', 'update', 'delete', 'export'))
    -- staff: create, read, update, delete
    OR (p."module" = 'staff' AND p."action" IN ('create', 'read', 'update', 'delete'))
    -- kds: read, update
    OR (p."module" = 'kds' AND p."action" IN ('read', 'update'))
    -- purchase_orders: create, read, update, delete, approve, export
    OR (p."module" = 'purchase_orders' AND p."action" IN ('create', 'read', 'update', 'delete', 'approve', 'export'))
    -- payments: create, read, update, export
    OR (p."module" = 'payments' AND p."action" IN ('create', 'read', 'update', 'export'))
    -- taxes: read
    OR (p."module" = 'taxes' AND p."action" IN ('read'))
    -- marketing: create, read, update, delete, export
    OR (p."module" = 'marketing' AND p."action" IN ('create', 'read', 'update', 'delete', 'export'))
    -- reports: read, export
    OR (p."module" = 'reports' AND p."action" IN ('read', 'export'))
    -- settings: read, update
    OR (p."module" = 'settings' AND p."action" IN ('read', 'update'))
    -- resources: create, read, update, delete
    OR (p."module" = 'resources' AND p."action" IN ('create', 'read', 'update', 'delete'))
    -- reservations: create, read, update, delete
    OR (p."module" = 'reservations' AND p."action" IN ('create', 'read', 'update', 'delete'))
    -- dashboard: read
    OR (p."module" = 'dashboard' AND p."action" IN ('read'))
    -- online_orders: read, update
    OR (p."module" = 'online_orders' AND p."action" IN ('read', 'update'))
  )
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- 4d. Kitchen Manager: kds:read, kds:update, inventory:create, inventory:read, inventory:update,
--     staff:read, orders:read, orders:update, catalog:read, dashboard:read
INSERT INTO "RolePermission" ("id", "roleId", "permissionId", "granted")
SELECT gen_random_uuid(), r."id", p."id", true
FROM "Role" r
CROSS JOIN "Permission" p
WHERE r."name" = 'Kitchen Manager'
  AND r."isSystem" = true
  AND r."businessOwnerId" = '00000000-0000-0000-0000-000000000000'
  AND (
    (p."module" = 'kds' AND p."action" IN ('read', 'update'))
    OR (p."module" = 'inventory' AND p."action" IN ('create', 'read', 'update'))
    OR (p."module" = 'staff' AND p."action" IN ('read'))
    OR (p."module" = 'orders' AND p."action" IN ('read', 'update'))
    OR (p."module" = 'catalog' AND p."action" IN ('read'))
    OR (p."module" = 'dashboard' AND p."action" IN ('read'))
  )
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- 4e. Waiter: pos:create, pos:read, pos:update, orders:create, orders:read, orders:update,
--     customers:create, customers:read, reservations:create, reservations:read, reservations:update,
--     resources:read, catalog:read, kds:read
INSERT INTO "RolePermission" ("id", "roleId", "permissionId", "granted")
SELECT gen_random_uuid(), r."id", p."id", true
FROM "Role" r
CROSS JOIN "Permission" p
WHERE r."name" = 'Waiter'
  AND r."isSystem" = true
  AND r."businessOwnerId" = '00000000-0000-0000-0000-000000000000'
  AND (
    (p."module" = 'pos' AND p."action" IN ('create', 'read', 'update'))
    OR (p."module" = 'orders' AND p."action" IN ('create', 'read', 'update'))
    OR (p."module" = 'customers' AND p."action" IN ('create', 'read'))
    OR (p."module" = 'reservations' AND p."action" IN ('create', 'read', 'update'))
    OR (p."module" = 'resources' AND p."action" IN ('read'))
    OR (p."module" = 'catalog' AND p."action" IN ('read'))
    OR (p."module" = 'kds' AND p."action" IN ('read'))
  )
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- 4f. Cashier: payments:create, payments:read, payments:update, orders:read,
--     pos:read, customers:read, reports:read, dashboard:read
INSERT INTO "RolePermission" ("id", "roleId", "permissionId", "granted")
SELECT gen_random_uuid(), r."id", p."id", true
FROM "Role" r
CROSS JOIN "Permission" p
WHERE r."name" = 'Cashier'
  AND r."isSystem" = true
  AND r."businessOwnerId" = '00000000-0000-0000-0000-000000000000'
  AND (
    (p."module" = 'payments' AND p."action" IN ('create', 'read', 'update'))
    OR (p."module" = 'orders' AND p."action" IN ('read'))
    OR (p."module" = 'pos' AND p."action" IN ('read'))
    OR (p."module" = 'customers' AND p."action" IN ('read'))
    OR (p."module" = 'reports' AND p."action" IN ('read'))
    OR (p."module" = 'dashboard' AND p."action" IN ('read'))
  )
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
