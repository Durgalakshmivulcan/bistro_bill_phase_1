import { quickRanges } from "./dateRanges";
import { useMemo, useState } from "react";

type Props = {
  onApply: (range: { start: Date; end: Date }) => void;
  onCancel: () => void;
};

export default function DateRangePanel({ onApply, onCancel }: Props) {
  const today = useMemo(() => new Date(), []);
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split("T")[0]);

  const applyQuickRange = (range: string) => {
    const end = new Date(today);
    const start = new Date(today);

    if (range === "Today") {
      // start and end remain today
    } else if (range === "Yesterday") {
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() - 1);
    } else if (range === "Last 7 days") {
      start.setDate(start.getDate() - 6);
    } else if (range === "Last 30 days") {
      start.setDate(start.getDate() - 29);
    } else if (range === "This Month") {
      start.setDate(1);
    } else if (range === "Last Month") {
      start.setMonth(start.getMonth() - 1, 1);
      end.setDate(0);
    } else if (/^\d{4}$/.test(range)) {
      const year = Number(range);
      start.setFullYear(year, 0, 1);
      end.setFullYear(year, 11, 31);
    }

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  };

  return (
    <div className="bg-white border border-bb-coloredborder rounded-lg shadow-lg flex relative">
      
      {/* LEFT QUICK RANGES */}
      <div className="w-40 border-r bg-[#FFF9EA] p-2">
        {quickRanges.map((r) => (
          <button
            key={r}
            onClick={() => applyQuickRange(r)}
            className="w-full text-left px-2 py-1.5 text-sm hover:bg-yellow-100 rounded"
          >
            {r}
          </button>
        ))}
      </div>

      {/* RIGHT CALENDARS */}
      <div className="p-4 flex flex-col gap-4 min-w-[280px]">
        <div>
          <label className="text-xs text-bb-textSoft">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border border-bb-coloredborder rounded-md px-3 py-2 text-sm mt-1"
          />
        </div>
        <div>
          <label className="text-xs text-bb-textSoft">End Date</label>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full border border-bb-coloredborder rounded-md px-3 py-2 text-sm mt-1"
          />
        </div>
      </div>

      {/* FOOTER */}
      <div className="absolute bottom-2 right-4 flex gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-1.5 text-sm border rounded"
        >
          Cancel
        </button>
        <button
          onClick={() => onApply({ start: new Date(startDate), end: new Date(endDate) })}
          className="px-4 py-1.5 text-sm bg-yellow-400 rounded"
          disabled={!startDate || !endDate}
        >
          Apply
        </button>
      </div>
    </div>
  );
}
