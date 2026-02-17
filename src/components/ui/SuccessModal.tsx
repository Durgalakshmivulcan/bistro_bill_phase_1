import tickImg from "../../assets/tick.png";
import { X } from "lucide-react";

interface SuccessModalProps {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export default function SuccessModal({
  open,
  title,
  message,
  onClose,
}: SuccessModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 sm:px-6">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-xl p-6 sm:p-8 text-center shadow-lg">
        
        {/* Close Icon */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl sm:text-2xl font-bold mb-6">
          {title}
        </h2>

        <div className="flex justify-center mb-6">
          <img
            src={tickImg}
            alt="Success"
            className="w-14 h-14 sm:w-16 sm:h-16"
          />
        </div>

        <p className="text-sm sm:text-base text-gray-600">
          {message}
        </p>
      </div>
    </div>
  );
}
