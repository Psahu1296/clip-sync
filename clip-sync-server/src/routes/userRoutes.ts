import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authenticateToken, tryAuthenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/v1/user/status
 * @desc    Check authentication status and plan (Public/Soft Auth)
 * @access  Public
 */
router.get('/status', tryAuthenticateToken, userController.getAuthStatus.bind(userController));

/**
 * @route   GET /api/v1/user/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticateToken, userController.getMe.bind(userController));

/**
 * @route   GET /api/v1/user/subscription
 * @desc    Get user subscription information
 * @access  Private
 */
router.get(
  '/subscription',
  authenticateToken,
  userController.getSubscription.bind(userController)
);

export default router;
