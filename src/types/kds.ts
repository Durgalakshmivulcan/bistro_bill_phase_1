// Kitchen Display System Types

// Item-level (controls row color only)
export interface KDSOrderItem {
  name: string;
  variant?: string;
  qty: number;
  status?: "ready" | "preparing" | "normal";
}

// Delivery status for dispatched orders
export type KDSDeliveryStatus = "Assigned" | "PickedUp" | "InTransit" | "Delivered" | "Cancelled";

// Order-level (card stays white)
export interface KDSOrder {
  id: string;
  time: string;        // 00:01
  orderTime: string;   // 06:38 PM
  kot: string;
  type: string;        // Dine In / Take Away / Delivery
  source?: string;     // Zomato / Bistro Bill
  table: string;
  items: KDSOrderItem[];
  deliveryStatus?: KDSDeliveryStatus;
  trackingUrl?: string;
}

// Column-level (only grouping, NOT coloring cards)
export interface KDSColumn {
  key: "new" | "ready" | "served" | "cancelled";
  title: string;
  borderColor: string;
  headerBg: string;
  orders: KDSOrder[];
}
