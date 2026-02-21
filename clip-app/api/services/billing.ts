import apiClient, { apiRequest } from '../axios';
import {
  ApiResponse,
  VerifyPurchaseRequest,
  VerifyPurchaseResponse,
} from '../types';

export const billingService = {
  /**
   * Verify an in-app purchase from Google Play or Apple App Store
   */
  verifyPurchase: (data: VerifyPurchaseRequest) =>
    apiRequest<VerifyPurchaseResponse>(() =>
      apiClient.post<ApiResponse<VerifyPurchaseResponse>>('/billing/iap/verify', data)
    ),
};
