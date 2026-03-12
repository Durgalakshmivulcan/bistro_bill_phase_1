import { useEffect, useRef, useState } from "react";
import Modal from "../../../ui/Modal";
import {
  Category,
  createCategory,
  updateCategory,
} from "../../../../services/catalogService";
import { getErrorMessage } from "../../../../utils/errorHandler";

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
  const [status, setStatus] = useState<"" | "active" | "inactive">("");
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
      setStatus("");
      setImagePreview(null);
      setImageFile(null);
    }
    setError(null);
  }, [data, open]);

  const handleImageSelect = (file?: File) => {
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Category name is required");
      return;
    }
    if (!status) {
      setError("Please select status");
      return;
    }
    if (!data && !imageFile) {
      setError("Category image is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        status,
      };

      const response = data
        ? await updateCategory(data.id, payload, imageFile || undefined)
        : await createCategory(payload, imageFile || undefined);

      if (response.success) {
        onSuccess();
        return;
      }

      setError(response.message || response.error?.message || "Failed to save category");
    } catch (err) {
      setError(getErrorMessage(err, "An unexpected error occurred"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} className="w-[760px] p-6 max-w-[95vw]">
      <h2 className="text-2xl font-bold mb-6">{data ? "Edit Category" : "Add Category"}</h2>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-[240px]">
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
                alt="Category"
                className="w-full h-[140px] object-cover rounded"
              />
            ) : (
              <>
                <button type="button" className="bg-yellow-400 px-4 py-2 rounded text-sm">
                  Upload Image
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Recommended size: 400x260 to 600x300 (JPG/PNG)
                </p>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept="image/png,image/jpeg"
            onChange={(e) => handleImageSelect(e.target.files?.[0])}
          />
        </div>

        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Category Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter Category Name"
                className="w-full border px-3 py-2 rounded mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "" | "active" | "inactive")}
                className="w-full border px-3 py-2 rounded mt-1 bg-white"
              >
                <option value="">Select Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
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

      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="border px-6 py-2 rounded" disabled={saving}>
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
