type Props = {
  open: boolean;
  title: string;
  description?: string;
  image: string;
  confirmText?: string;
  cancelText?: string;
  onClose: () => void;
  onConfirm?: () => void;
};

const ActionAlertModal = ({
  open,
  title,
  description,
  image,
  confirmText = "Yes",
  cancelText = "Cancel",
  onClose,
  onConfirm,
}: Props) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">

      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* MODAL */}
      <div className="relative w-[360px] rounded-2xl bg-white p-6 shadow-xl text-center">

        {/* CLOSE */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-400"
        >
          ✕
        </button>

        {/* IMAGE */}
        <img
          src={image}
          alt={title}
          className="mx-auto h-20 w-20 object-contain"
        />

        <h3 className="mt-4 text-lg font-semibold">
          {title}
        </h3>

        {description && (
          <p className="mt-2 text-sm text-gray-500">
            {description}
          </p>
        )}

        {/* ACTIONS */}
        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={onClose}
            className="rounded-lg border px-6 py-2 text-sm"
          >
            {cancelText}
          </button>

          {onConfirm && (
            <button
              onClick={onConfirm}
              className="rounded-lg bg-[#FFC533] px-6 py-2 text-sm font-medium"
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActionAlertModal;
