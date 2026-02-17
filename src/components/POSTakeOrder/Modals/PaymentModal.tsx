import { useEffect, useState } from "react";
import { X, Star } from "lucide-react";
import dueImg from "../../../assets/deadline.png";
import tickImg from "../../../assets/tick.png";
import { addPayment, updateOrderStatus, Order } from "../../../services/orderService";
import { getPaymentOptions, PaymentOption } from "../../../services/settingsService";
import { getLoyaltyBalance, type LoyaltyBalance } from "../../../services/loyaltyService";
import { CRUDToasts } from "../../../utils/toast";

/* ================= TYPES ================= */

type PaymentType = "FULL" | "NON_CHARGEABLE" | "PARTIAL" | "SPLIT" | "DUE";

type Split = {
  id: number;
  paymentOption: PaymentOption;
  amount: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  order?: Order | null;
  onPaymentSuccess?: () => void;
};

/* ================= COMPONENT ================= */

export default function PaymentModal({ open, onClose, order, onPaymentSuccess }: Props) {
  const [paymentType, setPaymentType] = useState<PaymentType>("FULL");
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<PaymentOption | null>(null);
  const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [splits, setSplits] = useState<Split[]>([]);
  const [tips, setTips] = useState<number>(0);
  const [nonChargeableReason, setNonChargeableReason] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");

  const [loyaltyBalance, setLoyaltyBalance] = useState<LoyaltyBalance | null>(null);
  const [loyaltyPointsToRedeem, setLoyaltyPointsToRedeem] = useState<number>(0);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState<number>(0);

  const [paymentSuccessOpen, setPaymentSuccessOpen] = useState(false);
  const [markDueConfirmOpen, setMarkDueConfirmOpen] = useState(false);
  const [markedDueOpen, setMarkedDueOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>("");

  /* ================= EFFECTS ================= */

  // Fetch payment options when modal opens
  useEffect(() => {
    if (open) {
      fetchPaymentOptions();
    }
  }, [open]);

  const fetchPaymentOptions = async () => {
    try {
      setLoadingOptions(true);
      const response = await getPaymentOptions();
      if (response.success && response.data) {
        // Only show active payment options
        const activeOptions = response.data.filter(opt => opt.status === 'active');
        setPaymentOptions(activeOptions);

        // Set default payment option (first active one, or default if marked)
        const defaultOption = activeOptions.find(opt => opt.isDefault) || activeOptions[0];
        setSelectedPaymentOption(defaultOption || null);
      }
    } catch (err) {
      console.error("Error fetching payment options:", err);
    } finally {
      setLoadingOptions(false);
    }
  };

  // Fetch loyalty balance when modal opens with a customer order
  useEffect(() => {
    if (open && order?.customerId) {
      const fetchLoyalty = async () => {
        const res = await getLoyaltyBalance(order!.customerId!);
        if (res.success && res.data) {
          setLoyaltyBalance(res.data);
        }
      };
      fetchLoyalty();
    }
    if (!open) {
      setLoyaltyBalance(null);
      setLoyaltyPointsToRedeem(0);
      setLoyaltyDiscount(0);
    }
  }, [open, order?.customerId]);

  useEffect(() => {
    if (paymentType === "NON_CHARGEABLE") {
      setAmountReceived(0);
      setSplits([]);
      setTips(0);
      setLoyaltyPointsToRedeem(0);
      setLoyaltyDiscount(0);
    }

    if (paymentType !== "SPLIT") {
      setSplits([]);
    }
  }, [paymentType]);

  /* ================= VISIBILITY ================= */

  const showPaymentUI = paymentType !== "NON_CHARGEABLE";

  /* ================= KEYPAD ================= */

  const append = (num: string) => {
    setAmountReceived((prev) => Number(`${prev}${num}`));
  };

  const clear = () => setAmountReceived(0);

  /* ================= CALCULATIONS ================= */

  const TOTAL_AMOUNT = order?.total || 0;
  const effectiveTotal = Math.max(TOTAL_AMOUNT - loyaltyDiscount, 0);

  const baseCollected =
    paymentType === "FULL"
      ? effectiveTotal
      : paymentType === "SPLIT"
      ? splits.reduce((s, i) => s + i.amount, 0)
      : amountReceived;

  const collected = paymentType === "NON_CHARGEABLE" ? 0 : baseCollected + tips;
  const due = Math.max(effectiveTotal - baseCollected, 0);
  const change = Math.max(baseCollected - effectiveTotal, 0);

  // Handle loyalty points input change
  const handleLoyaltyPointsChange = (points: number) => {
    if (!loyaltyBalance) return;
    const clampedPoints = Math.min(Math.max(0, points), loyaltyBalance.balance);
    const discount = clampedPoints * loyaltyBalance.pointValue;
    const maxDiscount = (TOTAL_AMOUNT * loyaltyBalance.maxRedeemPercentage) / 100;
    const effectiveDiscount = Math.min(discount, maxDiscount);
    const effectivePoints = Math.floor(effectiveDiscount / loyaltyBalance.pointValue);
    setLoyaltyPointsToRedeem(effectivePoints);
    setLoyaltyDiscount(Math.round(effectivePoints * loyaltyBalance.pointValue * 100) / 100);
  };

  /* ================= SPLIT ================= */

  const addSplit = () => {
    if (!amountReceived || !selectedPaymentOption) return;

    setSplits((prev) => [
      ...prev,
      {
        id: Date.now(),
        paymentOption: selectedPaymentOption,
        amount: amountReceived,
      },
    ]);

    setAmountReceived(0);
  };

  const removeSplit = (id: number) =>
    setSplits((prev) => prev.filter((s) => s.id !== id));

  /* ================= PAYMENT PROCESSING ================= */

  const processPayment = async () => {
    if (!order) {
      setError("No order data available");
      return;
    }

    // Validate payment based on type
    if (paymentType === "NON_CHARGEABLE" && !nonChargeableReason) {
      setError("Please select a reason for non-chargeable order");
      return;
    }

    if (paymentType !== "NON_CHARGEABLE" && paymentType !== "DUE") {
      if (!selectedPaymentOption && paymentType !== "SPLIT") {
        setError("Please select a payment method");
        return;
      }

      if (due > 0) {
        setError("Payment amount does not cover the total");
        return;
      }
    }

    setProcessing(true);
    setError("");

    try {
      // For NON_CHARGEABLE orders, just complete the order
      if (paymentType === "NON_CHARGEABLE") {
        await updateOrderStatus(order.id, {
          status: "Completed",
          reason: `Non-chargeable: ${nonChargeableReason}${remarks ? ` - ${remarks}` : ""}`
        });
        setPaymentSuccessOpen(true);
        if (onPaymentSuccess) onPaymentSuccess();
        return;
      }

      // For DUE orders, mark as due and complete
      if (paymentType === "DUE") {
        await updateOrderStatus(order.id, {
          status: "Completed",
          reason: "Order marked as due"
        });
        setMarkDueConfirmOpen(false);
        setMarkedDueOpen(true);
        if (onPaymentSuccess) onPaymentSuccess();
        return;
      }

      // Process payment based on type
      if (paymentType === "SPLIT") {
        // Process each split payment
        for (const split of splits) {
          await addPayment(order.id, {
            paymentOptionId: split.paymentOption.id,
            amount: split.amount,
            reference: `Split payment - ${split.paymentOption.name}`
          });
        }
      } else {
        // Process single payment (FULL or PARTIAL)
        if (selectedPaymentOption) {
          await addPayment(order.id, {
            paymentOptionId: selectedPaymentOption.id,
            amount: baseCollected,
            reference: `${paymentType} payment - ${selectedPaymentOption.name}`
          });
        }
      }

      // Add tips if present
      if (tips > 0 && selectedPaymentOption) {
        // Use same payment option for tips
        await addPayment(order.id, {
          paymentOptionId: selectedPaymentOption.id,
          amount: tips,
          reference: "Tips"
        });
      }

      // Complete the order if fully paid
      if (paymentType === "FULL" || (paymentType === "PARTIAL" && due === 0)) {
        await updateOrderStatus(order.id, {
          status: "Completed",
          reason: `Payment completed - ${paymentType}`
        });
      }

      // Show success toast notification
      CRUDToasts.paymentProcessed();

      // Show success message
      setPaymentSuccessOpen(true);

      // Trigger parent callback
      if (onPaymentSuccess) onPaymentSuccess();
    } catch (err) {
      console.error("Payment processing failed:", err);
      setError("Payment processing failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  /* ================= EARLY RETURN ================= */

  if (!open) return null;

  /* ================= UI ================= */

  return (
    <>
      {/* ================= MAIN MODAL ================= */}
      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
        <div className="bg-white w-full max-w-5xl mx-4 rounded-xl flex flex-col md:flex-row overflow-hidden">
          {/* ================= LEFT ================= */}
          <div className="w-full md:w-2/3 p-6 min-h-[420px] flex flex-col">
            {/* Payment Type */}
            <div className="flex flex-wrap gap-5 text-sm mb-6">
              {[
                ["FULL", "Full Payment"],
                ["NON_CHARGEABLE", "Non-Chargeable"],
                ["PARTIAL", "Partial Payment"],
                ["SPLIT", "Split Payment"],
                ["DUE", "Due"],
              ].map(([key, label]) => (
                <div
                  key={key}
                  onClick={() => setPaymentType(key as PaymentType)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      paymentType === key
                        ? "border-green-500"
                        : "border-gray-400"
                    }`}
                  >
                    {paymentType === key && (
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                    )}
                  </div>
                  <span>{label}</span>
                </div>
              ))}
            </div>

            {showPaymentUI && (
              <div className="flex-1 flex flex-col">
                <div className="space-y-4">
                  {/* Amount Received */}
                  <div>
                    <label className="text-sm font-medium">
                      Amount Received
                    </label>
                    <input
                      value={
                        paymentType === "FULL"
                          ? TOTAL_AMOUNT
                          : amountReceived
                      }
                      className="w-1/2 h-10 border rounded-lg px-3 mt-1"
                      readOnly
                    />
                  </div>

                  {/* Keypad + Payment Mode */}
                  <div className="mt-4 flex gap-8 items-start">
                    {/* KEYPAD */}
                    <div className="flex gap-3">
                      <div className="grid grid-cols-3 gap-3 bg-gray-200 p-4 rounded-xl">
                        {[
                          "1",
                          "2",
                          "3",
                          "4",
                          "5",
                          "6",
                          "7",
                          "8",
                          "9",
                          "00",
                          "0",
                          ".",
                        ].map((n) => (
                          <button
                            key={n}
                            onClick={() => append(n)}
                            className="bg-white rounded-md h-12 w-16 text-lg shadow"
                          >
                            {n}
                          </button>
                        ))}
                      </div>

                      <div className="flex flex-col gap-3">
                        <button
                          onClick={clear}
                          className="bg-gray-300 rounded-md h-12 w-16"
                        >
                          C
                        </button>
                        <button
                          onClick={clear}
                          className="bg-gray-300 rounded-md h-12 w-16"
                        >
                          AC
                        </button>
                      </div>
                    </div>

                    {/* PAYMENT MODE */}
                    <div className="w-[240px] border rounded-lg p-4">
                      <label className="text-sm font-medium">
                        Payment Mode
                      </label>

                      {loadingOptions ? (
                        <div className="mt-4 text-sm text-gray-500">Loading payment options...</div>
                      ) : (
                        <div className="mt-4 flex flex-col gap-2">
                          {paymentOptions.map((option) => (
                            <button
                              key={option.id}
                              onClick={() => setSelectedPaymentOption(option)}
                              className={`py-2 px-3 border rounded-md text-sm ${
                                selectedPaymentOption?.id === option.id
                                  ? "bg-black text-white"
                                  : "bg-white"
                              }`}
                            >
                              {option.name} ({option.type})
                            </button>
                          ))}
                        </div>
                      )}

                      {/* ADD SPLIT BUTTON (only for SPLIT payment type) */}
                      {paymentType === "SPLIT" && (
                        <button
                          onClick={addSplit}
                          disabled={!amountReceived}
                          className="w-full mt-4 py-2 bg-green-500 text-white rounded-md text-sm disabled:opacity-50"
                        >
                          Add Split
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tips */}
                  <div className="mt-6">
                    <label className="text-sm font-medium">Tips</label>
                    <input
                      type="number"
                      min={0}
                      value={tips}
                      onChange={(e) =>
                        setTips(Number(e.target.value))
                      }
                      className="w-full h-10 border rounded-lg px-3 mt-1"
                    />
                  </div>

                  {/* Loyalty Points Redemption */}
                  {loyaltyBalance && loyaltyBalance.balance >= loyaltyBalance.minRedeemPoints && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Star size={16} className="text-yellow-500" />
                        <span className="text-sm font-medium">Loyalty Points</span>
                        <span className="text-xs text-gray-500 ml-auto">
                          Balance: {loyaltyBalance.balance.toLocaleString()} pts
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={loyaltyBalance.balance}
                          value={loyaltyPointsToRedeem}
                          onChange={(e) => handleLoyaltyPointsChange(Number(e.target.value))}
                          placeholder="Points to redeem"
                          className="flex-1 h-9 border rounded-lg px-3 text-sm"
                        />
                        <button
                          onClick={() => handleLoyaltyPointsChange(loyaltyBalance.balance)}
                          className="px-3 h-9 bg-blue-500 text-white rounded-lg text-xs whitespace-nowrap"
                        >
                          Use All
                        </button>
                      </div>
                      {loyaltyDiscount > 0 && (
                        <div className="mt-2 text-xs text-blue-700">
                          Discount: ₹{loyaltyDiscount.toFixed(2)} ({loyaltyPointsToRedeem} pts)
                          <span className="text-gray-400 ml-2">
                            (max {loyaltyBalance.maxRedeemPercentage}% of order)
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* NON CHARGEABLE */}
            {paymentType === "NON_CHARGEABLE" && (
              <div className="border rounded-xl p-4 space-y-3">
                <h4 className="font-medium">
                  Select a Reason to close this Order
                </h4>
                {[
                  "Order by Owner",
                  "Order by Friend's & Family",
                  "Order by Police",
                  "Order by Staff",
                  "Guest did not like the food",
                  "Others",
                ].map((r) => (
                  <label key={r} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="reason"
                      checked={nonChargeableReason === r}
                      onChange={() => setNonChargeableReason(r)}
                    />
                    {r}
                  </label>
                ))}
                <textarea
                  placeholder="Remarks (Optional)"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full border rounded p-3"
                />
              </div>
            )}
          </div>

          {/* ================= RIGHT ================= */}
          <div className="w-full md:w-1/3 border-t md:border-t-0 md:border-l p-6 relative">
            <button onClick={onClose} className="absolute top-3 right-3">
              <X />
            </button>

            <h4 className="font-medium mb-4">
              {order?.tableId ? `Table No.: ${order.tableId}` : `Order #${order?.orderNumber || "N/A"}`}
            </h4>

            <Row label="Subtotal" value={`₹ ${order?.subtotal?.toFixed(2) || "0.00"}`} />
            <Row label="Discount" value={`- ₹ ${order?.discountAmount?.toFixed(2) || "0.00"}`} />
            <Row label="Tax" value={`₹ ${order?.taxAmount?.toFixed(2) || "0.00"}`} />
            {loyaltyDiscount > 0 && (
              <Row label="Loyalty Points" value={`- ₹ ${loyaltyDiscount.toFixed(2)}`} />
            )}

            <hr className="my-3" />

            {tips > 0 && paymentType !== "NON_CHARGEABLE" && (
              <Row label="Tips" value={`₹ ${tips}`} />
            )}

            <Row
              label="Total"
              value={`₹ ${effectiveTotal.toFixed(2)}`}
              bold
            />

            {paymentType === "SPLIT" &&
              splits.map((s, i) => (
                <div
                  key={s.id}
                  className="flex justify-between items-center mt-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => removeSplit(s.id)}
                      className="w-5 h-5 flex items-center justify-center rounded-full border"
                    >
                      ✕
                    </button>
                    <span>
                      Split {i + 1} | {s.paymentOption.name} ({s.paymentOption.type})
                    </span>
                  </div>
                  <span className="font-medium">
                    ₹ {s.amount}
                  </span>
                </div>
              ))}

            <div className="mt-4 space-y-2 font-medium">
              <Row
                label="Amount Collected"
                value={`₹ ${collected.toFixed(2)}`}
              />
              <Row
                label="Amount Due"
                value={`₹ ${due.toFixed(2)}`}
              />
              {change > 0 && (
                <Row
                  label="Change"
                  value={`₹ ${change.toFixed(2)}`}
                />
              )}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                disabled={processing}
                className="flex-1 border rounded-lg py-2 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                disabled={(due > 0 && paymentType !== "DUE") || processing}
                onClick={() => {
                  if (paymentType === "DUE") {
                    setMarkDueConfirmOpen(true);
                  } else {
                    processPayment();
                  }
                }}
                className="flex-1 bg-[#FFC533] rounded-lg py-2 font-semibold disabled:opacity-50"
              >
                {processing ? "Processing..." : paymentType === "DUE"
                  ? "Close Order"
                  : "Confirm Payment"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= PAYMENT SUCCESS ================= */}
      {paymentSuccessOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl w-[90%] max-w-sm p-8 text-center">
            <h2 className="text-xl font-bold mb-4">
              Payment Successful
            </h2>

            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                 <img src={tickImg} alt="success" className="w-16 h-16" />
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Transaction has been processed successfully
            </p>

            <button
              onClick={() => {
                setPaymentSuccessOpen(false);
                onClose();
              }}
              className="bg-yellow-400 px-8 py-2 rounded font-medium"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* ================= MARK DUE CONFIRM ================= */}
      {markDueConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl w-[90%] max-w-sm p-8 text-center">
            <h2 className="text-xl font-bold mb-4">
              Mark as Due
            </h2>

            <div className="flex justify-center mb-4">
              <img src={dueImg} alt="due" className="w-16 h-16" />
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to mark this order as Due?
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setMarkDueConfirmOpen(false)}
                className="border border-black px-6 py-2 rounded"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  processPayment();
                }}
                disabled={processing}
                className="bg-yellow-400 px-8 py-2 rounded font-medium disabled:opacity-50"
              >
                {processing ? "Processing..." : "Yes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MARKED DUE SUCCESS ================= */}
      {markedDueOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl w-[90%] max-w-sm p-8 text-center">
            <h2 className="text-xl font-bold mb-4">
              Marked as Due
            </h2>

            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                <img src={tickImg} alt="success" className="w-16 h-16" />
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Order has been marked as Due successfully.
            </p>

            <button
              onClick={() => {
                setMarkedDueOpen(false);
                onClose();
              }}
              className="bg-yellow-400 px-8 py-2 rounded font-medium"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ================= ROW ================= */

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex justify-between ${
        bold ? "font-semibold" : ""
      }`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
