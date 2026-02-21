import { Router } from 'express';
import { syncController } from '../controllers/syncController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @route   POST /api/v1/clip/delete
 * @desc    Soft delete a clip
 * @access  Private
 */
router.post('/delete', authenticateToken, syncController.deleteClip.bind(syncController));

/**
 * @route   POST /api/v1/clip/restore
 * @desc    Restore a deleted clip
 * @access  Private
 */
router.post('/restore', authenticateToken, syncController.restoreClip.bind(syncController));

export default router;
