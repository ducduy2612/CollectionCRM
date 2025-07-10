import { Router } from 'express';
import { StatusDictController } from '../controllers/status-dict.controller';
import { requireAuth, requirePermissions } from '../middleware/auth.middleware';

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
  requirePermissions(['action_config:all']),
  statusDictController.addCustomerStatus
);

/**
 * @route PUT /status-dict/customer-status/:code
 * @desc Update customer status
 * @access Private - Requires ADMIN role
 */
router.put(
  '/customer-status/:code',
  requireAuth,
  requirePermissions(['action_config:all']),
  statusDictController.updateCustomerStatus
);

/**
 * @route DELETE /status-dict/customer-status/:code
 * @desc Deactivate customer status
 * @access Private - Requires ADMIN role
 */
router.delete(
  '/customer-status/:code',
  requireAuth,
  requirePermissions(['action_config:all']),
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
  requirePermissions(['action_config:all']),
  statusDictController.addCollateralStatus
);

/**
 * @route PUT /status-dict/collateral-status/:code
 * @desc Update collateral status
 * @access Private - Requires ADMIN role
 */
router.put(
  '/collateral-status/:code',
  requireAuth,
  requirePermissions(['action_config:all']),
  statusDictController.updateCollateralStatus
);

/**
 * @route DELETE /status-dict/collateral-status/:code
 * @desc Deactivate collateral status
 * @access Private - Requires ADMIN role
 */
router.delete(
  '/collateral-status/:code',
  requireAuth,
  requirePermissions(['action_config:all']),
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
  requirePermissions(['action_config:all']),
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
  requirePermissions(['action_config:all']),
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
  requirePermissions(['action_config:all']),
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
  requirePermissions(['action_config:all']),
  statusDictController.removeStateSubstateMapping
);

/**
 * @route PUT /status-dict/processing-state/:code
 * @desc Update processing state
 * @access Private - Requires ADMIN role
 */
router.put(
  '/processing-state/:code',
  requireAuth,
  requirePermissions(['action_config:all']),
  statusDictController.updateProcessingState
);

/**
 * @route PUT /status-dict/processing-substate/:code
 * @desc Update processing substate
 * @access Private - Requires ADMIN role
 */
router.put(
  '/processing-substate/:code',
  requireAuth,
  requirePermissions(['action_config:all']),
  statusDictController.updateProcessingSubstate
);

/**
 * @route DELETE /status-dict/processing-state/:code
 * @desc Deactivate processing state
 * @access Private - Requires ADMIN role
 */
router.delete(
  '/processing-state/:code',
  requireAuth,
  requirePermissions(['action_config:all']),
  statusDictController.deactivateProcessingState
);

/**
 * @route DELETE /status-dict/processing-substate/:code
 * @desc Deactivate processing substate
 * @access Private - Requires ADMIN role
 */
router.delete(
  '/processing-substate/:code',
  requireAuth,
  requirePermissions(['action_config:all']),
  statusDictController.deactivateProcessingSubstate
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
  requirePermissions(['action_config:all']),
  statusDictController.addLendingViolationStatus
);

/**
 * @route PUT /status-dict/lending-violation-status/:code
 * @desc Update lending violation status
 * @access Private - Requires ADMIN role
 */
router.put(
  '/lending-violation-status/:code',
  requireAuth,
  requirePermissions(['action_config:all']),
  statusDictController.updateLendingViolationStatus
);

/**
 * @route DELETE /status-dict/lending-violation-status/:code
 * @desc Deactivate lending violation status
 * @access Private - Requires ADMIN role
 */
router.delete(
  '/lending-violation-status/:code',
  requireAuth,
  requirePermissions(['action_config:all']),
  statusDictController.deactivateLendingViolationStatus
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
  requirePermissions(['action_config:all']),
  statusDictController.addRecoveryAbilityStatus
);

/**
 * @route PUT /status-dict/recovery-ability-status/:code
 * @desc Update recovery ability status
 * @access Private - Requires ADMIN role
 */
router.put(
  '/recovery-ability-status/:code',
  requireAuth,
  requirePermissions(['action_config:all']),
  statusDictController.updateRecoveryAbilityStatus
);

/**
 * @route DELETE /status-dict/recovery-ability-status/:code
 * @desc Deactivate recovery ability status
 * @access Private - Requires ADMIN role
 */
router.delete(
  '/recovery-ability-status/:code',
  requireAuth,
  requirePermissions(['action_config:all']),
  statusDictController.deactivateRecoveryAbilityStatus
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
  requirePermissions(['action_config:all']),
  statusDictController.getStatusUsageStats
);

export default router;