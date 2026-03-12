import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

type Option = {
  label: string;
  value: string;
};

type MultiSelectProps = {
  label: string;
  required?: boolean;
  options: Option[];
  value: string[];
  onChange: (values: string[]) => void;
};

export default function MultiSelect({
  label,
  required,
  options,
  value,
  onChange,
}: MultiSelectProps) {
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

  const toggleValue = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const getLabelByValue = (val: string) => {
    const option = options.find((opt) => opt.value === val);
    return option?.label || val;
  };

  return (
    <div ref={ref} className="space-y-2">
      <label className="font-bold">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* DROPDOWN */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full border rounded-md px-3 py-2 text-sm flex justify-between items-center bg-bb-bg"
      >
        Select {label}
        <ChevronDown size={14} />
      </button>

      {open && (
  <div className="border rounded-md bg-white shadow-lg overflow-hidden">
    {options.map((opt) => {
      const checked = value.includes(opt.value);

      return (
        <label
          key={opt.value}
          className={`flex items-center gap-3 px-4 py-3 text-sm cursor-pointer
            ${checked ? "bg-[#FFE8A3]" : "hover:bg-gray-100"}
          `}
        >
          {/* Custom Checkbox */}
          <span
            className={`w-5 h-5 flex items-center justify-center border border-grey
              ${checked ? "bg-[#FFE8A3] border-black" : "border-gray-400"}
            `}
          >
            {checked && (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="black"
                strokeWidth="4"
              >
                <path d="M6 12.5l4 4L18 8" />
              </svg>
            )}
          </span>

          <input
            type="checkbox"
            checked={checked}
            onChange={() => toggleValue(opt.value)}
            className="hidden"
          />

          <span className="text-gray-700">{opt.label}</span>
        </label>
      );
    })}
  </div>
)}


      {/* SELECTED CHIPS */}
      {value.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {value.map((v) => (
            <span
              key={v}
              className="bg-bb-coloredborder text-black px-3 py-1 rounded-full text-xs flex items-center gap-1"
            >
              {getLabelByValue(v)}
              <button
                type="button"
                onClick={() => toggleValue(v)}
                className="text-xs"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
