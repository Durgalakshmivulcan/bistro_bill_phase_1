import { X } from "lucide-react";

type Props = {
  title: string;
  message: string;
  icon: string;
  onClose: () => void;
};

const SuccessModal = ({ title, message, icon, onClose }: Props) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-[360px] rounded-xl p-6 text-center shadow-xl animate-scaleIn">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-black"
        >
          <X size={18} />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <img
            src={icon}
            alt="success"
            className="w-14 h-14"
          />
        </div>

        {/* Content */}
        <h3 className="text-lg font-semibold">
          {title}
        </h3>

        <p className="text-sm text-gray-500 mt-1">
          {message}
        </p>

        {/* Action */}
        <button
          onClick={onClose}
          className="mt-5 px-6 py-2 bg-[#FFC533] rounded-lg font-medium"
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;
