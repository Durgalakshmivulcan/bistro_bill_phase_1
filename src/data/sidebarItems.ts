export interface SidebarItem {
  key: string;
  name: string;
  icon?: string;
  imgSrc?: string;
  path: string;
}

export const sidebarItems: SidebarItem[] = [
  {
    key: "bo_dashboard",
    name: "Business Owner Dashboard",
     imgSrc: "/images/icons/dashboard.png",
    path: "/bodashboard",
  },
  {
    key: "pos",
    name: "Point of Sale",
     imgSrc: "/images/icons/pointofsale.png",
    path: "/pos/takeorder",
  },
  // {
  //   key: "kds",
  //   name: "Kitchen Display",
  //    imgSrc: "/images/icons/dashboard.png",
  //   path: "/kds",
  // },

  {
    key: "all_orders",
    name: "All Orders",
     imgSrc: "/images/icons/orders.png",
    path: "/orderhistory",
  },
  {
    key: "reservations",
    name: "Reservations",
     imgSrc: "/images/icons/reservations.png",
    path: "/reservation-list",
  },
  {
    key: "catalog",
    name: "Catalog",
     imgSrc: "/images/icons/catalog.png",
    path: "/catalog",
  },
  {
    key: "inventory",
    name: "Inventory",
     imgSrc: "/images/icons/inventory.png",
    path: "/inventory",
  },
   {
    key: "purchase_order",
    name: "Purchase Order",
     imgSrc: "/images/icons/purchaseorders.png",
    path: "/purchaseorder",
  },
  {
    key: "payments",
    name: "Payments",
   imgSrc: "/images/icons/payments.png",
    path: "/payments",
  },
  {
    key: "customers",
    name: "Customers",
     imgSrc: "/images/icons/contact.png",
    path: "/customers/customer",
  },
  {
    key: "loyalty_program",
    name: "Loyalty Program",
    imgSrc: "/images/icons/loyality.png",
    path: "/loyalty",
  },

  {
    key: "marketing",
    name: "Marketing",
     imgSrc: "/images/icons/marketing.png",
    path: "/marketing",
  },

  {
    key: "reviews",
    name: "Reviews",
   imgSrc: "/images/icons/reviews.png",
    path: "/reviews",
  },
  {
    key: "analytics_reports",
    name: "Analytics & Reports",
     imgSrc: "/images/icons/analytics.png",
    path: "/analytics-reports",
  },
   {
    key: "manage_resources",
    name: "Manage Resources",
     imgSrc: "/images/icons/manageresources.png",
    path: "/manage-resources",
  },
  {
    key: "business_settings",
    name: "Business settings",
     imgSrc: "/images/icons/settings.png",
    path: "/business-settings",
  },
   {
    key: "sa_dashboard",
    name: "Dashboard",
     imgSrc: "/images/icons/dashboard.png",
    path: "/superAdminDashboard",
  },

  {
    key: "business_owners",
    name: "Business Owners",
     imgSrc: "/images/icons/businessowners.png",
    path: "/businessowners",
  },

  {
    key: "subscription_plans",
    name: "Subscription Plans",
     imgSrc: "/images/icons/subscription.png",
    path: "/subscription-plans",
  },
  {
    key: "sa_orders",
    name: "Orders",
     imgSrc: "/images/icons/orders.png",
    path: "/orders",
  },

  {
    key: "contact_requests",
    name: "Contact Requests",
     imgSrc: "/images/icons/contact.png",
    path: "/contact-requests",
  },
  {
    key: "staff_management",
    name: "Staff Management",
    imgSrc: "/images/icons/staff.png",
    path: "/superadmin-staff-management",
  },
  {
    key: "blog_management",
    name: "blog Management",
     imgSrc: "/images/icons/blog.png",
    path: "/blog-management",
  },
  {
    key: "master_data",
    name: "Master Data",
     imgSrc: "/images/icons/masterdata.png",
    path: "/master-data",
  },

  {
    key: "sa_settings",
    name: "Settings",
    imgSrc: "/images/icons/settings.png",
    path: "/settings",
  },
   {
    key: "website",
    name: "Website",
    imgSrc: "/images/icons/website.png",
    path: "/website",
  },

];
