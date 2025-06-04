import { Router } from 'express';
import { StatusDictController } from '../controllers/status-dict.controller';
import { requireAuth, requireRoles } from '../middleware/auth.middleware';

const router = Router();
const statusDictController = new StatusDictController();

// =============================================
// CUSTOMER STATUS ROUTES
// =============================================

/**
 * @route GET /status-dict/customer-status
 * @desc Get all active customer statuses
 * @access Private - Requires authentication
 */
router.get(
  '/customer-status',
  requireAuth,
  statusDictController.getActiveCustomerStatuses
);

/**
 * @route POST /status-dict/customer-status
 * @desc Add new customer status
 * @access Private - Requires ADMIN role
 */
router.post(
  '/customer-status',
  requireAuth,
  requireRoles(['ADMIN']),
  statusDictController.addCustomerStatus
);

/**
 * @route DELETE /status-dict/customer-status/:code
 * @desc Deactivate customer status
 * @access Private - Requires ADMIN role
 */
router.delete(
  '/customer-status/:code',
  requireAuth,
  requireRoles(['ADMIN']),
  statusDictController.deactivateCustomerStatus
);

// =============================================
// COLLATERAL STATUS ROUTES
// =============================================

/**
 * @route GET /status-dict/collateral-status
 * @desc Get all active collateral statuses
 * @access Private - Requires authentication
 */
router.get(
  '/collateral-status',
  requireAuth,
  statusDictController.getActiveCollateralStatuses
);

/**
 * @route POST /status-dict/collateral-status
 * @desc Add new collateral status
 * @access Private - Requires ADMIN role
 */
router.post(
  '/collateral-status',
  requireAuth,
  requireRoles(['ADMIN']),
  statusDictController.addCollateralStatus
);

/**
 * @route DELETE /status-dict/collateral-status/:code
 * @desc Deactivate collateral status
 * @access Private - Requires ADMIN role
 */
router.delete(
  '/collateral-status/:code',
  requireAuth,
  requireRoles(['ADMIN']),
  statusDictController.deactivateCollateralStatus
);

// =============================================
// PROCESSING STATE ROUTES
// =============================================

/**
 * @route GET /status-dict/processing-state
 * @desc Get all active processing states
 * @access Private - Requires authentication
 */
router.get(
  '/processing-state',
  requireAuth,
  statusDictController.getActiveProcessingStates
);

/**
 * @route GET /status-dict/processing-substate
 * @desc Get all active processing substates
 * @access Private - Requires authentication
 */
router.get(
  '/processing-substate',
  requireAuth,
  statusDictController.getActiveProcessingSubstates
);

/**
 * @route GET /status-dict/processing-state/:stateCode/substates
 * @desc Get available substates for a processing state
 * @access Private - Requires authentication
 */
router.get(
  '/processing-state/:stateCode/substates',
  requireAuth,
  statusDictController.getSubstatesForState
);

/**
 * @route POST /status-dict/processing-state
 * @desc Add new processing state
 * @access Private - Requires ADMIN role
 */
router.post(
  '/processing-state',
  requireAuth,
  requireRoles(['ADMIN']),
  statusDictController.addProcessingState
);

/**
 * @route POST /status-dict/processing-substate
 * @desc Add new processing substate
 * @access Private - Requires ADMIN role
 */
router.post(
  '/processing-substate',
  requireAuth,
  requireRoles(['ADMIN']),
  statusDictController.addProcessingSubstate
);

/**
 * @route POST /status-dict/processing-state-mapping
 * @desc Map processing state to substate
 * @access Private - Requires ADMIN role
 */
router.post(
  '/processing-state-mapping',
  requireAuth,
  requireRoles(['ADMIN']),
  statusDictController.mapStateToSubstate
);

/**
 * @route DELETE /status-dict/processing-state-mapping
 * @desc Remove state-substate mapping
 * @access Private - Requires ADMIN role
 */
router.delete(
  '/processing-state-mapping',
  requireAuth,
  requireRoles(['ADMIN']),
  statusDictController.removeStateSubstateMapping
);

// =============================================
// LENDING VIOLATION STATUS ROUTES
// =============================================

/**
 * @route GET /status-dict/lending-violation-status
 * @desc Get all active lending violation statuses
 * @access Private - Requires authentication
 */
router.get(
  '/lending-violation-status',
  requireAuth,
  statusDictController.getActiveLendingViolationStatuses
);

/**
 * @route POST /status-dict/lending-violation-status
 * @desc Add new lending violation status
 * @access Private - Requires ADMIN role
 */
router.post(
  '/lending-violation-status',
  requireAuth,
  requireRoles(['ADMIN']),
  statusDictController.addLendingViolationStatus
);

// =============================================
// RECOVERY ABILITY STATUS ROUTES
// =============================================

/**
 * @route GET /status-dict/recovery-ability-status
 * @desc Get all active recovery ability statuses
 * @access Private - Requires authentication
 */
router.get(
  '/recovery-ability-status',
  requireAuth,
  statusDictController.getActiveRecoveryAbilityStatuses
);

/**
 * @route POST /status-dict/recovery-ability-status
 * @desc Add new recovery ability status
 * @access Private - Requires ADMIN role
 */
router.post(
  '/recovery-ability-status',
  requireAuth,
  requireRoles(['ADMIN']),
  statusDictController.addRecoveryAbilityStatus
);

// =============================================
// UTILITY ROUTES
// =============================================

/**
 * @route GET /status-dict/find/:statusType/:code
 * @desc Find status by code and type
 * @access Private - Requires authentication
 */
router.get(
  '/find/:statusType/:code',
  requireAuth,
  statusDictController.findStatusByCode
);

/**
 * @route GET /status-dict/usage-stats
 * @desc Get status usage statistics
 * @access Private - Requires ADMIN role
 */
router.get(
  '/usage-stats',
  requireAuth,
  requireRoles(['ADMIN']),
  statusDictController.getStatusUsageStats
);

export default router;