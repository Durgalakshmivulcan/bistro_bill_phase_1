import { useState } from "react";
import Modal from "../ui/Modal";

interface Props {
  startDate: string;
  endDate: string;
  onApply: (start: string, end: string) => void;
}

const formatDate = (date: string) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const FigmaDateRangePicker = ({
  startDate,
  endDate,
  onApply,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [localStart, setLocalStart] = useState(startDate);
  const [localEnd, setLocalEnd] = useState(endDate);

  const displayText =
    localStart && localEnd
      ? `${formatDate(localStart)} – ${formatDate(localEnd)}`
      : "Select Date Range";

  return (
    <>
      {/* PILL BUTTON */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 border border-bb-border rounded-md px-4 py-2 text-sm bg-white hover:bg-gray-50 w-full sm:w-auto"
      >
        <i className="bi bi-calendar-event text-bb-textSoft"></i>
        <span className="truncate">{displayText}</span>
      </button>

      {/* MODAL */}
      {open && (
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          className="w-[90%] max-w-sm p-6 text-center"
        >
          <h2 className="text-xl font-semibold mb-4">
            Select Date Range
          </h2>

          <div className="space-y-4">
            <div className="text-left">
              <label className="text-sm font-medium mb-1 block">
                Start Date
              </label>
              <input
                type="date"
                value={localStart}
                onChange={(e) =>
                  setLocalStart(e.target.value)
                }
                className="w-full border rounded-md px-3 py-2"
              />
            </div>

            <div className="text-left">
              <label className="text-sm font-medium mb-1 block">
                End Date
              </label>
              <input
                type="date"
                value={localEnd}
                min={localStart || undefined}
                onChange={(e) =>
                  setLocalEnd(e.target.value)
                }
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={() => setOpen(false)}
              className="border px-6 py-2 rounded-md"
            >
              Cancel
            </button>

            <button
              onClick={() => {
                onApply(localStart, localEnd);
                setOpen(false);
              }}
              className="bg-yellow-400 px-6 py-2 rounded-md font-medium"
              disabled={!localStart || !localEnd}
            >
              Apply
            </button>
          </div>
        </Modal>
      )}
    </>
  );
};

export default FigmaDateRangePicker;
