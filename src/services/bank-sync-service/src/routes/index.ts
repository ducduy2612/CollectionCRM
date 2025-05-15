/**
 * Route exports
 */

import { Router } from 'express';
import customerRoutes from './customer.routes';
import loanRoutes from './loan.routes';
import collateralRoutes from './collateral.routes';

const router = Router();

// Mount routes
router.use('/customers', customerRoutes);
router.use('/loans', loanRoutes);
router.use('/collaterals', collateralRoutes);

export default router;