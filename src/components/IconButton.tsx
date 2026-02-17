import React from "react";
import { LucideIcon } from "lucide-react";

type IconButtonProps = {
  icon: LucideIcon;
  label?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  className?: string;
};

const IconButton: React.FC<IconButtonProps> = ({
  icon: Icon,
  label,
  variant = "primary",
  size = "md",
  onClick,
  className = "",
}) => {
  const variantStyles: Record<string, string> = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 border border-blue-600",
    secondary:
      "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300",
    ghost:
      "bg-transparent text-gray-600 hover:bg-gray-100 border border-transparent",
    danger:
      "bg-red-500 text-white hover:bg-red-600 border border-red-500",
  };

  const sizeStyles: Record<string, string> = {
    sm: "p-1.5 text-xs",
    md: "p-2.5 text-sm",
    lg: "p-3 text-base",
  };

  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-2 rounded-lg transition-all duration-150
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      <Icon size={size === "sm" ? 14 : size === "md" ? 18 : 20} />
      {label && <span>{label}</span>}
    </button>
  );
};

export default IconButton;
