import { Router } from 'express';
import agentRoutes from './agent.routes';
import actionRoutes from './action.routes';
import fudAutoConfigRoutes from './fud-auto-config.routes';
import assignmentRoutes from './assignment.routes';
import caseRoutes from './case.routes';
import statusDictRoutes from './status-dict.routes';
import customerContactRoutes from './customer-contact.routes';
import referenceCustomerRoutes from './reference-customer.routes';
import documentRoutes from './document.routes';

const router = Router();

// Mount routes
router.use('/agents', agentRoutes);
router.use('/actions', actionRoutes);
router.use('/fud-auto-config', fudAutoConfigRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/cases', caseRoutes);
router.use('/status-dict', statusDictRoutes);
router.use('/customers', customerContactRoutes);
router.use('/reference-customers', referenceCustomerRoutes);
router.use('/documents', documentRoutes);

export default router;