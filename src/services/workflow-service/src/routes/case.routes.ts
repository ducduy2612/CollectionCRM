import { Router } from 'express';
import { CaseController } from '../controllers/case.controller';
import { requireAuth, agentContextMiddleware } from '../middleware/auth.middleware';
import { validatePagination } from '../middleware/validation.middleware';

const router = Router();
const caseController = new CaseController();

// =============================================
// CUSTOMER STATUS ROUTES
// =============================================

/**
 * @route GET /customer-status/:cif
 * @desc Get customer status list by CIF
 * @access Private - Requires authentication
 */
router.get(
  '/customer-status/:cif',
  requireAuth,
  validatePagination,
  caseController.getCustomerStatus
);

/**
 * @route POST /customer-status
 * @desc Record new customer status
 * @access Private - Requires authentication
 */
router.post(
  '/customer-status',
  requireAuth,
  agentContextMiddleware,
  caseController.recordCustomerStatus
);

// =============================================
// LENDING VIOLATION STATUS ROUTES
// =============================================

/**
 * @route GET /lending-violation-status/:cif
 * @desc Get lending violation status list by CIF
 * @access Private - Requires authentication
 */
router.get(
  '/lending-violation-status/:cif',
  requireAuth,
  validatePagination,
  caseController.getLendingViolationStatus
);

/**
 * @route POST /lending-violation-status
 * @desc Record new lending violation status
 * @access Private - Requires authentication
 */
router.post(
  '/lending-violation-status',
  requireAuth,
  agentContextMiddleware,
  caseController.recordLendingViolationStatus
);

// =============================================
// RECOVERY ABILITY STATUS ROUTES
// =============================================

/**
 * @route GET /recovery-ability-status/:cif
 * @desc Get recovery ability status list by CIF
 * @access Private - Requires authentication
 */
router.get(
  '/recovery-ability-status/:cif',
  requireAuth,
  validatePagination,
  caseController.getRecoveryAbilityStatus
);

/**
 * @route POST /recovery-ability-status
 * @desc Record new recovery ability status
 * @access Private - Requires authentication
 */
router.post(
  '/recovery-ability-status',
  requireAuth,
  agentContextMiddleware,
  caseController.recordRecoveryAbilityStatus
);

// =============================================
// PROCESSING STATE STATUS ROUTES
// =============================================

/**
 * @route GET /processing-state-status/:cif
 * @desc Get processing state status list by CIF
 * @access Private - Requires authentication
 */
router.get(
  '/processing-state-status/:cif',
  requireAuth,
  validatePagination,
  caseController.getProcessingStateStatus
);

/**
 * @route POST /processing-state-status
 * @desc Record new processing state status
 * @access Private - Requires authentication
 */
router.post(
  '/processing-state-status',
  requireAuth,
  agentContextMiddleware,
  caseController.recordProcessingStateStatus
);

// =============================================
// COLLATERAL STATUS ROUTES
// =============================================

/**
 * @route GET /collateral-status/:cif
 * @desc Get collateral status list by CIF
 * @access Private - Requires authentication
 */
router.get(
  '/collateral-status/:cif',
  requireAuth,
  validatePagination,
  caseController.getCollateralStatus
);

/**
 * @route POST /collateral-status
 * @desc Record new collateral status
 * @access Private - Requires authentication
 */
router.post(
  '/collateral-status',
  requireAuth,
  agentContextMiddleware,
  caseController.recordCollateralStatus
);

// =============================================
// CUSTOMER CASE ROUTES
// =============================================

/**
 * @route GET /customer-case/:cif
 * @desc Get customer case data
 * @access Private - Requires authentication
 */
router.get(
  '/customer-case/:cif',
  requireAuth,
  caseController.getCustomerCase
);

/**
 * @route PUT /master-notes/:cif
 * @desc Update master notes for customer case
 * @access Private - Requires authentication
 */
router.put(
  '/master-notes/:cif',
  requireAuth,
  caseController.updateMasterNotes
);

export default router;