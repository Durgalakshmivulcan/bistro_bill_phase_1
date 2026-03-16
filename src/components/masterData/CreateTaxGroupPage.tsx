import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  getTaxGroups,
  getTaxes,
  createTaxGroup,
  updateTaxGroup,
  TaxGroup,
  Tax,
} from "../../services/settingsService";

const CreateTaxGroupPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // MODES
  const isEditMode = window.location.pathname.includes("/edit");
  const isViewMode = window.location.pathname.includes("/view");

  // FORM STATE
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [percentage, setPercentage] = useState("");
  const [country, setCountry] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [city, setCity] = useState("");
  const [selectedTaxIds, setSelectedTaxIds] = useState<string[]>([]);

  // UI STATE
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // Fetch available taxes and tax group data
  useEffect(() => {
    fetchTaxes();
    if ((isEditMode || isViewMode) && id) {
      fetchTaxGroup(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode, isViewMode]);

  const fetchTaxes = async () => {
    // Keeping empty to satisfy call chain; taxes are not shown in UI per latest design.
  };

  const fetchTaxGroup = async (taxGroupId: string) => {
    try {
      setLoadingData(true);
      const response = await getTaxGroups();
      if (response.success && response.data) {
        const taxGroup = response.data.find((t: TaxGroup) => t.id === taxGroupId);
        if (taxGroup) {
          setName(taxGroup.name);
          setSymbol(taxGroup.taxGroupItems?.map(item => item.tax.symbol || item.tax.name).join(" + ") || "");
          const totalPerc = taxGroup.taxGroupItems?.reduce((sum, i) => sum + i.tax.percentage, 0) || 0;
          setPercentage(totalPerc.toString());
          setCountry(taxGroup.taxGroupItems?.[0]?.tax.country || "");
          setStateValue(taxGroup.taxGroupItems?.[0]?.tax.state || "");
          setCity(taxGroup.taxGroupItems?.[0]?.tax.city || "");
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

    if (!symbol.trim()) {
      setError("Please enter a tax symbol.");
      return false;
    }

    if (!percentage || isNaN(Number(percentage))) {
      setError("Please enter a valid percentage.");
      return false;
    }

    if (!country.trim()) {
      setError("Please select a country.");
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
        symbol,
        percentage: Number(percentage),
        country,
        state: stateValue,
        city,
        taxIds: selectedTaxIds,
        status: 'active' as const
      };

      if (isEditMode && id) {
        const response = await updateTaxGroup(id, taxGroupData);
        if (!response.success) {
          setError(response.message || "Failed to update tax group");
          return;
        }
        navigate("/master-data/taxgroup");
      } else {
        const response = await createTaxGroup(taxGroupData);
        if (!response.success) {
          setError(response.message || "Failed to create tax group");
          return;
        }
        navigate("/master-data/taxgroup");
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
    <div className="space-y-8 bg-[#FBF7EE] p-6 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6 pt-0">
        {/* TITLE */}
        <h1 className="text-3xl font-bold">
          {isViewMode
            ? "View Tax Group"
            : isEditMode
            ? "Edit Tax Group"
            : "Create New Tax Group"}
        </h1>

        {/* FORM */}
        <div className="space-y-6">
          {error && (
            <p className="text-red-600 text-sm">
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold">Tax Group Name<span className="text-red-500">*</span></label>
              <input
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm bg-[#FBF7EE] focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Tax Group Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isViewMode}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold">Symbol<span className="text-red-500">*</span></label>
              <input
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm bg-[#FBF7EE] focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Tax Symbol"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                disabled={isViewMode}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold">Percentage<span className="text-red-500">*</span></label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm bg-[#FBF7EE] focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Percentage of Tax"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                disabled={isViewMode}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold">Country<span className="text-red-500">*</span></label>
              <select
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm bg-[#FBF7EE] focus:outline-none focus:ring-2 focus:ring-yellow-400"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                disabled={isViewMode}
              >
                <option value="">Select Country</option>
                <option value="India">India</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold">State</label>
              <select
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm bg-[#FBF7EE] focus:outline-none focus:ring-2 focus:ring-yellow-400"
                value={stateValue}
                onChange={(e) => setStateValue(e.target.value)}
                disabled={isViewMode}
              >
                <option value="">Select State</option>
                <option value="Telangana">Telangana</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold">City</label>
              <select
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm bg-[#FBF7EE] focus:outline-none focus:ring-2 focus:ring-yellow-400"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={isViewMode}
              >
                <option value="">Select City</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Vijayawada">Vijayawada</option>
              </select>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6">
            <button
              onClick={() => navigate(-1)}
              className="border border-black px-7 py-2 rounded-md text-sm bg-white"
              disabled={loading}
            >
              Cancel
            </button>

            {!isViewMode && (
              <button
                onClick={handleSubmit}
                className="bg-yellow-400 px-8 py-2 rounded-md text-sm font-medium disabled:opacity-50 border border-black"
                disabled={loading}
              >
                {loading ? 'Saving...' : (isEditMode ? "Update" : "Create")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTaxGroupPage;
