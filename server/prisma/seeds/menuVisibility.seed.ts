import { PrismaClient } from '@prisma/client';

interface MenuDefault {
  menuKey: string;
  name: string;
  SuperAdmin: boolean;
  BusinessOwner: boolean;
  Staff: boolean;
}

const MENU_DEFAULTS: MenuDefault[] = [
  // Business Owner / Staff menus
  { menuKey: 'bo_dashboard',      name: 'BO Dashboard',        SuperAdmin: false, BusinessOwner: true,  Staff: true  },
  { menuKey: 'pos',               name: 'Point of Sale',       SuperAdmin: false, BusinessOwner: true,  Staff: true  },
  { menuKey: 'kds',               name: 'Kitchen Display',     SuperAdmin: false, BusinessOwner: true,  Staff: true  },
  { menuKey: 'all_orders',        name: 'All Orders',          SuperAdmin: false, BusinessOwner: true,  Staff: true  },
  { menuKey: 'reservations',      name: 'Reservations',        SuperAdmin: false, BusinessOwner: true,  Staff: true  },
  { menuKey: 'catalog',           name: 'Catalog',             SuperAdmin: false, BusinessOwner: true,  Staff: true  },
  { menuKey: 'inventory',         name: 'Inventory',           SuperAdmin: false, BusinessOwner: true,  Staff: true  },
  { menuKey: 'purchase_order',    name: 'Purchase Order',      SuperAdmin: false, BusinessOwner: true,  Staff: true  },
  { menuKey: 'payments',          name: 'Payments',            SuperAdmin: false, BusinessOwner: true,  Staff: false },
  { menuKey: 'customers',         name: 'Customers',           SuperAdmin: false, BusinessOwner: true,  Staff: true  },
  { menuKey: 'loyalty_program',   name: 'Loyalty Program',     SuperAdmin: false, BusinessOwner: true,  Staff: true  },
  { menuKey: 'marketing',         name: 'Marketing',           SuperAdmin: false, BusinessOwner: true,  Staff: true  },
  { menuKey: 'reviews',           name: 'Reviews',             SuperAdmin: false, BusinessOwner: true,  Staff: false },
  { menuKey: 'analytics_reports', name: 'Analytics & Reports', SuperAdmin: true,  BusinessOwner: true,  Staff: true  },
  { menuKey: 'manage_resources',  name: 'Manage Resources',    SuperAdmin: false, BusinessOwner: true,  Staff: true  },
  { menuKey: 'business_settings', name: 'Business Settings',   SuperAdmin: false, BusinessOwner: true,  Staff: false },

  // SuperAdmin menus
  { menuKey: 'sa_dashboard',      name: 'SA Dashboard',        SuperAdmin: true,  BusinessOwner: false, Staff: false },
  { menuKey: 'business_owners',   name: 'Business Owners',     SuperAdmin: true,  BusinessOwner: false, Staff: false },
  { menuKey: 'subscription_plans',name: 'Subscription Plans',  SuperAdmin: true,  BusinessOwner: false, Staff: false },
  { menuKey: 'sa_orders',         name: 'Orders (SA)',         SuperAdmin: true,  BusinessOwner: false, Staff: false },
  { menuKey: 'contact_requests',  name: 'Contact Requests',    SuperAdmin: true,  BusinessOwner: false, Staff: false },
  { menuKey: 'staff_management',  name: 'Staff Mgmt (SA)',     SuperAdmin: true,  BusinessOwner: false, Staff: false },
  { menuKey: 'blog_management',   name: 'Blog Management',     SuperAdmin: true,  BusinessOwner: false, Staff: false },
  { menuKey: 'master_data',       name: 'Master Data',         SuperAdmin: true,  BusinessOwner: false, Staff: false },
  { menuKey: 'sa_settings',       name: 'Settings (SA)',       SuperAdmin: true,  BusinessOwner: false, Staff: false },
  { menuKey: 'website',           name: 'Website',             SuperAdmin: true,  BusinessOwner: false, Staff: false },
];

const USER_TYPES = ['SuperAdmin', 'BusinessOwner', 'Staff'] as const;

export async function seedMenuVisibility(prisma: PrismaClient): Promise<number> {
  console.log('Creating Menu Visibility config...');

  const rows: { userType: string; menuKey: string; isVisible: boolean }[] = [];

  for (const menu of MENU_DEFAULTS) {
    for (const userType of USER_TYPES) {
      rows.push({
        userType,
        menuKey: menu.menuKey,
        isVisible: menu[userType],
      });
    }
  }

  // Upsert each row (idempotent)
  for (const row of rows) {
    await prisma.menuVisibility.upsert({
      where: {
        userType_menuKey: {
          userType: row.userType,
          menuKey: row.menuKey,
        },
      },
      update: {},  // Don't overwrite existing config
      create: row,
    });
  }

  // Force-update sa_orders visibility for SuperAdmin (was previously false)
  await prisma.menuVisibility.upsert({
    where: {
      userType_menuKey: { userType: 'SuperAdmin', menuKey: 'sa_orders' },
    },
    update: { isVisible: true },
    create: { userType: 'SuperAdmin', menuKey: 'sa_orders', isVisible: true },
  });

  // Force-update analytics_reports visibility for SuperAdmin (was previously false)
  await prisma.menuVisibility.upsert({
    where: {
      userType_menuKey: { userType: 'SuperAdmin', menuKey: 'analytics_reports' },
    },
    update: { isVisible: true },
    create: { userType: 'SuperAdmin', menuKey: 'analytics_reports', isVisible: true },
  });

  console.log(`✓ Menu Visibility config created: ${rows.length} rows\n`);
  return rows.length;
}
