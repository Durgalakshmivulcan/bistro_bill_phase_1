import { X } from "lucide-react";
import { useState } from "react";
import Input from "../form/Input";
import { adjustStock, StockAdjustmentResponse } from "../../services/inventoryService";
import { showSuccessToast } from "../../utils/toast";

interface StockAdjustmentModalProps {
  open: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  currentStock: number;
  branchName?: string;
  onSuccess: () => void;
}

export default function StockAdjustmentModal({
  open,
  onClose,
  productId,
  productName,
  currentStock,
  branchName,
  onSuccess,
}: StockAdjustmentModalProps) {
  const [adjustment, setAdjustment] = useState<number>(0);
  const [reason, setReason] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [adjustmentResult, setAdjustmentResult] = useState<StockAdjustmentResponse | null>(null);

  if (!open) return null;

  const handleSubmit = async () => {
    // Validation
    if (adjustment === 0) {
      setError("Adjustment value must be non-zero");
      return;
    }

    const newStock = currentStock + adjustment;
    if (newStock < 0) {
      setError(`Cannot reduce stock below zero. Current stock: ${currentStock}, Adjustment: ${adjustment}`);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await adjustStock(productId, {
        adjustment,
        reason: reason || undefined,
      });

      if (response.success && response.data) {
        showSuccessToast("Stock adjusted successfully");
        setAdjustmentResult(response.data);
        setSuccess(true);

        // Auto-close modal and refresh list after 2 seconds
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      } else {
        setError(response.message || "Failed to adjust stock");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to adjust stock");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setAdjustment(0);
    setReason("");
    setError(null);
    setSuccess(false);
    setAdjustmentResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-bb-card w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Adjust Stock</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Product Info */}
          <div className="bg-gray-50 rounded-md p-3 space-y-1">
            <p className="text-sm font-medium text-gray-700">Product: {productName}</p>
            {branchName && (
              <p className="text-sm text-gray-600">Branch: <span className="font-semibold">{branchName}</span></p>
            )}
            <p className="text-sm text-gray-600">Current Stock: <span className="font-semibold">{currentStock}</span></p>
            <p className="text-sm text-gray-600">
              New Stock: <span className="font-semibold">{currentStock + adjustment}</span>
            </p>
          </div>

          {/* Success State */}
          {success && adjustmentResult && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3 space-y-1">
              <p className="text-sm font-medium text-green-800">Stock adjusted successfully!</p>
              <p className="text-sm text-green-700">
                Old Stock: {adjustmentResult.oldStock} → New Stock: {adjustmentResult.newStock}
              </p>
              {adjustmentResult.reason && (
                <p className="text-sm text-green-700">Reason: {adjustmentResult.reason}</p>
              )}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {!success && (
            <>
              {/* Adjustment Input */}
              <div>
                <Input
                  label="Adjustment"
                  required
                  type="number"
                  value={String(adjustment)}
                  onChange={(value) => {
                    setAdjustment(Number(value));
                    setError(null);
                  }}
                  placeholder="Enter adjustment (e.g., 10 or -5)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use positive numbers to increase stock, negative to decrease
                </p>
              </div>

              {/* Reason Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for adjustment (e.g., Received shipment, Damaged goods, etc.)"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bb-primary"
                  rows={3}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-sm bg-bb-primary text-black rounded-md hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving || adjustment === 0}
            >
              {saving ? "Adjusting..." : "Adjust Stock"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
