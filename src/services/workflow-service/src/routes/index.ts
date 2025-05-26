import { Router } from 'express';
import agentRoutes from './agent.routes';
import actionRoutes from './action.routes';
import assignmentRoutes from './assignment.routes';
import caseRoutes from './case.routes';

const router = Router();

// Mount routes
router.use('/agents', agentRoutes);
router.use('/actions', actionRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/cases', caseRoutes);

export default router;