import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import Select from "../form/Select";
import Modal from "../../components/ui/Modal";
import tickImg from "../../assets/tick.png";
import {
  getPendingOnlineOrders,
  acceptOnlineOrder,
  rejectOnlineOrder,
  OnlineOrder,
  OrderAggregator
} from "../../services/onlineOrderService";
import { generateKOT } from "../../services/orderService";
import { showSuccessToast, showErrorToast } from "../../utils/toast";

const badgeStyles: Record<string, string> = {
  BistroBill: "bg-[#FFF2CE] text-[#7A5B00]",
  Swiggy: "bg-[#FFEEDD] text-orange-600",
  Zomato: "bg-[#FFE1E5] text-red-500",
  UberEats: "bg-[#E8F5E9] text-green-600",
};

const labelMap: Record<string, string> = {
  BistroBill: "Bistro Bill",
  Swiggy: "Swiggy",
  Zomato: "Zomato",
  UberEats: "Uber Eats",
};

// Helper function to calculate "N mins ago" from timestamp
const getMinutesAgo = (timestamp: string): number => {
  const now = new Date();
  const received = new Date(timestamp);
  const diffMs = now.getTime() - received.getTime();
  return Math.floor(diffMs / 60000); // Convert milliseconds to minutes
};

// Helper function to format time as "HH:MM AM/PM"
const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const OnlineOrderQueue = () => {
  const [aggregator, setAggregator] = useState("Filter by Aggregator");
  const [orders, setOrders] = useState<OnlineOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [acceptOpen, setAcceptOpen] = useState(false);

  const [timeOpen, setTimeOpen] = useState(false);
  const [acceptConfirmOpen, setAcceptConfirmOpen] = useState(false);
  const [acceptedOpen, setAcceptedOpen] = useState(false);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const [deliveryTime, setDeliveryTime] = useState(30);
  const [prepTime, setPrepTime] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<OnlineOrder | null>(null);

  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Handle Print KOT for an accepted online order
  const handlePrintKOT = async () => {
    if (!selectedOrder) return;

    setIsPrinting(true);

    try {
      const response = await generateKOT(selectedOrder.id, { kitchenId: 'default' });

      if (response.success && response.data) {
        const kot = response.data;
        const items = kot.items || selectedOrder.items;
        const aggregatorLabel = labelMap[selectedOrder.aggregator] || selectedOrder.aggregator;

        const receiptHtml = `
          <html>
          <head>
            <title>KOT - ${kot.kotNumber || selectedOrder.id.slice(0, 8)}</title>
            <style>
              body { font-family: 'Courier New', monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
              h2 { text-align: center; margin-bottom: 4px; }
              .subtitle { text-align: center; font-size: 12px; color: #666; margin-bottom: 16px; }
              .divider { border-top: 1px dashed #000; margin: 8px 0; }
              .meta { font-size: 12px; margin: 4px 0; }
              .items { width: 100%; border-collapse: collapse; margin: 8px 0; }
              .items td { padding: 4px 0; font-size: 13px; }
              .items td:first-child { width: 30px; text-align: center; }
              .items td:last-child { text-align: right; }
              .footer { text-align: center; font-size: 11px; color: #666; margin-top: 16px; }
            </style>
          </head>
          <body>
            <h2>KITCHEN ORDER TICKET</h2>
            <div class="subtitle">${aggregatorLabel} - Online Order</div>
            <div class="divider"></div>
            <div class="meta"><strong>KOT #:</strong> ${kot.kotNumber || 'N/A'}</div>
            <div class="meta"><strong>Order ID:</strong> #${selectedOrder.externalOrderId || selectedOrder.id.slice(0, 8)}</div>
            <div class="meta"><strong>Received:</strong> ${formatTime(selectedOrder.receivedAt)}</div>
            <div class="meta"><strong>Prep Time:</strong> ${prepTime} mins</div>
            <div class="divider"></div>
            <table class="items">
              <tbody>
                ${items.map((item: { quantity: number; productName: string }) => `
                  <tr>
                    <td>${item.quantity}x</td>
                    <td>${item.productName}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="divider"></div>
            <div class="footer">Printed at ${new Date().toLocaleTimeString()}</div>
          </body>
          </html>
        `;

        const printIframe = document.createElement('iframe');
        printIframe.style.position = 'fixed';
        printIframe.style.top = '-10000px';
        printIframe.style.left = '-10000px';
        document.body.appendChild(printIframe);

        const iframeDoc = printIframe.contentDocument || printIframe.contentWindow?.document;
        if (iframeDoc) {
          iframeDoc.open();
          iframeDoc.write(receiptHtml);
          iframeDoc.close();
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
        }

        setTimeout(() => document.body.removeChild(printIframe), 1000);
        showSuccessToast('KOT sent to printer');
      } else {
        showErrorToast(response.error?.message || 'Failed to generate KOT');
      }
    } catch {
      showErrorToast('Failed to generate KOT');
    }

    setIsPrinting(false);
  };

  // Load orders on mount and poll every 30 seconds
  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getPendingOnlineOrders();

        if (response.success && response.data) {
          setOrders(response.data.orders || []);
        } else {
          setError(response.error?.message || 'Failed to load orders');
        }
      } catch {
        setError('Failed to load orders');
      }

      setLoading(false);
    };

    // Initial load
    loadOrders();

    // Poll every 30 seconds
    const intervalId = setInterval(loadOrders, 30000);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, []);

  // Refresh orders list
  const refreshOrders = async () => {
    try {
      const response = await getPendingOnlineOrders();
      if (response.success && response.data) {
        setOrders(response.data.orders || []);
      }
    } catch {
      // Silently fail on refresh — keep existing orders
    }
  };

  // Handle accept order
  const handleAcceptOrder = async () => {
    if (!selectedOrder) return;

    setIsAccepting(true);

    // Convert deliveryTime (minutes) to ISO string (current time + deliveryTime minutes)
    const deliveryDateTime = new Date(Date.now() + deliveryTime * 60000).toISOString();

    const response = await acceptOnlineOrder(
      selectedOrder.id,
      deliveryDateTime,
      prepTime
    );

    setIsAccepting(false);

    if (response.success) {
      showSuccessToast("Order accepted successfully");
      setAcceptConfirmOpen(false);

      // Remove accepted order from UI immediately
      setOrders((prev) => prev.filter((order) => order.id !== selectedOrder.id));

      // Refresh order list
      await refreshOrders();

      // Reset selected order
      setSelectedOrder(null);
    } else {
      showErrorToast(response.error?.message || "Failed to accept order");
    }
  };

  // Handle reject order
  const handleRejectOrder = async () => {
    if (!selectedOrder || !rejectReason.trim()) {
      showErrorToast("Please provide a reason for rejection");
      return;
    }

    setIsRejecting(true);

    const response = await rejectOnlineOrder(selectedOrder.id, rejectReason);

    setIsRejecting(false);

    if (response.success) {
      showSuccessToast("Order rejected");
      setRejectOpen(false);

      // Remove rejected order from UI immediately
      setOrders((prev) => prev.filter((order) => order.id !== selectedOrder.id));

      // Refresh order list
      await refreshOrders();

      // Reset states
      setSelectedOrder(null);
      setRejectReason("");
    } else {
      showErrorToast(response.error?.message || "Failed to reject order");
    }
  };

  // Filter orders by aggregator
  const filteredOrders = aggregator === "Filter by Aggregator"
    ? orders
    : orders.filter(order => order.aggregator === aggregator);

  return (
    <div className="relative rounded-2xl p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
      {/* BACKGROUND IMAGE */}
      <div
        className="
          absolute inset-0
          bg-cover
          bg-center
          bg-no-repeat
          opacity-10
          pointer-events-none
          rounded-2xl
        "
        style={{
          backgroundImage: "url('/images/onlineordersqimg.jpg')",
        }}
      />

      {/* FOREGROUND CONTENT */}
      <div className="relative space-y-4">
        {/* HEADER */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base sm:text-lg font-semibold">
            Online Order Queue{" "}
            <span className="text-sm font-normal text-gray-500">
              ({filteredOrders.length} Orders)
            </span>
          </h2>

          <div className="w-full sm:w-52">
            <Select
              value={aggregator}
              onChange={(val: string) => setAggregator(val)}
              options={[
                {
                  label: "Filter by Aggregator",
                  value: "Filter by Aggregator",
                },
                { label: "Bistro Bill", value: OrderAggregator.BISTRO_BILL },
                { label: "Swiggy", value: OrderAggregator.SWIGGY },
                { label: "Zomato", value: OrderAggregator.ZOMATO },
                { label: "Uber Eats", value: OrderAggregator.UBER_EATS },
              ]}
            />
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="text-center py-8 text-gray-500">
            Loading orders...
          </div>
        )}

        {/* ERROR STATE */}
        {error && !loading && (
          <div className="text-center py-8 text-red-500">
            {error}
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && filteredOrders.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No pending orders
          </div>
        )}

        {/* CARDS ROW */}
        {!loading && !error && filteredOrders.length > 0 && (
          <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-3 scrollbar-hide">
            {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="
                rounded-2xl
                bg-white
                shadow-md
              "
            >
              {/* TOP BAR */}
              <div
                className={`flex items-center justify-between text-[11px] sm:text-xs p-2 sm:p-3 ${badgeStyles[order.aggregator]}`}
              >
                <span className="rounded-md px-2 py-0.5 font-semibold bg-white/60">
                  {labelMap[order.aggregator]}
                </span>

                <span>{getMinutesAgo(order.receivedAt)} mins ago</span>
              </div>

              {/* ORDER META */}
              <div className="flex items-center justify-between p-2 sm:p-3 text-sm">
                <span className="font-semibold">#{order.externalOrderId || order.id.slice(0, 8)}</span>

                <div className="flex items-center gap-4">
                  <span>{formatTime(order.receivedAt)}</span>
                  <span className="font-semibold">₹{order.amount.toFixed(2)}</span>
                </div>
              </div>

              {/* ITEMS GRID */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 p-2 sm:p-3">
                {order.items.map((item, i) => (
                  <div
                    key={i}
                    className="
                      rounded-md
                      bg-gray-100
                      px-2 py-1
                      text-xs
                      shadow-inner
                    "
                  >
                    {item.quantity}x {item.productName}
                  </div>
                ))}
              </div>

              {/* ACTIONS */}
              <div className="flex items-center justify-between p-2 sm:p-3 pt-3">
                <button
                  onClick={() => {
                    setSelectedOrder(order);
                    setRejectOpen(true);
                  }}
                  className="rounded-lg border px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm hover:bg-gray-100"
                >
                  Reject
                </button>

                <button
                  onClick={() => {
                    setSelectedOrder(order);
                    setTimeOpen(true);
                  }}
                  className="rounded-lg bg-[#FFC533] px-4 sm:px-5 py-1 sm:py-1.5 text-xs sm:text-sm font-medium hover:bg-yellow-500"
                >
                  Accept
                </button>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>

      {/* ---------------- ACCEPT CONFIRM MODAL ---------------- */}
      <Modal
        open={timeOpen}
        onClose={() => setTimeOpen(false)}
        className="w-[95%] max-w-lg p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <span className="font-bold">BISTRO BILL</span>
          </div>

          <span className="font-semibold">{selectedOrder?.id}</span>
        </div>

        <div className="space-y-6">
          {/* Minimum Delivery Time */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">
              Minimum Delivery Time (Minutes):
            </span>

            <div className="flex items-center">
              <button
                onClick={() => setDeliveryTime((prev) => Math.max(0, prev - 5))}
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

          {/* Preparation Time */}
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

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={() => setTimeOpen(false)}
            className="border border-black px-6 py-2 rounded"
          >
            Cancel
          </button>

          <button
            onClick={handlePrintKOT}
            disabled={isPrinting}
            className="bg-black text-white px-6 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPrinting ? "Printing..." : "Print KOT"}
          </button>

          <button
            onClick={() => {
              setTimeOpen(false);
              setAcceptConfirmOpen(true);
            }}
            className="bg-yellow-400 px-8 py-2 rounded font-medium"
          >
            Save Order
          </button>
        </div>
      </Modal>

      {/* ---------------- ACCEPTED SUCCESS MODAL ---------------- */}
      <Modal
        open={acceptConfirmOpen}
        onClose={() => setAcceptConfirmOpen(false)}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-6">Accept Order</h2>

        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <img src={tickImg} alt="Accept" className="w-8 h-8" />
          </div>
        </div>

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
            {isAccepting ? "Accepting..." : "Yes"}
          </button>
        </div>
      </Modal>

      {/* ---------------- REJECT MODAL ---------------- */}
      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
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
              setRejectOpen(false);
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
    </div>
  );
};

export default OnlineOrderQueue;
