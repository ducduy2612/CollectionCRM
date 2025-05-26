import { Router } from 'express';
import { CaseController } from '../controllers/case.controller';
import { requireAuth, agentContextMiddleware } from '../middleware/auth.middleware';
import { validatePagination } from '../middleware/validation.middleware';

const router = Router();
const caseController = new CaseController();

/**
 * @route GET /cases/customer/:cif
 * @desc Get customer case history
 * @access Private - Requires authentication
 */
router.get(
  '/customer/:cif',
  requireAuth,
  validatePagination,
  caseController.getCustomerCaseHistory
);

/**
 * @route POST /cases
 * @desc Record case action
 * @access Private - Requires authentication
 */
router.post(
  '/',
  requireAuth,
  agentContextMiddleware,
  caseController.recordCaseAction
);

/**
 * @route GET /cases/status/:cif
 * @desc Get customer case status
 * @access Private - Requires authentication
 */
router.get(
  '/status/:cif',
  requireAuth,
  caseController.getCustomerCaseStatus
);

export default router;