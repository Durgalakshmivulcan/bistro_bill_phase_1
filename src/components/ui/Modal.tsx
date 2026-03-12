// components/ui/Modal.tsx
import { X } from "lucide-react";
import { ReactNode, useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

const Modal = ({ open, onClose, children, className = "" }: ModalProps) => {
  // Handle escape key press
  useEffect(() => {
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", escHandler);
    return () => document.removeEventListener("keydown", escHandler);
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center">

      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Content */}
      <div
        className={`relative bg-white rounded-xl shadow-lg z-10 ${className}`}
      >
        <button
          onClick={onClose}
          className="absolute right-2 top-2 text-black hover:text-black"
        >
          <X size={18} />
        </button>

        {children}
      </div>
    </div>
  );
};

export default Modal;
