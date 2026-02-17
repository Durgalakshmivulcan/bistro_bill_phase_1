import { useState, useEffect } from "react";
import successIcon from "../../assets/tick.png";
import deleteIcon from "../../assets/deleteConformImg.png";
import deleteIcon1 from "../../assets/deleteSuccessImg.png";
import ActionMenu from "../Common/ActionMenu";
import {
  getCharges,
  createCharge,
  updateCharge,
  deleteCharge,
  Charge as ApiCharge,
  CreateChargeInput,
  UpdateChargeInput,
} from "../../services/settingsService";

/* ================= TYPES ================= */

type Mode = null | "add" | "edit" | "delete" | "added" | "updated" | "deleted";

type FormData = {
  name: string;
  value: number;
  status: "active" | "inactive";
};

type FormErrors = {
  name?: string;
  value?: string;
};

/* ================= PAGE ================= */

export default function ChargesPage() {
  const [charges, setCharges] = useState<ApiCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [menuIndex, setMenuIndex] = useState<number | null>(null);
  const [activeCharge, setActiveCharge] = useState<ApiCharge | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [form, setForm] = useState<FormData>({
    name: "",
    value: 0,
    status: "active",
  });

  /* ================= DATA FETCHING ================= */

  const loadCharges = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCharges();

      if (response.success && response.data) {
        setCharges(response.data);
      } else {
        setError(response.error?.message || "Failed to load charges");
      }
    } catch (err) {
      setError("An error occurred while loading charges");
      console.error("Error loading charges:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCharges();
  }, []);

  /* ================= VALIDATION ================= */

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!form.name.trim()) {
      errors.name = "Charge name is required";
    }

    if (form.value <= 0) {
      errors.value = "Price must be a positive number";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* ================= ACTIONS ================= */

  const closeAll = () => {
    setMode(null);
    setMenuIndex(null);
    setActiveCharge(null);
    setFormErrors({});
  };

  const openEdit = (charge: ApiCharge) => {
    setForm({
      name: charge.name,
      value: charge.value,
      status: charge.status as "active" | "inactive",
    });
    setActiveCharge(charge);
    setMode("edit");
  };

  const openAdd = () => {
    setForm({ name: "", value: 0, status: "active" });
    setActiveCharge(null);
    setFormErrors({});
    setMode("add");
  };

  const saveEdit = async () => {
    if (!validateForm() || !activeCharge) return;

    try {
      setSaving(true);
      const updateInput: UpdateChargeInput = {
        name: form.name,
        value: form.value,
        status: form.status,
      };

      const response = await updateCharge(activeCharge.id, updateInput);

      if (response.success) {
        await loadCharges();
        setMode("updated");
      } else {
        setError(response.error?.message || "Failed to update charge");
      }
    } catch (err) {
      setError("An error occurred while updating charge");
      console.error("Error updating charge:", err);
    } finally {
      setSaving(false);
    }
  };

  const saveAdd = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      const createInput: CreateChargeInput = {
        name: form.name,
        type: "Fixed", // Default to Fixed type since UI doesn't allow selection
        value: form.value,
        applyTo: "All", // Default to All since UI doesn't allow selection
        status: form.status,
      };

      const response = await createCharge(createInput);

      if (response.success) {
        await loadCharges();
        setMode("added");
      } else {
        setError(response.error?.message || "Failed to create charge");
      }
    } catch (err) {
      setError("An error occurred while creating charge");
      console.error("Error creating charge:", err);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!activeCharge) return;

    try {
      setSaving(true);
      const response = await deleteCharge(activeCharge.id);

      if (response.success) {
        await loadCharges();
        setMode("deleted");
      } else {
        setError(response.error?.message || "Failed to delete charge");
      }
    } catch (err) {
      setError("An error occurred while deleting charge");
      console.error("Error deleting charge:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setForm({ ...form, [field]: value });
    // Clear field error when user types
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors({ ...formErrors, [field]: undefined });
    }
  };

  /* ================= UI ================= */

  return (
    <div className="bg-[#FFF9E8] border rounded-lg p-4 sm:p-6 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 mb-6">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">Charges</h2>
        <button
          onClick={openAdd}
          className="bg-black text-white px-4 py-2 rounded-md text-sm"
          disabled={loading}
        >
          Add New
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-700 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          <span className="ml-3 text-gray-600">Loading charges...</span>
        </div>
      ) : charges.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12 text-gray-500">
          <p>No charges available</p>
          <button
            onClick={openAdd}
            className="mt-4 bg-black text-white px-4 py-2 rounded-md text-sm"
          >
            Add Your First Charge
          </button>
        </div>
      ) : (
        /* Table */
        <div className="border rounded-lg bg-white overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="bg-[#F7C948]">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Price</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-center px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {charges.map((c, i) => (
                <tr key={c.id} className={i % 2 ? "bg-[#FFFBEA]" : "bg-white"}>
                  <td className="px-4 py-3">{c.name}</td>
                  <td className="px-4 py-3">₹ {c.value.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        c.status === "active"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                    </span>
                  </td>
                  <ActionMenu
                    onEdit={() => {
                      openEdit(c);
                    }}
                    onDelete={() => {
                      setActiveCharge(c);
                      setMode("delete");
                    }}
                  />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= MODALS ================= */}

      {(mode === "edit" || mode === "add") && (
        <Overlay>
          <Modal title={mode === "edit" ? "Edit Charge" : "Add Charge"}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <Field
                label="Name"
                value={form.name}
                onChange={(v) => handleInputChange("name", v)}
                error={formErrors.name}
              />
              <Field
                label="Price"
                value={form.value === 0 ? "" : `₹ ${form.value}`}
                onChange={(v) => {
                  const numValue = Number(v.replace(/\D/g, ""));
                  handleInputChange("value", numValue);
                }}
                error={formErrors.value}
              />
            </div>

            <Select
              label="Status"
              value={form.status}
              onChange={(v) =>
                handleInputChange("status", v as "active" | "inactive")
              }
            />

            <Actions
              onCancel={closeAll}
              onSave={mode === "edit" ? saveEdit : saveAdd}
              saving={saving}
            />
          </Modal>
        </Overlay>
      )}

      {mode === "updated" && (
        <Success
          title="Charge Updated"
          desc="Charge Details Updated Successfully!"
          icon="success"
          onClose={closeAll}
        />
      )}

      {mode === "added" && (
        <Success
          title="Charge Added"
          desc="New Charge Added Successfully!"
          icon="success"
          onClose={closeAll}
        />
      )}

      {mode === "delete" && (
        <Confirm onCancel={closeAll} onConfirm={confirmDelete} saving={saving} />
      )}

      {mode === "deleted" && (
        <Success
          title="Deleted!"
          desc="Charge has been successfully removed."
          icon="delete"
          onClose={closeAll}
        />
      )}
    </div>
  );
}

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

