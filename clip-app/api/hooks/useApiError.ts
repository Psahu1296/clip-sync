import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { ApiError, ErrorCode } from '../types';

interface UseApiErrorOptions {
  /** Custom error handlers for specific error codes */
  handlers?: Partial<Record<ErrorCode, (error: ApiError) => void>>;
  /** Whether to show alert by default (default: true) */
  showAlert?: boolean;
  /** Custom alert title (default: "Error") */
  alertTitle?: string;
}

interface UseApiErrorReturn {
  /** Current error state */
  error: ApiError | null;
  /** Set an error */
  setError: (error: ApiError | null) => void;
  /** Handle an error with optional custom behavior */
  handleError: (error: unknown) => void;
  /** Clear the current error */
  clearError: () => void;
  /** Check if error is a specific code */
  isErrorCode: (code: ErrorCode) => boolean;
}

/**
 * Hook for handling API errors with customizable behavior
 */
export function useApiError(options: UseApiErrorOptions = {}): UseApiErrorReturn {
  const { handlers = {}, showAlert = true, alertTitle = 'Error' } = options;
  const [error, setError] = useState<ApiError | null>(null);

  const handleError = useCallback(
    (err: unknown) => {
      const apiError = err as ApiError;

      // Check if there's a custom handler for this error code
      if (apiError?.code && handlers[apiError.code]) {
        handlers[apiError.code]!(apiError);
        setError(apiError);
        return;
      }

      // Set the error state
      setError(apiError);

      // Show alert if enabled
      if (showAlert && apiError?.message) {
        Alert.alert(alertTitle, apiError.message);
      }
    },
    [handlers, showAlert, alertTitle]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const isErrorCode = useCallback(
    (code: ErrorCode) => {
      return error?.code === code;
    },
    [error]
  );

  return {
    error,
    setError,
    handleError,
    clearError,
    isErrorCode,
  };
}

/**
 * Get user-friendly error message for display
 */
export function getErrorMessage(error: unknown): string {
  const apiError = error as ApiError;

  if (apiError?.message) {
    return apiError.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Check if an error requires user action (upgrade, re-auth, etc.)
 */
export function requiresUserAction(error: unknown): boolean {
  const apiError = error as ApiError;
  const actionCodes: ErrorCode[] = [
    'UNAUTHORIZED',
    'PAYMENT_REQUIRED',
    'DEVICE_LIMIT_EXCEEDED',
    'CONTENT_TYPE_NOT_ALLOWED',
  ];

  return apiError?.code ? actionCodes.includes(apiError.code) : false;
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const apiError = error as ApiError;
  const retryableCodes: ErrorCode[] = [
    'NETWORK_ERROR',
    'TIMEOUT_ERROR',
    'RATE_LIMIT_EXCEEDED',
    'INTERNAL_ERROR',
  ];

  return apiError?.code ? retryableCodes.includes(apiError.code) : false;
}
