import { useState, useEffect } from "react";
import Modal from "../ui/Modal";
import { PurchaseOrderItem } from "../../services/purchaseOrderService";
import tickImg from "../../assets/tick.png";
import { handleError } from "../../utils/errorHandler";

interface ReceivePOModalProps {
  open: boolean;
  onClose: () => void;
  items: PurchaseOrderItem[];
  onConfirm: (receivedItems: { itemId: string; orderedQty: number; receivedQty: number }[], notes: string) => Promise<void>;
}

export default function ReceivePOModal({
  open,
  onClose,
  items,
  onConfirm
}: ReceivePOModalProps) {
  const [receivedQuantities, setReceivedQuantities] = useState<{ [itemId: string]: number }>({});
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Initialize received quantities with ordered quantities
  useEffect(() => {
    if (open && items.length > 0) {
      const initialQty: { [itemId: string]: number } = {};
      items.forEach(item => {
        initialQty[item.id] = item.quantity;
      });
      setReceivedQuantities(initialQty);
      setNotes("");
      setError(null);
      setSuccess(false);
    }
  }, [open, items]);

  const handleQuantityChange = (itemId: string, value: string) => {
    const qty = parseFloat(value);
    if (!isNaN(qty) && qty >= 0) {
      setReceivedQuantities({
        ...receivedQuantities,
        [itemId]: qty
      });
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      // Build received items array
      const receivedItems = items.map(item => ({
        itemId: item.id,
        orderedQty: item.quantity,
        receivedQty: receivedQuantities[item.id] || 0
      }));

      // Check if any discrepancies exist
      const hasDiscrepancies = receivedItems.some(
        item => item.receivedQty !== item.orderedQty
      );

      if (hasDiscrepancies && !notes.trim()) {
        setError("Please add notes explaining the quantity discrepancies");
        setLoading(false);
        return;
      }

      await onConfirm(receivedItems, notes);
      setSuccess(true);

      // Close modal after showing success
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      handleError(err, setError, {
        message: "Failed to receive purchase order",
        logError: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const getTotalDiscrepancy = () => {
    let discrepancy = 0;
    items.forEach(item => {
      const received = receivedQuantities[item.id] || 0;
      discrepancy += Math.abs(item.quantity - received);
    });
    return discrepancy;
  };

  const hasDiscrepancies = getTotalDiscrepancy() > 0;

  if (success) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-6">PO Received Successfully</h2>
        <div className="flex justify-center mb-6">
          <img src={tickImg} alt="Success" className="w-16 h-16" />
        </div>
        <p className="text-sm text-gray-600">
          Purchase order has been marked as received and inventory has been updated.
        </p>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="w-[90%] max-w-4xl p-6"
    >
      <h2 className="text-xl font-bold mb-4">Receive Purchase Order</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {hasDiscrepancies && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4 text-sm">
          ⚠️ Quantity discrepancies detected. Please add notes explaining the differences.
        </div>
      )}

      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-4">
          Review and adjust received quantities. Enter the actual quantities received for each item.
        </p>

        <div className="overflow-auto max-h-96">
          <table className="w-full text-sm border rounded">
            <thead className="bg-bb-primary sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left">Product</th>
                <th className="px-3 py-2">Unit</th>
                <th className="px-3 py-2">Ordered Qty</th>
                <th className="px-3 py-2">Received Qty</th>
                <th className="px-3 py-2">Difference</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const receivedQty = receivedQuantities[item.id] || 0;
                const difference = receivedQty - item.quantity;
                return (
                  <tr key={item.id} className="border-t">
                    <td className="px-3 py-2">{item.inventoryProduct.name}</td>
                    <td className="px-3 py-2 text-center">
                      {item.inventoryProduct.unit || "N/A"}
                    </td>
                    <td className="px-3 py-2 text-center">{item.quantity}</td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        value={receivedQty}
                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                        className="w-20 border rounded px-2 py-1 text-center"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className={`px-3 py-2 text-center font-medium ${
                      difference > 0 ? 'text-green-600' :
                      difference < 0 ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {difference > 0 ? '+' : ''}{difference.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-4">
        <label className="text-sm font-medium block mb-1">
          Notes {hasDiscrepancies && <span className="text-red-500">*</span>}
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full border rounded-md px-3 py-2"
          rows={3}
          placeholder="Add notes about any discrepancies or special conditions..."
        />
        {hasDiscrepancies && !notes.trim() && (
          <p className="text-xs text-red-600 mt-1">
            Required when received quantities differ from ordered quantities
          </p>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={loading}
          className="border px-6 py-2 rounded"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-yellow-400 px-6 py-2 rounded font-medium disabled:opacity-50"
        >
          {loading ? "Processing..." : "Confirm Receipt"}
        </button>
      </div>
    </Modal>
  );
}
