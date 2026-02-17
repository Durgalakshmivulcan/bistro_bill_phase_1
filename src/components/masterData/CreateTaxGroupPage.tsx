import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import Input from "../form/Input";
import Modal from "../ui/Modal";
import {
  getTaxGroups,
  getTaxes,
  createTaxGroup,
  updateTaxGroup,
  TaxGroup,
  Tax,
} from "../../services/settingsService";

// Images
import createSuccessImg from "../../assets/tick.png";
import updateSuccessImg from "../../assets/tick.png";

type SuccessType = "create" | "edit" | null;

const CreateTaxGroupPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // MODES
  const isEditMode = window.location.pathname.includes("/edit");
  const isViewMode = window.location.pathname.includes("/view");

  // FORM STATE
  const [name, setName] = useState("");
  const [selectedTaxIds, setSelectedTaxIds] = useState<string[]>([]);
  const [availableTaxes, setAvailableTaxes] = useState<Tax[]>([]);

  // UI STATE
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successType, setSuccessType] = useState<SuccessType>(null);

  // Fetch available taxes and tax group data
  useEffect(() => {
    fetchTaxes();
    if ((isEditMode || isViewMode) && id) {
      fetchTaxGroup(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode, isViewMode]);

  const fetchTaxes = async () => {
    try {
      const response = await getTaxes({ status: 'active' });
      if (response.success && response.data) {
        setAvailableTaxes(response.data);
      }
    } catch (err) {
      console.error('Error fetching taxes:', err);
    }
  };

  const fetchTaxGroup = async (taxGroupId: string) => {
    try {
      setLoadingData(true);
      const response = await getTaxGroups();
      if (response.success && response.data) {
        const taxGroup = response.data.find((t: TaxGroup) => t.id === taxGroupId);
        if (taxGroup) {
          setName(taxGroup.name);
          setSelectedTaxIds(taxGroup.taxGroupItems?.map(item => item.taxId) || []);
        } else {
          setError("Tax group not found");
        }
      }
    } catch (err) {
      console.error('Error fetching tax group:', err);
      setError('Failed to load tax group data');
    } finally {
      setLoadingData(false);
    }
  };

  // ---------------- HANDLERS ----------------

  const validateForm = () => {
    if (!name.trim()) {
      setError("Please enter a tax group name.");
      return false;
    }

    if (selectedTaxIds.length === 0) {
      setError("Please select at least one tax.");
      return false;
    }

    setError("");
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError("");

      const taxGroupData = {
        name,
        taxIds: selectedTaxIds,
        status: 'active' as const
      };

      if (isEditMode && id) {
        const response = await updateTaxGroup(id, taxGroupData);
        if (response.success) {
          setSuccessType("edit");
          setShowSuccess(true);
        } else {
          setError(response.message || "Failed to update tax group");
        }
      } else {
        const response = await createTaxGroup(taxGroupData);
        if (response.success) {
          setSuccessType("create");
          setShowSuccess(true);
        } else {
          setError(response.message || "Failed to create tax group");
        }
      }
    } catch (err) {
      console.error('Error saving tax group:', err);
      setError('An error occurred while saving the tax group');
    } finally {
      setLoading(false);
    }
  };

  const handleTaxToggle = (taxId: string) => {
    setSelectedTaxIds(prev =>
      prev.includes(taxId)
        ? prev.filter(id => id !== taxId)
        : [...prev, taxId]
    );
  };

  // ---------------- HELPERS ----------------

  const getSuccessTitle = () => {
    return isEditMode
      ? "Tax Group Updated"
      : "Tax Group Created";
  };

  const getSuccessMessage = () => {
    return isEditMode
      ? "Tax group updated successfully."
      : "Tax group created successfully.";
  };

  const getSuccessImage = () => {
    return isEditMode
      ? updateSuccessImg
      : createSuccessImg;
  };

  // ---------------- RENDER ----------------

  if (loadingData) {
    return (
      <div className="space-y-8 bg-bb-bg p-6 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-600">Loading tax group data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-bb-bg p-6 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* TITLE */}
        <h1 className="text-2xl md:text-3xl font-semibold">
          {isViewMode
            ? "View Tax Group"
            : isEditMode
            ? "Edit Tax Group"
            : "Create Tax Group"}
        </h1>

        {/* FORM CARD */}
        <div className="bg-white rounded-xl border p-6 space-y-6">
          {error && (
            <p className="text-red-600 text-sm">
              {error}
            </p>
          )}

          <div className="space-y-6">
            <Input
              label="Tax Group Name"
              required
              disabled={isViewMode}
              value={name}
              onChange={(val) => setName(val)}
              placeholder="Tax Group Name"
            />

            <div>
              <label className="block text-sm font-medium mb-2">
                Select Taxes <span className="text-red-500">*</span>
              </label>
              <div className="border rounded-md p-4 max-h-64 overflow-y-auto">
                {availableTaxes.length === 0 ? (
                  <p className="text-sm text-gray-600">No taxes available. Please create taxes first.</p>
                ) : (
                  <div className="space-y-2">
                    {availableTaxes.map((tax) => (
                      <label key={tax.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={selectedTaxIds.includes(tax.id)}
                          onChange={() => handleTaxToggle(tax.id)}
                          disabled={isViewMode}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{tax.name} ({tax.percentage}%)</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {selectedTaxIds.length > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  Total: {availableTaxes
                    .filter(t => selectedTaxIds.includes(t.id))
                    .reduce((sum, t) => sum + t.percentage, 0)}%
                </p>
              )}
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6">
            <button
              onClick={() => navigate(-1)}
              className="border px-6 py-2 rounded-md text-sm"
              disabled={loading}
            >
              Cancel
            </button>

            {!isViewMode && (
              <button
                onClick={handleSubmit}
                className="bg-yellow-400 px-6 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Saving...' : (isEditMode ? "Update" : "Create")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SUCCESS MODAL */}
      {showSuccess && successType && (
        <Modal
          open={showSuccess}
          onClose={() => {
            setShowSuccess(false);
            navigate(-1);
          }}
          className="w-[90%] max-w-md p-6 text-center z-[9999]"
        >
          <h2 className="text-2xl font-bold mb-4">
            {getSuccessTitle()}
          </h2>

          <div className="flex justify-center mb-4">
            <img
              src={getSuccessImage()}
              alt="success"
              className="w-16 h-16"
            />
          </div>

          <p className="text-sm text-gray-600">
            {getSuccessMessage()}
          </p>
        </Modal>
      )}
    </div>
  );
};

export default CreateTaxGroupPage;
