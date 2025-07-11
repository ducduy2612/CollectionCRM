import { Router } from 'express';
import { AssignmentController } from '../controllers/assignment.controller';
import { requireAuth, requirePermissions, agentContextMiddleware } from '../middleware/auth.middleware';
import { validatePagination } from '../middleware/validation.middleware';
import { uploadCSV } from '../middleware/upload.middleware';

const router = Router();
const assignmentController = new AssignmentController();

/**
 * @route GET /assignments/agent/:agentId
 * @desc Get agent assignments
 * @access Private - Requires authentication
 */
router.get(
  '/agent/:agentId',
  requireAuth,
  validatePagination,
  assignmentController.getAgentAssignments
);

/**
 * @route POST /assignments
 * @desc Create assignment
 * @access Private - Requires authentication and supervisor role
 */
router.post(
  '/',
  requireAuth,
  requirePermissions(['customer_assignment:all']),
  agentContextMiddleware,
  assignmentController.createAssignment
);

/**
 * @route POST /assignments/bulk
 * @desc Bulk assignment from CSV file
 * @access Private - Requires authentication and supervisor role
 */
router.post(
  '/bulk',
  requireAuth,
  requirePermissions(['customer_assignment:all']),
  agentContextMiddleware,
  uploadCSV.single('csvFile'),
  assignmentController.bulkAssignment
);

/**
 * @route GET /assignments/bulk/:batchId/status
 * @desc Get bulk assignment batch status
 * @access Private - Requires authentication and supervisor role
 */
router.get(
  '/bulk/:batchId/status',
  requireAuth,
  requirePermissions(['customer_assignment:all']),
  assignmentController.getBatchStatus
);

/**
 * @route DELETE /assignments/bulk/staging
 * @desc Clear staging table
 * @access Private - Requires authentication and supervisor role
 */
router.delete(
  '/bulk/staging',
  requireAuth,
  requirePermissions(['customer_assignment:all']),
  assignmentController.clearStagingTable
);

/**
 * @route PUT /assignments/:id
 * @desc Update assignment
 * @access Private - Requires authentication and supervisor role
 */
router.put(
  '/:id',
  requireAuth,
  requirePermissions(['customer_assignment:all']),
  agentContextMiddleware,
  assignmentController.updateAssignment
);

/**
 * @route GET /assignments/history/:cif
 * @desc Get assignment history
 * @access Private - Requires authentication
 */
router.get(
  '/history/:cif',
  requireAuth,
  assignmentController.getAssignmentHistory
);

export default router;