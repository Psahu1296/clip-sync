import apiClient, { apiRequest } from '../axios';
import { ApiResponse, ClipIdRequest, MessageResponse } from '../types';

export const clipService = {
  /**
   * Soft delete a clip (marks as deleted)
   */
  delete: (data: ClipIdRequest) =>
    apiRequest<MessageResponse>(() =>
      apiClient.post<ApiResponse<MessageResponse>>('/clip/delete', data)
    ),

  /**
   * Restore a previously deleted clip
   */
  restore: (data: ClipIdRequest) =>
    apiRequest<MessageResponse>(() =>
      apiClient.post<ApiResponse<MessageResponse>>('/clip/restore', data)
    ),
};
