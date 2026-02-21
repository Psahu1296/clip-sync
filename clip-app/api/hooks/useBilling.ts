import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryClient';
import { billingService } from '../services';
import { VerifyPurchaseRequest } from '../types';

/**
 * Hook to verify an in-app purchase
 */
export function useVerifyPurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VerifyPurchaseRequest) => billingService.verifyPurchase(data),
    onSuccess: (data) => {
      if (data.valid) {
        // Purchase verified - invalidate user and subscription queries
        // to reflect the new plan
        queryClient.invalidateQueries({ queryKey: queryKeys.userMe() });
        queryClient.invalidateQueries({ queryKey: queryKeys.userSubscription() });
      }
    },
  });
}
