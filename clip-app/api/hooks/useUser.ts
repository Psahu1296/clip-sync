import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../queryClient';
import { userService } from '../services';

/**
 * Hook to get current user profile
 */
export function useUser() {
  return useQuery({
    queryKey: queryKeys.userMe(),
    queryFn: userService.getMe,
  });
}

/**
 * Hook to get subscription information
 */
export function useSubscription() {
  return useQuery({
    queryKey: queryKeys.userSubscription(),
    queryFn: userService.getSubscription,
  });
}
