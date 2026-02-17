import { useState, useEffect } from "react";
import { addPayment, updateOrderStatus } from "../../../services/orderService";
import { getPaymentOptions, PaymentOption } from "../../../services/settingsService";

type Props = {
  open: boolean;
  orderId?: string;
  amount: number;
  onClose: () => void;
  onPaymentSuccess?: () => void;
};

const QuickSettleModal = ({ open, orderId, amount, onClose, onPaymentSuccess }: Props) => {
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>([]);

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
      }
    } catch (err) {
      console.error("Error fetching payment options:", err);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleSelect = async (paymentOption: PaymentOption) => {
    if (!orderId) {
      setError("No order selected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Process payment
      await addPayment(orderId, {
        paymentOptionId: paymentOption.id,
        amount,
      });

      // Complete the order after successful payment
      await updateOrderStatus(orderId, {
        status: 'Completed',
        reason: `Quick settle payment via ${paymentOption.name}`,
      });

      onPaymentSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to process payment");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">

      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      <div className="relative w-[360px] rounded-2xl bg-white p-6 text-center">

        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-400 disabled:opacity-50"
          disabled={loading}
        >
          ✕
        </button>

        <h3 className="text-lg font-semibold">
          Quick Settle ₹{amount.toFixed(2)}
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          Select any one of the Payment Method from below
        </p>

        {error && (
          <div className="mt-3 bg-red-50 text-red-700 text-sm p-2 rounded">
            {error}
          </div>
        )}

        {loadingOptions ? (
          <div className="mt-5 text-sm text-gray-500">Loading payment options...</div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-4">
            {paymentOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSelect(option)}
                className="flex items-center justify-center gap-2 rounded-xl border py-3 hover:bg-gray-50 disabled:opacity-50"
                disabled={loading || !orderId}
              >
                {option.name}
              </button>
            ))}

            {paymentOptions.length === 0 && !loadingOptions && (
              <div className="col-span-2 text-sm text-gray-500">
                No active payment options available
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickSettleModal;
