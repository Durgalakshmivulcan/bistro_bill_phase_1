interface DeleteConfirmModalProps {
  title?: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmModal({
  title = "Delete",
  message,
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-xl p-6 text-center shadow-lg">
        <h2 className="text-2xl font-bold mb-4">
          {title}
        </h2>

        <div className="flex justify-center mb-4 text-red-500 text-4xl">
          
        </div>

        <p className="text-sm text-gray-600 mb-6">
          {message}
        </p>

        <div className="flex justify-center gap-3">
          <button
            onClick={onCancel}
            className="border px-6 py-2 rounded-md"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="bg-yellow-400 px-6 py-2 rounded-md font-medium"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}
