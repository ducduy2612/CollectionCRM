import { Router } from 'express';
import { ActionController } from '../controllers/action.controller';
import { requireAuth, agentContextMiddleware } from '../middleware/auth.middleware';
import { validatePagination } from '../middleware/validation.middleware';

const router = Router();
const actionController = new ActionController();

/**
 * @route POST /actions
 * @desc Record a new action
 * @access Private - Requires authentication
 */
router.post(
  '/',
  requireAuth,
  agentContextMiddleware,
  actionController.recordAction
);

/**
 * @route GET /actions/customer/:cif
 * @desc Get customer actions
 * @access Private - Requires authentication
 */
router.get(
  '/customer/:cif',
  requireAuth,
  validatePagination,
  actionController.getCustomerActions
);

/**
 * @route GET /actions/loan/:accountNumber
 * @desc Get loan actions
 * @access Private - Requires authentication
 */
router.get(
  '/loan/:accountNumber',
  requireAuth,
  validatePagination,
  actionController.getLoanActions
);

/**
 * @route PUT /actions/:id/result
 * @desc Update action result
 * @access Private - Requires authentication
 */
router.put(
  '/:id/result',
  requireAuth,
  agentContextMiddleware,
  actionController.updateActionResult
);

export default router;