import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import DateRangePanel from "./DateRangePanel";

type Props = {
  value: string;
  onApply: (range: { start: Date; end: Date }) => void;
};

export default function DateRangePicker({ value, onApply }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative w-fit">
      {/* INPUT */}
      <button
        onClick={() => setOpen(!open)}
        className="
          flex items-center gap-2
          border border-bb-coloredborder
          bg-white
          px-3 py-2
          rounded-md
          text-sm
          min-w-[260px]
          justify-between
        "
      >
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-bb-textSoft" />
          <span>{value}</span>
        </div>
        <ChevronDown size={14} />
      </button>

      {/* DROPDOWN */}
      {open && (
        <div className="absolute right-0 mt-2 z-50">
          <DateRangePanel
            onApply={(range: { start: Date; end: Date; }) => {
              onApply(range);
              setOpen(false);
            }}
            onCancel={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
