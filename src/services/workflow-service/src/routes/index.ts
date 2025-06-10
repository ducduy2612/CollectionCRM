import { Router } from 'express';
import agentRoutes from './agent.routes';
import actionRoutes from './action.routes';
import assignmentRoutes from './assignment.routes';
import caseRoutes from './case.routes';
import statusDictRoutes from './status-dict.routes';
import phoneRoutes from './phone.routes';
import addressRoutes from './address.routes';
import emailRoutes from './email.routes';
import referenceCustomerRoutes from './reference-customer.routes';

const router = Router();

// Mount routes
router.use('/agents', agentRoutes);
router.use('/actions', actionRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/cases', caseRoutes);
router.use('/status-dict', statusDictRoutes);
router.use('/phones', phoneRoutes);
router.use('/addresses', addressRoutes);
router.use('/emails', emailRoutes);
router.use('/reference-customers', referenceCustomerRoutes);

export default router;