import { useNavigate } from "react-router-dom";
import Actions from "../form/ActionButtons";
import { useState } from "react";
import Modal from "../ui/Modal";
import { deleteAllergy, Allergen } from "../../services/masterDataService";

// Images
import deleteConfirmImg from "../../assets/deleteConformImg.png";
import deleteSuccessImg from "../../assets/deleteSuccessImg.png";

interface Props {
  allergens: Allergen[];
  onDeleted?: () => void;
}

const AllergiesTable = ({ allergens, onDeleted }: Props) => {
  const navigate = useNavigate();

  const [deleteItem, setDeleteItem] = useState<Allergen | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await deleteAllergy(deleteItem.id);
      if (res.success) {
        setShowConfirm(false);
        setShowSuccess(true);
        onDeleted?.();
      } else {
        setDeleteError(res.message || "Failed to delete allergen");
      }
    } catch {
      setDeleteError("Failed to delete allergen");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="bg-yellow-400">
          <tr>
            <th className="px-4 py-3 text-left">Allergen Name</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {allergens.map((item) => (
            <tr
              key={item.id}
              className="border-b odd:bg-white even:bg-[#FFF8E7]"
            >
              <td className="px-4 py-3 font-medium">{item.name}</td>

              <td className="px-4 py-3 text-right">
                <Actions
                  actions={["edit", "delete"]}
                  onEdit={() => navigate(`allergies/edit/${item.id}`)}
                  onDelete={() => {
                    setDeleteItem(item);
                    setShowConfirm(true);
                    setDeleteError(null);
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* DELETE CONFIRM MODAL */}
      {showConfirm && deleteItem && (
        <Modal
          open={showConfirm}
          onClose={() => {
            setShowConfirm(false);
            setDeleteItem(null);
          }}
          className="w-[90%] max-w-md p-6 text-center z-[9999]"
        >
          <h2 className="text-2xl font-bold mb-4">Delete Allergen</h2>

          <div className="flex justify-center mb-4">
            <img src={deleteConfirmImg} alt="delete" className="w-16 h-16" />
          </div>

          <p className="text-sm text-gray-600 mb-6">
            This action cannot be undone. <br />
            Are you sure you want to delete{" "}
            <span className="font-medium">{deleteItem.name}</span>?
          </p>

          {deleteError && (
            <p className="text-sm text-red-500 mb-4">{deleteError}</p>
          )}

          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                setShowConfirm(false);
                setDeleteItem(null);
              }}
              className="border px-6 py-2 rounded"
            >
              Cancel
            </button>

            <button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-yellow-400 px-6 py-2 rounded font-medium disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Yes"}
            </button>
          </div>
        </Modal>
      )}

      {/* DELETE SUCCESS MODAL */}
      {showSuccess && (
        <Modal
          open={showSuccess}
          onClose={() => {
            setShowSuccess(false);
            setDeleteItem(null);
          }}
          className="w-[90%] max-w-md p-6 text-center z-[9999]"
        >
          <h2 className="text-2xl font-bold mb-4">Deleted!</h2>

          <div className="flex justify-center mb-4">
            <img src={deleteSuccessImg} alt="success" className="w-16 h-16" />
          </div>

          <p className="text-sm text-gray-600">
            Allergen has been successfully removed.
          </p>
        </Modal>
      )}
    </div>
  );
};

export default AllergiesTable;
