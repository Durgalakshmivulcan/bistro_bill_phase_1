import { useEffect, useRef, useState } from "react";
import Modal from "../../../ui/Modal";
import { Brand, createBrand, updateBrand } from "../../../../services/catalogService";

interface Props {
  open: boolean;
  data: Brand | null;
  onClose: () => void;
  onSuccess: (type: "created" | "updated") => void;
}

export default function AddEditBrandModal({
  open,
  data,
  onClose,
  onSuccess,
}: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* PREFILL ON EDIT */
  useEffect(() => {
    if (data) {
      setImage(data.image || null);
      setImageFile(null);
      setName(data.name);
      setStatus(data.status);
      setDescription(data.description || "");
    } else {
      setImage(null);
      setImageFile(null);
      setName("");
      setStatus("active");
      setDescription("");
    }
    setError(null);
  }, [data, open]);

  if (!open) return null;

  /* IMAGE UPLOAD */
  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () =>
      setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  /* SAVE */
  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      setError("Brand name is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const brandData = {
        name,
        status,
        description: description || undefined,
      };

      let response;
      if (data) {
        // Update existing brand
        response = await updateBrand(data.id, brandData, imageFile || undefined);
      } else {
        // Create new brand
        response = await createBrand(brandData, imageFile || undefined);
      }

      if (response.success) {
        onSuccess(data ? "updated" : "created");
      } else {
        setError(response.message || "Failed to save brand");
      }
    } catch (err) {
      setError("An error occurred while saving brand");
      console.error("Error saving brand:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} className="w-[900px] p-8">
      <h2 className="text-2xl font-bold mb-6">
        {data ? "Edit Brand" : "Add Brand"}
      </h2>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* IMAGE */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Brand Image<span className="text-red-500">*</span>
          </label>

          <div className="border-2 border-dashed rounded-lg p-4 text-center">
            {image ? (
              <img
                src={image}
                alt="Brand Preview"
                className="w-full h-48 object-cover rounded"
              />
            ) : (
              <button
                onClick={() =>
                  fileRef.current?.click()
                }
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
              (Recommended size: 400×260 to
              600×300, JPG or PNG)
            </p>
          </div>
        </div>

        {/* FORM */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <label className="text-sm font-medium">
              Brand Name
            </label>
            <input
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="Enter Brand Name"
              className="w-full border rounded px-3 py-2 mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Status
            </label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(
                  e.target.value as
                    | "active"
                    | "inactive"
                )
              }
              className="w-full border rounded px-3 py-2 mt-1"
            >
              <option value="active">
                Active
              </option>
              <option value="inactive">
                Inactive
              </option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              placeholder="Add Description"
              className="w-full border rounded px-3 py-2 mt-1 h-28 resize-none"
            />
          </div>
        </div>
      </div>

      {/* ACTIONS */}
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
          className="bg-yellow-400 px-6 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </Modal>
  );
}
