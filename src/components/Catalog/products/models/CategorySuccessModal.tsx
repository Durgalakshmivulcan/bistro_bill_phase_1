import Modal from "../../../ui/Modal";
import { Check } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CategorySuccessModal({
  open,
  onClose,
}: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      className="w-[420px] p-6"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">
          Category Created
        </h2>

        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check size={32} className="text-white" />
        </div>

        <p className="text-sm text-gray-600">
          New Category added Successfully!
        </p>
      </div>
    </Modal>
  );
}
