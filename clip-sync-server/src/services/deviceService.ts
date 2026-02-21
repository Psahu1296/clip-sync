import { db } from '../db';
import { Device } from '../types';
import { AppError, ErrorCodes } from '../utils/errors';
import { userService } from './userService';

export class DeviceService {
  async getDevicesByUserId(userId: string): Promise<Device[]> {
    const result = await db.query(
      'SELECT id, user_id, name, last_sync_at, created_at FROM devices WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      lastSyncAt: row.last_sync_at,
      createdAt: row.created_at,
    }));
  }

  async getDeviceById(deviceId: string, userId: string): Promise<Device | null> {
    const result = await db.query(
      'SELECT id, user_id, name, last_sync_at, created_at FROM devices WHERE id = $1 AND user_id = $2',
      [deviceId, userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return {
      id: result.rows[0].id,
      userId: result.rows[0].user_id,
      name: result.rows[0].name,
      lastSyncAt: result.rows[0].last_sync_at,
      createdAt: result.rows[0].created_at,
    };
  }

  async registerDevice(userId: string, deviceId: string, deviceName: string): Promise<Device> {
    // Check user's plan and device limit
    const user = await userService.getUserById(userId);
    if (!user) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'User not found');
    }

    const planLimits = userService.getPlanLimits(user.plan);
    const existingDevices = await this.getDevicesByUserId(userId);

    // Check if device already exists
    const existingDevice = existingDevices.find((d) => d.id === deviceId);
    if (existingDevice) {
      // Update last sync time and return
      return await this.updateLastSync(deviceId, userId);
    }

    // Check device limit for free users
    if (planLimits.maxDevices !== -1 && existingDevices.length >= planLimits.maxDevices) {
      throw new AppError(
        402,
        ErrorCodes.DEVICE_LIMIT_EXCEEDED,
        'Device limit exceeded. Please upgrade to Pro to add more devices.',
        { currentDevices: existingDevices.length, maxDevices: planLimits.maxDevices }
      );
    }

    const result = await db.query(
      'INSERT INTO devices (id, user_id, name) VALUES ($1, $2, $3) RETURNING id, user_id, name, last_sync_at, created_at',
      [deviceId, userId, deviceName]
    );

    return {
      id: result.rows[0].id,
      userId: result.rows[0].user_id,
      name: result.rows[0].name,
      lastSyncAt: result.rows[0].last_sync_at,
      createdAt: result.rows[0].created_at,
    };
  }

  async removeDevice(deviceId: string, userId: string): Promise<void> {
    const result = await db.query('DELETE FROM devices WHERE id = $1 AND user_id = $2', [
      deviceId,
      userId,
    ]);

    if (result.rowCount === 0) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'Device not found');
    }
  }

  async updateLastSync(deviceId: string, userId: string): Promise<Device> {
    const result = await db.query(
      'UPDATE devices SET last_sync_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING id, user_id, name, last_sync_at, created_at',
      [deviceId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'Device not found');
    }

    return {
      id: result.rows[0].id,
      userId: result.rows[0].user_id,
      name: result.rows[0].name,
      lastSyncAt: result.rows[0].last_sync_at,
      createdAt: result.rows[0].created_at,
    };
  }
}

export const deviceService = new DeviceService();
