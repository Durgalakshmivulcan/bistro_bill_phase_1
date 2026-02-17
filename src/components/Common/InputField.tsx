import React from "react";

interface InputFieldProps {
  label: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  rightIcon,
  disabled = false,
}) => {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-800">
        {label}
      </label>

      <div className="relative">
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="
            w-full
            h-11
            rounded-lg
            border
            border-gray-200
            px-4
            pr-10
            text-sm
            text-gray-800
            placeholder-gray-400
            focus:outline-none
            focus:ring-1
            focus:ring-yellow-400
            disabled:opacity-50
            disabled:cursor-not-allowed
            disabled:bg-gray-50
          "
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer">
            {rightIcon}
          </div>
        )}
      </div>
    </div>
  );
};

export default InputField;
