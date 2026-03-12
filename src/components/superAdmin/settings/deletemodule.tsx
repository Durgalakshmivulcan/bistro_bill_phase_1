import { useState } from "react";
import Modal from "../../ui/Modal";
import TickIcon from "../../../assets/deleteSuccessImg.png";
import DeleteIcon from "../../../assets/deleteConformImg.png";
import { deleteSubscriptionOrder } from "../../../services/superAdminService"; // ✅ adjust path if needed

interface Props {
  open: boolean;
  orderId: string | number | null;
  onClose: () => void;
  onDeleted?: () => void;
}

const DeleteModal = ({ open, orderId, onClose, onDeleted }: Props) => {
  const [step, setStep] = useState<"confirm" | "success">("confirm");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  // ✅ REAL DELETE HANDLER
  const handleDelete = async () => {
    if (!orderId) return;

    try {
      setLoading(true);

      // 🔥 CALL API
      await deleteSubscriptionOrder(orderId);

      // show success UI
      setStep("success");

      // notify parent after short delay
      setTimeout(() => {
        onDeleted?.(); // ✅ VERY IMPORTANT
        setStep("confirm");
      }, 1200);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        setStep("confirm");
        onClose();
      }}
      className="w-[360px] p-6"
    >
      {step === "confirm" && (
        <div className="flex flex-col items-center text-center gap-3">
          <img src={DeleteIcon} alt="Delete" className="w-12 h-12" />

          <h2 className="text-lg font-semibold">Delete</h2>

          <p className="text-sm text-gray-500">
            This action cannot be undone.
            <br />
            Do you want to proceed with deletion?
          </p>

          <div className="flex gap-3 mt-4">
            <button
              onClick={onClose}
              className="px-6 py-2 border rounded-md text-sm"
            >
              Cancel
            </button>

            <button
              onClick={handleDelete}
              disabled={loading}
              className="px-6 py-2 bg-yellow-400 rounded-md text-sm font-medium disabled:opacity-50"
            >
              {loading ? "Deleting..." : "Yes"}
            </button>
          </div>
        </div>
      )}

      {step === "success" && (
        <div className="flex flex-col items-center text-center gap-3">
          <img
            src={TickIcon}
            alt="Deleted successfully"
            className="w-10 h-10"
          />

          <h2 className="text-base font-semibold">Deleted!</h2>

          <p className="text-sm text-gray-500">
            Order has been successfully removed.
          </p>
        </div>
      )}
    </Modal>
  );
};

export default DeleteModal;