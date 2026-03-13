import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import ActionMenu from "../Common/ActionMenu";
import Modal from "../ui/Modal";
import { showUpdatedSweetAlert } from "../../utils/swalAlerts";
import {
  Charge as ApiCharge,
  CreateChargeInput,
  UpdateChargeInput,
  createCharge,
  deleteCharge,
  getCharges,
  updateCharge,
} from "../../services/settingsService";

type ModalMode = "add" | "edit";

type FormData = {
  name: string;
  value: string; // keep as string to allow empty input
  status: "active" | "inactive";
};

type FormErrors = {
  name?: string;
  value?: string;
};

export default function ChargesPage() {
  const [charges, setCharges] = useState<ApiCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [openChargeModal, setOpenChargeModal] = useState(false);
  const [chargeModalMode, setChargeModalMode] = useState<ModalMode>("add");
  const [activeCharge, setActiveCharge] = useState<ApiCharge | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [form, setForm] = useState<FormData>({
    name: "",
    value: "",
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

    const numValue = Number(form.value);
    if (!Number.isFinite(numValue) || numValue <= 0) {
      errors.value = "Price must be a positive number";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* ================= ACTIONS ================= */

  const closeChargeModal = () => {
    setOpenChargeModal(false);
    setActiveCharge(null);
    setFormErrors({});
  };

  const openEdit = (charge: ApiCharge) => {
    setForm({
      name: charge.name,
      value: String(charge.value),
      status: charge.status as "active" | "inactive",
    });
    setActiveCharge(charge);
    setChargeModalMode("edit");
    setOpenChargeModal(true);
  };

  const openAdd = () => {
    setForm({ name: "", value: "", status: "active" });
    setActiveCharge(null);
    setFormErrors({});
    setChargeModalMode("add");
    setOpenChargeModal(true);
  };

  const saveEdit = async () => {
    if (!validateForm() || !activeCharge) return;

    try {
      setSaving(true);
      const numValue = Number(form.value);
      const updateInput: UpdateChargeInput = {
        name: form.name,
        value: numValue,
        status: form.status,
      };

      const response = await updateCharge(activeCharge.id, updateInput);

      if (response.success) {
        await loadCharges();
        closeChargeModal();
        await showUpdatedSweetAlert({
          title: "Charge Updated",
          message: "Charge Details Updated Successfully!",
        });
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
      const numValue = Number(form.value);
      const createInput: CreateChargeInput = {
        name: form.name,
        type: "Fixed", // Default to Fixed type since UI doesn't allow selection
        value: numValue,
        applyTo: "All", // Default to All since UI doesn't allow selection
        status: form.status,
      };

      const response = await createCharge(createInput);

      if (response.success) {
        await loadCharges();
        closeChargeModal();
        await showUpdatedSweetAlert({
          title: "Charge Added",
          message: "New Charge Added Successfully!",
        });
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

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setForm({ ...form, [field]: String(value) } as FormData);
    // Clear field error when user types
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors({ ...formErrors, [field]: undefined });
    }
  };

  /* ================= UI ================= */

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
        <h2 className="text-4xl font-extrabold tracking-tight">Charges</h2>
        <button
          onClick={openAdd}
          className="bg-black text-white px-6 py-2.5 rounded-md text-sm w-full sm:w-auto"
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
        <div className="bg-white rounded-md overflow-x-auto border border-[#EADFC2]">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-yellow-400 text-black">
              <tr>
                <th className="text-left px-6 py-4 font-medium">Name</th>
                <th className="text-left px-6 py-4 font-medium">Price</th>
                <th className="text-left px-6 py-4 font-medium">Status</th>
                <th className="text-center px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {charges.map((c, i) => (
                <tr key={c.id} className={i % 2 ? "bg-[#FFF9E8]" : "bg-white"}>
                  <td className="px-6 py-4">{c.name}</td>
                  <td className="px-6 py-4">
                    ₹{" "}
                    {Number.isInteger(c.value)
                      ? c.value
                      : Number(c.value).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-md text-xs font-medium ${
                        c.status === "active"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-[#FFE3E3] text-red-600"
                      }`}
                    >
                      {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <ActionMenu
                      onEdit={() => openEdit(c)}
                      deleteEntityName="Charge"
                      successTimerMs={null}
                      onDelete={async () => {
                        try {
                          const response = await deleteCharge(c.id);
                          if (response.success) {
                            await loadCharges();
                            return;
                          }
                          setError(response.error?.message || "Failed to delete charge");
                          return;
                        } catch (err) {
                          console.error("Error deleting charge:", err);
                          setError("An error occurred while deleting charge");
                          return;
                        }
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= ADD/EDIT MODAL ================= */}
      {openChargeModal && (
        <Modal open={openChargeModal} onClose={closeChargeModal}>
          <div className="w-[760px] max-w-[calc(100vw-32px)] px-10 py-8">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-6">
              {chargeModalMode === "edit" ? "Edit Charge" : "Add Charge"}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block mb-1 text-sm font-medium">Name</label>
                <input
                  className={`w-full h-[46px] rounded-md px-4 border ${
                    formErrors.name ? "border-red-500" : "border-gray-200"
                  }`}
                  value={form.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
                {formErrors.name && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">
                    ₹
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="1"
                    className={`w-full h-[46px] rounded-md pl-9 pr-4 border ${
                      formErrors.value ? "border-red-500" : "border-gray-200"
                    }`}
                    value={form.value}
                    onChange={(e) => handleInputChange("value", e.target.value)}
                  />
                </div>
                {formErrors.value && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.value}</p>
                )}
              </div>

              <div className="sm:col-span-1">
                <label className="block mb-1 text-sm font-medium">Status</label>
                <div className="relative">
                  <select
                    className="w-full h-[46px] rounded-md px-4 pr-10 border border-gray-200 appearance-none bg-white"
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value as "active" | "inactive" })
                    }
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <ChevronDown
                    size={18}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                </div>
              </div>
              <div className="hidden sm:block" />
            </div>

            <div className="flex justify-end gap-4 mt-10">
              <button
                type="button"
                onClick={closeChargeModal}
                className="px-8 h-[44px] border border-black rounded-md text-sm font-medium"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={chargeModalMode === "edit" ? saveEdit : saveAdd}
                className="px-10 h-[44px] bg-yellow-400 rounded-md text-sm font-medium hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
