import { useEffect, useState } from "react";
import Modal from "../../../ui/Modal";
import { Tag, createTag, updateTag } from "../../../../services/catalogService";
import { getErrorMessage } from "../../../../utils/errorHandler";

interface Props {
  open: boolean;
  data: Tag | null;
  onClose: () => void;
  onSuccess: (type: "created" | "updated") => void;
}

export default function AddEditTagModal({
  open,
  data,
  onClose,
  onSuccess,
}: Props) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"" | "active" | "inactive">("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setName(data.name);
      setStatus(data.status);
    } else {
      setName("");
      setStatus("");
    }
    setError(null);
  }, [data, open]);

  if (!open) return null;

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Tag name is required");
      return;
    }
    if (!status) {
      setError("Please select status");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = { name: name.trim(), status };
      const response = data
        ? await updateTag(data.id, payload)
        : await createTag({ ...payload, color: "#000000" });

      if (response.success) {
        onSuccess(data ? "updated" : "created");
        return;
      }

      setError(response.message || response.error?.message || "Failed to save tag");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save tag"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} className="w-[500px] p-8 max-w-[95vw]">
      <h2 className="text-2xl font-bold mb-6">{data ? "Edit Tag" : "Add Tag"}</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">
            Tag Name <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter Tag Name"
            className="w-full border rounded px-3 py-2 mt-1"
            disabled={saving}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "" | "active" | "inactive")}
            className="w-full border rounded px-3 py-2 mt-1 bg-white"
            disabled={saving}
          >
            <option value="">Select Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-8">
        <button onClick={onClose} className="border px-6 py-2 rounded" disabled={saving}>
          Cancel
        </button>
        <button onClick={handleSave} className="bg-yellow-400 px-6 py-2 rounded" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </Modal>
  );
}
