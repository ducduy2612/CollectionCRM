import { Router } from 'express';
import { FudAutoConfigController } from '../controllers/fud-auto-config.controller';
import { requireAuth, requireRoles } from '../middleware/auth.middleware';

const router = Router();
const controller = new FudAutoConfigController();

// Apply authentication middleware to all routes
router.use(requireAuth);

// FUD Auto Configuration Routes

// GET /fud-auto-config - Get all FUD configurations
router.get(
  '/',
  controller.getAllConfigs.bind(controller)
);

// GET /fud-auto-config/stats - Get configuration statistics
router.get(
  '/stats',
  controller.getConfigStats.bind(controller)
);

// GET /fud-auto-config/:id - Get FUD configuration by ID
router.get(
  '/:id',
  controller.getConfigById.bind(controller)
);

// GET /fud-auto-config/action-result/:actionResultId - Get FUD configuration by action result ID
router.get(
  '/action-result/:actionResultId',
  controller.getConfigByActionResult.bind(controller)
);

// POST /fud-auto-config - Create new FUD configuration
router.post(
  '/',
  requireRoles(['ADMIN']),
  controller.createConfig.bind(controller)
);

// POST /fud-auto-config/calculate - Calculate FUD date
router.post(
  '/calculate',
  controller.calculateFudDate.bind(controller)
);

// POST /fud-auto-config/calculate-bulk - Calculate FUD dates in bulk
router.post(
  '/calculate-bulk',
  controller.calculateBulkFudDates.bind(controller)
);

// PUT /fud-auto-config/:id - Update FUD configuration
router.put(
  '/:id',
  requireRoles(['ADMIN']),
  controller.updateConfig.bind(controller)
);

// DELETE /fud-auto-config/:id - Delete FUD configuration
router.delete(
  '/:id',
  requireRoles(['ADMIN']),
  controller.deleteConfig.bind(controller)
);

export default router;