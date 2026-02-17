import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Global Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the app.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // TODO: Send error to logging service (e.g., Sentry, LogRocket)
    // logErrorToService(error, errorInfo);
  }

  handleRetry = (): void => {
    // Reset error state and attempt to re-render children
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-bb-bg px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-bb-card p-6 text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-16 w-16 text-bb-danger"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-bb-text mb-2">
              Oops! Something went wrong
            </h1>

            <p className="text-bb-textSoft mb-6">
              We're sorry for the inconvenience. An unexpected error has occurred.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-bb-textSoft hover:text-bb-text mb-2">
                  Error Details (Development Only)
                </summary>
                <div className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-48">
                  <p className="font-semibold text-red-600 mb-2">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="whitespace-pre-wrap text-gray-700">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-6 py-2 bg-bb-primary text-white rounded-lg hover:bg-yellow-500 transition-colors font-medium"
              >
                Try Again
              </button>

              <button
                onClick={() => (window.location.href = '/')}
                className="px-6 py-2 bg-gray-200 text-bb-text rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Go to Home
              </button>
            </div>

            <p className="mt-6 text-sm text-bb-textSoft">
              If the problem persists, please contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
