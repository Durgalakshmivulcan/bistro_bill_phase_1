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
import { useAuth } from "../../contexts/AuthContext";
import {
  getBusinessOwners,
  BusinessOwnerListItem,
} from "../../services/superAdminService";
import { getSelectedBoId, setSelectedBoId } from "../../services/saReportContext";

const CreateTaxGroupPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isSuperAdmin = user?.userType === "SuperAdmin";

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
  const [availableTaxes, setAvailableTaxes] = useState<Tax[]>([]);
  const [selectedBo, setSelectedBo] = useState<string>(getSelectedBoId() || "");
  const [boList, setBoList] = useState<BusinessOwnerListItem[]>([]);
  const [boLoading, setBoLoading] = useState(false);

  // UI STATE
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // Fetch available taxes and tax group data
  useEffect(() => {
    const loadBusinessOwners = async () => {
      if (!isSuperAdmin) return;
      setBoLoading(true);
      try {
        const res = await getBusinessOwners({ limit: 100 });
        if (res.success && res.data) {
          setBoList(res.data.businessOwners);
        }
      } finally {
        setBoLoading(false);
      }
    };

    loadBusinessOwners();
  }, [isSuperAdmin]);

  useEffect(() => {
    if (isSuperAdmin && !selectedBo) {
      setAvailableTaxes([]);
      if (isEditMode || isViewMode) {
        setError("Select a restaurant to load this tax group.");
      }
      setLoadingData(false);
      return;
    }

    fetchTaxes();
    if ((isEditMode || isViewMode) && id) {
      fetchTaxGroup(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode, isViewMode, isSuperAdmin, selectedBo]);

  const fetchTaxes = async () => {
    try {
      const response = await getTaxes({ status: "active" });
      if (response.success && response.data) {
        setAvailableTaxes(response.data);
      } else {
        setError(response.message || "Failed to load taxes");
      }
    } catch (err) {
      console.error("Error fetching taxes:", err);
      setError(err instanceof Error ? err.message : "Failed to load taxes");
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
          setSymbol(taxGroup.symbol || taxGroup.taxGroupItems?.map(item => item.tax.symbol || item.tax.name).join(" + ") || "");
          const totalPerc =
            taxGroup.percentage ??
            (taxGroup.taxGroupItems?.reduce((sum, i) => sum + i.tax.percentage, 0) || 0);
          setPercentage(totalPerc.toString());
          setCountry(taxGroup.country || taxGroup.taxGroupItems?.[0]?.tax.country || "");
          setStateValue(taxGroup.state || taxGroup.taxGroupItems?.[0]?.tax.state || "");
          setCity(taxGroup.city || taxGroup.taxGroupItems?.[0]?.tax.city || "");
          setSelectedTaxIds(taxGroup.taxGroupItems?.map(item => item.taxId) || []);
        } else {
          setError("Tax group not found");
        }
      }
    } catch (err) {
      console.error('Error fetching tax group:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tax group data');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    const selectedTaxes = availableTaxes.filter((tax) => selectedTaxIds.includes(tax.id));
    if (selectedTaxes.length === 0) {
      setSymbol("");
      setPercentage("");
      setCountry("");
      setStateValue("");
      setCity("");
      return;
    }

    setSymbol(selectedTaxes.map((tax) => tax.symbol || tax.name).join(" + "));
    setPercentage(
      selectedTaxes.reduce((sum, tax) => sum + Number(tax.percentage || 0), 0).toString()
    );
    setCountry(selectedTaxes[0]?.country || "");
    setStateValue(selectedTaxes[0]?.state || "");
    setCity(selectedTaxes[0]?.city || "");
  }, [availableTaxes, selectedTaxIds]);

  // ---------------- HANDLERS ----------------

  const validateForm = () => {
    if (isSuperAdmin && !selectedBo) {
      setError("Select a restaurant before saving.");
      return false;
    }

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

  const handleBusinessOwnerChange = (boId: string) => {
    setSelectedBo(boId);
    setSelectedBoId(boId || null);
  };

  const handleTaxToggle = (taxId: string) => {
    if (isViewMode) return;
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
        {isSuperAdmin && (
          <div className="bg-white border rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Restaurant Context
            </label>
            <select
              value={selectedBo}
              onChange={(e) => handleBusinessOwnerChange(e.target.value)}
              className="w-full md:w-80 border rounded-md px-3 py-2 text-sm bg-white"
              disabled={boLoading}
            >
              <option value="">-- Select a Restaurant --</option>
              {boList.map((bo) => (
                <option key={bo.id} value={bo.id}>
                  {bo.restaurantName} ({bo.ownerName})
                </option>
              ))}
            </select>
          </div>
        )}

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
              <label className="text-sm font-semibold">Symbol</label>
              <input
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm bg-[#FBF7EE] focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Auto-generated from selected taxes"
                value={symbol}
                readOnly
                disabled
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold">Percentage</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm bg-[#FBF7EE] focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Auto-calculated from selected taxes"
                value={percentage}
                readOnly
                disabled
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold">Country</label>
              <input
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm bg-[#FBF7EE] focus:outline-none focus:ring-2 focus:ring-yellow-400"
                value={country}
                readOnly
                disabled
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold">State</label>
              <input
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm bg-[#FBF7EE] focus:outline-none focus:ring-2 focus:ring-yellow-400"
                value={stateValue}
                readOnly
                disabled
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold">City</label>
              <input
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm bg-[#FBF7EE] focus:outline-none focus:ring-2 focus:ring-yellow-400"
                value={city}
                readOnly
                disabled
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-semibold">
                Taxes in Group<span className="text-red-500">*</span>
              </label>
              {!isViewMode && availableTaxes.length > 0 && (
                <span className="text-xs text-gray-500">
                  Select one or more active taxes
                </span>
              )}
            </div>

            <div className="border border-gray-300 rounded-md bg-white p-4 max-h-64 overflow-y-auto">
              {availableTaxes.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No active taxes found. Create taxes first before creating a tax group.
                </p>
              ) : (
                <div className="space-y-3">
                  {availableTaxes.map((tax) => (
                    <label
                      key={tax.id}
                      className={`flex items-start gap-3 rounded-md border p-3 ${
                        selectedTaxIds.includes(tax.id)
                          ? "border-yellow-400 bg-yellow-50"
                          : "border-gray-200"
                      } ${isViewMode ? "cursor-default" : "cursor-pointer"}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTaxIds.includes(tax.id)}
                        onChange={() => handleTaxToggle(tax.id)}
                        disabled={isViewMode}
                        className="mt-1"
                      />
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {tax.name} {tax.symbol ? `(${tax.symbol})` : ""}
                        </div>
                        <div className="text-gray-600">
                          {tax.percentage}%{tax.country ? ` | ${tax.country}` : ""}
                          {tax.state ? ` | ${tax.state}` : ""}
                          {tax.city ? ` | ${tax.city}` : ""}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
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
