import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryClient';
import { clipService } from '../services';
import { ClipIdRequest } from '../types';

/**
 * Hook to delete a clip
 */
export function useDeleteClip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ClipIdRequest) => clipService.delete(data),
    onSuccess: () => {
      // Invalidate clips to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.clips });
    },
  });
}

/**
 * Hook to restore a deleted clip
 */
export function useRestoreClip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ClipIdRequest) => clipService.restore(data),
    onSuccess: () => {
      // Invalidate clips to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.clips });
    },
  });
}
