import { Router } from 'express';
import { deviceController } from '../controllers/deviceController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @route   POST /api/v1/device/register
 * @desc    Register a new device for the user
 * @access  Private
 */
router.post('/register', authenticateToken, deviceController.registerDevice.bind(deviceController));

/**
 * @route   POST /api/v1/device/remove
 * @desc    Remove a device from the user's account
 * @access  Private
 */
router.post('/remove', authenticateToken, deviceController.removeDevice.bind(deviceController));

/**
 * @route   GET /api/v1/device/list
 * @desc    List all devices for the user
 * @access  Private
 */
router.get('/list', authenticateToken, deviceController.listDevices.bind(deviceController));

export default router;
