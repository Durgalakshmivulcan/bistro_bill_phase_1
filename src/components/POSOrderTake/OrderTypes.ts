export type PaymentStatus = "Paid" | "Partial Paid" | "Unpaid";

export type BaseOrder = {
  id: string;
  orderNumber?: string; // Optional: Display order number (e.g., "ORD-2002")
  customer: string;
  initials: string;

  date: string;
  time: string;

  payment: PaymentStatus;
  paymentClass: string;

  statusText?: string;

  items: {
    name: string;
    qty: number;
    price: number;
  }[];

  subtotal: number;
  collected?: number;
  total: number;
  disablePay?: boolean;
};
