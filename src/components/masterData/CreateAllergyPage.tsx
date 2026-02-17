import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import Modal from "../../components/ui/Modal";
import Input from "../../components/form/Input";
import {
  getAllergies,
  createAllergy,
  updateAllergy,
  Allergen,
} from "../../services/masterDataService";

// Images
import createSuccessImg from "../../assets/tick.png";
import updateSuccessImg from "../../assets/tick.png";

type SuccessType = "create" | "edit" | null;

const CreateAllergyPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // MODES
  const isEditMode = window.location.pathname.includes("/edit");
  const isViewMode = window.location.pathname.includes("/view");

  // FORM STATE
  const [name, setName] = useState("");

  // UI STATE
  const [showSuccess, setShowSuccess] = useState<SuccessType>(null);
  const [error, setError] = useState("");
  const [pageLoading, setPageLoading] = useState(!!(isEditMode || isViewMode));
  const [submitting, setSubmitting] = useState(false);

  // Load allergen data in edit/view mode
  useEffect(() => {
    if (!id || (!isEditMode && !isViewMode)) return;
    setPageLoading(true);
    getAllergies()
      .then((res) => {
        if (res.success && res.data) {
          const allergen = res.data.allergens.find((a: Allergen) => a.id === id);
          if (allergen) {
            setName(allergen.name);
          } else {
            setError("Allergen not found");
          }
        } else {
          setError("Failed to load allergen");
        }
      })
      .catch(() => setError("Failed to load allergen"))
      .finally(() => setPageLoading(false));
  }, [id, isEditMode, isViewMode]);

  // ---------------- HANDLERS ----------------

  const validateForm = () => {
    if (!name.trim()) {
      setError("Please enter allergen name.");
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
        const res = await updateAllergy(id, { name: name.trim() });
        if (res.success) {
          setShowSuccess("edit");
        } else {
          setError(res.message || "Failed to update allergen");
        }
      } else {
        const res = await createAllergy({ name: name.trim() });
        if (res.success) {
          setShowSuccess("create");
        } else {
          setError(res.message || "Failed to create allergen");
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
    return showSuccess === "create" ? "Allergen Created" : "Details Updated";
  };

  const getSuccessMessage = () => {
    return showSuccess === "create"
      ? "New allergen created successfully."
      : "Allergen updated successfully.";
  };

  const getSuccessImage = () => {
    return showSuccess === "create" ? createSuccessImg : updateSuccessImg;
  };

  // ---------------- RENDER ----------------

  if (pageLoading) {
    return <div className="text-center py-8 text-bb-textSoft">Loading allergen...</div>;
  }

  return (
      <div className="p-6 bg-[#FFFDF5] min-h-screen">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-2xl md:text-3xl font-semibold">
              {isViewMode
                ? "View Allergen"
                : isEditMode
                ? "Edit Allergen"
                : "Create New Allergen"}
            </h1>
          </div>

          {/* CARD */}
          <div className="rounded-xl p-6 space-y-6">

            {error && (
              <p className="text-red-600 text-sm">
                {error}
              </p>
            )}

            {/* INPUT */}
            <div className="max-w-md">
              <Input
                label="Allergen Name"
                required
                disabled={isViewMode}
                value={name}
                onChange={(val: any) => setName(val)}
              />
            </div>

            {/* ACTIONS */}
            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6">
              <button
                onClick={() =>
                  navigate(-1)
                }
                className="border px-6 py-2 rounded-md"
              >
                Cancel
              </button>

              {!isViewMode && (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-yellow-400 px-6 py-2 rounded-md font-medium disabled:opacity-50"
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
        {showSuccess && (
          <Modal
            open={true}
            onClose={() => {
              setShowSuccess(null);
              navigate(-1);
            }}
            className="w-[90%] max-w-md p-6 text-center"
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

export default CreateAllergyPage;
