import Modal from "../../ui/Modal";
import { useState, useMemo, useEffect } from "react";
import { getOrder, addPayment, updateOrderStatus } from "../../../services/orderService";
import type { Order } from "../../../services/orderService";

interface Props {
  open: boolean;
  onClose: () => void;
  orderId?: string; // Order ID to load and process payment
  onPaymentSuccess?: () => void; // Callback after successful payment
}

type PaymentType = "FULL" | "NON_CHARGEABLE" | "PARTIAL" | "SPLIT" | "DUE";

const CheckoutPaymentModal = ({ open, onClose, orderId, onPaymentSuccess }: Props) => {
  /* ------------------ ORDER DATA ------------------ */
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  /* ------------------ BILL DATA (from order) ------------------ */
  const subtotal = order?.subtotal || 0;
  const discount = order?.discountAmount || 0;
  const charges = 0; // TODO: Get from order when charges field is available
  const tax = order?.taxAmount || 0;

  /* ------------------ STATE ------------------ */
  const [amountReceived, setAmountReceived] = useState("0");
  const [tip, setTip] = useState("10");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [paymentType, setPaymentType] = useState<PaymentType>("FULL");
  const [nonChargeableReason, setNonChargeableReason] = useState("");

  /* ------------------ CALCULATIONS ------------------ */
  const total = useMemo(() => {
    return subtotal - discount + charges + tax + Number(tip || 0);
  }, [tip]);

  const amountCollected = Math.min(Number(amountReceived || 0), total);
  const amountDue = Math.max(total - amountCollected, 0);

  /* ------------------ LOAD ORDER ------------------ */
  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId || !open) return;

      setLoading(true);
      setError(null);

      try {
        const response = await getOrder(orderId);
        if (response.success && response.data) {
          setOrder(response.data.order);
        } else {
          setError(response.error?.message || "Failed to load order");
        }
      } catch (err) {
        setError("An error occurred while loading order");
        console.error("Error loading order:", err);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId, open]);

  /* ------------------ PAYMENT HANDLER ------------------ */
  const handleConfirmPayment = async () => {
    if (!orderId || !order) {
      setError("No order selected");
      return;
    }

    // Validation based on payment type
    if (paymentType === "NON_CHARGEABLE") {
      if (!nonChargeableReason) {
        setError("Please provide a reason for non-chargeable order");
        return;
      }
    } else if (paymentType === "DUE") {
      // Allow DUE without payment
    } else if (amountCollected <= 0) {
      setError("Please enter an amount");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Map payment mode to payment option ID
      // TODO: Get real payment option IDs from settings API when available
      const paymentOptionMap: { [key: string]: string } = {
        Cash: "payment-option-cash",
        Card: "payment-option-card",
        UPI: "payment-option-upi",
      };

      // Handle different payment types
      if (paymentType === "NON_CHARGEABLE") {
        // Non-chargeable order - complete without payment
        await updateOrderStatus(orderId, {
          status: 'Completed',
          reason: `Non-chargeable: ${nonChargeableReason}`,
        });
      } else if (paymentType === "DUE") {
        // Mark order as due and complete
        await updateOrderStatus(orderId, {
          status: 'Completed',
          reason: 'Payment marked as due',
        });
      } else {
        // FULL, PARTIAL, or SPLIT - process payment first
        const response = await addPayment(orderId, {
          paymentOptionId: paymentOptionMap[paymentMode] || "payment-option-cash",
          amount: amountCollected,
          reference: paymentMode !== "Cash" ? `${paymentMode} Payment` : undefined,
        });

        if (!response.success) {
          setError(response.error?.message || "Payment failed");
          return;
        }

        // Add tip as separate payment if provided
        if (Number(tip) > 0) {
          await addPayment(orderId, {
            paymentOptionId: paymentOptionMap[paymentMode] || "payment-option-cash",
            amount: Number(tip),
            reference: "Tip",
          });
        }

        // Complete the order after successful payment
        if (paymentType === "FULL" || amountDue <= 0) {
          await updateOrderStatus(orderId, {
            status: 'Completed',
            reason: `Full payment via ${paymentMode}`,
          });
        } else {
          // Partial payment - keep order open
          await updateOrderStatus(orderId, {
            status: 'InProgress',
            reason: `Partial payment of ₹${amountCollected} received`,
          });
        }
      }

      // TODO: Print receipt if enabled (printer service integration needed)

      // Success - call callback and close
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred while processing payment");
      console.error("Error processing payment:", err);
    } finally {
      setProcessing(false);
    }
  };

  /* ------------------ RETRY HANDLER ------------------ */
  const handleRetry = () => {
    setError(null);
    handleConfirmPayment();
  };

  /* ------------------ KEYPAD HANDLER ------------------ */
  const handleKeypad = (value: string) => {
    setAmountReceived((prev) => {
      if (value === "AC") return "0";
      if (value === "C") return prev.length > 1 ? prev.slice(0, -1) : "0";
      if (value === "." && prev.includes(".")) return prev;
      if (prev === "0" && value !== ".") return value;
      return prev + value;
    });
  };

  return (
    <Modal open={open} onClose={onClose} className="w-[900px] max-w-[95vw]">
      {loading ? (
        <div className="p-6 text-center">Loading order...</div>
      ) : error && !order ? (
        <div className="p-6 text-center text-red-600">
          {error}
          <button
            onClick={onClose}
            className="block mx-auto mt-4 px-4 py-2 border rounded-lg hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      ) : !orderId || !order ? (
        <div className="p-6 text-center">No order selected</div>
      ) : (
        <div className="p-6 grid grid-cols-2 gap-6">

        {/* ================= LEFT ================= */}
        <div className="space-y-4">

          {/* Payment Type */}
          <div className="flex flex-wrap gap-4 text-sm">
            {[
              { label: "Full Payment", value: "FULL" as PaymentType },
              { label: "Non-Chargeable", value: "NON_CHARGEABLE" as PaymentType },
              { label: "Partial Payment", value: "PARTIAL" as PaymentType },
              { label: "Split Payment", value: "SPLIT" as PaymentType },
              { label: "Due", value: "DUE" as PaymentType },
            ].map(({ label, value }) => (
              <label key={value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="paymentType"
                  checked={paymentType === value}
                  onChange={() => setPaymentType(value)}
                />
                {label}
              </label>
            ))}
          </div>

          {/* Non-Chargeable Reason */}
          {paymentType === "NON_CHARGEABLE" && (
            <div>
              <label className="text-sm font-medium">Reason for Non-Chargeable</label>
              <input
                className="w-full h-11 border rounded-lg px-3 mt-1"
                placeholder="Enter reason (e.g., Staff meal, Complimentary)"
                value={nonChargeableReason}
                onChange={(e) => setNonChargeableReason(e.target.value)}
              />
            </div>
          )}

          {/* Amount Received */}
          <div>
            <label className="text-sm font-medium">Amount Received</label>
            <input
              readOnly
              className="w-full h-11 border rounded-lg px-3 mt-1 text-lg font-semibold"
              value={amountReceived}
            />
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-[1fr_1fr_1fr_60px] gap-3">
            {["1","2","3","4","5","6","7","8","9","00","0","."].map((n) => (
              <button
                key={n}
                onClick={() => handleKeypad(n)}
                className="h-12 rounded-lg bg-gray-100 hover:bg-gray-200 font-medium"
              >
                {n}
              </button>
            ))}

            <button
              onClick={() => handleKeypad("C")}
              className="row-span-2 h-full rounded-lg bg-gray-200 font-medium"
            >
              C
            </button>

            <button
              onClick={() => handleKeypad("AC")}
              className="row-span-2 h-full rounded-lg bg-gray-200 font-medium"
            >
              AC
            </button>
          </div>

          {/* Payment Mode */}
          <div>
            <label className="text-sm font-medium">Payment Mode</label>
            <div className="flex gap-2 mt-2">
              {["Cash", "Card", "UPI"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPaymentMode(mode)}
                  className={`px-4 py-2 rounded-lg border text-sm
                    ${
                      paymentMode === mode
                        ? "bg-black text-white"
                        : "hover:bg-gray-100"
                    }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div>
            <label className="text-sm font-medium">Tips</label>
            <input
              className="w-full h-11 border rounded-lg px-3 mt-1"
              value={tip}
              onChange={(e) => setTip(e.target.value.replace(/\D/g, ""))}
            />
          </div>
        </div>

        {/* ================= RIGHT ================= */}
        <div className="border rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="text-sm text-gray-600 mb-4">
              {order.type} | {new Date(order.createdAt).toLocaleDateString()} | {new Date(order.createdAt).toLocaleTimeString()}
              <br />
              <strong>Order No.: {order.orderNumber}</strong>
              {order.tableId && <><br />Table ID: {order.tableId}</>}
            </div>

            {error && (
              <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">
                {error}
                <button
                  onClick={handleRetry}
                  className="block mt-2 px-3 py-1 bg-red-700 text-white text-xs rounded hover:bg-red-800"
                  disabled={processing}
                >
                  Retry Payment
                </button>
              </div>
            )}

            <div className="space-y-2 text-sm">
              <Row label="Subtotal" value={`₹ ${subtotal}`} />
              <Row label="Discount sales" value={`- ₹ ${discount}`} />
              <Row label="Charges" value={`₹ ${charges}`} />
              <Row label="Tip" value={`₹ ${tip || 0}`} />
              <Row label="Total Tax" value={`₹ ${tax}`} />
            </div>

            <hr className="my-3" />

            <Row label="Total" value={`₹ ${total}`} bold />

            <div className="mt-4 space-y-2">
              <Row label="Amount Collected" value={`₹ ${amountCollected}`} bold />
              <Row label="Amount Due" value={`₹ ${amountDue}`} bold />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 h-11 border rounded-xl hover:bg-gray-100"
              disabled={processing}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmPayment}
              className="flex-1 h-11 rounded-xl bg-[#FFC533] font-semibold hover:bg-[#FFB800] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={processing || amountCollected <= 0}
            >
              {processing ? "Processing..." : "Confirm Payment"}
            </button>
          </div>
        </div>
        </div>
      )}
    </Modal>
  );
};

const Row = ({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) => (
  <div className={`flex justify-between ${bold ? "font-semibold" : ""}`}>
    <span>{label}</span>
    <span>{value}</span>
  </div>
);

export default CheckoutPaymentModal;
