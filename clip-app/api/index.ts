// Main API exports

// Axios instance and utilities
export {
  default as apiClient,
  setAuthToken,
  setRefreshTokenFunction,
  setAuthFailureHandler,
  getAuthToken,
  parseApiError,
} from './axios';

// Query client and utilities
export {
  queryClient,
  queryKeys,
  invalidateUserQueries,
  clearQueryCache,
} from './queryClient';

// Query Provider
export { QueryProvider } from './QueryProvider';

// All hooks
export * from './hooks';

// Services (for direct API calls if needed)
export * from './services';

// Types
export * from './types';