function Field({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input
        className={`w-full border rounded-md px-3 py-2 mt-1 ${
          error ? "border-red-500" : ""
        }`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

function Select({
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
      <select
        className="w-full border rounded-md px-3 py-2 mt-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
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
  saving?: boolean;
}) {
  return (
    <div className="flex justify-end gap-3">
      <button
        onClick={onCancel}
        className="border px-4 py-2 rounded-md"
        disabled={saving}
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        className="bg-[#F7C948] px-6 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={saving}
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
  saving?: boolean;
}) {
  return (
    <Overlay>
      <div className="bg-white rounded-lg p-6 w-full max-w-sm text-center">
        <h3 className="text-xl font-bold mb-3">Delete</h3>
        <img src={deleteIcon1} className="mx-auto mb-4 h-12 w-12" alt="Delete" />
        <p className="text-sm mb-6">
          This action cannot be undone. Do you want to proceed?
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={onCancel}
            className="border px-4 py-2 rounded-md"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-[#F7C948] px-6 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={saving}
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
  icon,
  onClose,
}: {
  title: string;
  desc: string;
  icon: "success" | "delete";
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
          <img
            src={icon === "success" ? successIcon : deleteIcon}
            className="mx-auto h-12 w-12"
            alt={icon === "success" ? "Success" : "Delete"}
          />
        </div>

        <p className="text-sm">{desc}</p>
      </div>
    </Overlay>
  );
}
