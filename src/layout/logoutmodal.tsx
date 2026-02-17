import Modal from "../components/ui/Modal";
import LogoutIcon from "../assets/logout.png"; // 👈 use your logout image

interface Props {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const LogoutConfirmModal = ({ open, onCancel, onConfirm }: Props) => {
  return (
    <Modal open={open} onClose={onCancel} className="w-[360px] p-6">
      <div className="flex flex-col items-center text-center gap-3">
        {/* Icon */}
        <img
          src={LogoutIcon}
          alt="Logout"
          className="w-14 h-14"
        />

        {/* Title */}
        <h2 className="text-lg font-semibold">Logout</h2>

        {/* Message */}
        <p className="text-sm text-gray-600">
          Are you sure you want to Logout?
        </p>

        {/* Actions */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={onCancel}
            className="px-6 py-2 border rounded-md text-sm"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-yellow-400 rounded-md text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default LogoutConfirmModal;
