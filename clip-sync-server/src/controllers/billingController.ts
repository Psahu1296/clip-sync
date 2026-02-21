import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../types/express';
import { revenueCatService } from '../billing/revenuecat';
import { sendSuccess, AppError, ErrorCodes } from '../utils/errors';
import { logger } from '../utils/logger';

const iapVerifySchema = z.object({
  platform: z.enum(['ios', 'android']),
  receipt: z.string().optional(),
  purchaseToken: z.string().optional(),
  productId: z.string(),
});

export class BillingController {
  /**
   * Validates an In-App Purchase from the mobile app.
   * This is called by the app after a successful Play Store purchase.
   */
  async verifyIAP(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = iapVerifySchema.safeParse(req.body);

      if (!validation.success) {
        throw new AppError(
          400,
          ErrorCodes.VALIDATION_ERROR,
          'Invalid request data',
          validation.error.errors
        );
      }

      // Pass the userId to the service so we can link the purchase to the user profile
      const verifyRequest = {
        ...validation.data,
        userId: req.userId!
      };

      const isValid = await revenueCatService.verifyPurchase(verifyRequest as any);

      sendSuccess(res, { valid: isValid });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles webhooks from RevenueCat (Sent when subscriptions are renewed, cancelled, etc.)
   */
  async revenueCatWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = req.body;

      // In production, you would verify the webhook signature here
      await revenueCatService.handleWebhook(payload);

      res.status(200).json({ received: true });
    } catch (error) {
      logger.error('RevenueCat webhook error', { error });
      next(error);
    }
  }
}

export const billingController = new BillingController();
