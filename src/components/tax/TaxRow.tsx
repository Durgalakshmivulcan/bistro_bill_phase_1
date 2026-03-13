import { useState } from "react";
import { Tax, deleteTax } from "../../services/settingsService";
import ActionMenu from "../Common/ActionMenu";
import EditTaxModal from "./EditTaxModal";
import { CRUDToasts } from "../../utils/toast";

type Props = {
  tax: Tax;
  onDeleted?: () => void;
  onUpdated?: () => void;
};

const TaxRow: React.FC<Props> = ({ tax, onDeleted, onUpdated }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (): Promise<void> => {
    try {
      setDeleting(true);
      const response = await deleteTax(tax.id);

      if (response.success) {
        CRUDToasts.deleted("Tax");
        if (onDeleted) {
          onDeleted();
        }
        return;
      }
      return;
    } catch (err) {
      console.error('Error deleting tax:', err);
      return;
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {/* ================= TABLE ROW ================= */}
      <tr className="border-b last:border-none even:bg-[#FFF9E8]">
        <td className="px-6 py-4">{tax.name}</td>
        <td className="px-6 py-4">{tax.percentage}%</td>
        <td className="px-6 py-4">
          <ActionMenu
            deleteEntityName="Tax"
            successTimerMs={null}
            onEdit={() => {
              setShowEditModal(true);
            }}
            onDelete={handleDelete}
          />
        </td>
      </tr>

      {/* ================= EDIT TAX MODAL ================= */}
      <EditTaxModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        tax={tax}
        onSuccess={() => {
          setShowEditModal(false);
          if (onUpdated) {
            onUpdated();
          }
        }}
      />
    </>
  );
};

export default TaxRow;
