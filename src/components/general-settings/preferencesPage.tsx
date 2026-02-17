import { useState, useEffect } from "react";
import { getPreferences, updatePreferences } from "../../services/settingsService";
import { showSuccessToast } from "../../utils/toast";

/* ===== Shared Styles (Figma matched) ===== */
const selectClass =
  "w-full h-[44px] rounded-lg border border-gray-300 bg-[#FFFDF7] px-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400";

const labelClass = "block text-sm font-semibold mb-1";

const PreferencesPage = () => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  // Main preferences fields
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [currency, setCurrency] = useState("INR");

  // Additional settings stored in JSON
  const [currencyPosition, setCurrencyPosition] = useState("Before Amount");
  const [precision, setPrecision] = useState("2 Digits");
  const [decimalSeparator, setDecimalSeparator] = useState("Dot (.)");
  const [thousandsSeparator, setThousandsSeparator] = useState("Comma (,)");
  const [defaultOrderType, setDefaultOrderType] = useState("Dine In");
  const [paymentTiming, setPaymentTiming] = useState("Pre Payment");
  const [roundTotal, setRoundTotal] = useState("Do Not Roundoff");
  const [smsAuto, setSmsAuto] = useState("No");

  // Fetch preferences on mount
  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    setFetching(true);
    setError("");
    try {
      const response = await getPreferences();
      if (response.success && response.data) {
        const prefs = response.data;

        // Set main fields
        setDateFormat(prefs.dateFormat || "DD/MM/YYYY");
        setCurrency(prefs.currency || "INR");

        // Set additional settings from JSON
        if (prefs.settings) {
          setCurrencyPosition(prefs.settings.currencyPosition || "Before Amount");
          setPrecision(prefs.settings.precision || "2 Digits");
          setDecimalSeparator(prefs.settings.decimalSeparator || "Dot (.)");
          setThousandsSeparator(prefs.settings.thousandsSeparator || "Comma (,)");
          setDefaultOrderType(prefs.settings.defaultOrderType || "Dine In");
          setPaymentTiming(prefs.settings.paymentTiming || "Pre Payment");
          setRoundTotal(prefs.settings.roundTotal || "Do Not Roundoff");
          setSmsAuto(prefs.settings.smsAuto || "No");
        }
      } else {
        setError(response.error?.message || "Failed to load preferences");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load preferences");
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await updatePreferences({
        dateFormat,
        currency,
        settings: {
          currencyPosition,
          precision,
          decimalSeparator,
          thousandsSeparator,
          defaultOrderType,
          paymentTiming,
          roundTotal,
          smsAuto,
        },
      });

      if (response.success) {
        showSuccessToast("Preferences saved successfully");
        setShowSuccess(true);
      } else {
        setError(response.error?.message || "Failed to save preferences");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save preferences");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">
          General Preferences
        </h2>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ================= PAGE ================= */}
      <div className="space-y-6 p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">
          General Preferences
        </h2>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {/* Date Format */}
          <div>
            <label className={labelClass}>
              Date Format<span className="text-red-500">*</span>
            </label>
            <select
              className={selectClass}
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              disabled={loading}
            >
              <option>YY/MM/DD</option>
              <option>MM/DD/YYYY</option>
              <option>DD/MM/YYYY</option>
              <option>YYYY/MM/DD</option>
              <option>YYYY-MM-DD</option>
            </select>
          </div>

          {/* Currency */}
          <div>
            <label className={labelClass}>
              Currency<span className="text-red-500">*</span>
            </label>
            <select
              className={selectClass}
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              disabled={loading}
            >
              <option value="INR">₹ (INR)</option>
              <option value="USD">$ (USD)</option>
              <option value="EUR">€ (EUR)</option>
              <option value="GBP">£ (GBP)</option>
            </select>
          </div>

          {/* Currency Position */}
          <div>
            <label className={labelClass}>
              Currency Position<span className="text-red-500">*</span>
            </label>
            <select
              className={selectClass}
              value={currencyPosition}
              onChange={(e) => setCurrencyPosition(e.target.value)}
              disabled={loading}
            >
              <option>Before Amount</option>
              <option>After Amount</option>
            </select>
          </div>

          {/* Precision */}
          <div>
            <label className={labelClass}>
              Precision<span className="text-red-500">*</span>
            </label>
            <select
              className={selectClass}
              value={precision}
              onChange={(e) => setPrecision(e.target.value)}
              disabled={loading}
            >
              <option>2 Digits</option>
              <option>3 Digits</option>
              <option>4 Digits</option>
            </select>
          </div>

          {/* Decimal Separator */}
          <div>
            <label className={labelClass}>
              Decimal Separator<span className="text-red-500">*</span>
            </label>
            <select
              className={selectClass}
              value={decimalSeparator}
              onChange={(e) => setDecimalSeparator(e.target.value)}
              disabled={loading}
            >
              <option>Dot (.)</option>
              <option>Comma (,)</option>
            </select>
          </div>

          {/* Thousands Separator */}
          <div>
            <label className={labelClass}>
              Thousands Separator<span className="text-red-500">*</span>
            </label>
            <select
              className={selectClass}
              value={thousandsSeparator}
              onChange={(e) => setThousandsSeparator(e.target.value)}
              disabled={loading}
            >
              <option>Comma (,)</option>
              <option>Dot (.)</option>
            </select>
          </div>

          {/* Default Order Type */}
          <div>
            <label className={labelClass}>
              Default Order Type<span className="text-red-500">*</span>
            </label>
            <select
              className={selectClass}
              value={defaultOrderType}
              onChange={(e) => setDefaultOrderType(e.target.value)}
              disabled={loading}
            >
              <option>Dine In</option>
              <option>Take Away</option>
              <option>Catering</option>
              <option>Subscription</option>
              <option>Online</option>
            </select>
          </div>

          {/* Pre/Post Payment */}
          <div>
            <label className={labelClass}>
              Pre or Post POS Payment<span className="text-red-500">*</span>
            </label>
            <select
              className={selectClass}
              value={paymentTiming}
              onChange={(e) => setPaymentTiming(e.target.value)}
              disabled={loading}
            >
              <option>Pre Payment</option>
              <option>Post Payment</option>
            </select>
          </div>

          {/* Round Total */}
          <div>
            <label className={labelClass}>
              Round Total Bill Amount<span className="text-red-500">*</span>
            </label>
            <select
              className={selectClass}
              value={roundTotal}
              onChange={(e) => setRoundTotal(e.target.value)}
              disabled={loading}
            >
              <option>Do Not Roundoff</option>
              <option>Round Up</option>
              <option>Round Down</option>
            </select>
          </div>

          {/* SMS Auto */}
          <div>
            <label className={labelClass}>
              SMS Send Auto<span className="text-red-500">*</span>
            </label>
            <select
              className={selectClass}
              value={smsAuto}
              onChange={(e) => setSmsAuto(e.target.value)}
              disabled={loading}
            >
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6">
          <button
            className="h-[44px] px-6 rounded-lg border border-gray-300 w-full sm:w-auto disabled:opacity-50"
            onClick={fetchPreferences}
            disabled={loading}
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="h-[44px] px-6 rounded-lg bg-yellow-400 font-semibold w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-800"></div>
            )}
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* ================= SUCCESS MODAL ================= */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
          <div className="flex min-h-screen items-center justify-center px-4">
            <div className="relative bg-white rounded-xl w-full max-w-sm p-6 text-center shadow-xl">
              <button
                onClick={() => setShowSuccess(false)}
                className="absolute right-4 top-4 text-gray-400 hover:text-black"
              >
                ✕
              </button>

              <h3 className="text-lg sm:text-xl font-semibold mb-2">
                Preferences Updated
              </h3>

              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center text-white text-2xl">
                  ✓
                </div>
              </div>

              <p className="text-sm text-gray-600">
                General Preferences Updated Successfully!
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PreferencesPage;
