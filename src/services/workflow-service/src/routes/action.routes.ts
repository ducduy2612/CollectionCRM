import { Router } from 'express';
import { ActionController } from '../controllers/action.controller';
import { ConfigController } from '../controllers/config.controller';
import { requireAuth, agentContextMiddleware, requireRoles } from '../middleware/auth.middleware';
import { validatePagination } from '../middleware/validation.middleware';

const router = Router();
const actionController = new ActionController();
const configController = new ConfigController();

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

// =============================================
// CONFIGURATION MANAGEMENT ROUTES
// =============================================

/**
 * @route POST /config/action-types
 * @desc Add new action type
 * @access Private - Requires authentication
 */
router.post(
  '/config/action-types',
  requireAuth,
  requireRoles(['ADMIN']),
  configController.addActionType
);

/**
 * @route POST /config/action-subtypes
 * @desc Add new action subtype
 * @access Private - Requires authentication
 */
router.post(
  '/config/action-subtypes',
  requireAuth,
  requireRoles(['ADMIN']),
  configController.addActionSubtype
);

/**
 * @route POST /config/action-results
 * @desc Add new action result
 * @access Private - Requires authentication
 */
router.post(
  '/config/action-results',
  requireAuth,
  requireRoles(['ADMIN']),
  configController.addActionResult
);

/**
 * @route POST /config/mappings/type-subtype
 * @desc Map action type to subtype
 * @access Private - Requires authentication
 */
router.post(
  '/config/mappings/type-subtype',
  requireAuth,
  requireRoles(['ADMIN']),
  configController.mapTypeToSubtype
);

/**
 * @route POST /config/mappings/subtype-result
 * @desc Map action subtype to result
 * @access Private - Requires authentication
 */
router.post(
  '/config/mappings/subtype-result',
  requireAuth,
  requireRoles(['ADMIN']),
  configController.mapSubtypeToResult
);

/**
 * @route GET /config/types/:typeCode/subtypes
 * @desc Get available subtypes for a type
 * @access Private - Requires authentication
 */
router.get(
  '/config/types/:typeCode/subtypes',
  requireAuth,
  requireRoles(['ADMIN']),
  configController.getSubtypesForType
);

/**
 * @route GET /config/subtypes/:subtypeCode/results
 * @desc Get available results for a subtype
 * @access Private - Requires authentication
 */
router.get(
  '/config/subtypes/:subtypeCode/results',
  requireAuth,
  requireRoles(['ADMIN']),
  configController.getResultsForSubtype
);

/**
 * @route POST /config/validate
 * @desc Validate action configuration
 * @access Private - Requires authentication
 */
router.post(
  '/config/validate',
  requireAuth,
  requireRoles(['ADMIN']),
  configController.validateActionConfiguration
);

/**
 * @route DELETE /config/action-types/:typeCode
 * @desc Deactivate action type
 * @access Private - Requires authentication
 */
router.delete(
  '/config/action-types/:typeCode',
  requireAuth,
  requireRoles(['ADMIN']),
  configController.deactivateActionType
);

/**
 * @route DELETE /config/action-subtypes/:subtypeCode
 * @desc Deactivate action subtype
 * @access Private - Requires authentication
 */
router.delete(
  '/config/action-subtypes/:subtypeCode',
  requireAuth,
  requireRoles(['ADMIN']),
  configController.deactivateActionSubtype
);

/**
 * @route DELETE /config/action-results/:resultCode
 * @desc Deactivate action result
 * @access Private - Requires authentication
 */
router.delete(
  '/config/action-results/:resultCode',
  requireAuth,
  requireRoles(['ADMIN']),
  configController.deactivateActionResult
);

/**
 * @route DELETE /config/mappings/type-subtype
 * @desc Remove type-subtype mapping
 * @access Private - Requires authentication
 */
router.delete(
  '/config/mappings/type-subtype',
  requireAuth,
  requireRoles(['ADMIN']),
  configController.removeTypeSubtypeMapping
);

/**
 * @route DELETE /config/mappings/subtype-result
 * @desc Remove subtype-result mapping
 * @access Private - Requires authentication
 */
router.delete(
  '/config/mappings/subtype-result',
  requireAuth,
  requireRoles(['ADMIN']),
  configController.removeSubtypeResultMapping
);

/**
 * @route GET /config/usage-stats
 * @desc Get configuration usage statistics
 * @access Private - Requires authentication
 */
router.get(
  '/config/usage-stats',
  requireAuth,
  requireRoles(['ADMIN']),
  configController.getConfigurationUsageStats
);

export default router;