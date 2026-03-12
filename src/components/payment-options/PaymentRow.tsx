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
  onUpdatedSuccess: () => void | Promise<void>;
};

const PaymentRow: React.FC<Props> = ({ option, onRefresh, onUpdatedSuccess }) => {
  const [enabled, setEnabled] = useState(option.status === "active");
  const [showEditModal, setShowEditModal] = useState(false);
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

  const handleDelete = async (): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await deletePaymentOption(option.id);

      if (response.success) {
        CRUDToasts.deleted("Payment Option");
        onRefresh();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error deleting payment option:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleEditSuccess = async () => {
    setShowEditModal(false);
    await onUpdatedSuccess();
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
            onDelete={handleDelete}
            deleteEntityName="Payment mode"
            successTimerMs={null}
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
    </>
  );
};

export default PaymentRow;
