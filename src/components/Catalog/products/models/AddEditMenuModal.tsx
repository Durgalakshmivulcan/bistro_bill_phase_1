import { useEffect, useRef, useState } from "react";
import Modal from "../../../ui/Modal";
import { Menu, createMenu, updateMenu } from "../../../../services/catalogService";

interface Props {
  open: boolean;
  data: Menu | null;
  onClose: () => void;
  onSuccess: (type: "created" | "updated") => void;
}

export default function AddEditMenuModal({
  open,
  data,
  onClose,
  onSuccess,
}: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [image, setImage] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---------------- PREFILL ON EDIT ---------------- */
  useEffect(() => {
    if (data) {
      setImage(null); // API Menu type doesn't have image
      setName(data.name);
      setStatus(data.status === "active" ? "Active" : "Inactive");
      setDescription(data.description || "");
    } else {
      setImage(null);
      setName("");
      setStatus("Active");
      setDescription("");
    }
    setError(null);
    setSaving(false);
  }, [data, open]);

  if (!open) return null;

  /* ---------------- IMAGE UPLOAD ---------------- */
  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () =>
      setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  /* ---------------- SAVE ---------------- */
  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      setError("Menu name is required");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const menuData = {
        name: name.trim(),
        description: description.trim() || undefined,
        status: status.toLowerCase() as 'active' | 'inactive',
      };

      if (data) {
        // Update existing menu
        const response = await updateMenu(data.id, menuData);
        if (response.success) {
          onSuccess("updated");
        } else {
          setError(response.message || "Failed to update menu");
        }
      } else {
        // Create new menu
        const response = await createMenu(menuData);
        if (response.success) {
          onSuccess("created");
        } else {
          setError(response.message || "Failed to create menu");
        }
      }
    } catch (err) {
      console.error("Failed to save menu:", err);
      setError("An error occurred while saving the menu");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} className="w-[900px] p-8">
      <h2 className="text-2xl font-bold mb-6">
        {data ? "Edit Menu" : "Add New Menu"}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ================= IMAGE UPLOAD ================= */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Menu Image<span className="text-red-500">*</span>
          </label>

          <div className="border-2 border-dashed rounded-lg p-4 text-center">
            {image ? (
              <img
                src={image}
                alt="Menu Preview"
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

        {/* ================= FORM ================= */}
        <div className="lg:col-span-2 space-y-4">
          {/* NAME */}
          <div>
            <label className="text-sm font-medium">
              Menu Name
            </label>
            <input
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="Enter Menu Name"
              className="w-full border rounded px-3 py-2 mt-1"
            />
          </div>

          {/* STATUS */}
          <div>
            <label className="text-sm font-medium">
              Status
            </label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(
                  e.target.value as
                    | "Active"
                    | "Inactive"
                )
              }
              className="w-full border rounded px-3 py-2 mt-1"
            >
              <option value="Active">
                Active
              </option>
              <option value="Inactive">
                Inactive
              </option>
            </select>
          </div>

          {/* DESCRIPTION */}
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

      {/* ================= ERROR MESSAGE ================= */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* ================= ACTIONS ================= */}
      <div className="flex justify-end gap-3 mt-8">
        <button
          onClick={onClose}
          disabled={saving}
          className="border px-6 py-2 rounded disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-yellow-400 px-6 py-2 rounded disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </Modal>
  );
}
