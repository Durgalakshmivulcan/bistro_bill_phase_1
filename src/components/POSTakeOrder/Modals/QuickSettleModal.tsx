import { useMemo, useState, useEffect } from "react";
import { CreditCard, Wallet, Banknote } from "lucide-react";
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

  const formattedAmount = useMemo(
    () =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }).format(amount || 0),
    [amount]
  );

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
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <div className="relative w-[440px] max-w-[92vw] rounded-2xl bg-white p-7 text-center shadow-2xl">

        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-500 disabled:opacity-50"
          disabled={loading}
        >
          ✕
        </button>

        <h3 className="text-3xl font-semibold text-gray-900">
          Quick Settle <span className="font-bold">{formattedAmount}</span>
        </h3>

        <p className="mt-3 text-sm text-gray-600">
          Select any one of the Payment Method from below
        </p>

        {error && (
          <div className="mt-3 bg-red-50 text-red-700 text-sm p-2 rounded">
            {error}
          </div>
        )}

        <div className="mt-6">
          {loadingOptions ? (
            <div className="text-sm text-gray-500">Loading payment options...</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {paymentOptions.map((option) => {
                const lower = option.name.toLowerCase();
                const Icon =
                  lower.includes("cash") ? Banknote : lower.includes("card") ? CreditCard : Wallet;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelect(option)}
                    className="flex items-center justify-center gap-2 rounded-lg border border-amber-300 bg-[#fffaf1] px-4 py-3 text-sm font-medium text-gray-800 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md disabled:opacity-60"
                    disabled={loading || !orderId}
                  >
                    <Icon size={18} />
                    {option.name}
                  </button>
                );
              })}

              {paymentOptions.length === 0 && !loadingOptions && (
                <div className="col-span-2 text-sm text-gray-500">
                  No active payment options available
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickSettleModal;
