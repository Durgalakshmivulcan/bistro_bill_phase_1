import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import Input from "../form/Input";
import Modal from "../ui/Modal";
import {
  getMeasuringUnits,
  createMeasuringUnit,
  updateMeasuringUnit,
  MeasuringUnit,
} from "../../services/masterDataService";

// Images
import createSuccessImg from "../../assets/tick.png";
import updateSuccessImg from "../../assets/tick.png";

type SuccessType = "create" | "edit" | null;

const MEASURING_LIST_ROUTE = "/master-data/measuring-units";

const CreateMeasuringPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // MODES
  const isEditMode = window.location.pathname.includes("/edit");
  const isViewMode = window.location.pathname.includes("/view");

  // FORM STATE
  const [quantity, setQuantity] = useState("");
  const [unitName, setUnitName] = useState("");
  const [symbol, setSymbol] = useState("");

  // UI STATE
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successType, setSuccessType] = useState<SuccessType>(null);
  const [pageLoading, setPageLoading] = useState(!!(isEditMode || isViewMode));
  const [submitting, setSubmitting] = useState(false);

  // Load measuring unit data in edit/view mode
  useEffect(() => {
    if (!id || (!isEditMode && !isViewMode)) return;
    setPageLoading(true);
    getMeasuringUnits()
      .then((res) => {
        if (res.success && res.data) {
          const unit = res.data.measuringUnits.find((m: MeasuringUnit) => m.id === id);
          if (unit) {
            setQuantity(unit.quantity);
            setUnitName(unit.unit);
            setSymbol(unit.symbol);
          } else {
            setError("Measuring unit not found");
          }
        } else {
          setError("Failed to load measuring unit");
        }
      })
      .catch(() => setError("Failed to load measuring unit"))
      .finally(() => setPageLoading(false));
  }, [id, isEditMode, isViewMode]);

  // ---------------- HANDLERS ----------------

  const validateForm = () => {
    if (!quantity.trim() || !unitName.trim() || !symbol.trim()) {
      setError("Please fill all required fields.");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setError("");
    setSubmitting(true);
    try {
      if (isEditMode && id) {
        const res = await updateMeasuringUnit(id, {
          quantity: quantity.trim(),
          unit: unitName.trim(),
          symbol: symbol.trim(),
        });
        if (res.success) {
          setSuccessType("edit");
          setShowSuccess(true);
        } else {
          setError(res.message || "Failed to update measuring unit");
        }
      } else {
        const res = await createMeasuringUnit({
          quantity: quantity.trim(),
          unit: unitName.trim(),
          symbol: symbol.trim(),
        });
        if (res.success) {
          setSuccessType("create");
          setShowSuccess(true);
        } else {
          setError(res.message || "Failed to create measuring unit");
        }
      }
    } catch {
      setError("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------- HELPERS ----------------

  const getSuccessTitle = () => {
    return isEditMode
      ? "Measuring Unit Updated"
      : "Measuring Unit Created";
  };

  const getSuccessMessage = () => {
    return isEditMode
      ? "Measuring unit updated successfully."
      : "Measuring unit created successfully.";
  };

  const getSuccessImage = () => {
    return isEditMode
      ? updateSuccessImg
      : createSuccessImg;
  };

  // ---------------- RENDER ----------------

  if (pageLoading) {
    return <div className="text-center py-8 text-bb-textSoft">Loading measuring unit...</div>;
  }

  return (
    <div className="space-y-8 bg-bb-bg p-6 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* TITLE */}
        <h1 className="text-2xl md:text-3xl font-semibold">
          {isViewMode
            ? "View Measuring Unit"
            : isEditMode
            ? "Edit Measuring Unit"
            : "Create Measuring Unit"}
        </h1>

        {/* FORM CARD */}
        <div className="rounded-xl p-6 space-y-6">
          {error && (
            <p className="text-red-600 text-sm">
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input
              label="Measuring Quantity Name"
              required
              disabled={isViewMode}
              value={quantity}
              onChange={(val) =>
                setQuantity(val)
              }
              placeholder="Measuring Quantity Name"
            />

            <Input
              label="Unit"
              required
              disabled={isViewMode}
              value={unitName}
              onChange={(val) =>
                setUnitName(val)
              }
              placeholder="Unit"
            />

            <Input
              label="Symbol"
              required
              disabled={isViewMode}
              value={symbol}
              onChange={(val) =>
                setSymbol(val)
              }
              placeholder="Unit Symbol"
            />
          </div>

          {/* ACTIONS */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6">
            <button
              onClick={() =>
                navigate(-1)
              }
              className="border px-6 py-2 rounded-md text-sm"
            >
              Cancel
            </button>

            {!isViewMode && (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-yellow-400 px-6 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              >
                {submitting
                  ? isEditMode ? "Updating..." : "Creating..."
                  : isEditMode ? "Update" : "Create"}
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

export default CreateMeasuringPage;
