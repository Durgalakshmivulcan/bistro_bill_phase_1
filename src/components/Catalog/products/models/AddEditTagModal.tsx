import { useEffect, useState } from "react";
import Modal from "../../../ui/Modal";
import { Tag, createTag, updateTag } from "../../../../services/catalogService";

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
  const [color, setColor] = useState("#000000");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* PREFILL */
  useEffect(() => {
    if (data) {
      setName(data.name);
      setColor(data.color);
      setStatus(data.status);
    } else {
      setName("");
      setColor("#000000");
      setStatus("active");
    }
    setError(null);
  }, [data, open]);

  if (!open) return null;

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      setError("Tag name is required");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (data) {
        // Update existing tag
        const response = await updateTag(data.id, { name, color, status });
        if (response.success) {
          onSuccess("updated");
        } else {
          setError(response.message || "Failed to update tag");
        }
      } else {
        // Create new tag
        const response = await createTag({ name, color, status });
        if (response.success) {
          onSuccess("created");
        } else {
          setError(response.message || "Failed to create tag");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save tag");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} className="w-[500px] p-8">
      <h2 className="text-2xl font-bold mb-6">
        {data ? "Edit Tag" : "Add Tag"}
      </h2>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* FORM */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">
            Tag Name <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            placeholder="Enter Tag Name"
            className="w-full border rounded px-3 py-2 mt-1"
            disabled={saving}
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            Color
          </label>
          <input
            type="color"
            value={color}
            onChange={(e) =>
              setColor(e.target.value)
            }
            className="w-full border rounded px-3 py-2 mt-1 h-12"
            disabled={saving}
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
            disabled={saving}
          >
            <option value="active">
              Active
            </option>
            <option value="inactive">
              Inactive
            </option>
          </select>
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
          className="bg-yellow-400 px-6 py-2 rounded"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </Modal>
  );
}
