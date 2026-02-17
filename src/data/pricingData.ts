export type PricingPlan = {
  id: "starter" | "professional" | "enterprise";
  title: string;
  price: string;
  subtitle: string;
  highlight?: boolean;
  cta: string;
  features?: string[]; // ✅ OPTIONAL
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "starter",
    title: "Starter",
    price: "49",
    subtitle: "Perfect for small restaurants and cafes",
    cta: "Get Started",
  },
  {
    id: "professional",
    title: "Professional",
    price: "99",
    subtitle: "Ideal for individuals who need advanced features",
    highlight: true,
    cta: "Start Free Trial",
  },
  {
    id: "enterprise",
    title: "Enterprise",
    price: "199",
    subtitle: "For established chains and large operations",
    cta: "Get Started",
  },
];

export const PRICING_FEATURES = {
  starter: [
    "Customer List & Overview",
    "Customer Profile Management",
    "Order History & Recent Orders",
    "Basic Reports",
    "Basic Inventory",
    "Basic Menu Management",
    "Role Management",
    "Kitchen Management",
    "Floor / Area Management",
    "Table Management",
    "Room Management",
    "Discount Management",
    "Advertisement Management",
  ],

  professional: [
    "Brand Listing & Management",
    "Category and Sub Category",
    "Customer List & Overview",
    "Customer Profile Management",
    "Order History & Recent Orders",
    "Due Amount & Payment Status Tracking",
    "Preparing Orders Section",
    "Food Ready Section",
    "Kitchen Management",
    "Floor / Area Management",
    "Table Management",
    "Room Management",
    "Discount Management",
    "Advertisement Management",
  ],

  enterprise: [
    "Brand Listing & Management",
    "Inter linking with Inventory & Product Management",
    "Category and Sub Category",
    "Channel Menu Overview",
    "Product View & Availability Controls",
    "Export & Data Management",
    "Role & Based Access Controls",
    "Product View & Status Indicators",
    "Centralized Inventory Management",
    "Multi-Branch Management",
    "Advanced Analytics & Reports",
    "API Access & Integrations",
    "Custom Roles & Permissions",
    "Priority Support",
  ],
  
};


