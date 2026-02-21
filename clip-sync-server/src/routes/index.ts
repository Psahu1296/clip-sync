import { Router } from 'express';
import userRoutes from './userRoutes';
import deviceRoutes from './deviceRoutes';
import syncRoutes from './syncRoutes';
import clipRoutes from './clipRoutes';
import billingRoutes from './billingRoutes';

const router = Router();

// Mount route modules
router.use('/user', userRoutes);
router.use('/device', deviceRoutes);
router.use('/sync', syncRoutes);
router.use('/clip', clipRoutes);
router.use('/billing', billingRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
