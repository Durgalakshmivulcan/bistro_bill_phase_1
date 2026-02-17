import { useState } from "react";
import Modal from "../ui/Modal";
import { createTax } from "../../services/settingsService";
import { CRUDToasts } from "../../utils/toast";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

const inputClass =
  "w-full h-[44px] rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400";

const labelClass = "block text-sm font-semibold mb-1";

const AddTaxModal: React.FC<Props> = ({ open, onClose, onSuccess }) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [taxName, setTaxName] = useState("");
  const [taxRate, setTaxRate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!taxName.trim() || !taxRate.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    const rate = parseFloat(taxRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      setError("Please enter a valid percentage (0-100)");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await createTax({
        name: taxName,
        percentage: rate,
        status: 'active'
      });

      if (response.success) {
        CRUDToasts.created("Tax");
        onClose();
        setTaxName("");
        setTaxRate("");
        setShowSuccess(true);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(response.message || 'Failed to create tax');
      }
    } catch (err) {
      setError('An error occurred while creating the tax');
      console.error('Error creating tax:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTaxName("");
    setTaxRate("");
    setError(null);
    onClose();
  };

  return (
    <>
      {/* ================= ADD TAX MODAL ================= */}
      <Modal open={open} onClose={handleClose}>
        <div className="w-full max-w-[420px] ">
          <h2 className="text-xl sm:text-2xl font-bold mb-6">
            Add New Tax
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Tax Name */}
            <div>
              <label className={labelClass}>
                Tax Name <span className="text-red-500">*</span>
              </label>
              <input
                placeholder="VAT"
                className={inputClass}
                value={taxName}
                onChange={(e) => setTaxName(e.target.value)}
              />
            </div>

            {/* Tax Rate */}
            <div>
              <label className={labelClass}>
                Tax Rate <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="12"
                  className={`${inputClass} pr-10`}
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8">
            <button
              onClick={handleClose}
              className="h-[44px] px-6 rounded-lg border border-gray-300 w-full sm:w-auto"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="h-[44px] px-6 rounded-lg bg-yellow-400 font-semibold w-full sm:w-auto disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ================= SUCCESS IMAGE ALERT ================= */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm">
          <div className="flex min-h-screen items-center justify-center px-4">
            <div className="relative bg-white rounded-lg p-6 sm:p-8 text-center w-full max-w-sm">
              {/* Close */}
              <button
                onClick={() => setShowSuccess(false)}
                className="absolute top-3 right-3 text-gray-400 hover:text-black"
              >
                ✕
              </button>

              <h3 className="text-lg sm:text-xl font-bold mb-4">
                New Tax Added
              </h3>

              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-500 flex items-center justify-center text-white text-2xl sm:text-3xl">
                  ✓
                </div>
              </div>

              <p className="text-sm text-gray-600">
                New Tax Added Successfully!
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddTaxModal;
