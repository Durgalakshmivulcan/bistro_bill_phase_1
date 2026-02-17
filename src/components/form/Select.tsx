import { useState, useRef, useEffect, ReactNode } from "react";
import { ChevronDown } from "lucide-react";

type Option = {
  label: ReactNode;
  value: string;
};

type SelectProps = {
  label?: string;
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  options?: Option[];
  className?: string;
  containerClassName?: string;
  disabled?: boolean; // ✅ ADD THIS
};

export default function Select({
  label,
  required = false,
  value,
  onChange,
  options = [],
  className = "",
  containerClassName = "",
  disabled = false, // ✅ ADD THIS
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  // Close dropdown if disabled while open
  useEffect(() => {
    if (disabled) {
      setOpen(false);
    }
  }, [disabled]);

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
    <div
      ref={ref}
      className={`relative w-full ${containerClassName} ${
        disabled ? "opacity-60 pointer-events-none" : ""
      }`}
    >
      {label && (
        <label className="text-sm font-bold">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setOpen((o) => !o);
        }}
        className={`
          w-full mt-1
          border border-bb-coloredborder
          rounded-md
          px-3 py-2
          bg-bb-bg
          text-sm
          flex items-center justify-between
          ${className}
          ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        <span className="truncate">
          {selected?.label || "Select"}
        </span>
        <ChevronDown size={14} />
      </button>

      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white border rounded-md shadow">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange?.(opt.value);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
