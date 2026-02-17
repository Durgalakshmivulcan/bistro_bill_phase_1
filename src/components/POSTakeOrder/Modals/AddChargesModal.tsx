import { useState, useEffect } from "react";
import Select from "../../form/Select";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import successIcon from "../../../assets/tick.png";
import { getCharges, type Charge } from "../../../services/settingsService";
import { useOrder } from "../../../contexts/OrderContext";
import { api } from "../../../services/api";
import { ApiResponse } from "../../../types/api";

type Props = {
  orderId?: string;
  onClose: () => void;
  onChargesApplied?: () => void;
};

const AddChargesModal = ({ orderId, onClose, onChargesApplied }: Props) => {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [selectedChargeId, setSelectedChargeId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const orderContext = useOrder();

  // Fetch available charges from settings API
  useEffect(() => {
    async function fetchCharges() {
      setLoading(true);
      setError(null);
      try {
        const response = await getCharges({ status: "active" });
        if (response.success && response.data) {
          setCharges(response.data);
          if (response.data.length > 0) {
            setSelectedChargeId(response.data[0].id);
          }
        } else {
          setError(response.error?.message || "Failed to load charges.");
        }
      } catch {
        setError("Failed to load charges. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchCharges();
  }, []);

  const formatChargeLabel = (charge: Charge) => {
    if (charge.type === "Percentage") {
      return `${charge.name} (${charge.value}%)`;
    }
    return `${charge.name} (₹ ${Number(charge.value).toFixed(2)})`;
  };

  /* ================= SAVE HANDLER ================= */
  const handleSave = async () => {
    if (!selectedChargeId) {
      setError("Please select a charge to apply.");
      return;
    }

    setSaving(true);

    try {
      const selectedCharge = charges.find((c) => c.id === selectedChargeId);
      if (!selectedCharge) {
        setError("Selected charge not found.");
        setSaving(false);
        return;
      }

      if (orderId) {
        // Order already exists — call backend API to apply charges
        const response = await api.post<ApiResponse<{ orderId: string; chargesAmount: number }>>(
          `/pos/orders/${orderId}/charges`,
          { chargeIds: [selectedChargeId] }
        );
        if (response.success && response.data) {
          orderContext.updateSummary({ additionalCharges: response.data.chargesAmount });
        }
      } else {
        // No order yet — apply charge locally to OrderContext
        const chargeAmount =
          selectedCharge.type === "Percentage"
            ? (orderContext.summary.subtotal * selectedCharge.value) / 100
            : Number(selectedCharge.value);

        orderContext.updateSummary({
          additionalCharges: orderContext.summary.additionalCharges + chargeAmount,
        });
      }

      await Swal.fire({
        title: "Saved!",
        html: `
          <div style="display:flex; justify-content:center; margin:16px 0;">
            <img src="${successIcon}" style="width:56px; height:56px;" />
          </div>
          <p style="font-size:14px; color:#6b7280; text-align:center;">
            Charges have been added successfully.
          </p>
        `,
        confirmButtonText: "OK",
        buttonsStyling: false,
        didOpen: () => {
          const confirm = Swal.getConfirmButton();
          const actions = Swal.getActions();

          if (actions) {
            actions.style.display = "flex";
            actions.style.justifyContent = "center";
          }

          if (confirm) {
            confirm.style.background = "#facc15";
            confirm.style.color = "#000";
            confirm.style.padding = "8px 28px";
            confirm.style.border = "none";
            confirm.style.borderRadius = "4px";
            confirm.style.fontWeight = "500";
            confirm.style.minWidth = "100px";
          }
        },
      });

      onChargesApplied?.();
      onClose();
    } catch {
      setError("Failed to apply charges. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white w-[420px] rounded-xl p-6 space-y-5">
        {/* Title */}
        <h2 className="text-lg font-semibold">
          Add Charges to Order
        </h2>

        {/* Charges Select */}
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            <span className="ml-2 text-sm text-gray-500">Loading charges...</span>
          </div>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : charges.length === 0 ? (
          <p className="text-sm text-gray-500">No charges configured. Add charges in Business Settings.</p>
        ) : (
          <Select
            label="Charges"
            value={selectedChargeId}
            onChange={(value) => setSelectedChargeId(value)}
            options={charges.map((c) => ({
              label: formatChargeLabel(c),
              value: c.id,
            }))}
          />
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="px-6 py-2 border rounded-lg"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={saving || loading || charges.length === 0}
            className={`px-6 py-2 bg-[#FFC533] rounded-lg font-medium ${
              (saving || loading || charges.length === 0) ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddChargesModal;
