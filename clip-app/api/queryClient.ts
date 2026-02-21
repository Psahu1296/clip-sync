import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './types';

// Query keys for cache management
export const queryKeys = {
  // User
  user: ['user'] as const,
  userMe: () => [...queryKeys.user, 'me'] as const,
  userSubscription: () => [...queryKeys.user, 'subscription'] as const,

  // Devices
  devices: ['devices'] as const,
  deviceList: () => [...queryKeys.devices, 'list'] as const,

  // Clips/Sync
  clips: ['clips'] as const,
  clipsSync: (lastSync?: string) => [...queryKeys.clips, 'sync', lastSync] as const,
};

// Default options for queries
const defaultQueryOptions = {
  queries: {
    // Retry failed requests up to 3 times with exponential backoff
    retry: (failureCount: number, error: unknown) => {
      const apiError = error as ApiError;

      // Don't retry on certain errors
      const noRetryErrors = [
        'UNAUTHORIZED',
        'FORBIDDEN',
        'PAYMENT_REQUIRED',
        'DEVICE_LIMIT_EXCEEDED',
        'CONTENT_TYPE_NOT_ALLOWED',
        'VALIDATION_ERROR',
      ];

      if (noRetryErrors.includes(apiError?.code)) {
        return false;
      }

      return failureCount < 3;
    },
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),

    // Stale time: consider data fresh for 30 seconds
    staleTime: 30 * 1000,

    // Cache time: keep data in cache for 5 minutes
    gcTime: 5 * 60 * 1000,

    // Don't refetch on window focus for mobile
    refetchOnWindowFocus: false,

    // Refetch on reconnect
    refetchOnReconnect: true,
  },
  mutations: {
    // Retry mutations once on network errors
    retry: (failureCount: number, error: unknown) => {
      const apiError = error as ApiError;
      if (apiError?.code === 'NETWORK_ERROR' && failureCount < 1) {
        return true;
      }
      return false;
    },
  },
};

// Create the query client
export const queryClient = new QueryClient({
  defaultOptions: defaultQueryOptions,
});

// Utility to invalidate all user-related queries (e.g., on logout)
export const invalidateUserQueries = () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.user });
  queryClient.invalidateQueries({ queryKey: queryKeys.devices });
  queryClient.invalidateQueries({ queryKey: queryKeys.clips });
};

// Utility to clear all cached data (e.g., on logout)
export const clearQueryCache = () => {
  queryClient.clear();
};
