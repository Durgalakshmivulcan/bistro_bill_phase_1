/**
 * Error Handler Utility
 *
 * Provides standardized error handling across the application:
 * - Consistent error message extraction
 * - User-friendly error messages
 * - Logging for debugging
 * - Retry functionality support
 */

export interface ErrorHandlerOptions {
  /** Custom error message to display to user */
  message?: string;
  /** Log error to console for debugging (default: true) */
  logError?: boolean;
  /** Show retry button in error display (default: false) */
  showRetry?: boolean;
  /** Callback function for retry action */
  onRetry?: () => void;
}

/**
 * Extract user-friendly error message from various error types
 */
export function getErrorMessage(error: unknown, fallbackMessage = 'An unexpected error occurred'): string {
  if (!error) return fallbackMessage;

  // Handle API response errors with error.message
  if (typeof error === 'object' && error !== null) {
    const err = error as any;

    // Axios-style nested backend error (most specific)
    if (err.response?.data?.error?.message) {
      return err.response.data.error.message;
    }

    // Axios-style top-level backend message
    if (err.response?.data?.message) {
      return err.response.data.message;
    }

    // API error response structure
    if (err.message) {
      return err.message;
    }

    // Error response with error property
    if (err.error?.message) {
      return err.error.message;
    }

    // Network error
    if (err.name === 'NetworkError' || err.message?.includes('network')) {
      return 'Network error. Please check your connection and try again.';
    }

    // Timeout error
    if (err.name === 'TimeoutError' || err.message?.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
  }

  // String error
  if (typeof error === 'string') {
    return error;
  }

  return fallbackMessage;
}

/**
 * Handle error with consistent pattern:
 * 1. Extract user-friendly message
 * 2. Log to console (optional)
 * 3. Update error state
 * 4. Return error message
 */
export function handleError(
  error: unknown,
  setError: (message: string | null) => void,
  options: ErrorHandlerOptions = {}
): string {
  const {
    message,
    logError = true,
  } = options;

  // Extract error message
  const errorMessage = message || getErrorMessage(error);

  // Log to console for debugging
  if (logError) {
    console.error('Error:', error);
  }

  // Update error state
  setError(errorMessage);

  return errorMessage;
}

/**
 * Clear error after a delay (useful for temporary error messages)
 */
export function clearErrorAfterDelay(
  setError: (message: string | null) => void,
  delay = 3000
): void {
  setTimeout(() => setError(null), delay);
}

/**
 * Wrapper for async operations with standardized error handling
 *
 * @example
 * await withErrorHandling(
 *   () => deleteCustomer(id),
 *   setError,
 *   { message: 'Failed to delete customer', showRetry: true }
 * );
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  setError: (message: string | null) => void,
  options: ErrorHandlerOptions = {}
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    handleError(error, setError, options);
    return null;
  }
}

/**
 * Error boundary helper for catch blocks
 * Provides consistent error handling pattern
 */
export function catchError(
  error: unknown,
  setError: (message: string | null) => void,
  customMessage?: string,
  logToConsole = true
): void {
  const errorMessage = getErrorMessage(error, customMessage);

  if (logToConsole) {
    console.error('Error:', error);
  }

  setError(errorMessage);
}

/**
 * Validation error messages (for form validation)
 */
export const ValidationErrors = {
  required: (field: string) => `${field} is required`,
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number',
  minLength: (field: string, min: number) => `${field} must be at least ${min} characters`,
  maxLength: (field: string, max: number) => `${field} must be no more than ${max} characters`,
  numeric: (field: string) => `${field} must be a number`,
  positive: (field: string) => `${field} must be a positive number`,
  url: 'Please enter a valid URL',
  date: 'Please enter a valid date',
};

/**
 * Check if error is a specific type
 */
export function isNetworkError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null) {
    const err = error as any;
    return err.name === 'NetworkError' || err.message?.includes('network');
  }
  return false;
}

export function isTimeoutError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null) {
    const err = error as any;
    return err.name === 'TimeoutError' || err.message?.includes('timeout');
  }
  return false;
}

export function isAuthError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null) {
    const err = error as any;
    return err.status === 401 || err.status === 403 || err.message?.includes('unauthorized');
  }
  return false;
}
