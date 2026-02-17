import { quickRanges } from "./dateRanges";

type Props = {
  onApply: (range: { start: Date; end: Date }) => void;
  onCancel: () => void;
};

export default function DateRangePanel({ onApply, onCancel }: Props) {
  return (
    <div className="bg-white border border-bb-coloredborder rounded-lg shadow-lg flex">
      
      {/* LEFT QUICK RANGES */}
      <div className="w-40 border-r bg-[#FFF9EA] p-2">
        {quickRanges.map((r) => (
          <button
            key={r}
            className="w-full text-left px-2 py-1.5 text-sm hover:bg-yellow-100 rounded"
          >
            {r}
          </button>
        ))}
      </div>

      {/* RIGHT CALENDARS */}
      <div className="p-4 flex gap-6">
        {/* Month 1 */}
        <CalendarMock title="Apr, 2025" />
        {/* Month 2 */}
        <CalendarMock title="May, 2025" />
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
          onClick={() =>
            onApply({ start: new Date(), end: new Date() })
          }
          className="px-4 py-1.5 text-sm bg-yellow-400 rounded"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

/* TEMP calendar mock — replace later */
function CalendarMock({ title }: { title: string }) {
  return (
    <div className="w-56">
      <div className="text-sm font-medium mb-2">{title}</div>
      <div className="grid grid-cols-7 gap-1 text-xs text-center">
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={i}
            className="py-1 rounded hover:bg-yellow-100 cursor-pointer"
          >
            {i + 1 <= 30 ? i + 1 : ""}
          </div>
        ))}
      </div>
    </div>
  );
}
