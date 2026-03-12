import { useEffect, useRef, useState } from "react";
import Modal from "../../../ui/Modal";
import { Menu, createMenu, updateMenu } from "../../../../services/catalogService";
import { getErrorMessage } from "../../../../utils/errorHandler";

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"" | "active" | "inactive">("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setStatus("");
      setDescription("");
    }
    setError(null);
    setSaving(false);
  }, [data, open]);

  if (!open) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImage(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Menu name is required");
      return;
    }
    if (!status) {
      setError("Please select status");
      return;
    }
    if (!data && !imageFile) {
      setError("Menu image is required");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        status,
      };

      const response = data
        ? await updateMenu(data.id, payload, imageFile || undefined)
        : await createMenu(payload, imageFile || undefined);

      if (response.success) {
        onSuccess(data ? "updated" : "created");
        return;
      }

      setError(response.message || response.error?.message || "Failed to save menu");
    } catch (err) {
      setError(getErrorMessage(err, "An unexpected error occurred"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} className="w-[900px] p-8 max-w-[95vw]">
      <h2 className="text-2xl font-bold mb-6">{data ? "Edit Menu" : "Add New Menu"}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Menu Image<span className="text-red-500">*</span>
          </label>
          <div
            className="border-2 border-dashed border-yellow-400 rounded-lg p-4 text-center cursor-pointer"
            onClick={() => fileRef.current?.click()}
          >
            {image ? (
              <img src={image} alt="Menu" className="w-full h-48 object-cover rounded" />
            ) : (
              <>
                <button type="button" className="bg-yellow-400 px-4 py-2 rounded">
                  Upload Image
                </button>
                <p className="text-xs text-gray-500 mt-3">
                  Recommended size: 400x260 to 600x300 (JPG/PNG)
                </p>
              </>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg"
              hidden
              onChange={handleImageChange}
            />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div>
            <label className="text-sm font-medium">Menu Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter Menu Name"
              className="w-full border rounded px-3 py-2 mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "" | "active" | "inactive")}
              className="w-full border rounded px-3 py-2 mt-1 bg-white"
            >
              <option value="">Select Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add Description"
              className="w-full border rounded px-3 py-2 mt-1 h-28 resize-none"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 mt-8">
        <button onClick={onClose} disabled={saving} className="border px-6 py-2 rounded disabled:opacity-50">
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving} className="bg-yellow-400 px-6 py-2 rounded disabled:opacity-50">
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </Modal>
  );
}
