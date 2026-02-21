import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryClient';
import { deviceService } from '../services';
import { RegisterDeviceRequest, RemoveDeviceRequest } from '../types';

/**
 * Hook to get list of registered devices
 */
export function useDevices() {
  return useQuery({
    queryKey: queryKeys.deviceList(),
    queryFn: deviceService.list,
    select: (data) => data.devices,
  });
}

/**
 * Hook to register a device
 */
export function useRegisterDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterDeviceRequest) => deviceService.register(data),
    onSuccess: () => {
      // Invalidate device list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.deviceList() });
      // Also invalidate subscription as device count may have changed
      queryClient.invalidateQueries({ queryKey: queryKeys.userSubscription() });
    },
  });
}

/**
 * Hook to remove a device
 */
export function useRemoveDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RemoveDeviceRequest) => deviceService.remove(data),
    onSuccess: () => {
      // Invalidate device list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.deviceList() });
      // Also invalidate subscription as device count may have changed
      queryClient.invalidateQueries({ queryKey: queryKeys.userSubscription() });
    },
  });
}
