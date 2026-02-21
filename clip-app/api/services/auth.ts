import apiClient, { apiRequest } from '../axios';
import {
  ApiResponse,
  AuthResponse,
  GoogleAuthRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from '../types';

export const authService = {
  /**
   * Authenticate with Google ID token
   */
  googleAuth: (data: GoogleAuthRequest) =>
    apiRequest<AuthResponse>(() =>
      apiClient.post<ApiResponse<AuthResponse>>('/auth/google', data)
    ),

  /**
   * Refresh access token
   */
  refreshToken: (data: RefreshTokenRequest) =>
    apiRequest<RefreshTokenResponse>(() =>
      apiClient.post<ApiResponse<RefreshTokenResponse>>('/auth/refresh', data)
    ),

  /**
   * Logout (invalidate refresh token)
   */
  logout: () =>
    apiRequest<{ message: string }>(() =>
      apiClient.post<ApiResponse<{ message: string }>>('/auth/logout')
    ),
};
