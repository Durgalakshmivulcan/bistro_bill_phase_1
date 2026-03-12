import { useState } from "react";
import Modal from "../ui/Modal";
import { createTax } from "../../services/settingsService";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

const inputClass =
  "w-full h-[44px] rounded-md border border-gray-300 px-4 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400";
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
  <div className="w-full max-w-[520px] bg-white rounded-xl p-8">

    {/* Title */}
    <h2 className="text-2xl font-bold mb-6">
      Add New Tax
    </h2>

    {error && (
      <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
        {error}
      </div>
    )}

    <div className="space-y-5">

      {/* Tax Name */}
      <div>
        <label className="block text-sm font-semibold mb-1">
          Tax Name <span className="text-red-500">*</span>
        </label>

        <input
          placeholder="VAT"
          className="w-full h-[44px] rounded-md border border-gray-300 px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
          value={taxName}
          onChange={(e) => setTaxName(e.target.value)}
        />
      </div>

      {/* Tax Rate */}
      <div>
        <label className="block text-sm font-semibold mb-1">
          Tax Rate <span className="text-red-500">*</span>
        </label>

        <input
          type="text"
          placeholder="12%"
          className="w-full h-[44px] rounded-md border border-gray-300 px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
          value={taxRate}
          onChange={(e) => setTaxRate(e.target.value)}
        />
      </div>

    </div>

    {/* Buttons */}
    <div className="flex justify-center gap-6 mt-8">

      <button
        onClick={handleClose}
        className="h-[44px] px-8 rounded-md border border-black text-black"
      >
        Cancel
      </button>

      <button
        onClick={handleSave}
        className="h-[44px] px-8 rounded-md bg-yellow-400 font-semibold hover:bg-yellow-500"
      >
        {loading ? "Saving..." : "Save"}
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
