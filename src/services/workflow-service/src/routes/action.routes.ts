import { Router } from 'express';
import { ActionController } from '../controllers/action.controller';
import { ActionConfigController } from '../controllers/action-config.controller';
import { requireAuth, agentContextMiddleware, requirePermissions } from '../middleware/auth.middleware';
import { validatePagination } from '../middleware/validation.middleware';

const router = Router();
const actionController = new ActionController();
const actionConfigController = new ActionConfigController();

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
 * @route POST /actions/bulk
 * @desc Record multiple actions in bulk
 * @access Private - Requires authentication
 */
router.post(
  '/bulk',
  requireAuth,
  agentContextMiddleware,
  actionController.recordBulkActions
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
 * @route GET /actions/agent/:agentId
 * @desc Get agent actions
 * @access Private - Requires authentication
 */
router.get(
  '/agent/:agentId',
  requireAuth,
  validatePagination,
  actionController.getAgentActions
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

// =============================================
// CONFIGURATION MANAGEMENT ROUTES
// =============================================

/**
 * @route POST /action-config/action-types
 * @desc Add new action type
 * @access Private - Requires authentication
 */
router.post(
  '/action-config/action-types',
  requireAuth,
  requirePermissions(['action_config:all']),
  actionConfigController.addActionType
);

/**
 * @route POST /action-config/action-subtypes
 * @desc Add new action subtype
 * @access Private - Requires authentication
 */
router.post(
  '/action-config/action-subtypes',
  requireAuth,
  requirePermissions(['action_config:all']),
  actionConfigController.addActionSubtype
);

/**
 * @route POST /action-config/action-results
 * @desc Add new action result
 * @access Private - Requires authentication
 */
router.post(
  '/action-config/action-results',
  requireAuth,
  requirePermissions(['action_config:all']),
  actionConfigController.addActionResult
);

/**
 * @route PUT /action-config/action-types/:typeCode
 * @desc Update existing action type
 * @access Private - Requires authentication
 */
router.put(
  '/action-config/action-types/:typeCode',
  requireAuth,
  requirePermissions(['action_config:all']),
  actionConfigController.updateActionType
);

/**
 * @route PUT /action-config/action-subtypes/:subtypeCode
 * @desc Update existing action subtype
 * @access Private - Requires authentication
 */
router.put(
  '/action-config/action-subtypes/:subtypeCode',
  requireAuth,
  requirePermissions(['action_config:all']),
  actionConfigController.updateActionSubtype
);

/**
 * @route PUT /action-config/action-results/:resultCode
 * @desc Update existing action result
 * @access Private - Requires authentication
 */
router.put(
  '/action-config/action-results/:resultCode',
  requireAuth,
  requirePermissions(['action_config:all']),
  actionConfigController.updateActionResult
);

/**
 * @route POST /action-config/mappings/type-subtype
 * @desc Map action type to subtype
 * @access Private - Requires authentication
 */
router.post(
  '/action-config/mappings/type-subtype',
  requireAuth,
  requirePermissions(['action_config:all']),
  actionConfigController.mapTypeToSubtype
);

/**
 * @route POST /action-config/mappings/subtype-result
 * @desc Map action subtype to result
 * @access Private - Requires authentication
 */
router.post(
  '/action-config/mappings/subtype-result',
  requireAuth,
  requirePermissions(['action_config:all']),
  actionConfigController.mapSubtypeToResult
);

/**
 * @route GET /action-config/action-types
 * @desc get all action type
 * @access Private - Requires authentication
 */
router.get(
  '/action-config/action-types',
  requireAuth,
  actionConfigController.getAllActionTypes
);

/**
 * @route GET /action-config/action-subtypes
 * @desc get all action subtypes
 * @access Private - Requires authentication
 */
router.get(
  '/action-config/action-subtypes',
  requireAuth,
  actionConfigController.getAllActionSubtypes
);

/**
 * @route GET /action-config/action-results
 * @desc get all action results
 * @access Private - Requires authentication
 */
router.get(
  '/action-config/action-results',
  requireAuth,
  actionConfigController.getAllActionResults
);

/**
 * @route GET /action-config/action-types
 * @desc get all active action type
 * @access Private - Requires authentication
 */
router.get(
  '/action-config/action-types/active',
  requireAuth,
  actionConfigController.getAllActiveActionTypes
);

/**
 * @route GET /action-config/action-subtypes
 * @desc get all active action subtypes
 * @access Private - Requires authentication
 */
router.get(
  '/action-config/action-subtypes/active',
  requireAuth,
  actionConfigController.getAllActiveActionSubtypes
);

/**
 * @route GET /action-config/action-results
 * @desc get all active action results
 * @access Private - Requires authentication
 */
router.get(
  '/action-config/action-results/active',
  requireAuth,
  actionConfigController.getAllActiveActionResults
);

/**
 * @route GET /action-config/types/:typeCode/subtypes
 * @desc Get available subtypes for a type
 * @access Private - Requires authentication
 */
router.get(
  '/action-config/types/:typeCode/subtypes',
  requireAuth,
  actionConfigController.getSubtypesForType
);

/**
 * @route GET /action-config/subtypes/:subtypeCode/results
 * @desc Get available results for a subtype
 * @access Private - Requires authentication
 */
router.get(
  '/action-config/subtypes/:subtypeCode/results',
  requireAuth,
  actionConfigController.getResultsForSubtype
);

/**
 * @route POST /action-config/validate
 * @desc Validate action configuration
 * @access Private - Requires authentication
 */
router.post(
  '/action-config/validate',
  requireAuth,
  requirePermissions(['action_config:all']),
  actionConfigController.validateActionConfiguration
);

/**
 * @route DELETE /action-config/action-types/:typeCode
 * @desc Deactivate action type
 * @access Private - Requires authentication
 */
router.delete(
  '/action-config/action-types/:typeCode',
  requireAuth,
  requirePermissions(['action_config:all']),
  actionConfigController.deactivateActionType
);

/**
 * @route DELETE /action-config/action-subtypes/:subtypeCode
 * @desc Deactivate action subtype
 * @access Private - Requires authentication
 */
router.delete(
  '/action-config/action-subtypes/:subtypeCode',
  requireAuth,
  requirePermissions(['action_config:all']),
  actionConfigController.deactivateActionSubtype
);

/**
 * @route DELETE /action-config/action-results/:resultCode
 * @desc Deactivate action result
 * @access Private - Requires authentication
 */
router.delete(
  '/action-config/action-results/:resultCode',
  requireAuth,
  requirePermissions(['action_config:all']),
  actionConfigController.deactivateActionResult
);

/**
 * @route DELETE /action-config/mappings/type-subtype
 * @desc Remove type-subtype mapping
 * @access Private - Requires authentication
 */
router.delete(
  '/action-config/mappings/type-subtype',
  requireAuth,
  requirePermissions(['action_config:all']),
  actionConfigController.removeTypeSubtypeMapping
);

/**
 * @route DELETE /action-config/mappings/subtype-result
 * @desc Remove subtype-result mapping
 * @access Private - Requires authentication
 */
router.delete(
  '/action-config/mappings/subtype-result',
  requireAuth,
  requirePermissions(['action_config:all']),
  actionConfigController.removeSubtypeResultMapping
);

/**
 * @route GET /action-config/usage-stats
 * @desc Get configuration usage statistics
 * @access Private - Requires authentication
 */
router.get(
  '/action-config/usage-stats',
  requireAuth,
  actionConfigController.getConfigurationUsageStats
);

export default router;