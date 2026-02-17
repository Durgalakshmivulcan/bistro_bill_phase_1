import { useState, useEffect, useRef, useCallback } from "react";
import OnlineOrderCard, { OnlineOrder, Aggregator } from "./OnlineOrderCard";
import {
  getPendingOnlineOrders,
  acceptOnlineOrder,
  rejectOnlineOrder,
  OnlineOrderStatus,
  OnlineOrder as ApiOnlineOrder,
} from "../../services/onlineOrderService";
import { showSuccessToast, showErrorToast } from "../../utils/toast";
import Modal from "../ui/Modal";

type Props = {
  aggregator: Aggregator;
  onSelectOrder: (order: OnlineOrder) => void;
};

/** Map API aggregator string to UI Aggregator type */
const mapAggregator = (agg: string): Aggregator => {
  switch (agg) {
    case "Swiggy":
      return "Swiggy";
    case "Zomato":
      return "Zomato";
    case "UberEats":
      return "Uber Eats";
    default:
      return "Swiggy";
  }
};

/** Map API status to payment badge values */
const mapPayment = (
  status: OnlineOrderStatus
): { payment: "Paid" | "Partial Paid" | "Unpaid"; paymentClass: string } => {
  switch (status) {
    case OnlineOrderStatus.COMPLETED:
      return { payment: "Paid", paymentClass: "bg-green-100 text-green-700" };
    case OnlineOrderStatus.ACCEPTED:
    case OnlineOrderStatus.PREPARING:
    case OnlineOrderStatus.READY:
      return {
        payment: "Partial Paid",
        paymentClass: "bg-yellow-100 text-yellow-700",
      };
    default:
      return { payment: "Unpaid", paymentClass: "bg-red-100 text-red-700" };
  }
};

/** Transform API OnlineOrder to the UI OnlineOrder shape */
const transformOrder = (apiOrder: ApiOnlineOrder): OnlineOrder => {
  const aggUI = mapAggregator(apiOrder.aggregator);
  const { payment, paymentClass } = mapPayment(apiOrder.status);
  const receivedDate = new Date(apiOrder.receivedAt || apiOrder.createdAt);

  return {
    id: apiOrder.id,
    customer: apiOrder.customerName || "Unknown",
    initials: aggUI === "Swiggy" ? "S" : aggUI === "Zomato" ? "Z" : "UE",
    type: aggUI,
    date: receivedDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    time: receivedDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
    payment,
    paymentClass,
    statusText: apiOrder.status,
    apiStatus: apiOrder.status,
    apiOrderId: apiOrder.id,
    items: apiOrder.items.map((item) => ({
      name: item.productName,
      qty: item.quantity,
      price: item.totalPrice,
    })),
    subtotal: apiOrder.amount,
    total: apiOrder.amount,
  };
};

const POLL_INTERVAL = 30000; // 30 seconds

