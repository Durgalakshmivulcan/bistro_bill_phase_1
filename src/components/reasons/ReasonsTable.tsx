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
import deleteIcon from "../../assets/deleteConformImg.png";

/* ================= TYPES ================= */

type Mode = null | "add" | "edit" | "delete" | "added" | "updated" | "deleted";

/* ================= COMPONENT ================= */

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
  });

  /* ================= API FUNCTIONS ================= */

  const loadReasons = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getReasons({ type: reasonType, status: 'active' });
      if (response.success && response.data) {
        setReasons(response.data);
      } else {
        setError(response.error?.message || 'Failed to load reasons');
      }
    } catch (err) {
      setError('An error occurred while loading reasons');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReasons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ================= ACTIONS ================= */

  const closeAll = () => {
    setMode(null);
    setActiveReason(null);
    setError(null);
  };

  const openAdd = () => {
    setForm({ text: "" });
    setMode("add");
  };

  const openEdit = (reason: Reason) => {
    setForm({ text: reason.text });
    setActiveReason(reason);
    setMode("edit");
  };

  const saveAdd = async () => {
    if (!form.text.trim()) {
      setError('Reason text is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const response = await createReason({
        type: reasonType,
        text: form.text,
        status: 'active'
      });

      if (response.success) {
        await loadReasons();
        setMode("added");
      } else {
        setError(response.error?.message || 'Failed to add reason');
      }
    } catch (err) {
      setError('An error occurred while adding reason');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!activeReason || !form.text.trim()) {
      setError('Reason text is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const response = await updateReason(activeReason.id, {
        text: form.text
      });

      if (response.success) {
        await loadReasons();
        setMode("updated");
      } else {
        setError(response.error?.message || 'Failed to update reason');
      }
    } catch (err) {
      setError('An error occurred while updating reason');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!activeReason) return;

    try {
      setSaving(true);
      setError(null);
      const response = await deleteReason(activeReason.id);

      if (response.success) {
        await loadReasons();
        setMode("deleted");
      } else {
        setError(response.error?.message || 'Failed to delete reason');
      }
    } catch (err) {
      setError('An error occurred while deleting reason');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="bg-[#FFF9E8] border rounded-lg p-4 sm:p-6 overflow-x-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">{title}</h2>
        <button
          onClick={openAdd}
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add New
        </button>
      </div>

      {/* Error Banner */}
      {error && mode !== "add" && mode !== "edit" && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex justify-between items-center">
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg bg-white overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="bg-[#F7C948]">
            <tr>
              <th className="text-left px-4 py-3">Reason</th>
              <th className="text-center px-4 py-3 w-20">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-gray-500">
                  Loading reasons...
                </td>
              </tr>
            ) : reasons.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-gray-500">
                  <p className="mb-4">No reasons found</p>
                  <button
                    onClick={openAdd}
                    className="bg-black text-white px-4 py-2 rounded-md text-sm inline-block"
                  >
                    Add Your First Reason
                  </button>
                </td>
              </tr>
            ) : (
              reasons.map((item, index) => (
                <tr
                  key={item.id}
                  className={index % 2 ? "bg-[#FFF7E0]" : "bg-white"}
                >
                  <td className="px-4 py-3 font-medium">{item.text}</td>
                  <td className="px-4 py-3 text-center">
                    <ActionMenu
                      onEdit={() => openEdit(item)}
                      onDelete={() => {
                        setActiveReason(item);
                        setMode("delete");
                      }}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ================= MODALS ================= */}

      {(mode === "add" || mode === "edit") && (
        <Overlay>
          <Modal title={mode === "add" ? "Add Reason" : "Edit Reason"}>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <TextArea
              label="Reason"
              value={form.text}
              onChange={(v) => setForm({ ...form, text: v })}
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
          desc="New Reason Added Successfully!"
          onClose={closeAll}
        />
      )}

      {mode === "updated" && (
        <Success
          title="Changes Updated"
          desc="Reason Updated Successfully!"
          onClose={closeAll}
        />
      )}

      {mode === "delete" && (
        <Confirm onCancel={closeAll} onConfirm={confirmDelete} saving={saving} />
      )}

      {mode === "deleted" && (
        <Success
          title="Deleted!"
          desc="Reason has been successfully removed."
          onClose={closeAll}
        />
      )}
    </div>
  );
};

export default ReasonsTable;

/* ================= SHARED UI ================= */

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-3">
      {children}
    </div>
  );
}

function Modal({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg w-full max-w-lg p-6">
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      {children}
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
    <div className="mb-6">
      <label className="text-sm font-medium">{label}</label>
      <textarea
        className="w-full border rounded-md px-3 py-2 mt-1 min-h-[90px]"
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
    <div className="flex justify-end gap-3">
      <button
        onClick={onCancel}
        disabled={saving}
        className="border px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        className="bg-[#F7C948] px-6 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

function Confirm({
  onCancel,
  onConfirm,
  saving,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  saving: boolean;
}) {
  return (
    <Overlay>
      <div className="bg-white rounded-lg p-6 w-full max-w-sm text-center">
        <h3 className="text-xl font-bold mb-3">Delete</h3>
        <img src={deleteIcon} className="mx-auto mb-4 h-12 w-12" alt="Delete" />
        <p className="text-sm mb-6">
          This action cannot be undone. Do you want to proceed?
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={onCancel}
            disabled={saving}
            className="border px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className="bg-[#F7C948] px-6 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Deleting..." : "Yes"}
          </button>
        </div>
      </div>
    </Overlay>
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
          className="absolute right-3 top-3 text-gray-400"
        >
          ✕
        </button>

        <h3 className="text-xl font-bold mb-2">{title}</h3>

        <div className="my-4">
          <img src={successIcon} className="mx-auto h-12 w-12" />
        </div>

        <p className="text-sm">{desc}</p>
      </div>
    </Overlay>
  );
}
