import { Router } from 'express';
import { CollateralController } from '../controllers/collateral.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
const collateralController = new CollateralController();

/**
 * @route GET /collaterals/:collateralNumber
 * @desc Get collateral by collateral number
 * @access Private - Requires authentication
 */
router.get(
  '/:collateralNumber',
  requireAuth,
  collateralController.getCollateralByNumber
);

export default router;