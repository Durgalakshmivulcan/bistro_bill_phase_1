import { useState, useEffect } from "react";
import {
  Reason,
  ReasonType,
  getReasons,
  createReason,
  updateReason,
  deleteReason
} from "../../services/settingsService";
import ActionMenu from "../Common/ActionMenu";
import successIcon from "../../assets/tick.png";

type Mode = null | "add" | "edit" | "added" | "updated";

interface Props {
  title: string;
  reasonType: ReasonType;
}

const ReasonsTable = ({ title, reasonType }: Props) => {
  const [reasons, setReasons] = useState<Reason[]>([]);
  const [activeReason, setActiveReason] = useState<Reason | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    text: "",
    description: "",
  });

  const loadReasons = async () => {
    try {
      setLoading(true);
      setError(null);
  
      const response = await getReasons({
        type: reasonType,
        status: "active"
      });  
      if (response.success && response.data) {
        setReasons(response.data);
      } else {
        setError(response.error?.message || "Failed to load reasons");
      }
  
    } catch (err) {
      console.error("Failed to load reasons:", err);
      setError("Failed to load reasons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReasons();
  }, [reasonType]);

  const closeAll = () => {
    setMode(null);
    setActiveReason(null);
    setError(null);
  };

  const openAdd = () => {
    setForm({ text: "", description: "" });
    setMode("add");
  };

  const openEdit = (reason: Reason) => {
    setForm({
      text: reason.text,
      description: reason.description || "",
    });
    setActiveReason(reason);
    setMode("edit");
  };

  const saveAdd = async () => {
    if (!form.text.trim()) {
      setError("Reason name is required");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await createReason({
        type: reasonType,
        text: form.text,
        description: form.description,
        status: "active",
      });

      if (response.success) {
        await loadReasons();
        setMode("added");
      } else {
        setError(response.error?.message || "Failed to add reason");
      }
    } catch (err) {
      setError("An error occurred while adding reason");
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!activeReason || !form.text.trim()) {
      setError("Reason name is required");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await updateReason(activeReason.id, {
        text: form.text,
        description: form.description,
      });

      if (response.success) {
        await loadReasons();
        setMode("updated");
      } else {
        setError(response.error?.message || "Failed to update reason");
      }
    } catch (err) {
      setError("An error occurred while updating reason");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#FFF9E8] border border-[#E5DCC8] rounded-lg p-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">{title}</h2>

        <button
          onClick={openAdd}
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded-md text-sm"
        >
          Add New
        </button>
      </div>

      {/* Table */}
<div className="border border-[#E5DCC8] rounded-lg bg-white overflow-x-auto">

<table className="w-full min-w-[700px] text-sm">

  <thead className="bg-[#F7C948]">
    <tr>
      <th className="text-left px-6 py-3 font-semibold">Name</th>
      <th className="text-left px-6 py-3 font-semibold">Description</th>
      <th className="text-right px-6 py-3 font-semibold w-24">Actions</th>
    </tr>
  </thead>

  <tbody>
    {loading ? (
      <tr>
        <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
          Loading reasons...
        </td>
      </tr>
    ) : reasons.length === 0 ? (
      <tr>
        <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
          No reasons found
        </td>
      </tr>
    ) : (
      reasons.map((item, index) => (
        <tr
          key={item.id}
          className={`${index % 2 === 0 ? "bg-white" : "bg-[#FFF7E0]"} hover:bg-[#FFF1CC]`}
        >
          <td className="px-6 py-4 font-medium">{item.text}</td>

          <td className="px-6 py-4 text-gray-600">
            {item.description || "—"}
          </td>

          <td className="px-6 py-4 text-right">
            <ActionMenu
              onEdit={() => openEdit(item)}
              deleteEntityName="Reason"
              successTimerMs={null}
              onDelete={async () => {
                try {
                  const response = await deleteReason(item.id);
                  if (response.success) {
                    await loadReasons();
                    return;
                  }
                  setError(response.message || "Failed to delete reason");
                  return;
                } catch (err) {
                  console.error("An error occurred while deleting reason:", err);
                  setError("An error occurred while deleting reason");
                  return;
                }
              }}
            />
          </td>
        </tr>
      ))
    )}
  </tbody>

</table>
</div>

      {/* MODAL */}
      {(mode === "add" || mode === "edit") && (
        <Overlay>

          <Modal title={mode === "add" ? "Add Reason" : "Edit Reason"}>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <InputField
              label="Name"
              value={form.text}
              onChange={(v) => setForm({ ...form, text: v })}
            />

            <TextArea
              label="Description"
              value={form.description}
              onChange={(v) => setForm({ ...form, description: v })}
            />

            <Actions
              onCancel={closeAll}
              onSave={mode === "add" ? saveAdd : saveEdit}
              saving={saving}
            />

          </Modal>

        </Overlay>
      )}

      {mode === "added" && (
        <Success
          title="Reason Added"
          desc="New reason added successfully!"
          onClose={closeAll}
        />
      )}

      {mode === "updated" && (
        <Success
          title="Changes Updated"
          desc="Reason updated successfully!"
          onClose={closeAll}
        />
      )}
    </div>
  );
};

export default ReasonsTable;

/* UI COMPONENTS */

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-3">
      {children}
    </div>
  );
}

function Modal({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl w-full max-w-2xl p-7 shadow-xl">
      <h3 className="text-3xl font-bold text-gray-800 mb-6">{title}</h3>
      {children}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-3">

      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>

      <input
        type="text"
        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-4">

      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>

      <textarea
        className="w-full border border-gray-300 rounded-md px-4 py-2.5 min-h-[90px] resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

    </div>
  );
}

function Actions({
  onCancel,
  onSave,
  saving,
}: {
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="flex justify-end gap-4 mt-4">

      <button
        onClick={onCancel}
        disabled={saving}
        className="border border-gray-300 px-6 py-2.5 rounded-md bg-white text-gray-700 hover:bg-gray-100"
      >
        Cancel
      </button>

      <button
        onClick={onSave}
        disabled={saving}
        className="bg-[#F4C430] px-6 py-2.5 rounded-md font-medium"
      >
        {saving ? "Saving..." : "Save"}
      </button>

    </div>
  );
}

function Success({
  title,
  desc,
  onClose,
}: {
  title: string;
  desc: string;
  onClose: () => void;
}) {
  return (
    <Overlay>
      <div className="bg-white rounded-lg p-6 w-full max-w-sm text-center relative">

        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>

        <h3 className="text-xl font-bold mb-2">{title}</h3>

        <div className="my-4">
          <img src={successIcon} className="mx-auto h-12 w-12" />
        </div>

        <p className="text-sm mb-6">{desc}</p>

        <button
          onClick={onClose}
          className="bg-[#F7C948] px-6 py-2 rounded-md font-medium hover:opacity-90"
        >
          OK
        </button>

      </div>
    </Overlay>
  );
}
