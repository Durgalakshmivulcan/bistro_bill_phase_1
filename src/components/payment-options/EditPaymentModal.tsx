import { useState, useEffect } from "react";
import Modal from "../ui/Modal";
import {
  PaymentOption,
  updatePaymentOption,
  PaymentType,
} from "../../services/settingsService";
import { CRUDToasts } from "../../utils/toast";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  option: PaymentOption;
};

const EditPaymentModal: React.FC<Props> = ({
  open,
  onClose,
  onSuccess,
  option,
}) => {
  const [name, setName] = useState(option.name);
  const [type, setType] = useState<PaymentType>(option.type);
  const [status, setStatus] = useState(option.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update form when option changes
  useEffect(() => {
    setName(option.name);
    setType(option.type);
    setStatus(option.status);
  }, [option]);

  const handleSubmit = async () => {
    // Validate
    if (!name.trim()) {
      setError("Payment mode name is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await updatePaymentOption(option.id, {
        name: name.trim(),
        type,
        status,
      });

      if (response.success) {
        CRUDToasts.updated("Payment Option");
        onClose();
        onSuccess();
      } else {
        setError(response.message || "Failed to update payment option");
      }
    } catch (err) {
      console.error("Error updating payment option:", err);
      setError("Failed to update payment option");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="text-2xl font-bold mb-6">
        Edit Payment Mode
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Payment Name */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Payment Mode Name <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Gift Cards"
            className="w-full border rounded-md px-3 py-2"
          />
        </div>

        {/* Payment Type */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Payment Type <span className="text-red-500">*</span>
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as PaymentType)}
            className="w-full border rounded-md px-3 py-2"
          >
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="UPI">UPI</option>
            <option value="Wallet">Wallet</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-8">
        <button
          onClick={onClose}
          className="border px-6 py-2 rounded-md"
          disabled={loading}
        >
          Cancel
        </button>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-yellow-400 px-6 py-2 rounded-md font-medium disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </Modal>
  );
};

export default EditPaymentModal;
