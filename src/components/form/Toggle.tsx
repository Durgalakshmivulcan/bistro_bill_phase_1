import { useId, useState, useEffect } from "react";

type ToggleProps = {
  label: string;
  value?: boolean;
  onChange?: (value: boolean) => void;
};

const Toggle = ({ label, value, onChange }: ToggleProps) => {
  const id = useId();

  // Internal state (fallback)
  const [internalValue, setInternalValue] = useState<boolean>(value ?? true);

  // Sync if parent controls value
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const handleChange = (val: boolean) => {
    setInternalValue(val);
    onChange?.(val);
  };

  return (
    <div>
      <label className="font-bold">{label}</label>

      <div className="flex gap-6 mt-1 text-sm">
        {/* YES */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={id}
            checked={internalValue === true}
            onChange={() => handleChange(true)}
            className="hidden"
          />
          <span
            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
              ${
                internalValue
                  ? "border-green-500"
                  : "border-gray-400"
              }`}
          >
            <span
              className={`w-2 h-2 rounded-full
                ${internalValue ? "bg-green-500" : "hidden"}`}
            />
          </span>
          <span className="text-green-600">Yes</span>
        </label>

        {/* NO */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={id}
            checked={internalValue === false}
            onChange={() => handleChange(false)}
            className="hidden"
          />
          <span
            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
              ${
                internalValue === false
                  ? "border-red-500"
                  : "border-gray-400"
              }`}
          >
            <span
              className={`w-2 h-2 rounded-full
                ${
                  internalValue === false
                    ? "bg-red-500"
                    : "hidden"
                }`}
            />
          </span>
          <span>No</span>
        </label>
      </div>
    </div>
  );
};

export default Toggle;
