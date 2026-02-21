import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  setAuthToken,
  setRefreshTokenFunction,
  setAuthFailureHandler,
} from '@/api/axios';
import { authService } from '@/api/services';
import { AuthResponse, User } from '@/api/types';

// Storage keys
const AUTH_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_KEY = 'auth_user';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (authResponse: AuthResponse) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  // Load stored auth state on mount
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const [storedToken, storedRefreshToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(AUTH_TOKEN_KEY),
          AsyncStorage.getItem(REFRESH_TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);

        if (storedToken && storedRefreshToken && storedUser) {
          setAuthToken(storedToken);
          setRefreshToken(storedRefreshToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('[Auth] Failed to load auth state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthState();
  }, []);

  // Sign in and store tokens
  const signIn = useCallback(async (authResponse: AuthResponse) => {
    try {
      const { accessToken, refreshToken: newRefreshToken, user: authUser } = authResponse;

      // Store in memory
      setAuthToken(accessToken);
      setRefreshToken(newRefreshToken);
      setUser(authUser);

      // Persist to storage
      await Promise.all([
        AsyncStorage.setItem(AUTH_TOKEN_KEY, accessToken),
        AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken),
        AsyncStorage.setItem(USER_KEY, JSON.stringify(authUser)),
      ]);
    } catch (error) {
      console.error('[Auth] Failed to sign in:', error);
      throw error;
    }
  }, []);

  // Sign out and clear tokens
  const signOut = useCallback(async () => {
    try {
      // Try to logout on server (invalidate refresh token)
      try {
        await authService.logout();
      } catch {
        // Ignore server errors - still clear local state
      }

      // Clear memory
      setAuthToken(null);
      setRefreshToken(null);
      setUser(null);

      // Clear storage
      await Promise.all([
        AsyncStorage.removeItem(AUTH_TOKEN_KEY),
        AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
        AsyncStorage.removeItem(USER_KEY),
      ]);
    } catch (error) {
      console.error('[Auth] Failed to sign out:', error);
      throw error;
    }
  }, []);

  // Refresh access token
  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await authService.refreshToken({ refreshToken });
      const { accessToken } = response;

      // Update in memory
      setAuthToken(accessToken);

      // Persist new token
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, accessToken);

      return accessToken;
    } catch (error) {
      console.error('[Auth] Failed to refresh token:', error);
      // If refresh fails, sign out user
      await signOut();
      return null;
    }
  }, [refreshToken, signOut]);

  // Register refresh function and auth failure handler with axios
  useEffect(() => {
    setRefreshTokenFunction(refreshAccessToken);
    setAuthFailureHandler(signOut);
  }, [refreshAccessToken, signOut]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      signIn,
      signOut,
      refreshAccessToken,
    }),
    [user, isLoading, signIn, signOut, refreshAccessToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
