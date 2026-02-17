import { useEffect, useRef, useState } from "react";
import Modal from "../../../ui/Modal";
import { Category, createCategory, updateCategory } from "../../../../services/catalogService";

interface Props {
  open: boolean;
  data: Category | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddEditCategoryModal({
  open,
  data,
  onClose,
  onSuccess,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setName(data.name);
      setDescription(data.description || "");
      setStatus(data.status);
      setImagePreview(data.image || null);
      setImageFile(null);
    } else {
      setName("");
      setDescription("");
      setStatus("active");
      setImagePreview(null);
      setImageFile(null);
    }
    setError(null);
  }, [data, open]);

  const handleImageSelect = (file?: File) => {
    if (!file) return;
    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const handleSave = async () => {
    // Basic validation
    if (!name.trim()) {
      setError("Category name is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (data) {
        // Edit mode - update category
        const response = await updateCategory(
          data.id,
          {
            name: name.trim(),
            description: description.trim() || undefined,
            status,
          },
          imageFile || undefined
        );

        if (response.success) {
          onSuccess();
        } else {
          setError(response.message || "Failed to update category");
        }
      } else {
        // Add mode - create category
        const response = await createCategory(
          {
            name: name.trim(),
            description: description.trim() || undefined,
            status,
          },
          imageFile || undefined
        );

        if (response.success) {
          onSuccess();
        } else {
          setError(response.message || "Failed to create category");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="w-[760px] p-6"
    >
      <h2 className="text-2xl font-bold mb-6">
        {data ? "Edit Category" : "Add Category"}
      </h2>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="flex gap-6">
        {/* IMAGE UPLOAD */}
        <div className="w-[240px]">
          <label className="text-sm font-medium">
            Category Image<span className="text-red-500">*</span>
          </label>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 border-2 border-dashed border-yellow-400 rounded-lg p-4 text-center cursor-pointer"
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-[140px] object-cover rounded"
              />
            ) : (
              <>
                <button
                  type="button"
                  className="bg-yellow-400 px-4 py-2 rounded text-sm"
                >
                  Upload Image
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  (400×260 – 600×300 JPG / PNG)
                </p>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept="image/png,image/jpeg"
            onChange={(e) =>
              handleImageSelect(e.target.files?.[0])
            }
          />
        </div>

        {/* FORM */}
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">
                Category Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter Category Name"
                className="w-full border px-3 py-2 rounded mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
                className="w-full border px-3 py-2 rounded mt-1"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">
              Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add Description"
              className="w-full border px-3 py-2 rounded mt-1 resize-none"
            />
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onClose}
          className="border px-6 py-2 rounded"
          disabled={saving}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="bg-yellow-400 px-6 py-2 rounded disabled:opacity-50"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </Modal>
  );
}
