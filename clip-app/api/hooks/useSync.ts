import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryClient';
import { syncService } from '../services';
import { PushClipsRequest, SyncClip } from '../types';

/**
 * Hook to pull clips from server
 * @param lastSync Optional timestamp - only returns clips updated after this time
 * @param enabled Whether to enable the query (default: true)
 */
export function usePullClips(lastSync?: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.clipsSync(lastSync),
    queryFn: () => syncService.pull(lastSync),
    enabled,
    // Don't cache sync results for too long
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to push clips to server
 */
export function usePushClips() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PushClipsRequest) => syncService.push(data),
    onSuccess: (data) => {
      // Invalidate sync queries after successful push
      queryClient.invalidateQueries({ queryKey: queryKeys.clips });
    },
  });
}

/**
 * Hook for complete sync operation (push then pull)
 * Returns utilities for managing the sync lifecycle
 */
export function useSyncClips() {
  const pushMutation = usePushClips();
  const queryClient = useQueryClient();

  const performSync = async (
    clipsToUpload: SyncClip[],
    lastSyncTimestamp?: string
  ) => {
    let serverTimestamp = lastSyncTimestamp;

    // Step 1: Push local changes if any
    if (clipsToUpload.length > 0) {
      // Split into batches of 100 (API limit)
      const batches = [];
      for (let i = 0; i < clipsToUpload.length; i += 100) {
        batches.push(clipsToUpload.slice(i, i + 100));
      }

      for (const batch of batches) {
        const pushResult = await pushMutation.mutateAsync({ clips: batch });
        serverTimestamp = pushResult.serverTimestamp;
      }
    }

    // Step 2: Pull server changes
    const pullResult = await syncService.pull(lastSyncTimestamp);

    return {
      pulledClips: pullResult.clips,
      serverTimestamp: pullResult.serverTimestamp,
      pushedCount: clipsToUpload.length,
    };
  };

  return {
    performSync,
    isPushing: pushMutation.isPending,
    pushError: pushMutation.error,
    reset: () => {
      pushMutation.reset();
    },
  };
}
