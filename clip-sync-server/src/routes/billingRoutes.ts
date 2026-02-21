import { Router } from 'express';
import { billingController } from '../controllers/billingController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @route   POST /api/v1/billing/iap/verify
 * @desc    Verify in-app purchase (Google Play Store)
 * @access  Private
 */
router.post('/iap/verify', authenticateToken, billingController.verifyIAP.bind(billingController));

/**
 * @route   POST /api/v1/billing/webhook/revenuecat
 * @desc    RevenueCat webhook handler (Handles Play Store subscription events)
 * @access  Public
 */
router.post(
  '/webhook/revenuecat',
  billingController.revenueCatWebhook.bind(billingController)
);

export default router;
