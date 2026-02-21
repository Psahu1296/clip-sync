import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/express';
import { userService } from '../services/userService';
import { sendSuccess } from '../utils/errors';

export class UserController {
  async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const user = await userService.getUserById(userId);

      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  async getAuthStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // If authenticateToken middleware passed, req.userId will be set
      // If we use a "soft" version of the middleware, we can check manually
      const userId = req.userId;
      const user = req.user;

      if (userId && user) {
        sendSuccess(res, {
          isAuthenticated: true,
          userId,
          plan: user.plan,
          isAnonymous: false // Supabase auth users are considered authenticated
        });
      } else {
        sendSuccess(res, {
          isAuthenticated: false,
          userId: null,
          plan: 'free',
          isAnonymous: true
        });
      }
    } catch (error) {
      next(error);
    }
  }

  async getSubscription(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const subscription = await userService.getSubscriptionInfo(userId);

      sendSuccess(res, subscription);
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
