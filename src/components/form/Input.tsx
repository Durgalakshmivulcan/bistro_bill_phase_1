import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { ReactNode } from "react";

type InputProps = {
  label: string;
  required?: boolean;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  value?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
  rightIcon?: ReactNode;
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value" | "type"
>;

const Input = ({
  label,
  required = false,
  placeholder,
  type = "text",
  value,
  disabled = false,
  onChange,
  rightIcon,
  ...rest
}: InputProps) => {
  const isPassword = type === "password";
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-1">
      <label className="font-bold text-sm">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <input
          type={
            isPassword
              ? showPassword
                ? "text"
                : "password"
              : type
          }
          value={value}
          disabled={disabled}
          placeholder={placeholder || `Enter ${label}`}
          onChange={(e) => onChange?.(e.target.value)}
          className={`w-full border rounded-md px-3 py-2 pr-10 bg-bb-bg text-sm
    ${disabled ? "opacity-60 cursor-not-allowed" : ""}
  `}
          {...rest}
        />

        {/* 👁 Eye Icon (ONLY for password) */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-black hover:text-black"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}

        {/* Optional right icon for non-password inputs */}
        {!isPassword && rightIcon && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
            {rightIcon}
          </span>
        )}
      </div>
    </div>
  );
};

export default Input;
