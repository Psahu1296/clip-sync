import { logger } from '../utils/logger';
import { userService } from '../services/userService';
import { AppError, ErrorCodes } from '../utils/errors';
import { IAPVerifyRequest } from '../types';
import { config } from '../config';

/**
 * RevenueCat Integration Service
 * 
 * Handles Play Store (Android) and App Store (iOS) purchase verification.
 * For production, you would typically use the RevenueCat REST API or SDK.
 */

interface RevenueCatWebhookEvent {
  event: {
    type: string;
    app_user_id: string;
    product_id: string;
    period_type: string;
    purchased_at_ms: number;
    expiration_at_ms?: number;
  };
}

class RevenueCatService {
  /**
   * Verifies an in-app purchase.
   * In a real app, this would call RevenueCat's REST API to validate the receipt/token.
   */
  async verifyPurchase(request: IAPVerifyRequest & { userId: string }): Promise<boolean> {
    logger.info('Verifying mobile purchase', {
      platform: request.platform,
      productId: request.productId,
      userId: request.userId
    });

    if (!config.revenueCat.apiKey) {
      logger.warn('REVENUECAT_API_KEY is not set. Mocking success for development.');
      // In development, we might want to automatically upgrade to facilitate testing
      await userService.updateUserPlan(request.userId, 'pro');
      return true;
    }

    try {
      // Logic for calling RevenueCat API:
      // POST https://api.revenuecat.com/v1/subscribers/<app_user_id>/purchase
      // body: { fetch_token: purchaseToken, product_id: productId }

      // For now, we simulate success if the token is present
      const isValid = !!(request.purchaseToken || request.receipt);
      
      if (isValid) {
        await userService.updateUserPlan(request.userId, 'pro');
      }

      return isValid;
    } catch (error) {
      logger.error('Error verifying purchase with RevenueCat', { error });
      return false;
    }
  }

  /**
   * Handles server-to-server webhooks from RevenueCat.
   * This ensures the user's plan is updated even if the app isn't open.
   */
  async handleWebhook(payload: any): Promise<void> {
    const event = payload.event;
    if (!event) return;

    const eventType = event.type;
    const userId = event.app_user_id;

    logger.info('RevenueCat webhook received', { eventType, userId });

    switch (eventType) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'PRODUCT_CHANGE':
      case 'UNCANCELLATION':
        await userService.updateUserPlan(userId, 'pro');
        logger.info('User upgraded/renewed Pro plan', { userId });
        break;

      case 'CANCELLATION':
      case 'EXPIRATION':
        await userService.updateUserPlan(userId, 'free');
        logger.info('User subscription expired/cancelled', { userId });
        break;

      case 'BILLING_ISSUE':
        logger.warn('Billing issue detected for user', { userId });
        break;

      default:
        logger.debug('Unhandled RevenueCat event', { eventType });
    }
  }
}

export const revenueCatService = new RevenueCatService();
