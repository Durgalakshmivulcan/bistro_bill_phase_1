import DashboardLayout from "../../layout/DashboardLayout";
import { useNavigate, useParams } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import Modal from "../../components/ui/Modal";
import Input from "../../components/form/Input";
import {
  getBlogCategories,
  createBlogCategoryApi,
  updateBlogCategoryApi,
} from "../../services/blogService";

// Images
import createSuccessImg from "../../assets/tick.png";
import updateSuccessImg from "../../assets/tick.png";
import activateImg from "../../assets/activated.png";
import deactivateImg from "../../assets/deactivated.png";
import confirmImg from "../../assets/activate-success.png";

type SuccessType =
  | "create"
  | "edit"
  | "activate"
  | "deactivate"
  | null;

const CATEGORY_LIST_ROUTE = "/blog-management/categories";

const CreateBlogCategoryPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // MODES
  const isEditMode = window.location.pathname.includes("/edit");
  const isViewMode = window.location.pathname.includes("/view");

  // DATA STATE
  const [loading, setLoading] = useState(isEditMode || isViewMode);
  const [saving, setSaving] = useState(false);

  // FORM STATE
  const [name, setName] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);

  // MODALS
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successType, setSuccessType] = useState<SuccessType>(null);
  const [error, setError] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);

  // LOAD CATEGORY DATA FOR EDIT/VIEW
  useEffect(() => {
    if (!id || (!isEditMode && !isViewMode)) return;

    const loadCategory = async () => {
      try {
        setLoading(true);
        const response = await getBlogCategories();
        if (response.success && response.data) {
          const found = response.data.categories.find((c) => c.id === id);
          if (found) {
            setName(found.name);
            setIsActive(found.status === "Active");
          } else {
            setError("Category not found");
          }
        } else {
          setError(response.error?.message || "Failed to load category");
        }
      } catch (err) {
        setError("Failed to load category. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadCategory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ---------------- HANDLERS ----------------

  const validateForm = () => {
    if (!name.trim()) {
      setError("Please enter a category name.");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      setSaving(true);
      setError("");

      if (isEditMode && id) {
        const response = await updateBlogCategoryApi(id, { name: name.trim() });
        if (response.success) {
          setSuccessType("edit");
          setShowSuccess(true);
        } else {
          setError(response.error?.message || "Failed to update category");
        }
      } else {
        const response = await createBlogCategoryApi({ name: name.trim() });
        if (response.success) {
          setSuccessType("create");
          setShowSuccess(true);
        } else {
          setError(response.error?.message || "Failed to create category");
        }
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = () => {
    setShowConfirm(true);
  };

  const confirmToggleStatus = async () => {
    if (!id) return;
    try {
      setSaving(true);
      const newStatus = isActive ? "Inactive" : "Active";
      const response = await updateBlogCategoryApi(id, { status: newStatus });
      if (response.success) {
        setIsActive(!isActive);
        setShowConfirm(false);
        setSuccessType(!isActive ? "activate" : "deactivate");
        setShowSuccess(true);
      } else {
        setError(response.error?.message || "Failed to update status");
        setShowConfirm(false);
      }
    } catch (err) {
      setError("Failed to update status. Please try again.");
      setShowConfirm(false);
    } finally {
      setSaving(false);
    }
  };

  // ---------------- HELPERS ----------------

  const getSuccessTitle = () => {
    switch (successType) {
      case "create":
        return "Category Created";
      case "edit":
        return "Category Updated";
      case "activate":
        return "Category Activated";
      case "deactivate":
        return "Category Deactivated";
      default:
        return "Success";
    }
  };

  const getSuccessMessage = () => {
    switch (successType) {
      case "create":
        return "Blog category created successfully.";
      case "edit":
        return "Blog category updated successfully.";
      case "activate":
        return "Category activated successfully.";
      case "deactivate":
        return "Category deactivated successfully.";
      default:
        return "";
    }
  };

  const getSuccessImage = () => {
    switch (successType) {
      case "create":
        return createSuccessImg;
      case "edit":
        return updateSuccessImg;
      case "activate":
        return activateImg;
      case "deactivate":
        return deactivateImg;
      default:
        return "";
    }
  };

  // ---------------- RENDER ----------------

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 bg-[#FFFDF5] min-h-screen flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bb-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 bg-[#FFFDF5] min-h-screen">
        <div className="max-w-6xl mx-auto space-y-10">

          {/* HEADER */}
          <h1 className="text-3xl font-semibold text-gray-500">
            {isViewMode
              ? "View Blog Category"
              : isEditMode
              ? "Edit Blog Category"
              : "Create Blog Category"}
          </h1>

          {/* FORM ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

            {/* CATEGORY NAME */}
            <Input
              label="Category Name"
              required
              disabled={isViewMode}
              value={name}
              onChange={(value) => setName(value)}
            />

            {/* CATEGORY IMAGE */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Category Image
              </label>

              <div className="flex items-center gap-4">
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="w-24 h-14 object-cover rounded border"
                  />
                )}

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png, image/jpeg"
                  disabled={isViewMode}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImagePreview(
                        URL.createObjectURL(file)
                      );
                    }
                  }}
                />

                {!isViewMode && (
                  <button
                    onClick={() =>
                      fileRef.current?.click()
                    }
                    className="border px-4 py-2 rounded-md text-sm bg-white hover:bg-gray-50"
                  >
                    Upload category Image
                  </button>
                )}
              </div>
            </div>
          </div>

          {error && (
            <p className="text-red-600 text-sm">
              {error}
            </p>
          )}

          {/* ACTION BAR */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pt-10">

            {/* LEFT BUTTON */}
            {(isEditMode || isViewMode) && (
              <button
                onClick={handleToggleStatus}
                disabled={saving}
                className={`px-8 py-2 rounded-md font-medium disabled:opacity-50 ${
                  isActive
                    ? "bg-black text-white"
                    : "bg-green-600 text-white"
                }`}
              >
                {isActive ? "Deactivate" : "Activate"}
              </button>
            )}

            {/* RIGHT BUTTONS */}
            <div className="flex gap-4 justify-end">
              <button
                onClick={() =>
                  navigate(CATEGORY_LIST_ROUTE)
                }
                className="border px-8 py-2 rounded-md bg-white"
              >
                Cancel
              </button>

              {!isViewMode && (
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="bg-yellow-400 px-8 py-2 rounded-md font-medium disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : isEditMode
                    ? "Update"
                    : "Create"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* CONFIRM MODAL */}
        {showConfirm && (
          <Modal
            open={showConfirm}
            onClose={() => setShowConfirm(false)}
            className="w-[90%] max-w-md p-6 text-center"
          >
            <h2 className="text-2xl font-bold mb-4">
              {isActive
                ? "Deactivate Category"
                : "Activate Category"}
            </h2>

            <div className="flex justify-center mb-4">
              <img
                src={confirmImg}
                alt="confirm"
                className="w-16 h-16"
              />
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to{" "}
              {isActive ? "deactivate" : "activate"} this
              category?
            </p>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="border px-6 py-2 rounded"
                disabled={saving}
              >
                Cancel
              </button>

              <button
                onClick={confirmToggleStatus}
                disabled={saving}
                className="bg-yellow-400 px-6 py-2 rounded font-medium disabled:opacity-50"
              >
                {saving ? "Saving..." : "Yes"}
              </button>
            </div>
          </Modal>
        )}

        {/* SUCCESS MODAL */}
        {showSuccess && successType && (
          <Modal
            open={showSuccess}
            onClose={() => {
              setShowSuccess(false);
              navigate(CATEGORY_LIST_ROUTE);
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
    </DashboardLayout>
  );
};

export default CreateBlogCategoryPage;
