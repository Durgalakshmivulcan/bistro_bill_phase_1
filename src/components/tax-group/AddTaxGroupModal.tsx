import { useState, useEffect } from "react";
import Modal from "../ui/Modal";
import { createTaxGroup, getTaxes, Tax } from "../../services/settingsService";
import { CRUDToasts } from "../../utils/toast";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const AddTaxGroupModal: React.FC<Props> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [groupName, setGroupName] = useState("");
  const [selectedTaxIds, setSelectedTaxIds] = useState<string[]>([]);
  const [availableTaxes, setAvailableTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTaxes, setLoadingTaxes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchTaxes();
    }
  }, [open]);

  const fetchTaxes = async () => {
    try {
      setLoadingTaxes(true);
      const response = await getTaxes({ status: 'active' });
      if (response.success && response.data) {
        setAvailableTaxes(response.data);
      }
    } catch (err) {
      console.error('Error fetching taxes:', err);
    } finally {
      setLoadingTaxes(false);
    }
  };

  const handleTaxToggle = (taxId: string) => {
    setSelectedTaxIds(prev =>
      prev.includes(taxId)
        ? prev.filter(id => id !== taxId)
        : [...prev, taxId]
    );
  };

  const handleSave = async () => {
    if (!groupName.trim()) {
      setError("Please enter a group name");
      return;
    }

    if (selectedTaxIds.length === 0) {
      setError("Please select at least one tax");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await createTaxGroup({
        name: groupName,
        taxIds: selectedTaxIds,
        status: 'active'
      });

      if (response.success) {
        CRUDToasts.created("Tax Group");
        handleClose();
        onSuccess();
      } else {
        setError(response.message || 'Failed to create tax group');
      }
    } catch (err) {
      setError('An error occurred while creating the tax group');
      console.error('Error creating tax group:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setGroupName("");
    setSelectedTaxIds([]);
    setError(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <h2 className="text-2xl font-bold mb-6">
        Add New Tax Group
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Tax Group Name <span className="text-red-500">*</span>
          </label>
          <input
            placeholder="Cascading Tax"
            className="w-full border rounded-md px-3 py-2"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Select Taxes <span className="text-red-500">*</span>
          </label>
          {loadingTaxes ? (
            <p className="text-sm text-gray-600">Loading taxes...</p>
          ) : (
            <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
              {availableTaxes.length === 0 ? (
                <p className="text-sm text-gray-600">No taxes available. Please create taxes first.</p>
              ) : (
                availableTaxes.map((tax) => (
                  <label key={tax.id} className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTaxIds.includes(tax.id)}
                      onChange={() => handleTaxToggle(tax.id)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{tax.name} ({tax.percentage}%)</span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-8">
        <button
          onClick={handleClose}
          className="border px-6 py-2 rounded-md"
          disabled={loading}
        >
          Cancel
        </button>

        <button
          onClick={handleSave}
          className="bg-yellow-400 px-6 py-2 rounded-md font-medium disabled:opacity-50"
          disabled={loading || loadingTaxes}
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </Modal>
  );
};

export default AddTaxGroupModal;
