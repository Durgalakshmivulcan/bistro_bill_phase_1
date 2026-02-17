import { X, BadgePercent } from "lucide-react";
import { useState } from "react";
import SuccessModal from "./SuccessModal";
import { applyDiscount as applyDiscountAPI } from "../../../services/orderService";

type Props = {
  orderId?: string;
  onClose: () => void;
  onDiscountApplied?: () => void;
};

const DiscountModal = ({ orderId, onClose, onDiscountApplied }: Props) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyDiscount = async () => {
    if (!orderId) {
      setError("No order selected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Apply discount using coupon code
      // For now, using reason field for coupon code since discountId is optional
      await applyDiscountAPI(orderId, {
        reason: couponCode || "Flat 10% Off",
      });

      setShowSuccess(true);
      onDiscountApplied?.();
    } catch (err: any) {
      setError(err.message || "Failed to apply discount");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    onClose();
  };

  return (
    <>
      {/* Discount Modal */}
      <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center">
        <div className="bg-white w-[520px] rounded-xl p-6 space-y-5 relative">

          {/* Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Discounts & Deals</h2>
            <button onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Coupon */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Coupons</label>
            <div className="flex gap-3">
              <input
                className="flex-1 h-11 border rounded-lg px-3"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Enter coupon code"
                disabled={loading}
              />
              <button
                onClick={applyDiscount}
                className="h-11 px-5 rounded-lg bg-black text-white text-sm disabled:opacity-50"
                disabled={loading || !orderId}
              >
                {loading ? "Applying..." : "Apply"}
              </button>
            </div>
          </div>

          {/* Discount Options */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Discount</label>

            <div className="flex justify-between items-center border rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <BadgePercent size={18} />
                <span className="text-sm">
                  Get Flat 10% Off on your Order value
                </span>
              </div>
              <button
                onClick={applyDiscount}
                className="px-4 py-2 bg-black text-white rounded-md text-sm disabled:opacity-50"
                disabled={loading || !orderId}
              >
                {loading ? "Applying..." : "Apply"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Success Modal */}
      {showSuccess && (
        <SuccessModal
          title="Discount Applied"
          message="Discount applied successfully!"
          icon="/images/discount-success.png"
          onClose={handleSuccessClose}
        />
      )}
    </>
  );
};

export default DiscountModal;
