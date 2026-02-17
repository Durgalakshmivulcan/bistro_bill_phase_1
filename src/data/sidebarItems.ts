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
    icon: "bi bi-receipt",
    path: "/pos/takeorder",
  },
  {
    key: "kds",
    name: "Kitchen Display",
    icon: "bi-display",
    path: "/kds",
  },

  {
    key: "all_orders",
    name: "All Orders",
    icon: "bi bi-bag-check",
    path: "/orderhistory",
  },
  {
    key: "reservations",
    name: "Reservations",
    icon: "bi-database",
    path: "/reservation-list",
  },
  {
    key: "catalog",
    name: "Catalog",
    icon: "bi-box-seam",
    path: "/catalog",
  },
  {
    key: "inventory",
    name: "Inventory",
    icon: "bi-box-seam",
    path: "/inventory",
  },
   {
    key: "purchase_order",
    name: "Purchase Order",
    icon: "bi-card-list",
    path: "/purchaseorder",
  },
  {
    key: "payments",
    name: "Payments",
    icon: "bi-credit-card-2-front",
    path: "/payments",
  },
  {
    key: "customers",
    name: "Customers",
    icon: "bi-card-list",
    path: "/customers/customer",
  },
  {
    key: "loyalty_program",
    name: "Loyalty Program",
    icon: "bi-gift",
    path: "/loyalty",
  },

  {
    key: "marketing",
    name: "Marketing",
    icon: "bi-card-list",
    path: "/marketing",
  },

  {
    key: "reviews",
    name: "Reviews",
    icon: "bi-star",
    path: "/reviews",
  },
  {
    key: "analytics_reports",
    name: "Analytics & Reports",
    icon: "bi-file-bar-graph",
    path: "/analytics-reports",
  },
   {
    key: "manage_resources",
    name: "Manage Resources",
    icon: "bi-person-badge",
    path: "/manage-resources",
  },
  {
    key: "business_settings",
    name: "Business settings",
    icon: "bi-people",
    path: "/business-settings",
  },
   {
    key: "sa_dashboard",
    name: "Dashboard",
    icon: "bi bi-columns-gap",
    path: "/superAdminDashboard",
  },

  {
    key: "business_owners",
    name: "Business Owners",
    icon: "bi-people",
    path: "/businessowners",
  },

  {
    key: "subscription_plans",
    name: "Subscription Plans",
    icon: "bi-card-list",
    path: "/subscription-plans",
  },
  {
    key: "sa_orders",
    name: "Orders",
    icon: "bi-people",
    path: "/orders",
  },

  {
    key: "contact_requests",
    name: "Contact Requests",
    icon: "bi-envelope-open",
    path: "/contact-requests",
  },
  {
    key: "staff_management",
    name: "Staff Management",
    icon: "bi-people-fill",
    path: "/manage-resources/staff",
  },
  {
    key: "blog_management",
    name: "blog Management",
    icon: "bi-journal-text",
    path: "/blog-management",
  },
  {
    key: "master_data",
    name: "Master Data",
    icon: "bi-database",
    path: "/master-data",
  },

  {
    key: "sa_settings",
    name: "Settings",
    icon: "bi-gear",
    path: "/settings",
  },
   {
    key: "website",
    name: "Website",
    icon: "bi-ui-checks",
    path: "/website",
  },

];
