import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect } from 'react';

import { queryKeys } from '../queryClient';
import { authService } from '../services';
import { AuthResponse } from '../types';

// Complete auth session for web browser redirect
WebBrowser.maybeCompleteAuthSession();

// Google OAuth configuration
// You need to replace these with your actual Google OAuth client IDs
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';

interface UseGoogleAuthOptions {
  onSuccess?: (data: AuthResponse) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for Google Sign-In authentication
 */
export function useGoogleAuth(options: UseGoogleAuthOptions = {}) {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();

  // Configure Google auth request
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
  });

  // Mutation for backend authentication
  const googleAuthMutation = useMutation({
    mutationFn: (idToken: string) => authService.googleAuth({ idToken }),
    onSuccess: (data) => {
      // Invalidate user queries to fetch fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.userMe() });
      queryClient.invalidateQueries({ queryKey: queryKeys.userSubscription() });
      onSuccess?.(data);
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });

  // Handle Google auth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        googleAuthMutation.mutate(id_token);
      }
    } else if (response?.type === 'error') {
      onError?.(new Error(response.error?.message || 'Google sign-in failed'));
    }
  }, [response]);

  // Sign in function
  const signIn = useCallback(async () => {
    try {
      await promptAsync();
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to start sign-in'));
    }
  }, [promptAsync, onError]);

  return {
    signIn,
    isLoading: googleAuthMutation.isPending || !request,
    isReady: !!request,
    error: googleAuthMutation.error,
  };
}

/**
 * Hook for refreshing access token
 */
export function useRefreshToken() {
  return useMutation({
    mutationFn: (refreshToken: string) => authService.refreshToken({ refreshToken }),
  });
}

/**
 * Hook for logout
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      // Clear all cached queries on logout
      queryClient.clear();
    },
  });
}
