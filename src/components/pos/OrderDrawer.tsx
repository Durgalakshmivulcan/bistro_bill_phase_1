interface Props {
  onClose: () => void;
  onTransfer?: () => void;
}

const OrderDrawer = ({ onClose, onTransfer }: Props) => {
  return (
    <div className="fixed inset-0 z-50 flex">
      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* DRAWER */}
      <div className="relative ml-auto w-full max-w-md bg-white h-full shadow-lg p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">
            Order Details
          </h3>

          <button
            onClick={onClose}
            className="text-xl"
          >
            ✕
          </button>
        </div>

        {onTransfer && (
          <button
            onClick={onTransfer}
            className="mb-4 bg-black text-white px-4 py-2 rounded"
          >
            Transfer Table
          </button>
        )}

        {/* Order content here */}
      </div>
    </div>
  );
};

export default OrderDrawer;
