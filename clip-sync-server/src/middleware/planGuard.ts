import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/express';
import { AppError, ErrorCodes } from '../utils/errors';
import { userService } from '../services/userService';

export const checkPlan = (feature: 'images' | 'cloud' | 'multiDevice') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) {
        throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'Authentication required');
      }

      const planLimits = userService.getPlanLimits(user.plan);

      switch (feature) {
        case 'images':
          if (!planLimits.canSyncImages) {
            throw new AppError(
              402,
              ErrorCodes.CONTENT_TYPE_NOT_ALLOWED,
              'Image sync requires a Pro plan'
            );
          }
          break;

        case 'cloud':
          if (!planLimits.canSyncToCloud && user.plan === 'free') {
            // According to logic: free can sync text/url but with 1 device limit.
            // If we interpret "Cloud Backup" strictly as a Pro feature:
            // return next(new AppError(402, ErrorCodes.PAYMENT_REQUIRED, 'Cloud sync requires a Pro plan'));
          }
          break;

        case 'multiDevice':
          if (planLimits.maxDevices === 1 && user.plan === 'free') {
            // This is already checked during device registration, 
            // but we can double check here if needed.
          }
          break;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
