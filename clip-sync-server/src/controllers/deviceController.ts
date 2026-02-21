import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../types/express';
import { deviceService } from '../services/deviceService';
import { sendSuccess, AppError, ErrorCodes } from '../utils/errors';

const registerDeviceSchema = z.object({
  deviceId: z.string().uuid(),
  deviceName: z.string().min(1).max(255),
});

const removeDeviceSchema = z.object({
  deviceId: z.string().uuid(),
});

export class DeviceController {
  async registerDevice(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const validation = registerDeviceSchema.safeParse(req.body);

      if (!validation.success) {
        throw new AppError(
          400,
          ErrorCodes.VALIDATION_ERROR,
          'Invalid request data',
          validation.error.errors
        );
      }

      const { deviceId, deviceName } = validation.data;
      const device = await deviceService.registerDevice(userId, deviceId, deviceName);

      sendSuccess(res, device, 201);
    } catch (error) {
      next(error);
    }
  }

  async removeDevice(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const validation = removeDeviceSchema.safeParse(req.body);

      if (!validation.success) {
        throw new AppError(
          400,
          ErrorCodes.VALIDATION_ERROR,
          'Invalid request data',
          validation.error.errors
        );
      }

      const { deviceId } = validation.data;
      await deviceService.removeDevice(deviceId, userId);

      sendSuccess(res, { message: 'Device removed successfully' });
    } catch (error) {
      next(error);
    }
  }

  async listDevices(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const devices = await deviceService.getDevicesByUserId(userId);

      sendSuccess(res, { devices });
    } catch (error) {
      next(error);
    }
  }
}

export const deviceController = new DeviceController();
