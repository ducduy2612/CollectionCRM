import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { CampaignController } from '../controllers/campaign.controller';
import { requireAuth, requirePermissions } from '../middleware/auth.middleware';

const router = express.Router();
const campaignController = new CampaignController();

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

// Campaign Groups Routes
router.get('/groups', campaignController.getCampaignGroups.bind(campaignController));

router.get('/groups/:id', 
  param('id').isUUID().withMessage('Invalid campaign group ID'),
  validateRequest,
  campaignController.getCampaignGroupById.bind(campaignController)
);

router.post('/groups',
  requireAuth,
  requirePermissions(['campaign_management:all']),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('name').isLength({ max: 255 }).withMessage('Name must be less than 255 characters')
  ],
  validateRequest,
  campaignController.createCampaignGroup.bind(campaignController)
);

router.put('/groups/:id',
  requireAuth,
  requirePermissions(['campaign_management:all']),
  [
    param('id').isUUID().withMessage('Invalid campaign group ID'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('name').optional().isLength({ max: 255 }).withMessage('Name must be less than 255 characters')
  ],
  validateRequest,
  campaignController.updateCampaignGroup.bind(campaignController)
);

router.delete('/groups/:id',
  requireAuth,
  requirePermissions(['campaign_management:all']),
  param('id').isUUID().withMessage('Invalid campaign group ID'),
  validateRequest,
  campaignController.deleteCampaignGroup.bind(campaignController)
);

// Campaigns Routes
router.get('/',
  query('campaign_group_id').optional().isUUID().withMessage('Invalid campaign group ID'),
  validateRequest,
  campaignController.getCampaigns.bind(campaignController)
);

router.get('/:id',
  param('id').isUUID().withMessage('Invalid campaign ID'),
  validateRequest,
  campaignController.getCampaignById.bind(campaignController)
);

router.post('/',
  requireAuth,
  requirePermissions(['campaign_management:all']),
  [
    body('campaign_group_id').isUUID().withMessage('Invalid campaign group ID'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('name').isLength({ max: 255 }).withMessage('Name must be less than 255 characters'),
    body('priority').isInt({ min: 1 }).withMessage('Priority must be a positive integer'),
    
    // Base conditions validation
    body('base_conditions').optional().isArray().withMessage('Base conditions must be an array'),
    body('base_conditions.*.field_name').notEmpty().withMessage('Field name is required'),
    body('base_conditions.*.operator').isIn(['=', '!=', '>', '>=', '<', '<=', 'LIKE', 'NOT_LIKE', 'IN', 'NOT_IN', 'IS_NULL', 'IS_NOT_NULL']).withMessage('Invalid operator'),
    body('base_conditions.*.field_value').notEmpty().withMessage('Field value is required'),
    body('base_conditions.*.data_source').notEmpty().withMessage('Data source is required'),
    
    // Contact selection rules validation
    body('contact_selection_rules').optional().isArray().withMessage('Contact selection rules must be an array'),
    body('contact_selection_rules.*.rule_priority').isInt({ min: 1 }).withMessage('Rule priority must be a positive integer'),
    body('contact_selection_rules.*.conditions').isArray().withMessage('Rule conditions must be an array'),
    body('contact_selection_rules.*.outputs').isArray().withMessage('Rule outputs must be an array')
  ],
  validateRequest,
  campaignController.createCampaign.bind(campaignController)
);

router.put('/:id',
  requireAuth,
  requirePermissions(['campaign_management:all']),
  [
    param('id').isUUID().withMessage('Invalid campaign ID'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('name').optional().isLength({ max: 255 }).withMessage('Name must be less than 255 characters'),
    body('campaign_group_id').optional().isUUID().withMessage('Invalid campaign group ID'),
    body('priority').optional().isInt({ min: 1 }).withMessage('Priority must be a positive integer'),
    
    // Base conditions validation (optional for updates)
    body('base_conditions').optional().isArray().withMessage('Base conditions must be an array'),
    body('base_conditions.*.field_name').optional().notEmpty().withMessage('Field name is required'),
    body('base_conditions.*.operator').optional().isIn(['=', '!=', '>', '>=', '<', '<=', 'LIKE', 'NOT_LIKE', 'IN', 'NOT_IN', 'IS_NULL', 'IS_NOT_NULL']).withMessage('Invalid operator'),
    body('base_conditions.*.field_value').optional().notEmpty().withMessage('Field value is required'),
    body('base_conditions.*.data_source').optional().notEmpty().withMessage('Data source is required'),
    
    // Contact selection rules validation (optional for updates)
    body('contact_selection_rules').optional().isArray().withMessage('Contact selection rules must be an array'),
    body('contact_selection_rules.*.rule_priority').optional().isInt({ min: 1 }).withMessage('Rule priority must be a positive integer'),
    body('contact_selection_rules.*.conditions').optional().isArray().withMessage('Rule conditions must be an array'),
    body('contact_selection_rules.*.outputs').optional().isArray().withMessage('Rule outputs must be an array')
  ],
  validateRequest,
  campaignController.updateCampaign.bind(campaignController)
);

router.delete('/:id',
  requireAuth,
  requirePermissions(['campaign_management:all']),
  param('id').isUUID().withMessage('Invalid campaign ID'),
  validateRequest,
  campaignController.deleteCampaign.bind(campaignController)
);

// Campaign Details Routes
router.get('/:id/conditions',
  param('id').isUUID().withMessage('Invalid campaign ID'),
  validateRequest,
  campaignController.getCampaignConditions.bind(campaignController)
);

router.get('/:id/contact-rules',
  param('id').isUUID().withMessage('Invalid campaign ID'),
  validateRequest,
  campaignController.getCampaignContactRules.bind(campaignController)
);

// Custom Fields Routes
router.get('/config/custom-fields', campaignController.getCustomFields.bind(campaignController));

router.post('/config/custom-fields',
  requireAuth,
  requirePermissions(['campaign_management:all']),
  [
    body('field_name').trim().notEmpty().withMessage('Field name is required'),
    body('field_name').isLength({ max: 255 }).withMessage('Field name must be less than 255 characters'),
    body('data_type').isIn(['string', 'number', 'date', 'boolean']).withMessage('Invalid data type'),
    body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters')
  ],
  validateRequest,
  campaignController.createCustomField.bind(campaignController)
);

// Configuration Routes
router.get('/config/data-sources', campaignController.getDataSources.bind(campaignController));
router.get('/config/operators', campaignController.getOperators.bind(campaignController));
router.get('/config/contact-types', campaignController.getContactTypes.bind(campaignController));
router.get('/config/related-party-types', campaignController.getRelatedPartyTypes.bind(campaignController));

// Campaign Configuration for Processing
router.get('/config/processing', campaignController.getCampaignConfiguration.bind(campaignController));

// Queue Statistics
router.get('/stats/queue', campaignController.getQueueStatistics.bind(campaignController));

export { router as campaignRoutes };