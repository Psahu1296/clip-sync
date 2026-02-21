import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../types/express';
import { clipService } from '../services/clipService';
import { deviceService } from '../services/deviceService';
import { sendSuccess, AppError, ErrorCodes } from '../utils/errors';

const clipSchema = z.object({
  id: z.string().uuid(),
  deviceId: z.string().uuid(),
  encryptedBlob: z.string().min(1),
  contentType: z.enum(['text', 'url', 'image']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const syncPushSchema = z.object({
  clips: z.array(clipSchema).max(100), // Limit batch size
});

const clipActionSchema = z.object({
  clipId: z.string().uuid(),
});

export class SyncController {
  async push(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const validation = syncPushSchema.safeParse(req.body);

      if (!validation.success) {
        throw new AppError(
          400,
          ErrorCodes.VALIDATION_ERROR,
          'Invalid request data',
          validation.error.errors
        );
      }

      const { clips } = validation.data;

      // Validate that all device IDs belong to the user
      if (clips.length > 0) {
        const deviceIds = [...new Set(clips.map((c) => c.deviceId))];
        for (const deviceId of deviceIds) {
          const device = await deviceService.getDeviceById(deviceId, userId);
          if (!device) {
            throw new AppError(
              403,
              ErrorCodes.FORBIDDEN,
              `Device ${deviceId} not found or does not belong to user`
            );
          }
        }

        // Update last sync time for devices
        for (const deviceId of deviceIds) {
          await deviceService.updateLastSync(deviceId, userId);
        }
      }

      await clipService.syncPush(userId, clips);

      sendSuccess(res, {
        synced: clips.length,
        serverTimestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async pull(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const lastSync = req.query.lastSync as string | undefined;

      let sinceDate: Date | undefined;
      if (lastSync) {
        sinceDate = new Date(lastSync);
        if (isNaN(sinceDate.getTime())) {
          throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid lastSync timestamp');
        }
      }

      const clips = await clipService.getClipsByUserId(userId, sinceDate);

      sendSuccess(res, {
        clips,
        serverTimestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteClip(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const validation = clipActionSchema.safeParse(req.body);

      if (!validation.success) {
        throw new AppError(
          400,
          ErrorCodes.VALIDATION_ERROR,
          'Invalid request data',
          validation.error.errors
        );
      }

      const { clipId } = validation.data;
      await clipService.deleteClip(clipId, userId);

      sendSuccess(res, { message: 'Clip deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async restoreClip(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const validation = clipActionSchema.safeParse(req.body);

      if (!validation.success) {
        throw new AppError(
          400,
          ErrorCodes.VALIDATION_ERROR,
          'Invalid request data',
          validation.error.errors
        );
      }

      const { clipId } = validation.data;
      await clipService.restoreClip(clipId, userId);

      sendSuccess(res, { message: 'Clip restored successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const syncController = new SyncController();
