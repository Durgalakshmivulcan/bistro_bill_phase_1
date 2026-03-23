import { useState } from "react";
import { Truck, Percent } from "lucide-react";
import AddChargesModal from "../Modals/AddChargesModal";
import DiscountModal from "../Modals/DiscountModal";
import { useOrder } from "../../../contexts/OrderContext";

const PaymentSummary = () => {
  const [showCharges, setShowCharges] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const orderContext = useOrder();
  const captainName = orderContext.table.captainName;

  // Format currency with fallback to ₹0.00
  const formatCurrency = (amount: number | undefined) => {
    return `₹ ${(amount || 0).toFixed(2)}`;
  };

  return (
    <>
      <div className="space-y-4 text-sm">
        {/* Add Charges */}
        <button
          onClick={() => setShowCharges(true)}
          className="w-full h-11 border rounded-lg flex items-center gap-3 px-3 hover:bg-gray-50"
        >
          <Truck size={18} />
          <span>Add Charges</span>
        </button>

        {/* Discount */}
        <button
          onClick={() => setShowDiscount(true)}
          className="w-full h-11 border rounded-lg flex items-center gap-3 px-3 hover:bg-gray-50"
        >
          <Percent size={18} />
          <span>Discount</span>
        </button>

        {/* Summary */}
        <div className="pt-2 space-y-2">
          {captainName && (
            <div className="flex justify-between text-gray-700">
              <span>Captain</span>
              <span className="font-medium">{captainName}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(orderContext.summary.subtotal)}</span>
          </div>

          <div className="flex justify-between text-red-500">
            <span>Discount sales</span>
            <span>- {formatCurrency(orderContext.summary.discountAmount)}</span>
          </div>

          <div className="flex justify-between">
            <span>Charges</span>
            <span>{formatCurrency(orderContext.summary.additionalCharges)}</span>
          </div>

          <div className="flex justify-between">
            <span>Total Tax</span>
            <span>{formatCurrency(orderContext.summary.taxAmount)}</span>
          </div>

          <hr />

          <div className="flex justify-between font-semibold">
            <span>Total Payable</span>
            <span>{formatCurrency(orderContext.summary.total)}</span>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCharges && (
        <AddChargesModal
          orderId={orderContext.currentOrderId}
          onClose={() => setShowCharges(false)}
          onChargesApplied={() => {}}
        />
      )}

      {showDiscount && (
        <DiscountModal onClose={() => setShowDiscount(false)} />
      )}
    </>
  );
};

export default PaymentSummary;
