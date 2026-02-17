export type OrderItem = {
  id: number;
  orderNo: string;
  branch: string;
  customerName: string;
  phone: string;
  orderType: string;
  orderValue: string;
  status: "Paid" | "Unpaid" | "Due" | "Free" | "Partial Paid";
  createdAt: string;
  createdBy: string;
};

export type Payment = {
  amount: number;
  mode: "Cash" | "UPI" | "Card";
  paidAt: string;
};

export type OrderActivityEvent = {
  type:
    | "CREATED"
    | "KOT"
    | "MODIFIED"
    | "PARTIAL_PAYMENT"
    | "FULL_PAYMENT"
    | "CANCELLED"
    | "RETURN";
  time: string;
  meta?: string;
};

export type OrderDetails = {
  orderNo: string;
  branch: string;
  customerName: string;
  phone: string;
  orderType: string;

  createdAt: string;
  createdBy: string;

  status: "UNPAID" | "PARTIAL_PAID" | "PAID" | "CANCELLED";

  kotPrinted: boolean;
  kotPrintedAt?: string;

  payments: Payment[];

  items: {
    name: string;
    qty: number;
    price: number;
  }[];

  subtotal: number;
  discount: number;
  tax: number;
  total: number;

  activityLog: OrderActivityEvent[];
};
