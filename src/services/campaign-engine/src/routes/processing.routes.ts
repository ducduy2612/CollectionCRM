import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { ProcessingController } from '../controllers/processing.controller';
import { requireAuth, requirePermissions } from '../middleware/auth.middleware';

const router = express.Router();
const processingController = new ProcessingController();

// Validation middleware
const validateRequest = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      data: null,
      message: 'Validation error',
      errors: errors.array().map(err => ({
        code: 'VALIDATION_ERROR',
        message: err.msg,
        field: 'param' in err ? err.param : undefined
      }))
    });
    return;
  }
  next();
};

// Trigger campaign processing
router.post('/trigger',
  requireAuth,
  requirePermissions(['campaign_management:all']),
  [
    body('campaign_group_ids').optional().isArray().withMessage('Campaign group IDs must be an array'),
    body('campaign_group_ids.*').optional().isUUID().withMessage('Invalid campaign group ID'),
    body('processing_options').optional().isObject().withMessage('Processing options must be an object'),
    body('processing_options.max_contacts_per_customer').optional().isInt({ min: 1, max: 10 }).withMessage('Max contacts per customer must be between 1 and 10'),
    body('processing_options.include_uncontactable').optional().isBoolean().withMessage('Include uncontactable must be a boolean')
  ],
  validateRequest,
  processingController.triggerProcessing.bind(processingController)
);

// Get all processing runs
router.get('/runs',
  [
    query('status').optional().isIn(['running', 'completed', 'failed']).withMessage('Invalid status'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
  ],
  validateRequest,
  processingController.getProcessingRuns.bind(processingController)
);

// Get specific processing run status
router.get('/runs/:id',
  param('id').isUUID().withMessage('Invalid processing run ID'),
  validateRequest,
  processingController.getProcessingRunStatus.bind(processingController)
);

// Get campaign results for a processing run
router.get('/runs/:id/results',
  param('id').isUUID().withMessage('Invalid processing run ID'),
  validateRequest,
  processingController.getCampaignResults.bind(processingController)
);

// Get processing statistics
router.get('/runs/:id/statistics',
  param('id').isUUID().withMessage('Invalid processing run ID'),
  validateRequest,
  processingController.getProcessingStatistics.bind(processingController)
);

// Get processing errors
router.get('/runs/:id/errors',
  param('id').isUUID().withMessage('Invalid processing run ID'),
  validateRequest,
  processingController.getProcessingErrors.bind(processingController)
);

// Get processing summary
router.get('/runs/:id/summary',
  param('id').isUUID().withMessage('Invalid processing run ID'),
  validateRequest,
  processingController.getProcessingSummary.bind(processingController)
);

// Get selected contacts for a processing run
router.get('/runs/:id/contacts',
  param('id').isUUID().withMessage('Invalid processing run ID'),
  validateRequest,
  processingController.getSelectedContacts.bind(processingController)
);

// Get customer assignments for a specific campaign result
router.get('/results/:campaignResultId/assignments',
  [
    param('campaignResultId').isUUID().withMessage('Invalid campaign result ID'),
    query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
  ],
  validateRequest,
  processingController.getCustomerAssignments.bind(processingController)
);

// Search customer assignments
router.get('/assignments/search',
  [
    query('cif').isString().withMessage('CIF is required and must be a string'),
    query('processing_run_id').optional().isUUID().withMessage('Invalid processing run ID')
  ],
  validateRequest,
  processingController.searchCustomerAssignments.bind(processingController)
);

export { router as processingRoutes };