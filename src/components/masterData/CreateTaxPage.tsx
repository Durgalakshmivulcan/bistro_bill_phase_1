import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import Input from "../form/Input";
import Select from "../form/Select";
import Modal from "../ui/Modal";
import { createTax, updateTax, getTaxes, getProfile, Tax } from "../../services/settingsService";
import { getCountries, getStates, getCities } from "../../services/geographyService";

// Images
import createSuccessImg from "../../assets/tick.png";
import updateSuccessImg from "../../assets/tick.png";

type SuccessType = "create" | "edit" | null;

const TAX_LIST_ROUTE = "/master-data/taxes";

const CreateTaxPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // MODES
  const isEditMode = window.location.pathname.includes("/edit");
  const isViewMode = window.location.pathname.includes("/view");

  // FORM STATE
  const [taxName, setTaxName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [percentage, setPercentage] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");

  // GEOGRAPHY STATE
  const countries = getCountries();
  const states = country ? getStates(country) : [];
  const cities = country && state ? getCities(country, state) : [];

  // UI STATE
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingTax, setLoadingTax] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successType, setSuccessType] = useState<SuccessType>(null);

  // Load business profile defaults for new tax creation
  useEffect(() => {
    if (!isEditMode && !isViewMode) {
      loadBusinessDefaults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch tax data if in edit/view mode
  useEffect(() => {
    if ((isEditMode || isViewMode) && id) {
      fetchTax(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode, isViewMode]);

  const loadBusinessDefaults = async () => {
    try {
      const response = await getProfile();
      if (response.success && response.data) {
        const profile = response.data;
        if (profile.country) setCountry(profile.country);
        if (profile.state) setState(profile.state);
        if (profile.city) setCity(profile.city);
      }
    } catch {
      // Silently fail — defaults will just be empty
    }
  };

  const fetchTax = async (taxId: string) => {
    try {
      setLoadingTax(true);
      const response = await getTaxes();
      if (response.success && response.data) {
        const tax = response.data.find((t: Tax) => t.id === taxId);
        if (tax) {
          setTaxName(tax.name);
          setSymbol(tax.symbol || "");
          setPercentage(tax.percentage.toString());
          setCountry(tax.country || "");
          setState(tax.state || "");
          setCity(tax.city || "");
        } else {
          setError("Tax not found");
        }
      }
    } catch (err) {
      console.error('Error fetching tax:', err);
      setError('Failed to load tax data');
    } finally {
      setLoadingTax(false);
    }
  };

  // Reset dependent fields when parent changes
  const handleCountryChange = (value: string) => {
    setCountry(value);
    setState("");
    setCity("");
  };

  const handleStateChange = (value: string) => {
    setState(value);
    setCity("");
  };

  // ---------------- HANDLERS ----------------

  const validateForm = () => {
    if (!taxName || !symbol || !percentage) {
      setError("Please fill all required fields.");
      return false;
    }

    const percentageNum = parseFloat(percentage);
    if (isNaN(percentageNum) || percentageNum < 0 || percentageNum > 100) {
      setError("Please enter a valid percentage (0-100)");
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

      const taxData = {
        name: taxName,
        symbol,
        percentage: parseFloat(percentage),
        country: country || undefined,
        state: state || undefined,
        city: city || undefined,
        status: 'active'
      };

      if (isEditMode && id) {
        const response = await updateTax(id, taxData);
        if (response.success) {
          setSuccessType("edit");
          setShowSuccess(true);
        } else {
          setError(response.message || "Failed to update tax");
        }
      } else {
        const response = await createTax(taxData);
        if (response.success) {
          setSuccessType("create");
          setShowSuccess(true);
        } else {
          setError(response.message || "Failed to create tax");
        }
      }
    } catch (err) {
      console.error('Error saving tax:', err);
      setError('An error occurred while saving the tax');
    } finally {
      setLoading(false);
    }
  };

  // ---------------- HELPERS ----------------

  const getSuccessTitle = () => {
    return isEditMode ? "Tax Updated" : "Tax Created";
  };

  const getSuccessMessage = () => {
    return isEditMode
      ? "Tax updated successfully."
      : "Tax created successfully.";
  };

  const getSuccessImage = () => {
    return isEditMode ? updateSuccessImg : createSuccessImg;
  };

  const toOptions = (items: string[]) =>
    items.map((item) => ({ label: item, value: item }));

  // ---------------- RENDER ----------------

  if (loadingTax) {
    return (
      <div className="space-y-8 bg-bb-bg p-6 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-600">Loading tax data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-bb-bg p-6 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* TITLE */}
        <h1 className="text-2xl md:text-3xl font-semibold">
          {isViewMode ? "View Tax" : isEditMode ? "Edit Tax" : "Create Tax"}
        </h1>

        {/* FORM CARD */}
        <div className="rounded-xl p-6 space-y-6">
          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input
              label="Tax Name"
              required
              disabled={isViewMode}
              value={taxName}
              onChange={(val) => setTaxName(val)}
              placeholder="Tax Name"
            />

            <Input
              label="Symbol"
              required
              disabled={isViewMode}
              value={symbol}
              onChange={(val) => setSymbol(val)}
              placeholder="Tax Symbol"
            />

            <Input
              label="Percentage"
              required
              disabled={isViewMode}
              value={percentage}
              onChange={(val) => setPercentage(val)}
              placeholder="Percentage of Tax"
            />

            <Select
              label="Country"
              disabled={isViewMode}
              value={country}
              onChange={handleCountryChange}
              options={toOptions(countries)}
            />

            <Select
              label="State"
              disabled={isViewMode || !country}
              value={state}
              onChange={handleStateChange}
              options={states.length > 0 ? toOptions(states) : [{ label: country ? 'No states available' : 'Select a country first', value: '' }]}
            />

            <Select
              label="City"
              disabled={isViewMode || !state}
              value={city}
              onChange={(val) => setCity(val)}
              options={cities.length > 0 ? toOptions(cities) : [{ label: state ? 'No cities available' : 'Select a state first', value: '' }]}
            />
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
          <h2 className="text-2xl font-bold mb-4">{getSuccessTitle()}</h2>

          <div className="flex justify-center mb-4">
            <img src={getSuccessImage()} alt="success" className="w-16 h-16" />
          </div>

          <p className="text-sm text-gray-600">{getSuccessMessage()}</p>
        </Modal>
      )}
    </div>
  );
};

export default CreateTaxPage;
