import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string, remarks?: string) => void;
};

const reasons = [
  "Order Placed by Mistake",
  "Restaurant-Specific Cancellation",
  "Incorrect Order Details",
  "Duplicate Order",
  "Unavailability of Items",
  "Others",
];

const CancelOrderModal = ({ open, onClose, onSubmit }: Props) => {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");

  if (!open) return null;

  const handleSubmit = () => {
    if (!selectedReason) {
      alert("Please select a reason for cancellation");
      return;
    }
    onSubmit(selectedReason, remarks || undefined);
    // Reset form
    setSelectedReason("");
    setRemarks("");
  };

  const handleClose = () => {
    // Reset form
    setSelectedReason("");
    setRemarks("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">

      <div
        className="absolute inset-0 bg-black/40"
        onClick={handleClose}
      />

      <div className="relative w-[380px] rounded-2xl bg-white p-6">

        <button
          onClick={handleClose}
          className="absolute right-3 top-3 text-gray-400"
        >
          ✕
        </button>

        <h3 className="text-lg font-semibold mb-4">
          Select a Reason to Cancel this Order
        </h3>

        <div className="space-y-2">
          {reasons.map((r) => (
            <label
              key={r}
              className="flex items-center gap-2 rounded-lg bg-yellow-50 px-3 py-2"
            >
              <input
                type="radio"
                name="cancel"
                value={r}
                checked={selectedReason === r}
                onChange={(e) => setSelectedReason(e.target.value)}
              />
              {r}
            </label>
          ))}
        </div>

        <textarea
          placeholder="Remarks (Optional)"
          className="mt-3 w-full rounded-lg border p-2 text-sm"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="rounded-lg border px-5 py-2 text-sm"
          >
            No
          </button>

          <button
            onClick={handleSubmit}
            className="rounded-lg bg-[#FFC533] px-5 py-2 text-sm font-medium"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelOrderModal;
