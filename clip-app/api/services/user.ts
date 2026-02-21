import apiClient, { apiRequest } from '../axios';
import { ApiResponse, SubscriptionInfo, User } from '../types';

export const userService = {
  /**
   * Get current authenticated user's profile
   */
  getMe: () =>
    apiRequest<User>(() =>
      apiClient.get<ApiResponse<User>>('/user/me')
    ),

  /**
   * Get subscription information including device count and plan limits
   */
  getSubscription: () =>
    apiRequest<SubscriptionInfo>(() =>
      apiClient.get<ApiResponse<SubscriptionInfo>>('/user/subscription')
    ),
};
