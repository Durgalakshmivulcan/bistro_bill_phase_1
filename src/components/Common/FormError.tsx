import React from "react";

interface FormErrorProps {
  message: string;
  className?: string;
}

/**
 * FormError Component
 * Displays validation error messages below form fields consistently
 */
export const FormError: React.FC<FormErrorProps> = ({ message, className = "" }) => {
  if (!message) return null;

  return (
    <p className={`text-red-500 text-sm mt-1 ${className}`}>
      {message}
    </p>
  );
};

export default FormError;
