/**
 * ErrorDisplay Component
 *
 * Standardized error message display with optional retry functionality
 * Used consistently across all pages for error states
 */

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorDisplayProps {
  /** Error message to display */
  message: string;
  /** Optional retry callback */
  onRetry?: () => void;
  /** Custom title (default: "Error") */
  title?: string;
  /** Size variant (default: "medium") */
  size?: 'small' | 'medium' | 'large';
  /** Display style (default: "card") */
  variant?: 'card' | 'inline' | 'banner';
  /** Custom className for additional styling */
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  message,
  onRetry,
  title = 'Error',
  size = 'medium',
  variant = 'card',
  className = '',
}) => {
  const sizeClasses = {
    small: 'p-3 text-sm',
    medium: 'p-4 text-base',
    large: 'p-6 text-lg',
  };

  const variantClasses = {
    card: 'bg-red-50 border border-red-200 rounded-lg',
    inline: 'bg-red-50 border-l-4 border-red-500',
    banner: 'bg-red-100 border-b border-red-300',
  };

  const iconSizes = {
    small: 16,
    medium: 20,
    large: 24,
  };

  return (
    <div className={`${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      <div className="flex items-start gap-3">
        {/* Error Icon */}
        <AlertCircle
          size={iconSizes[size]}
          className="text-red-600 flex-shrink-0 mt-0.5"
        />

        {/* Error Content */}
        <div className="flex-1">
          {variant === 'card' && (
            <h3 className="font-semibold text-red-800 mb-1">{title}</h3>
          )}
          <p className="text-red-700">{message}</p>
        </div>

        {/* Retry Button */}
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex-shrink-0"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Inline error message (for form fields)
 */
interface InlineErrorProps {
  message: string;
  className?: string;
}

export const InlineError: React.FC<InlineErrorProps> = ({ message, className = '' }) => {
  return (
    <p className={`text-sm text-red-600 mt-1 ${className}`}>
      {message}
    </p>
  );
};

/**
 * Error banner (for page-level errors)
 */
interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  onDismiss,
  onRetry,
}) => {
  return (
    <div className="bg-red-100 border-b border-red-300 px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
          <p className="text-red-800">{message}</p>
        </div>

        <div className="flex items-center gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          )}

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-red-600 hover:text-red-800 transition-colors p-1"
              aria-label="Dismiss"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;
