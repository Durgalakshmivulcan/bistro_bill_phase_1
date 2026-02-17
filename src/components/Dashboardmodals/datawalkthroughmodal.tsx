export interface WalkthroughStep {
  title: string;
  description: string;
  image: string;
}

export const Datawalkthroughmodal: WalkthroughStep[] = [
  {
    title: "Dashboard",
    description: "Overview of sales, orders, and performance.",
    image: "/walkthrough/dashboard.png",
  },
  {
    title: "POS",
    description: "Quick order processing using POS.",
    image: "/walkthrough/pos.png",
  },
  {
    title: "Orders",
    description: "Manage and track customer orders.",
    image: "/walkthrough/orders.png",
  },
  {
    title: "Reservations",
    description: "Handle table reservations efficiently.",
    image: "/walkthrough/reservations.png",
  },
  {
    title: "Catalog",
    description: "Manage menu items and categories.",
    image: "/walkthrough/catalog.png",
  },
  {
    title: "Inventory",
    description: "Track stock and reduce waste.",
    image: "/walkthrough/inventory.png",
  },
  {
    title: "Purchase Orders",
    description: "Create and manage supplier orders.",
    image: "/walkthrough/purchase-orders.png",
  },
  {
    title: "Customers",
    description: "Maintain customer information.",
    image: "/walkthrough/customers.png",
  },
  {
    title: "Marketing",
    description: "Run promotions and campaigns.",
    image: "/walkthrough/marketing.png",
  },
  {
    title: "Reports",
    description: "View detailed business reports.",
    image: "/walkthrough/reports.png",
  },
];