export default function OnlineOrdersList({ aggregator, onSelectOrder }: Props) {
  const [orders, setOrders] = useState<OnlineOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Accept modal state
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [acceptConfirmOpen, setAcceptConfirmOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OnlineOrder | null>(null);
  const [deliveryTime, setDeliveryTime] = useState(30);
  const [prepTime, setPrepTime] = useState(15);
  const [isAccepting, setIsAccepting] = useState(false);

  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const fetchOrders = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError(null);

    const res = await getPendingOnlineOrders(OnlineOrderStatus.PENDING);
    if (res.success && res.data) {
      setOrders(res.data.orders.map(transformOrder));
    } else {
      setOrders([]);
      if (res.error?.code !== "FETCH_ONLINE_ORDERS_FAILED") {
        setError(res.error?.message || "Failed to fetch online orders");
      }
    }
    setLoading(false);
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    fetchOrders(true);

    pollRef.current = setInterval(() => {
      fetchOrders(false);
    }, POLL_INTERVAL);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchOrders]);

  // --- Accept flow ---
  const handleOpenAccept = (order: OnlineOrder) => {
    setSelectedOrder(order);
    setDeliveryTime(30);
    setPrepTime(15);
    setAcceptModalOpen(true);
  };

  const handleAcceptOrder = async () => {
    if (!selectedOrder) return;
    setIsAccepting(true);

    const deliveryDateTime = new Date(
      Date.now() + deliveryTime * 60000
    ).toISOString();

    const response = await acceptOnlineOrder(
      selectedOrder.apiOrderId || selectedOrder.id,
      deliveryDateTime,
      prepTime
    );

    setIsAccepting(false);

    if (response.success) {
      showSuccessToast("Order accepted successfully");
      setAcceptConfirmOpen(false);
      // Remove from list immediately
      setOrders((prev) => prev.filter((o) => o.id !== selectedOrder.id));
      setSelectedOrder(null);
      await fetchOrders(false);
    } else {
      showErrorToast(response.error?.message || "Failed to accept order");
    }
  };

  // --- Reject flow ---
  const handleOpenReject = (order: OnlineOrder) => {
    setSelectedOrder(order);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const handleRejectOrder = async () => {
    if (!selectedOrder || !rejectReason.trim()) {
      showErrorToast("Please provide a reason for rejection");
      return;
    }

    setIsRejecting(true);

    const response = await rejectOnlineOrder(
      selectedOrder.apiOrderId || selectedOrder.id,
      rejectReason
    );

    setIsRejecting(false);

    if (response.success) {
      showSuccessToast("Order rejected");
      setRejectModalOpen(false);
      setOrders((prev) => prev.filter((o) => o.id !== selectedOrder.id));
      setSelectedOrder(null);
      setRejectReason("");
      await fetchOrders(false);
    } else {
      showErrorToast(response.error?.message || "Failed to reject order");
    }
  };

  // Filter by selected aggregator tab
  const filteredOrders =
    aggregator === "All"
      ? orders
      : orders.filter((o) => o.type === aggregator);

  if (loading) {
    return (
      <div className="p-3 sm:p-4 flex items-center justify-center min-h-[200px]">
        <div className="flex flex-col items-center gap-2 text-gray-500">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-bb-primary rounded-full animate-spin" />
          <span className="text-sm">Loading online orders...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 sm:p-4 flex items-center justify-center min-h-[200px]">
        <div className="flex flex-col items-center gap-2 text-red-500">
          <i className="bi bi-exclamation-triangle text-2xl" />
          <span className="text-sm">{error}</span>
          <button
            onClick={() => fetchOrders(true)}
            className="mt-2 px-4 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (filteredOrders.length === 0) {
    return (
      <div className="p-3 sm:p-4 flex items-center justify-center min-h-[200px]">
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <i className="bi bi-inbox text-3xl" />
          <span className="text-sm">
            {aggregator === "All"
              ? "No online orders"
              : `No orders from ${aggregator}`}
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-3 sm:p-4">
        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
          {filteredOrders.map((order) => (
            <OnlineOrderCard
              key={order.id}
              order={order}
              onClick={() => onSelectOrder(order)}
              onAccept={handleOpenAccept}
              onReject={handleOpenReject}
            />
          ))}
        </div>
      </div>

      {/* ---- ACCEPT TIME MODAL ---- */}
      <Modal
        open={acceptModalOpen}
        onClose={() => setAcceptModalOpen(false)}
        className="w-[95%] max-w-lg p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <span className="font-bold">Accept Online Order</span>
          <span className="font-semibold text-sm text-gray-500">
            #{selectedOrder?.id.slice(0, 8)}
          </span>
        </div>

        <div className="space-y-6">
          {/* Delivery Time */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">
              Estimated Delivery Time (Minutes):
            </span>
            <div className="flex items-center">
              <button
                onClick={() =>
                  setDeliveryTime((prev) => Math.max(5, prev - 5))
                }
                className="bg-black text-white px-4 py-2 rounded-l-lg"
              >
                –
              </button>
              <div className="border-t border-b px-6 py-2 text-sm">
                {deliveryTime}
              </div>
              <button
                onClick={() => setDeliveryTime((prev) => prev + 5)}
                className="bg-black text-white px-4 py-2 rounded-r-lg"
              >
                +
              </button>
            </div>
          </div>

          {/* Prep Time */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">
              Preparation Time (Minutes):
            </span>
            <div className="flex items-center">
              <button
                onClick={() => setPrepTime((prev) => Math.max(0, prev - 5))}
                className="bg-black text-white px-4 py-2 rounded-l-lg"
              >
                –
              </button>
              <div className="border-t border-b px-6 py-2 text-sm">
                {prepTime}
              </div>
              <button
                onClick={() => setPrepTime((prev) => prev + 5)}
                className="bg-black text-white px-4 py-2 rounded-r-lg"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={() => setAcceptModalOpen(false)}
            className="border border-black px-6 py-2 rounded"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              setAcceptModalOpen(false);
              setAcceptConfirmOpen(true);
            }}
            className="bg-yellow-400 px-8 py-2 rounded font-medium"
          >
            Continue
          </button>
        </div>
      </Modal>

      {/* ---- ACCEPT CONFIRM MODAL ---- */}
      <Modal
        open={acceptConfirmOpen}
        onClose={() => setAcceptConfirmOpen(false)}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-6">Accept Order</h2>

        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <i className="bi bi-check-lg text-3xl text-green-600" />
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-2">
          Delivery: {deliveryTime} min · Prep: {prepTime} min
        </p>
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to accept this order?
        </p>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => setAcceptConfirmOpen(false)}
            disabled={isAccepting}
            className="border border-black px-6 py-2 rounded disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAcceptOrder}
            disabled={isAccepting}
            className="bg-yellow-400 px-8 py-2 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAccepting ? "Accepting..." : "Yes, Accept"}
          </button>
        </div>
      </Modal>

      {/* ---- REJECT MODAL ---- */}
      <Modal
        open={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        className="w-[90%] max-w-md p-8"
      >
        <h2 className="text-2xl font-bold mb-6">Reject Order</h2>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Reason for Rejection <span className="text-red-500">*</span>
          </label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter reason for rejecting this order..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 min-h-[100px]"
            disabled={isRejecting}
          />
        </div>

        <div className="flex justify-end gap-4">
          <button
            onClick={() => {
              setRejectModalOpen(false);
              setRejectReason("");
            }}
            disabled={isRejecting}
            className="border border-black px-6 py-2 rounded disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleRejectOrder}
            disabled={isRejecting || !rejectReason.trim()}
            className="bg-red-500 text-white px-8 py-2 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRejecting ? "Rejecting..." : "Reject Order"}
          </button>
        </div>
      </Modal>
    </>
  );
}
