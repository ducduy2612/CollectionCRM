import { Router } from 'express';
import { AssignmentController } from '../controllers/assignment.controller';
import { requireAuth, requireRoles, agentContextMiddleware } from '../middleware/auth.middleware';
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
  requireRoles(['ADMIN', 'SUPERVISOR']),
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
  requireRoles(['ADMIN', 'SUPERVISOR']),
  agentContextMiddleware,
  uploadCSV.single('csvFile'),
  assignmentController.bulkAssignment
);

/**
 * @route PUT /assignments/:id
 * @desc Update assignment
 * @access Private - Requires authentication and supervisor role
 */
router.put(
  '/:id',
  requireAuth,
  requireRoles(['ADMIN', 'SUPERVISOR']),
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