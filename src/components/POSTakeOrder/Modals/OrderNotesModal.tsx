import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  value: string;
  onClose: () => void;
  onSave: (note: string) => void;
};

const OrderNotesModal = ({ open, value, onClose, onSave }: Props) => {
  const [note, setNote] = useState(value || "");

  useEffect(() => {
    setNote(value || "");
  }, [value]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white relative w-full max-w-lg rounded-xl p-4">
        <h2 className="font-bold mb-3">Add Order Notes</h2>
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-400"
        >
          ✕
        </button>
<label className="font-sm font-bold">Description</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full h-28 border rounded-lg p-2 text-sm"
          placeholder="Add notes for this item"
        />

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="border px-4 py-2 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(note)}
            className="bg-[#FFC533] px-4 py-2 rounded-lg font-medium"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderNotesModal;
