import { ActivityItem } from "../types/orderActivity";

export const buildOrderTimeline = (order: any): ActivityItem[] => {
  const paidAmount =
    order.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;

  const isPartial = order.status === "PARTIAL_PAID";
  const isPaid = order.status === "PAID";
  const isCancelled = order.status === "CANCELLED";
  const isReturned = order.status === "RETURNED";

  return [
    // 1️⃣ Order placed
    {
      id: "placed",
      type: "CREATED",
      title: "Order is Placed",
      time: order.createdAt,
      completed: true,
    },

    // 2️⃣ In progress
    {
      id: "progress",
      type: "MODIFIED",
      title: "Order is In progress",
      time: order.inProgressAt || order.createdAt,
      completed: true,
    },

    // 3️⃣ Payment step (always visible)
    {
      id: "payment",
      type: isPaid ? "FULL_PAYMENT" : "PARTIAL_PAYMENT",
      title: isPaid
        ? "Payment Completed"
        : isPartial
        ? "Payment is Due"
        : "Payment Pending",
      description: isPaid
        ? `Paid via ${order.payments?.at(-1)?.mode || ""}`
        : isPartial
        ? `₹${paidAmount} received`
        : undefined,
      time:
        isPaid || isPartial
          ? order.payments?.at(-1)?.time
          : undefined,
      completed: isPaid || isPartial,
    },

    // 4️⃣ Final step (Closed / Cancelled / Returned)
    {
      id: "final",
      type: isCancelled
        ? "CANCELLED"
        : isReturned
        ? "RETURN"
        : "MODIFIED",
      title: isCancelled
        ? "Order is Cancelled"
        : isReturned
        ? "Order Returned"
        : "Order Closed",
      description: isCancelled
        ? `Reason: ${order.cancelReason || "Cancelled by user"}`
        : undefined,
      time: isCancelled
        ? order.cancelledAt
        : isPaid
        ? order.closedAt
        : undefined,
      completed: isPaid || isCancelled || isReturned,
    },
  ];
};
