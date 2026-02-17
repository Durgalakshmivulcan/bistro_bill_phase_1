import { useEffect, useRef, useState } from "react";
import Modal from "../../../ui/Modal";
import {
  SubCategory,
  Category,
  getCategories,
  createSubCategory,
  updateSubCategory,
} from "../../../../services/catalogService";

interface Props {
  open: boolean;
  data: SubCategory | null;
  onClose: () => void;
  onSuccess: (type: "created" | "updated") => void;
}

export default function AddEditSubCategoryModal({
  open,
  data,
  onClose,
  onSuccess,
}: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [saving, setSaving] = useState(false);

  /* ---------------- LOAD CATEGORIES ---------------- */
  useEffect(() => {
    if (open) {
      loadCategories();
    }
  }, [open]);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await getCategories();
      if (response.success && response.data) {
        setCategories(response.data.categories || []);
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  /* ---------------- PREFILL ON EDIT ---------------- */
  useEffect(() => {
    if (data) {
      setImagePreview(data.image || null);
      setImageFile(null);
      setName(data.name);
      setCategoryId(data.categoryId);
      setStatus(data.status);
      setDescription(data.description || "");
    } else {
      setImagePreview(null);
      setImageFile(null);
      setName("");
      setCategoryId("");
      setStatus("active");
      setDescription("");
    }
  }, [data, open]);

  if (!open) return null;

  /* ---------------- IMAGE UPLOAD ---------------- */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  /* ---------------- SAVE ---------------- */
  const handleSave = async () => {
    try {
      setSaving(true);
      if (data) {
        const response = await updateSubCategory(
          data.id,
          { name, categoryId, status, description },
          imageFile || undefined
        );
        if (response.success) {
          onSuccess("updated");
        }
      } else {
        const response = await createSubCategory(
          { name, categoryId, status, description },
          imageFile || undefined
        );
        if (response.success) {
          onSuccess("created");
        }
      }
    } catch (error) {
      console.error("Failed to save sub-category:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} className="w-[900px] p-8">
      <h2 className="text-2xl font-bold mb-6">
        {data ? "Edit Sub-Category" : "Add Sub-Category"}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ================= IMAGE UPLOAD ================= */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Sub-Category Image<span className="text-red-500">*</span>
          </label>

          <div className="border-2 border-dashed rounded-lg p-4 text-center">
            {imagePreview ? (
              <img
                src={imagePreview}
                className="w-full h-40 object-cover rounded"
                alt="preview"
              />
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="bg-yellow-400 px-4 py-2 rounded"
              >
                Upload Image
              </button>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg"
              hidden
              onChange={handleImageChange}
            />

            <p className="text-xs text-gray-500 mt-3">
              (Recommended size: 400x260 to 600x300, JPG or PNG)
            </p>
          </div>
        </div>

        {/* ================= FORM ================= */}
        <div className="lg:col-span-2 space-y-4">
          {/* NAME + CATEGORY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">
                Sub-Category Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter Sub-Category Name"
                className="w-full border rounded px-3 py-2 mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full border rounded px-3 py-2 mt-1"
                disabled={loadingCategories}
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* STATUS */}
          <div>
            <label className="text-sm font-medium">Status</label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "active" | "inactive")
              }
              className="w-full border rounded px-3 py-2 mt-1"
            >
              <option value="">Select Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add Description"
              className="w-full border rounded px-3 py-2 mt-1 h-24 resize-none"
            />
          </div>
        </div>
      </div>

      {/* ================= ACTIONS ================= */}
      <div className="flex justify-end gap-3 mt-8">
        <button
          onClick={onClose}
          className="border px-6 py-2 rounded"
          disabled={saving}
        >
          Cancel
        </button>

        <button
          onClick={handleSave}
          className="bg-yellow-400 px-6 py-2 rounded"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </Modal>
  );
}
