import { useState, useEffect } from "react";
import Modal from "../ui/Modal";
import { ChevronDown } from "lucide-react";
import {
  PaymentOption,
  updatePaymentOption,
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
  const [status, setStatus] = useState(option.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update form when option changes
  useEffect(() => {
    setName(option.name);
    setStatus(option.status);
  }, [option]);

  const handleClose = () => {
    setName(option.name);
    setStatus(option.status);
    setError(null);
    onClose();
  };

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
    <Modal open={open} onClose={handleClose}>
      <div className="w-[760px] px-10 py-8">
        <h2 className="text-[30px] font-bold mb-8">
          Edit Payment Mode
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Payment Mode Name <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Gift Cards"
              className="w-full h-[46px] border border-gray-300 rounded-md px-4 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Status
            </label>
            <div className="relative">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-[46px] border border-gray-300 rounded-md px-4 pr-10 text-sm bg-white appearance-none"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown
                size={18}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-10">
          <button
            onClick={handleClose}
            className="px-8 h-[44px] border border-black rounded-md text-sm font-medium"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-8 h-[44px] bg-yellow-400 rounded-md text-sm font-medium hover:bg-yellow-500 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default EditPaymentModal;
