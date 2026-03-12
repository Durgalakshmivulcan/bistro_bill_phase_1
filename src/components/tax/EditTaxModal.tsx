import { useState, useEffect } from "react";
import Modal from "../ui/Modal";
import { updateTax, Tax } from "../../services/settingsService";
import { showUpdatedSweetAlert } from "../../utils/swalAlerts";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  tax: Tax | null;
};

const inputClass =
  "w-full h-[44px] rounded-md border border-gray-300 px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400";
const labelClass = "block text-sm font-semibold mb-1";

const EditTaxModal: React.FC<Props> = ({ open, onClose, onSuccess, tax }) => {
  const [taxName, setTaxName] = useState("");
  const [taxRate, setTaxRate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tax && open) {
      setTaxName(tax.name);
      setTaxRate(`${tax.percentage}%`);
      setError(null);
    }
  }, [tax, open]);

  const handleSave = async () => {
    if (!tax) return;

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
      const response = await updateTax(tax.id, {
        name: taxName,
        percentage: rate,
      });

      if (response.success) {
        onClose();
        await showUpdatedSweetAlert({
          title: "Tax Updated",
          message: "Tax Details Updated Successfully!",
        });
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(response.message || 'Failed to update tax');
      }
    } catch (err) {
      setError('An error occurred while updating the tax');
      console.error('Error updating tax:', err);
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
      {/* ================= EDIT TAX MODAL ================= */}
      <Modal open={open} onClose={handleClose}>
        <div className="w-full max-w-[420px] bg-white rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-6">
            Edit New Tax
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="space-y-5">
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
              <input
                type="text"
                placeholder="12%"
                className={inputClass}
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-6 mt-8">
            <button
              onClick={handleClose}
              className="h-[44px] px-8 rounded-md border border-black text-black"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="h-[44px] px-8 rounded-md bg-yellow-400 font-semibold hover:bg-yellow-500 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default EditTaxModal;
