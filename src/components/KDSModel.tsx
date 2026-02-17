import React from "react";
import { useNavigate } from "react-router-dom";

interface KDSModalProps {
  open: boolean;
  onClose: () => void;
}

const kitchens = [
  { id: 1, name: "Kitchen-1" },
  { id: 2, name: "Beverages" },
  { id: 3, name: "Kitchen-2" },
];

const KDSModal: React.FC<KDSModalProps> = ({ open, onClose }) => {
  const navigate = useNavigate();

  if (!open) return null;

  const handleKitchenClick = (kitchenName: string) => {
    onClose();               // close modal (same pattern as status modal)
    navigate("/kds", {
      state: { kitchen: kitchenName }, // optional but useful
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl w-[90%] max-w-md p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>

        <h2 className="text-xl font-semibold text-center">
          Select the Kitchen
        </h2>
        <p className="text-sm text-gray-500 text-center mt-1">
          Choose a kitchen to View Kitchen Display System
        </p>

        <div className="grid grid-cols-3 gap-4 mt-6">
          {kitchens.map((kitchen) => (
            <button
              key={kitchen.id}
              onClick={() => handleKitchenClick(kitchen.name)}
              className="
                flex flex-col items-center justify-center
                border rounded-lg p-3
                hover:border-yellow-400 hover:shadow-md
                transition
              "
            >
              <div className="w-12 h-12 mb-2 flex items-center justify-center bg-yellow-50 rounded-md">
                🍳
              </div>
              <span className="text-sm font-medium">
                {kitchen.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KDSModal;