/**
 * Route exports
 */

import { Router } from 'express';
import customerRoutes from './customer.routes';
import loanRoutes from './loan.routes';
import collateralRoutes from './collateral.routes';
import phoneTypesRoutes from './phone-types.routes';
import addressTypesRoutes from './address-types.routes';
import relationshipTypesRoutes from './relationship-types.routes';

const router = Router();

// Mount routes
router.use('/customers', customerRoutes);
router.use('/loans', loanRoutes);
router.use('/collaterals', collateralRoutes);
router.use('/phone-types', phoneTypesRoutes);
router.use('/address-types', addressTypesRoutes);
router.use('/relationship-types', relationshipTypesRoutes);

export default router;