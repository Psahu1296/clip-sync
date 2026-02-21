import { Router } from 'express';
import { syncController } from '../controllers/syncController';
import { authenticateToken } from '../middleware/auth';
import { syncLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * @route   POST /api/v1/sync/push
 * @desc    Push encrypted clips to server
 * @access  Private
 */
router.post(
  '/push',
  authenticateToken,
  syncLimiter,
  syncController.push.bind(syncController)
);

/**
 * @route   GET /api/v1/sync/pull
 * @desc    Pull encrypted clips from server
 * @access  Private
 * @query   lastSync - ISO timestamp of last sync (optional)
 */
router.get(
  '/pull',
  authenticateToken,
  syncLimiter,
  syncController.pull.bind(syncController)
);

export default router;
