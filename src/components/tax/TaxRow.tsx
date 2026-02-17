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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setError(null);
      const response = await deleteTax(tax.id);

      if (response.success) {
        CRUDToasts.deleted("Tax");
        setShowDeleteConfirm(false);
        setShowDeleteSuccess(true);
        if (onDeleted) {
          onDeleted();
        }
      } else {
        setError(response.message || 'Failed to delete tax');
      }
    } catch (err) {
      setError('An error occurred while deleting the tax');
      console.error('Error deleting tax:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {/* ================= TABLE ROW ================= */}
      <tr className="border-b last:border-none">
        <td className="px-4 py-3">{tax.name}</td>
        <td className="px-4 py-3">{tax.percentage}%</td>
        <td className="px-4 py-3">
          <ActionMenu
            onEdit={() => {
              setShowEditModal(true);
            }}
            onDelete={() => {
              setShowDeleteConfirm(true);
            }}
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

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-white rounded-lg p-6 sm:p-8 w-full max-w-sm relative">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute top-3 right-3 text-gray-400"
              disabled={deleting}
            >
              ✕
            </button>

            <h3 className="text-lg sm:text-xl font-bold mb-2">
              Delete Tax
            </h3>

            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete "{tax.name}"? This action cannot be undone.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-md disabled:opacity-50"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DELETE SUCCESS MODAL ================= */}
      {showDeleteSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-white rounded-lg p-6 sm:p-8 text-center w-full max-w-sm relative">
            <button
              onClick={() => setShowDeleteSuccess(false)}
              className="absolute top-3 right-3 text-gray-400"
            >
              ✕
            </button>

            <h3 className="text-lg sm:text-xl font-bold mb-2">
              Tax Deleted
            </h3>

            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-500 flex items-center justify-center text-white text-2xl sm:text-3xl">
                ✓
              </div>
            </div>

            <p className="text-sm text-gray-600">
              Tax Deleted Successfully!
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default TaxRow;
