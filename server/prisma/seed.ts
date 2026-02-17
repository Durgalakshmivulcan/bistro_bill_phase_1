import { PrismaClient, ProductType, CustomerType, DiscountType, DiscountValueType, FloorType, TableShape, TableStatus, OrderType, OrderSource, PaymentStatus, OrderStatus, OrderItemStatus, PaymentType, PurchaseOrderStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { seedPermissions } from './seeds/permissions.seed';
import { seedRoles } from './seeds/roles.seed';
import { seedMenuVisibility } from './seeds/menuVisibility.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // ============================================
  // 0. CLEANUP - Delete existing seed data for idempotent re-seeding
  // ============================================
  console.log('Cleaning up existing data...');

  // Delete in reverse dependency order (children first, parents last)
  await prisma.menuVisibility.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.userRoleAssignment.deleteMany({});
  await prisma.permissionAuditLog.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.businessHours.deleteMany({});
  await prisma.businessPreference.deleteMany({});
  await prisma.allergen.deleteMany({});
  await prisma.orderItemAddon.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.orderKOT.deleteMany({});
  await prisma.orderPayment.deleteMany({});
  await prisma.orderTimeline.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.purchaseOrderItem.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  await prisma.inventoryProduct.deleteMany({});
  await prisma.supplierContact.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.table.deleteMany({});
  await prisma.floor.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.kitchen.deleteMany({});
  await prisma.discountProduct.deleteMany({});
  await prisma.discountCategory.deleteMany({});
  await prisma.discount.deleteMany({});
  await prisma.paymentOption.deleteMany({});
  await prisma.taxGroupItem.deleteMany({});
  await prisma.taxGroup.deleteMany({});
  await prisma.tax.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.customerGroup.deleteMany({});
  await prisma.productAddon.deleteMany({});
  await prisma.productAllergen.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.productKitchen.deleteMany({});
  await prisma.productNutrition.deleteMany({});
  await prisma.productPrice.deleteMany({});
  await prisma.productTag.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.menu.deleteMany({});
  await prisma.brand.deleteMany({});
  await prisma.subCategory.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.staff.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.reservation.deleteMany({});
  await prisma.onlineOrder.deleteMany({});
  await prisma.branch.deleteMany({});
  await prisma.businessOwner.deleteMany({});
  await prisma.subscriptionPlan.deleteMany({});
  await prisma.superAdmin.deleteMany({});

  console.log('✓ Existing data cleaned up\n');

  // ============================================
  // 1. SUPER ADMIN
  // ============================================
  console.log('Creating SuperAdmin...');
  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  const superAdmin = await prisma.superAdmin.upsert({
    where: { email: 'admin@bistrobill.com' },
    update: {},
    create: {
      email: 'admin@bistrobill.com',
      password: hashedPassword,
      name: 'Super Admin',
    },
  });
  console.log(`✓ SuperAdmin created: ${superAdmin.email}\n`);

  // ============================================
  // 2. SUBSCRIPTION PLANS
  // ============================================
  console.log('Creating Subscription Plans...');

  const freePlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Free',
      price: 0,
      duration: 36500, // Lifetime (~100 years in days)
      trialDays: 0,
      features: ['Basic POS', 'Single Branch', 'Basic Reports'],
      maxBranches: 1,
      status: 'active',
    },
  });

  const goldPlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Gold',
      price: 3639,
      duration: 365, // 1 Year
      trialDays: 35,
      features: ['Full POS', 'Up to 3 Branches', 'Advanced Reports', 'Inventory Management', 'Customer Management'],
      maxBranches: 3,
      status: 'active',
    },
  });

  const platinumPlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Platinum',
      price: 9412,
      duration: 365, // 1 Year
      trialDays: 49,
      features: ['Full POS', 'Unlimited Branches', 'Premium Reports', 'Inventory Management', 'Customer Management', 'Marketing Tools', 'API Access', 'Priority Support'],
      maxBranches: 99,
      status: 'inactive',
    },
  });
  console.log('✓ Subscription Plans created: Free, Gold, Platinum\n');

  // ============================================
  // 3. BUSINESS OWNERS
  // ============================================
  console.log('Creating Business Owners...');
  const ownerPassword = await bcrypt.hash('Owner@123', 10);

  // Main business owner (Spice Paradise) - we'll use this for most seed data
  const spiceParadise = await prisma.businessOwner.create({
    data: {
      email: 'priyagupta@gmail.com',
      password: ownerPassword,
      ownerName: 'Priya Gupta',
      restaurantName: 'Spice Paradise',
      phone: '+91 912345678',
      businessType: 'Casual Dining',
      country: 'India',
      state: 'Telangana',
      city: 'Hyderabad',
      zipCode: '500081',
      address: '123 Main Road, Hitech City',
      planId: freePlan.id,
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      status: 'active',
    },
  });

  const _masalaMagic = await prisma.businessOwner.create({
    data: {
      email: 'amitvarma@gmail.com',
      password: ownerPassword,
      ownerName: 'Amit Varma',
      restaurantName: 'Masala Magic',
      phone: '+91 912345679',
      businessType: 'Fine Dining',
      country: 'India',
      state: 'Maharashtra',
      city: 'Mumbai',
      planId: goldPlan.id,
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      status: 'inactive',
    },
  });

  const _curryHouse = await prisma.businessOwner.create({
    data: {
      email: 'neha@gmail.com',
      password: ownerPassword,
      ownerName: 'Neha Joshi',
      restaurantName: 'Curry House',
      phone: '+91 912345680',
      businessType: 'Fine Dining',
      country: 'India',
      state: 'Karnataka',
      city: 'Bangalore',
      planId: platinumPlan.id,
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      status: 'active',
    },
  });
  console.log('✓ Business Owners created: Spice Paradise, Masala Magic, Curry House\n');

  // ============================================
  // 4. BRANCHES (for Spice Paradise)
  // ============================================
  console.log('Creating Branches...');

  const mainBranch = await prisma.branch.create({
    data: {
      businessOwnerId: spiceParadise.id,
      name: 'Hitech City',
      code: 'HTC',
      phone: '+91 912345678',
      email: 'hitechcity@spiceparadise.com',
      address: '123 Main Road, Hitech City',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      zipCode: '500081',
      isMainBranch: true,
      status: 'active',
    },
  });

  const uppalBranch = await prisma.branch.create({
    data: {
      businessOwnerId: spiceParadise.id,
      name: 'Uppal',
      code: 'UPL',
      phone: '+91 912345699',
      email: 'uppal@spiceparadise.com',
      address: '456 Uppal Main Road',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      zipCode: '500039',
      isMainBranch: false,
      status: 'active',
    },
  });
  console.log('✓ Branches created: Hitech City, Uppal\n');

  // ============================================
  // 5. ROLES
  // ============================================
  console.log('Creating Roles...');

  const managerRole = await prisma.role.create({
    data: {
      businessOwnerId: spiceParadise.id,
      name: 'Manager',
      permissions: {
        pos: { create: true, view: true, edit: true, delete: true },
        inventory: { create: true, view: true, edit: true, delete: true },
        staff: { create: true, view: true, edit: true, delete: true },
        reports: { view: true },
        settings: { view: true, edit: true },
      },
      status: 'inactive',
    },
  });

  const staffRole = await prisma.role.create({
    data: {
      businessOwnerId: spiceParadise.id,
      name: 'Staff',
      permissions: {
        pos: { create: true, view: true, edit: false, delete: false },
        inventory: { view: true },
        reports: { view: false },
      },
      status: 'active',
    },
  });

  const accountantRole = await prisma.role.create({
    data: {
      businessOwnerId: spiceParadise.id,
      name: 'Accountant',
      permissions: {
        pos: { view: true },
        inventory: { view: true },
        reports: { view: true },
        settings: { view: true },
      },
      status: 'inactive',
    },
  });

  const _analystRole = await prisma.role.create({
    data: {
      businessOwnerId: spiceParadise.id,
      name: 'Business Analyst',
      permissions: {
        reports: { view: true },
        pos: { view: true },
      },
      status: 'active',
    },
  });

  const _supportRole = await prisma.role.create({
    data: {
      businessOwnerId: spiceParadise.id,
      name: 'Support',
      permissions: {
        pos: { view: true },
      },
      status: 'inactive',
    },
  });

  const _salesRole = await prisma.role.create({
    data: {
      businessOwnerId: spiceParadise.id,
      name: 'Sales Executives',
      permissions: {
        pos: { create: true, view: true },
        customers: { create: true, view: true },
      },
      status: 'active',
    },
  });
  console.log('✓ Roles created: Manager, Staff, Accountant, Business Analyst, Support, Sales Executives\n');

  // ============================================
  // 6. STAFF
  // ============================================
  console.log('Creating Staff...');
  const staffPassword = await bcrypt.hash('Staff@123', 10);

  const rahul = await prisma.staff.create({
    data: {
      businessOwnerId: spiceParadise.id,
      branchId: mainBranch.id,
      roleId: managerRole.id,
      firstName: 'Rahul',
      lastName: 'Sharma',
      email: 'rahul.sharma@example.com',
      password: staffPassword,
      phone: '+91 9876543210',
      avatar: '/images/staff1.jpg',
      status: 'active',
    },
  });

  const _priya = await prisma.staff.create({
    data: {
      businessOwnerId: spiceParadise.id,
      branchId: mainBranch.id,
      roleId: staffRole.id,
      firstName: 'Priya',
      lastName: 'Verma',
      email: 'priya.verma@example.com',
      password: staffPassword,
      phone: '+91 9123456789',
      avatar: '/images/staff2.jpg',
      status: 'active',
    },
  });

  const _amit = await prisma.staff.create({
    data: {
      businessOwnerId: spiceParadise.id,
      branchId: mainBranch.id,
      roleId: accountantRole.id,
      firstName: 'Amit',
      lastName: 'Kumar',
      email: 'amit.kumar@example.com',
      password: staffPassword,
      phone: '+91 9988776655',
      avatar: '/images/staff3.jpg',
      status: 'inactive',
    },
  });

  const _neha = await prisma.staff.create({
    data: {
      businessOwnerId: spiceParadise.id,
      branchId: uppalBranch.id,
      roleId: staffRole.id,
      firstName: 'Neha',
      lastName: 'Singh',
      email: 'neha.singh@example.com',
      password: staffPassword,
      phone: '+91 9090909090',
      avatar: '/images/staff4.jpg',
      status: 'active',
    },
  });
  console.log('✓ Staff created: Rahul Sharma, Priya Verma, Amit Kumar, Neha Singh\n');

  // ============================================
  // 7. CATEGORIES
  // ============================================
  console.log('Creating Categories...');

  const _appetizersCategory = await prisma.category.create({
    data: {
      businessOwnerId: spiceParadise.id,
      name: 'Appetizers',
      image: '/images/categories/appetizers.jpg',
      description: 'Tasty starters to kick off your hunger.',
      status: 'active',
      sortOrder: 1,
    },
  });

  const mainCoursesCategory = await prisma.category.create({
    data: {
      businessOwnerId: spiceParadise.id,
      name: 'Main Courses',
      image: '/images/categories/main-course.jpg',
      description: 'Hearty dishes that satisfy your hunger.',
      status: 'active',
      sortOrder: 2,
    },
  });

  const thalisCategory = await prisma.category.create({
    data: {
      businessOwnerId: spiceParadise.id,
      name: 'Thalis',
      image: '/images/categories/thali.jpg',
      description: 'Platter of diverse flavors in one meal.',
      status: 'active',
      sortOrder: 3,
    },
  });

  const riceDishesCategory = await prisma.category.create({
    data: {
      businessOwnerId: spiceParadise.id,
      name: 'Rice Dishes',
      image: '/images/categories/rice.jpg',
      description: 'Flavorful rice preparations for all tastes.',
      status: 'active',
      sortOrder: 4,
    },
  });

  const _curriesCategory = await prisma.category.create({
    data: {
      businessOwnerId: spiceParadise.id,
      name: 'Curries',
      image: '/images/categories/curry.jpg',
      description: 'Rich and aromatic curries for spice lovers.',
      status: 'inactive',
      sortOrder: 5,
    },
  });

  const combosCategory = await prisma.category.create({
    data: {
      businessOwnerId: spiceParadise.id,
      name: 'Combos',
      image: '/images/categories/combo.jpg',
      description: 'Value meals combining dishes and drinks.',
      status: 'active',
      sortOrder: 6,
    },
  });

  const breakfastCategory = await prisma.category.create({
    data: {
      businessOwnerId: spiceParadise.id,
      name: 'Breakfast',
      image: '/images/categories/breakfast.jpg',
      description: 'Start your day with our delicious breakfast options.',
      status: 'active',
      sortOrder: 7,
    },
  });

  const snacksCategory = await prisma.category.create({
    data: {
      businessOwnerId: spiceParadise.id,
      name: 'Snacks',
      image: '/images/categories/snacks.jpg',
      description: 'Light bites for any time of the day.',
      status: 'active',
      sortOrder: 8,
    },
  });
  console.log('✓ Categories created\n');

  // ============================================
  // 8. BRANDS
  // ============================================
  console.log('Creating Brands...');

  await prisma.brand.createMany({
    data: [
      {
        businessOwnerId: spiceParadise.id,
        name: 'Coca-Cola',
        image: 'https://images.unsplash.com/photo-1600180758890-6b94519a8ba6',
        description: 'Classic carbonated soft drink known for its refreshing taste.',
        status: 'active',
      },
      {
        businessOwnerId: spiceParadise.id,
        name: 'Pepsi',
        image: 'https://images.unsplash.com/photo-1585238342028-4f3c9c2c6fa1',
        description: 'Sweet cola beverage with a slightly citrus flavor.',
        status: 'active',
      },
      {
        businessOwnerId: spiceParadise.id,
        name: 'Sprite',
        image: 'https://images.unsplash.com/photo-1623945275525-02bcd3e8e2b1',
        description: 'Lemon-lime flavored soda that is crisp and refreshing.',
        status: 'active',
      },
      {
        businessOwnerId: spiceParadise.id,
        name: 'Tropicana',
        image: 'https://images.unsplash.com/photo-1613478223719-2ab802c9c55a',
        description: 'Premium fruit juices made from fresh, quality fruits.',
        status: 'inactive',
      },
      {
        businessOwnerId: spiceParadise.id,
        name: 'Real Fruit Juice',
        image: 'https://images.unsplash.com/photo-1571689936042-03e3b4dfb3f3',
        description: 'A range of 100% fruit juices without artificial flavors.',
        status: 'active',
      },
      {
        businessOwnerId: spiceParadise.id,
        name: 'Nescafe',
        image: 'https://images.unsplash.com/photo-1587738347119-05c0dfc16ef6',
        description: 'Instant coffee brand offering rich and aromatic coffee.',
        status: 'inactive',
      },
      {
        businessOwnerId: spiceParadise.id,
        name: 'Tata Tea',
        image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348',
        description: 'Popular tea brand known for premium quality and rich flavors.',
        status: 'active',
      },
    ],
  });
  console.log('✓ Brands created\n');

  // ============================================
  // 9. MENUS
  // ============================================
  console.log('Creating Menus...');

  const dineInMenu = await prisma.menu.create({
    data: {
      businessOwnerId: spiceParadise.id,
      name: 'Dine-In',
      description: 'Full menu available for dine-in customers',
      status: 'active',
    },
  });

  await prisma.menu.createMany({
    data: [
      {
        businessOwnerId: spiceParadise.id,
        name: 'Delivery',
        description: 'Menu items available for delivery',
        status: 'active',
      },
      {
        businessOwnerId: spiceParadise.id,
        name: 'TakeAway',
        description: 'Menu items available for takeaway',
        status: 'active',
      },
    ],
  });
  console.log('✓ Menus created\n');

  // ============================================
  // 10. TAGS
  // ============================================
  console.log('Creating Tags...');

  await prisma.tag.createMany({
    data: [
      { businessOwnerId: spiceParadise.id, name: 'Spicy', color: '#FF5733', status: 'active' },
      { businessOwnerId: spiceParadise.id, name: 'Vegan', color: '#27AE60', status: 'active' },
      { businessOwnerId: spiceParadise.id, name: 'Bestseller', color: '#F1C40F', status: 'active' },
      { businessOwnerId: spiceParadise.id, name: 'New', color: '#3498DB', status: 'active' },
      { businessOwnerId: spiceParadise.id, name: 'Gluten-Free', color: '#9B59B6', status: 'active' },
    ],
  });
  console.log('✓ Tags created\n');

  // ============================================
  // 11. PRODUCTS
  // ============================================
  console.log('Creating Products...');

  const idly = await prisma.product.create({
    data: {
      businessOwnerId: spiceParadise.id,
      name: 'Idly with Sambar',
      sku: 'PRD-001',
      type: ProductType.Regular,
      categoryId: breakfastCategory.id,
      menuId: dineInMenu.id,
      description: 'Soft steamed rice cakes served with sambar and chutney',
      shortCode: 'IDLY',
      preparationTime: 15,
      servesCount: 1,
      isVeg: true,
      status: 'active',
      images: {
        create: {
          url: '/images/products/Idli-Sambar.jpg',
          isPrimary: true,
          sortOrder: 1,
        },
      },
      prices: {
        create: {
          channelType: 'DineIn',
          basePrice: 60,
        },
      },
    },
  });

  const paneerCurry = await prisma.product.create({
    data: {
      businessOwnerId: spiceParadise.id,
      name: 'Paneer Curry Combo',
      sku: 'PRD-002',
      type: ProductType.Regular,
      categoryId: mainCoursesCategory.id,
      menuId: dineInMenu.id,
      description: 'Creamy paneer curry served with rice and roti',
      shortCode: 'PNRCRY',
      preparationTime: 20,
      servesCount: 1,
      isVeg: true,
      status: 'active',
      images: {
        create: {
          url: '/images/products/paneer-curry.jpg',
          isPrimary: true,
          sortOrder: 1,
        },
      },
      prices: {
        create: {
          channelType: 'DineIn',
          basePrice: 80,
        },
      },
    },
  });

  const vegFriedRice = await prisma.product.create({
    data: {
      businessOwnerId: spiceParadise.id,
      name: 'Veg Fried Rice',
      sku: 'PRD-003',
      type: ProductType.Regular,
      categoryId: riceDishesCategory.id,
      menuId: dineInMenu.id,
      description: 'Stir-fried rice with fresh vegetables',
      shortCode: 'VFRRC',
      preparationTime: 15,
      servesCount: 1,
      isVeg: true,
      status: 'active',
      images: {
        create: {
          url: '/images/products/veg-fried-rice.jpg',
          isPrimary: true,
          sortOrder: 1,
        },
      },
      prices: {
        create: {
          channelType: 'DineIn',
          basePrice: 40,
        },
      },
    },
  });

  const andhraThali = await prisma.product.create({
    data: {
      businessOwnerId: spiceParadise.id,
      name: 'Andhra Thali (Veg)',
      sku: 'PRD-004',
      type: ProductType.Combo,
      categoryId: thalisCategory.id,
      menuId: dineInMenu.id,
      description: 'Traditional Andhra thali with multiple curries, rice, and sweets',
      shortCode: 'ANDTHL',
      preparationTime: 25,
      servesCount: 1,
      isVeg: true,
      status: 'active',
      images: {
        create: {
          url: '/images/products/Mini-Thali.webp',
          isPrimary: true,
          sortOrder: 1,
        },
      },
      prices: {
        create: {
          channelType: 'DineIn',
          basePrice: 120,
        },
      },
    },
  });

  const grilledSandwich = await prisma.product.create({
    data: {
      businessOwnerId: spiceParadise.id,
      name: 'Veg Grilled Sandwich',
      sku: 'PRD-005',
      type: ProductType.Regular,
      categoryId: snacksCategory.id,
      menuId: dineInMenu.id,
      description: 'Grilled sandwich with fresh vegetables and cheese',
      shortCode: 'VGSND',
      preparationTime: 10,
      servesCount: 1,
      isVeg: true,
      status: 'active',
      images: {
        create: {
          url: '/images/products/veg-grilled-sandwich.jpg',
          isPrimary: true,
          sortOrder: 1,
        },
      },
      prices: {
        create: {
          channelType: 'DineIn',
          basePrice: 80,
        },
      },
    },
  });

  const curdRice = await prisma.product.create({
    data: {
      businessOwnerId: spiceParadise.id,
      name: 'Curd Rice',
      sku: 'PRD-006',
      type: ProductType.Regular,
      categoryId: riceDishesCategory.id,
      menuId: dineInMenu.id,
      description: 'South Indian style curd rice with tempering',
      shortCode: 'CRDRC',
      preparationTime: 10,
      servesCount: 1,
      isVeg: true,
      status: 'active',
      images: {
        create: {
          url: '/images/products/South-indian-curd-rice.jpg',
          isPrimary: true,
          sortOrder: 1,
        },
      },
      prices: {
        create: {
          channelType: 'DineIn',
          basePrice: 130,
        },
      },
    },
  });
  console.log('✓ Products created\n');

  // ============================================
  // 12. CUSTOMER GROUPS
  // ============================================
  console.log('Creating Customer Groups...');

  const vipGroup = await prisma.customerGroup.create({
    data: {
      businessOwnerId: spiceParadise.id,
      name: 'VIP',
      status: 'active',
    },
  });

  const corporateGroup = await prisma.customerGroup.create({
    data: {
      businessOwnerId: spiceParadise.id,
      name: 'Corporate Clients',
      status: 'inactive',
    },
  });

  const regularGroup = await prisma.customerGroup.create({
    data: {
      businessOwnerId: spiceParadise.id,
      name: 'Regular',
      status: 'active',
    },
  });

  await prisma.customerGroup.createMany({
    data: [
      { businessOwnerId: spiceParadise.id, name: 'Family', status: 'active' },
      { businessOwnerId: spiceParadise.id, name: 'Staff', status: 'active' },
    ],
  });
  console.log('✓ Customer Groups created\n');

  // ============================================
  // 13. CUSTOMERS
  // ============================================
  console.log('Creating Customers...');

  const elizabeth = await prisma.customer.create({
    data: {
      businessOwnerId: spiceParadise.id,
      name: 'Elizabeth Brink',
      phone: '+91 7243657890',
      email: 'elizabeth@gmail.com',
      gender: 'Female',
      dob: new Date('2000-02-09'),
      type: CustomerType.Regular,
      totalSpent: 1250,
      customerGroupId: regularGroup.id,
    },
  });

  const mark = await prisma.customer.create({
    data: {
      businessOwnerId: spiceParadise.id,
      name: 'Mark Taylor',
      phone: '+91 9564123574',
      email: 'mark@gmail.com',
      gender: 'Male',
      dob: new Date('2001-03-06'),
      type: CustomerType.Corporate,
      totalSpent: 1450,
      customerGroupId: corporateGroup.id,
    },
  });

  const jessica = await prisma.customer.create({
    data: {
      businessOwnerId: spiceParadise.id,
      name: 'Jessica John',
      phone: '+91 7894561230',
      email: 'jessica@gmail.com',
      gender: 'Female',
      dob: new Date('2000-07-08'),
      type: CustomerType.VIP,
      totalSpent: 1850,
      customerGroupId: vipGroup.id,
    },
  });
  console.log('✓ Customers created\n');

  // ============================================
  // 14. TAXES
  // ============================================
  console.log('Creating Taxes...');

  const cgst = await prisma.tax.create({
    data: {
      businessOwnerId: spiceParadise.id,
      name: 'CGST (Central Goods and Services Tax)',
      symbol: 'CGST',
      percentage: 9,
      country: 'India',
      status: 'active',
    },
  });

  const sgst = await prisma.tax.create({
    data: {
      businessOwnerId: spiceParadise.id,
      name: 'SGST (State Goods and Services Tax)',
      symbol: 'SGST',
      percentage: 9,
      country: 'India',
      state: 'Telangana',
      status: 'active',
    },
  });

  const igst = await prisma.tax.create({
    data: {
      businessOwnerId: spiceParadise.id,
      name: 'IGST (Integrated Goods and Services Tax)',
      symbol: 'IGST',
      percentage: 18,
      country: 'India',
      status: 'active',
    },
  });

  // Create Tax Group
  const gstGroup = await prisma.taxGroup.create({
    data: {
      businessOwnerId: spiceParadise.id,
      name: 'GST 18%',
      status: 'active',
      taxGroupItems: {
        create: [
          { taxId: cgst.id },
          { taxId: sgst.id },
        ],
      },
    },
  });
  console.log('✓ Taxes and Tax Groups created\n');

  // ============================================
  // 15. PAYMENT OPTIONS
  // ============================================
  console.log('Creating Payment Options...');

  const cashPayment = await prisma.paymentOption.create({
    data: {
      businessOwnerId: spiceParadise.id,
      name: 'Cash',
      type: PaymentType.Cash,
      isDefault: true,
      status: 'active',
    },
  });

  await prisma.paymentOption.createMany({
    data: [
      { businessOwnerId: spiceParadise.id, name: 'Credit Card', type: PaymentType.Card, status: 'active' },
      { businessOwnerId: spiceParadise.id, name: 'Debit Card', type: PaymentType.Card, status: 'active' },
      { businessOwnerId: spiceParadise.id, name: 'UPI', type: PaymentType.UPI, status: 'active' },
      { businessOwnerId: spiceParadise.id, name: 'PhonePe', type: PaymentType.Wallet, status: 'active' },
      { businessOwnerId: spiceParadise.id, name: 'Paytm', type: PaymentType.Wallet, status: 'active' },
    ],
  });
  console.log('✓ Payment Options created\n');

  // ============================================
  // 16. DISCOUNTS
  // ============================================
  console.log('Creating Discounts...');

  const welcome100 = await prisma.discount.create({
    data: {
      businessOwnerId: spiceParadise.id,
      code: 'WELCOME100',
      name: 'First Order',
      type: DiscountType.OrderType,
      valueType: DiscountValueType.Fixed,
      value: 100,
      startDate: new Date('2025-03-08'),
      endDate: new Date('2025-04-08'),
      usageLimit: 1000,
      usedCount: 0,
      status: 'active',
    },
  });

  await prisma.discount.createMany({
    data: [
      {
        businessOwnerId: spiceParadise.id,
        code: 'PIZZA50',
        name: 'Happy Hour Special',
        type: DiscountType.ProductCategory,
        valueType: DiscountValueType.Fixed,
        value: 50,
        startDate: new Date('2025-02-09'),
        endDate: new Date('2025-02-28'),
        status: 'inactive',
      },
      {
        businessOwnerId: spiceParadise.id,
        code: 'GRAB75',
        name: 'Exclusive Offer',
        type: DiscountType.Custom,
        valueType: DiscountValueType.Percentage,
        value: 75,
        maxDiscount: 200,
        startDate: new Date('2025-02-09'),
        endDate: new Date('2025-02-28'),
        status: 'active',
      },
      {
        businessOwnerId: spiceParadise.id,
        code: 'PARTY500',
        name: 'Family Feast Deal',
        type: DiscountType.OrderType,
        valueType: DiscountValueType.Fixed,
        value: 500,
        minOrderAmount: 2000,
        startDate: new Date('2025-07-23'),
        endDate: new Date('2025-08-08'),
        status: 'active',
      },
      {
        businessOwnerId: spiceParadise.id,
        code: 'BOGO2025',
        name: 'Weekend Brunch',
        type: DiscountType.OrderType,
        valueType: DiscountValueType.BOGO,
        value: 0,
        startDate: new Date('2025-02-09'),
        endDate: new Date('2025-02-28'),
        status: 'active',
      },
      {
        businessOwnerId: spiceParadise.id,
        code: 'HH50',
        name: 'Happy Hours',
        type: DiscountType.OrderType,
        valueType: DiscountValueType.Percentage,
        value: 50,
        maxDiscount: 100,
        startDate: new Date('2025-03-08'),
        endDate: new Date('2025-04-08'),
        status: 'active',
      },
      {
        businessOwnerId: spiceParadise.id,
        code: 'HOLIDAY25',
        name: 'Holiday Special',
        type: DiscountType.ProductCategory,
        valueType: DiscountValueType.Fixed,
        value: 25,
        startDate: new Date('2025-02-09'),
        endDate: new Date('2025-02-28'),
        status: 'active',
      },
      {
        businessOwnerId: spiceParadise.id,
        code: 'FEST35',
        name: 'Festival Offers',
        type: DiscountType.OrderType,
        valueType: DiscountValueType.Percentage,
        value: 35,
        maxDiscount: 150,
        startDate: new Date('2025-03-08'),
        endDate: new Date('2025-04-08'),
        status: 'active',
      },
      {
        businessOwnerId: spiceParadise.id,
        code: 'MIDNIGHT15',
        name: 'Mid-Night Cravings',
        type: DiscountType.ProductCategory,
        valueType: DiscountValueType.Percentage,
        value: 15,
        startDate: new Date('2025-02-09'),
        endDate: new Date('2025-02-28'),
        status: 'active',
      },
    ],
  });
  console.log('✓ Discounts created\n');

  // ============================================
  // 17. KITCHENS, FLOORS & TABLES
  // ============================================
  console.log('Creating Kitchens, Floors & Tables...');

  const mainKitchen = await prisma.kitchen.create({
    data: {
      branchId: mainBranch.id,
      name: 'Main Kitchen',
      description: 'Primary kitchen for all food preparation',
      status: 'active',
    },
  });

  // Create floors
  const nonAcFloor = await prisma.floor.create({
    data: {
      branchId: mainBranch.id,
      name: 'Non-AC Area',
      type: FloorType.NonAC,
      status: 'active',
    },
  });

  const acFloor = await prisma.floor.create({
    data: {
      branchId: mainBranch.id,
      name: 'AC Area',
      type: FloorType.AC,
      status: 'active',
    },
  });

  const familyFloor = await prisma.floor.create({
    data: {
      branchId: mainBranch.id,
      name: 'Family Section',
      type: FloorType.Family,
      status: 'active',
    },
  });

  // Create tables for Non-AC area
  await prisma.table.createMany({
    data: [
      { floorId: nonAcFloor.id, label: 'T-01', shape: TableShape.square, chairs: 4, status: TableStatus.running },
      { floorId: nonAcFloor.id, label: 'T-03', shape: TableShape.square, chairs: 4, status: TableStatus.running },
      { floorId: nonAcFloor.id, label: 'T-04', shape: TableShape.square, chairs: 4, status: TableStatus.available },
      { floorId: nonAcFloor.id, label: 'T-07', shape: TableShape.square, chairs: 4, status: TableStatus.available },
      { floorId: nonAcFloor.id, label: 'T-10', shape: TableShape.square, chairs: 4, status: TableStatus.available },
      { floorId: nonAcFloor.id, label: 'T-11', shape: TableShape.square, chairs: 4, status: TableStatus.available },
      { floorId: nonAcFloor.id, label: 'T-12', shape: TableShape.square, chairs: 4, status: TableStatus.running },
      { floorId: nonAcFloor.id, label: 'T-13', shape: TableShape.square, chairs: 4, status: TableStatus.reserved },
      { floorId: nonAcFloor.id, label: 'T-14', shape: TableShape.square, chairs: 4, status: TableStatus.running },
    ],
  });

  // Create tables for AC area
  const acTable1 = await prisma.table.create({
    data: { floorId: acFloor.id, label: 'A-01', shape: TableShape.square, chairs: 4, status: TableStatus.available },
  });

  await prisma.table.createMany({
    data: [
      { floorId: acFloor.id, label: 'A-02', shape: TableShape.long, chairs: 10, status: TableStatus.reserved },
      { floorId: acFloor.id, label: 'A-03', shape: TableShape.square, chairs: 4, status: TableStatus.running },
      { floorId: acFloor.id, label: 'A-04', shape: TableShape.long, chairs: 10, status: TableStatus.reserved },
      { floorId: acFloor.id, label: 'A-05', shape: TableShape.long, chairs: 8, status: TableStatus.running },
    ],
  });

  // Create tables for Family section
  await prisma.table.createMany({
    data: [
      { floorId: familyFloor.id, label: 'F-06', shape: TableShape.square, chairs: 4, status: TableStatus.running },
      { floorId: familyFloor.id, label: 'F-07', shape: TableShape.square, chairs: 4, status: TableStatus.available },
      { floorId: familyFloor.id, label: 'F-08', shape: TableShape.square, chairs: 4, status: TableStatus.running },
      { floorId: familyFloor.id, label: 'F-09', shape: TableShape.square, chairs: 4, status: TableStatus.available },
      { floorId: familyFloor.id, label: 'F-10', shape: TableShape.square, chairs: 4, status: TableStatus.available },
      { floorId: familyFloor.id, label: 'F-11', shape: TableShape.square, chairs: 4, status: TableStatus.running },
      { floorId: familyFloor.id, label: 'F-12', shape: TableShape.square, chairs: 4, status: TableStatus.available },
      { floorId: familyFloor.id, label: 'F-13', shape: TableShape.square, chairs: 4, status: TableStatus.reserved },
      { floorId: familyFloor.id, label: 'F-14', shape: TableShape.square, chairs: 4, status: TableStatus.running },
    ],
  });
  console.log('✓ Kitchens, Floors & Tables created\n');

  // ============================================
  // 18. SUPPLIERS
  // ============================================
  console.log('Creating Suppliers...');

  const techNova = await prisma.supplier.create({
    data: {
      businessOwnerId: spiceParadise.id,
      code: '43215',
      name: 'TechNova',
      phone: '+91 9123456789',
      email: 'tech@nova.com',
      address: '768 Reach Street, Baltimore, MD 21202',
      status: 'active',
    },
  });

  const gearGlow = await prisma.supplier.create({
    data: {
      businessOwnerId: spiceParadise.id,
      code: '22120',
      name: 'Gear Glow',
      phone: '+91 7569842135',
      email: 'gear@glow.com',
      address: '102 West Street, Columbus, OH 43215',
      status: 'active',
    },
  });

  const naturesPure = await prisma.supplier.create({
    data: {
      businessOwnerId: spiceParadise.id,
      code: '33456',
      name: 'Nature\'s Pure',
      phone: '+91 8765432109',
      email: 'contact@naturespure.com',
      address: '45 Green Valley Road, Hyderabad',
      status: 'active',
    },
  });

  const artisanRoasters = await prisma.supplier.create({
    data: {
      businessOwnerId: spiceParadise.id,
      code: '44567',
      name: 'Artisan Roasters',
      phone: '+91 9876123456',
      email: 'sales@artisanroasters.com',
      address: '78 Coffee Lane, Bangalore',
      status: 'active',
    },
  });
  console.log('✓ Suppliers created\n');

  // ============================================
  // 19. INVENTORY ITEMS
  // ============================================
  console.log('Creating Inventory Items...');

  const cocaColaInventory = await prisma.inventoryProduct.create({
    data: {
      businessOwnerId: spiceParadise.id,
      branchId: mainBranch.id,
      name: 'Coca-Cola',
      image: '/images/coke.png',
      supplierId: naturesPure.id,
      inStock: 9523,
      quantitySold: 29523,
      restockAlert: 20,
      costPrice: 20,
      sellingPrice: 45,
      expiryDate: new Date('2025-02-09'),
      unit: 'bottles',
      status: 'active',
    },
  });

  const nescafeInventory = await prisma.inventoryProduct.create({
    data: {
      businessOwnerId: spiceParadise.id,
      branchId: mainBranch.id,
      name: 'Nescafe Coffee',
      image: '/images/nescafe.png',
      supplierId: artisanRoasters.id,
      inStock: 6353,
      quantitySold: 15523,
      restockAlert: 90,
      costPrice: 40,
      sellingPrice: 100,
      expiryDate: new Date('2025-03-08'),
      unit: 'packets',
      status: 'active',
    },
  });
  console.log('✓ Inventory Items created\n');

  // ============================================
  // 20. PURCHASE ORDERS
  // ============================================
  console.log('Creating Purchase Orders...');

  await prisma.purchaseOrder.create({
    data: {
      businessOwnerId: spiceParadise.id,
      branchId: mainBranch.id,
      supplierId: techNova.id,
      invoiceNumber: 'INV-2025-0001',
      amountPaid: 116000,
      grandTotal: 116000,
      status: PurchaseOrderStatus.Approved,
      items: {
        create: {
          inventoryProductId: cocaColaInventory.id,
          quantity: 1000,
          unitPrice: 20,
          totalPrice: 20000,
        },
      },
    },
  });

  await prisma.purchaseOrder.create({
    data: {
      businessOwnerId: spiceParadise.id,
      branchId: uppalBranch.id,
      supplierId: gearGlow.id,
      invoiceNumber: 'INV-2025-0002',
      amountPaid: 0,
      grandTotal: 638000,
      status: PurchaseOrderStatus.Pending,
      items: {
        create: {
          inventoryProductId: nescafeInventory.id,
          quantity: 500,
          unitPrice: 40,
          totalPrice: 20000,
        },
      },
    },
  });
  console.log('✓ Purchase Orders created\n');

  // ============================================
  // 21. SAMPLE ORDERS
  // ============================================
  console.log('Creating Sample Orders...');

  const sampleOrder = await prisma.order.create({
    data: {
      businessOwnerId: spiceParadise.id,
      branchId: mainBranch.id,
      orderNumber: 'ORD-3231',
      type: OrderType.DineIn,
      source: OrderSource.BistroBill,
      tableId: acTable1.id,
      customerId: jessica.id,
      staffId: rahul.id,
      subtotal: 610,
      discountAmount: 10,
      discountId: welcome100.id,
      chargesAmount: 10,
      taxAmount: 40,
      total: 650,
      paidAmount: 650,
      dueAmount: 0,
      paymentStatus: PaymentStatus.Paid,
      orderStatus: OrderStatus.Completed,
      items: {
        create: [
          {
            productId: idly.id,
            name: 'Idly with Sambar',
            quantity: 1,
            unitPrice: 60,
            totalPrice: 60,
            status: OrderItemStatus.Served,
          },
          {
            productId: paneerCurry.id,
            name: 'Paneer Curry Combo',
            quantity: 1,
            unitPrice: 80,
            totalPrice: 80,
            status: OrderItemStatus.Served,
          },
          {
            productId: vegFriedRice.id,
            name: 'Veg Fried Rice',
            quantity: 1,
            unitPrice: 40,
            totalPrice: 40,
            status: OrderItemStatus.Served,
          },
          {
            productId: andhraThali.id,
            name: 'Andhra Thali (Veg)',
            quantity: 1,
            unitPrice: 120,
            totalPrice: 120,
            status: OrderItemStatus.Served,
          },
          {
            productId: curdRice.id,
            name: 'Curd Rice',
            quantity: 1,
            unitPrice: 130,
            totalPrice: 130,
            status: OrderItemStatus.Served,
          },
        ],
      },
      payments: {
        create: {
          paymentOptionId: cashPayment.id,
          amount: 650,
          reference: 'CASH-001',
        },
      },
      kots: {
        create: {
          kitchenId: mainKitchen.id,
          kotNumber: 'KOT-001',
          status: 'Served',
          printedAt: new Date(),
        },
      },
      timeline: {
        create: [
          { action: 'created', description: 'Order created', staffId: rahul.id },
          { action: 'confirmed', description: 'Order confirmed', staffId: rahul.id },
          { action: 'preparing', description: 'Kitchen started preparing', staffId: rahul.id },
          { action: 'ready', description: 'Order ready for serving', staffId: rahul.id },
          { action: 'served', description: 'Order served to customer', staffId: rahul.id },
          { action: 'completed', description: 'Payment received and order completed', staffId: rahul.id },
        ],
      },
    },
  });
  console.log('✓ Sample Orders created\n');

  // ============================================
  // 22. BUSINESS PREFERENCES
  // ============================================
  console.log('Creating Business Preferences...');

  await prisma.businessPreference.create({
    data: {
      businessOwnerId: spiceParadise.id,
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      dateFormat: 'DD/MM/YYYY',
      invoicePrefix: 'INV',
      kotPrefix: 'KOT',
      autoAcceptOrders: false,
      enableReservations: true,
      settings: {
        allowSplitPayments: true,
        printKotOnOrderCreate: true,
        requireCustomerForDineIn: false,
      },
    },
  });
  console.log('✓ Business Preferences created\n');

  // ============================================
  // 23. BUSINESS HOURS
  // ============================================
  console.log('Creating Business Hours...');

  const businessHours = [
    { dayOfWeek: 0, openTime: '10:00', closeTime: '22:00', isClosed: false }, // Sunday
    { dayOfWeek: 1, openTime: '09:00', closeTime: '23:00', isClosed: false }, // Monday
    { dayOfWeek: 2, openTime: '09:00', closeTime: '23:00', isClosed: false }, // Tuesday
    { dayOfWeek: 3, openTime: '09:00', closeTime: '23:00', isClosed: false }, // Wednesday
    { dayOfWeek: 4, openTime: '09:00', closeTime: '23:00', isClosed: false }, // Thursday
    { dayOfWeek: 5, openTime: '09:00', closeTime: '00:00', isClosed: false }, // Friday
    { dayOfWeek: 6, openTime: '10:00', closeTime: '00:00', isClosed: false }, // Saturday
  ];

  for (const hours of businessHours) {
    await prisma.businessHours.create({
      data: {
        branchId: mainBranch.id,
        ...hours,
      },
    });
  }
  console.log('✓ Business Hours created\n');

  // ============================================
  // 24. ALLERGENS
  // ============================================
  console.log('Creating Allergens...');

  await prisma.allergen.createMany({
    data: [
      { name: 'Peanuts', icon: 'peanut' },
      { name: 'Tree Nuts', icon: 'tree-nut' },
      { name: 'Milk', icon: 'milk' },
      { name: 'Eggs', icon: 'egg' },
      { name: 'Wheat', icon: 'wheat' },
      { name: 'Soy', icon: 'soybean' },
      { name: 'Fish', icon: 'fish' },
      { name: 'Shellfish', icon: 'shellfish' },
      { name: 'Sesame', icon: 'sesame' },
      { name: 'Gluten', icon: 'gluten' },
    ],
  });
  console.log('✓ Allergens created\n');

  // ============================================
  // SUMMARY
  // ============================================
  // ============================================
  // 25. RBAC PERMISSIONS
  // ============================================
  const permissionCount = await seedPermissions(prisma);

  // ============================================
  // 26. RBAC ROLES WITH PERMISSION ASSIGNMENTS
  // ============================================
  const roleCount = await seedRoles(prisma, spiceParadise.id);

  // ============================================
  // 27. MENU VISIBILITY CONFIG
  // ============================================
  const menuVisibilityCount = await seedMenuVisibility(prisma);

  console.log('========================================');
  console.log('🎉 Database seed completed successfully!');
  console.log('========================================\n');
  console.log('Created:');
  console.log('- 1 SuperAdmin (admin@bistrobill.com / Admin@123)');
  console.log('- 3 Subscription Plans (Free, Gold, Platinum)');
  console.log('- 3 Business Owners (Spice Paradise, Masala Magic, Curry House)');
  console.log('- 2 Branches for Spice Paradise');
  console.log('- 6 Roles');
  console.log('- 4 Staff members');
  console.log('- 8 Categories');
  console.log('- 7 Brands');
  console.log('- 3 Menus');
  console.log('- 5 Tags');
  console.log('- 6 Products');
  console.log('- 5 Customer Groups');
  console.log('- 3 Customers');
  console.log('- 3 Taxes + 1 Tax Group');
  console.log('- 6 Payment Options');
  console.log('- 9 Discounts');
  console.log('- 1 Kitchen, 3 Floors, 23 Tables');
  console.log('- 4 Suppliers');
  console.log('- 2 Inventory Items');
  console.log('- 2 Purchase Orders');
  console.log('- 1 Sample Order with items');
  console.log('- 1 Business Preference');
  console.log('- 7 Business Hours entries');
  console.log('- 10 Allergens');
  console.log(`- ${permissionCount} RBAC Permissions`);
  console.log(`- ${roleCount} RBAC System Roles with permission assignments`);
  console.log(`- ${menuVisibilityCount} Menu Visibility configuration rows`);
  console.log('\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
