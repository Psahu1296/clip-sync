import { db } from '../db';
import { User, UserPlan, SubscriptionInfo } from '../types';
import { AppError, ErrorCodes } from '../utils/errors';

export class UserService {
  async getUserById(userId: string): Promise<User | null> {
    const result = await db.query('SELECT id, plan, created_at FROM users WHERE id = $1', [
      userId,
    ]);

    if (result.rows.length === 0) {
      return null;
    }

    return {
      id: result.rows[0].id,
      plan: result.rows[0].plan,
      createdAt: result.rows[0].created_at,
    };
  }

  async createUser(userId: string, plan: UserPlan = 'free'): Promise<User> {
    const result = await db.query(
      'INSERT INTO users (id, plan) VALUES ($1, $2) RETURNING id, plan, created_at',
      [userId, plan]
    );

    return {
      id: result.rows[0].id,
      plan: result.rows[0].plan,
      createdAt: result.rows[0].created_at,
    };
  }

  async updateUserPlan(userId: string, plan: UserPlan): Promise<User> {
    const result = await db.query(
      'UPDATE users SET plan = $1 WHERE id = $2 RETURNING id, plan, created_at',
      [plan, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'User not found');
    }

    return {
      id: result.rows[0].id,
      plan: result.rows[0].plan,
      createdAt: result.rows[0].created_at,
    };
  }

  async getSubscriptionInfo(userId: string): Promise<SubscriptionInfo> {
    const user = await this.getUserById(userId);

    if (!user) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'User not found');
    }

    // Get device count
    const deviceResult = await db.query('SELECT COUNT(*) as count FROM devices WHERE user_id = $1', [
      userId,
    ]);

    const deviceCount = parseInt(deviceResult.rows[0].count, 10);

    const planLimits = this.getPlanLimits(user.plan);

    return {
      plan: user.plan,
      deviceCount,
      maxDevices: planLimits.maxDevices,
      canSyncImages: planLimits.canSyncImages,
      canSyncToCloud: planLimits.canSyncToCloud,
    };
  }

  getPlanLimits(plan: UserPlan) {
    switch (plan) {
      case 'free':
        return {
          maxDevices: 1,
          canSyncImages: false,
          canSyncToCloud: false,
        };
      case 'pro':
        return {
          maxDevices: -1, // unlimited
          canSyncImages: true,
          canSyncToCloud: true,
        };
      case 'enterprise':
        return {
          maxDevices: -1, // unlimited
          canSyncImages: true,
          canSyncToCloud: true,
        };
      default:
        return {
          maxDevices: 1,
          canSyncImages: false,
          canSyncToCloud: false,
        };
    }
  }
}

export const userService = new UserService();
