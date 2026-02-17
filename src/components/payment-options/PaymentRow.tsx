import { useState } from "react";
import ActionMenu from "../Common/ActionMenu";
import StatusToggle from "./StatusToggle";
import EditPaymentModal from "./EditPaymentModal";
import {
  PaymentOption,
  updatePaymentOption,
  deletePaymentOption,
} from "../../services/settingsService";
import { CRUDToasts } from "../../utils/toast";

type Props = {
  option: PaymentOption;
  onRefresh: () => void;
};

const PaymentRow: React.FC<Props> = ({ option, onRefresh }) => {
  const [enabled, setEnabled] = useState(option.status === "active");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditSuccess, setShowEditSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleStatusToggle = async () => {
    try {
      setLoading(true);
      const newStatus = enabled ? "inactive" : "active";

      const response = await updatePaymentOption(option.id, {
        status: newStatus,
      });

      if (response.success) {
        setEnabled(!enabled);
        onRefresh();
      }
    } catch (err) {
      console.error("Error updating payment option status:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      const response = await deletePaymentOption(option.id);

      if (response.success) {
        CRUDToasts.deleted("Payment Option");
        setShowDeleteConfirm(false);
        onRefresh();
      }
    } catch (err) {
      console.error("Error deleting payment option:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setShowEditSuccess(true);
    onRefresh();
  };

  return (
    <>
      <tr className="border-b last:border-none">
        <td className="px-4 py-3">
          {option.name}
          <span className="text-gray-500 text-xs ml-2">({option.type})</span>
        </td>

        <td className="px-4 py-3">
          <StatusToggle
            enabled={enabled}
            onChange={handleStatusToggle}
          />
        </td>

        <td className="px-4 py-3">
          <ActionMenu
            onEdit={() => setShowEditModal(true)}
            onDelete={() => setShowDeleteConfirm(true)}
          />
        </td>
      </tr>

      {/* ================= EDIT MODAL ================= */}
      {showEditModal && (
        <EditPaymentModal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
          option={option}
        />
      )}

      {/* ================= EDIT SUCCESS MODAL ================= */}
      {showEditSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-white rounded-lg p-6 sm:p-8 text-center w-full max-w-sm relative">
            <button
              onClick={() => setShowEditSuccess(false)}
              className="absolute top-3 right-3 text-gray-400"
            >
              ✕
            </button>

            <h3 className="text-lg sm:text-xl font-bold mb-2">
              Payment Mode Updated
            </h3>

            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-500 flex items-center justify-center text-white text-2xl sm:text-3xl">
                ✓
              </div>
            </div>

            <p className="text-sm text-gray-600">
              Payment mode updated successfully!
            </p>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-white rounded-lg p-6 sm:p-8 w-full max-w-sm relative">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute top-3 right-3 text-gray-400"
            >
              ✕
            </button>

            <h3 className="text-lg sm:text-xl font-bold mb-2">
              Delete Payment Mode
            </h3>

            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete "{option.name}"? This action
              cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="border px-6 py-2 rounded-md"
                disabled={loading}
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                disabled={loading}
                className="bg-red-500 text-white px-6 py-2 rounded-md font-medium disabled:opacity-50"
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentRow;
