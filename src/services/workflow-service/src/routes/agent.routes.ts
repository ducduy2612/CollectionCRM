import { Router } from 'express';
import { AgentController } from '../controllers/agent.controller';
import { requireAuth, requireRoles, agentContextMiddleware } from '../middleware/auth.middleware';
import { validatePagination } from '../middleware/validation.middleware';

const router = Router();
const agentController = new AgentController();

/**
 * @route GET /agents
 * @desc Get all agents with optional filtering
 * @access Private - Requires authentication
 */
router.get(
  '/',
  requireAuth,
  validatePagination,
  agentController.getAgents
);

/**
 * @route POST /agents
 * @desc Create a new agent
 * @access Private - Requires authentication and admin role
 */
router.post(
  '/',
  requireAuth,
  requireRoles(['ADMIN', 'SUPERVISOR']),
  agentController.createAgent
);

/**
 * @route PUT /agents/:id
 * @desc Update an existing agent
 * @access Private - Requires authentication and admin role
 */
router.put(
  '/:id',
  requireAuth,
  requireRoles(['ADMIN', 'SUPERVISOR']),
  agentController.updateAgent
);

/**
 * @route GET /agents/:id/performance
 * @desc Get agent performance metrics
 * @access Private - Requires authentication
 */
router.get(
  '/:id/performance',
  requireAuth,
  agentController.getAgentPerformance
);

/**
 * @route GET /agents/by-user/:userId
 * @desc Get agent by user ID
 * @access Private - Requires authentication
 */
router.get(
  '/by-user/:userId',
  requireAuth,
  agentController.getAgentByUserId
);

/**
 * @route POST /agents/link-user
 * @desc Link agent to user
 * @access Private - Requires authentication and admin role
 */
router.post(
  '/link-user',
  requireAuth,
  requireRoles(['ADMIN']),
  agentController.linkAgentToUser
);

export default router;