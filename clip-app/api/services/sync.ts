import apiClient, { apiRequest } from '../axios';
import {
  ApiResponse,
  PullClipsResponse,
  PushClipsRequest,
  PushClipsResponse,
} from '../types';

export const syncService = {
  /**
   * Upload encrypted clips to the server
   * @param clips Array of clips to push (max 100)
   */
  push: (data: PushClipsRequest) =>
    apiRequest<PushClipsResponse>(() =>
      apiClient.post<ApiResponse<PushClipsResponse>>('/sync/push', data)
    ),

  /**
   * Retrieve clips from the server
   * @param lastSync Optional timestamp - only returns clips updated after this time
   */
  pull: (lastSync?: string) =>
    apiRequest<PullClipsResponse>(() =>
      apiClient.get<ApiResponse<PullClipsResponse>>('/sync/pull', {
        params: lastSync ? { lastSync } : undefined,
      })
    ),
};
