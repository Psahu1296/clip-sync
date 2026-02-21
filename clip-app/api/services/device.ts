import apiClient, { apiRequest } from '../axios';
import {
  ApiResponse,
  Device,
  MessageResponse,
  RegisterDeviceRequest,
  RemoveDeviceRequest,
} from '../types';

export const deviceService = {
  /**
   * Register a new device or update existing device's last sync time
   */
  register: (data: RegisterDeviceRequest) =>
    apiRequest<Device>(() =>
      apiClient.post<ApiResponse<Device>>('/device/register', data)
    ),

  /**
   * Remove a device from the user's account
   */
  remove: (data: RemoveDeviceRequest) =>
    apiRequest<MessageResponse>(() =>
      apiClient.post<ApiResponse<MessageResponse>>('/device/remove', data)
    ),

  /**
   * Get all devices registered to the user
   */
  list: () =>
    apiRequest<{ devices: Device[] }>(() =>
      apiClient.get<ApiResponse<{ devices: Device[] }>>('/device/list')
    ),
};
