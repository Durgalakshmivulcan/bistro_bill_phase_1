/**
 * Form Validation Utilities
 * Provides consistent validation patterns across all forms in the application
 */

// Validation result type
export interface ValidationResult {
  isValid: boolean;
  message: string;
}

// Email validation
export const validateEmail = (email: string): ValidationResult => {
  if (!email) {
    return { isValid: false, message: "Email is required" };
  }

  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    return { isValid: false, message: "Email is required" };
  }

  // Standard email regex pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, message: "Please enter a valid email address" };
  }

  return { isValid: true, message: "" };
};

// Phone validation (supports Indian format +91 and international)
export const validatePhone = (phone: string): ValidationResult => {
  if (!phone) {
    return { isValid: false, message: "Phone number is required" };
  }

  const trimmedPhone = phone.trim();

  if (!trimmedPhone) {
    return { isValid: false, message: "Phone number is required" };
  }

  // Remove spaces, hyphens, and parentheses for validation
  const cleanPhone = trimmedPhone.replace(/[\s\-\(\)]/g, "");

  // Accept formats: +91XXXXXXXXXX, 91XXXXXXXXXX, XXXXXXXXXX (10 digits)
  const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;

  if (!phoneRegex.test(cleanPhone)) {
    return {
      isValid: false,
      message: "Please enter a valid 10-digit phone number"
    };
  }

  return { isValid: true, message: "" };
};

// Required field validation
export const validateRequired = (
  value: string | number | null | undefined,
  fieldName: string = "This field"
): ValidationResult => {
  if (value === null || value === undefined) {
    return { isValid: false, message: `${fieldName} is required` };
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return { isValid: false, message: `${fieldName} is required` };
    }
  }

  if (typeof value === "number" && isNaN(value)) {
    return { isValid: false, message: `${fieldName} must be a valid number` };
  }

  return { isValid: true, message: "" };
};

// Positive number validation
export const validatePositiveNumber = (
  value: string | number,
  fieldName: string = "Value",
  allowZero: boolean = false
): ValidationResult => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return { isValid: false, message: `${fieldName} must be a valid number` };
  }

  if (allowZero ? numValue < 0 : numValue <= 0) {
    return {
      isValid: false,
      message: `${fieldName} must be ${allowZero ? 'zero or ' : ''}greater than zero`
    };
  }

  return { isValid: true, message: "" };
};

// Positive integer validation
export const validatePositiveInteger = (
  value: string | number,
  fieldName: string = "Value"
): ValidationResult => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return { isValid: false, message: `${fieldName} must be a valid number` };
  }

  if (numValue <= 0) {
    return { isValid: false, message: `${fieldName} must be greater than zero` };
  }

  if (!Number.isInteger(numValue)) {
    return { isValid: false, message: `${fieldName} must be a whole number` };
  }

  return { isValid: true, message: "" };
};

// Percentage validation (0-100)
export const validatePercentage = (
  value: string | number,
  fieldName: string = "Percentage"
): ValidationResult => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return { isValid: false, message: `${fieldName} must be a valid number` };
  }

  if (numValue < 0 || numValue > 100) {
    return {
      isValid: false,
      message: `${fieldName} must be between 0 and 100`
    };
  }

  return { isValid: true, message: "" };
};

// String length validation
export const validateLength = (
  value: string,
  minLength: number,
  maxLength: number,
  fieldName: string = "Field"
): ValidationResult => {
  const trimmed = value.trim();

  if (trimmed.length < minLength) {
    return {
      isValid: false,
      message: `${fieldName} must be at least ${minLength} characters`
    };
  }

  if (trimmed.length > maxLength) {
    return {
      isValid: false,
      message: `${fieldName} must not exceed ${maxLength} characters`
    };
  }

  return { isValid: true, message: "" };
};

// Date range validation
export const validateDateRange = (
  startDate: string | Date,
  endDate: string | Date,
  allowSameDay: boolean = true
): ValidationResult => {
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;

  if (isNaN(start.getTime())) {
    return { isValid: false, message: "Start date is invalid" };
  }

  if (isNaN(end.getTime())) {
    return { isValid: false, message: "End date is invalid" };
  }

  if (allowSameDay) {
    if (end < start) {
      return {
        isValid: false,
        message: "End date cannot be before start date"
      };
    }
  } else {
    if (end <= start) {
      return {
        isValid: false,
        message: "End date must be after start date"
      };
    }
  }

  return { isValid: true, message: "" };
};

// GST number validation (Indian GST format)
export const validateGST = (gst: string): ValidationResult => {
  if (!gst) {
    return { isValid: false, message: "GST number is required" };
  }

  const trimmed = gst.trim();

  // GST format: 2 digits (state code) + 10 alphanumeric (PAN) + 1 digit (entity) + 1 letter (Z) + 1 alphanumeric (checksum)
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  if (!gstRegex.test(trimmed)) {
    return {
      isValid: false,
      message: "Please enter a valid GST number (e.g., 22AAAAA0000A1Z5)"
    };
  }

  return { isValid: true, message: "" };
};

// IFSC code validation (Indian bank IFSC format)
export const validateIFSC = (ifsc: string): ValidationResult => {
  if (!ifsc) {
    return { isValid: false, message: "IFSC code is required" };
  }

  const trimmed = ifsc.trim();

  // IFSC format: 4 letters (bank code) + 0 + 6 alphanumeric (branch code)
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

  if (!ifscRegex.test(trimmed)) {
    return {
      isValid: false,
      message: "Please enter a valid IFSC code (e.g., SBIN0001234)"
    };
  }

  return { isValid: true, message: "" };
};

// Composite form validation
export interface FormErrors {
  [key: string]: string;
}

export const hasFormErrors = (errors: FormErrors): boolean => {
  return Object.values(errors).some((error) => error !== "");
};

export const clearFormError = (
  errors: FormErrors,
  field: string
): FormErrors => {
  return { ...errors, [field]: "" };
};

export const setFormError = (
  errors: FormErrors,
  field: string,
  message: string
): FormErrors => {
  return { ...errors, [field]: message };
};

// Validation helpers for common field types
export const ValidationHelpers = {
  email: validateEmail,
  phone: validatePhone,
  required: validateRequired,
  positiveNumber: validatePositiveNumber,
  positiveInteger: validatePositiveInteger,
  percentage: validatePercentage,
  length: validateLength,
  dateRange: validateDateRange,
  gst: validateGST,
  ifsc: validateIFSC,
};

export default ValidationHelpers;
