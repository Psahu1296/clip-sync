import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { ApiError, ApiResponse, ErrorCode } from './types';

// Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://0f80068073dd.ngrok-free.app';
const REQUEST_TIMEOUT = 30000; // 30 seconds

// Token management - will be set by auth module
let authToken: string | null = null;
let refreshTokenFn: (() => Promise<string | null>) | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const setRefreshTokenFunction = (fn: () => Promise<string | null>) => {
  refreshTokenFn = fn;
};

export const getAuthToken = () => authToken;

// Create Axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token if available
    if (authToken && config.headers) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }

    // Log request in development
    if (__DEV__) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data ? '[DATA]' : undefined,
      });
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('[API] Request error:', error.message);
    return Promise.reject(error);
  }
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // Log successful response in development
    if (__DEV__) {
      console.log(`[API] Response ${response.status}:`, response.config.url);
    }

    return response;
  },
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry && refreshTokenFn) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshTokenFn();
        if (newToken) {
          setAuthToken(newToken);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('[API] Token refresh failed:', refreshError);
        // Token refresh failed - user needs to re-authenticate
        handleAuthFailure();
      }
    }

    // Log error in development
    if (__DEV__) {
      console.error('[API] Response error:', {
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }

    return Promise.reject(error);
  }
);

// Auth failure handler - to be set by auth module
let authFailureHandler: (() => void) | null = null;

export const setAuthFailureHandler = (handler: () => void) => {
  authFailureHandler = handler;
};

const handleAuthFailure = () => {
  setAuthToken(null);
  if (authFailureHandler) {
    authFailureHandler();
  }
};

// Error parsing utility
export const parseApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponse>;

    // Network error (no response)
    if (!axiosError.response) {
      if (axiosError.code === 'ECONNABORTED') {
        return {
          code: 'TIMEOUT_ERROR',
          message: 'Request timed out. Please check your connection and try again.',
        };
      }
      return {
        code: 'NETWORK_ERROR',
        message: 'Network error. Please check your internet connection.',
      };
    }

    // Server responded with error
    const responseData = axiosError.response.data;
    if (responseData?.error) {
      return responseData.error;
    }

    // Map HTTP status codes to error codes
    const statusCodeMap: Record<number, ErrorCode> = {
      400: 'VALIDATION_ERROR',
      401: 'UNAUTHORIZED',
      402: 'PAYMENT_REQUIRED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      429: 'RATE_LIMIT_EXCEEDED',
      500: 'INTERNAL_ERROR',
    };

    const code = statusCodeMap[axiosError.response.status] || 'UNKNOWN_ERROR';
    const message = getDefaultErrorMessage(code);

    return { code, message };
  }

  // Non-Axios error
  return {
    code: 'UNKNOWN_ERROR',
    message: error instanceof Error ? error.message : 'An unexpected error occurred',
  };
};

// Default error messages
const getDefaultErrorMessage = (code: ErrorCode): string => {
  const messages: Record<ErrorCode, string> = {
    UNAUTHORIZED: 'Please sign in to continue.',
    FORBIDDEN: "You don't have permission to perform this action.",
    NOT_FOUND: 'The requested resource was not found.',
    VALIDATION_ERROR: 'Invalid data provided. Please check your input.',
    PAYMENT_REQUIRED: 'This feature requires a premium subscription.',
    DEVICE_LIMIT_EXCEEDED: 'Device limit reached. Upgrade to add more devices.',
    CONTENT_TYPE_NOT_ALLOWED: 'This content type requires a premium subscription.',
    RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait a moment and try again.',
    INTERNAL_ERROR: 'Something went wrong on our end. Please try again later.',
    NETWORK_ERROR: 'Network error. Please check your internet connection.',
    TIMEOUT_ERROR: 'Request timed out. Please try again.',
    UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  };

  return messages[code] || messages.UNKNOWN_ERROR;
};

// Helper function to make typed API calls
export async function apiRequest<T>(
  request: () => Promise<AxiosResponse<ApiResponse<T>>>
): Promise<T> {
  try {
    const response = await request();

    if (response.data.success && response.data.data !== undefined) {
      return response.data.data;
    }

    // Success is false or data is undefined
    throw response.data.error || {
      code: 'UNKNOWN_ERROR',
      message: 'Unexpected response format',
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw parseApiError(error);
    }
    throw error;
  }
}

export default apiClient;
