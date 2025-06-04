import { Request, Response, NextFunction } from 'express';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';
import { ResponseUtil } from '../utils/response';
import { logger } from '../utils/logger';
import { StatusDictRepository } from '../repositories';

/**
 * Status Dictionary controller for workflow service admin functions
 */
export class StatusDictController {
  // =============================================
  // CUSTOMER STATUS MANAGEMENT
  // =============================================

  /**
   * Get all active customer statuses
   * @route GET /status-dict/customer-status
   */
  async getActiveCustomerStatuses(req: Request, res: Response, next: NextFunction) {
    try {
      const statuses = await StatusDictRepository.getActiveCustomerStatuses();
      
      logger.info('Active customer statuses retrieved successfully');
      
      return ResponseUtil.success(
        res,
        statuses,
        'Active customer statuses retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error retrieving active customer statuses');
      next(error);
    }
  }

  /**
   * Add new customer status
   * @route POST /status-dict/customer-status
   */
  async addCustomerStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, name, description, color, displayOrder } = req.body;

      // Validate required fields
      if (!code || !name) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Missing required fields: code, name',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }

      const statusId = await StatusDictRepository.addCustomerStatus({
        code,
        name,
        description,
        color,
        displayOrder,
        createdBy: req.user?.username || 'ADMIN'
      });

      logger.info({ statusId, code, name }, 'Customer status added successfully');

      return ResponseUtil.success(
        res,
        { id: statusId, code, name, description, color, displayOrder },
        'Customer status added successfully',
        201
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error adding customer status');
      next(error);
    }
  }

  /**
   * Deactivate customer status
   * @route DELETE /status-dict/customer-status/:code
   */
  async deactivateCustomerStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;

      const success = await StatusDictRepository.deactivateCustomerStatus(
        code,
        req.user?.username || 'ADMIN'
      );

      logger.info({ code, success }, 'Customer status deactivation completed');

      return ResponseUtil.success(
        res,
        { code, deactivated: success },
        success ? 'Customer status deactivated successfully' : 'Customer status deactivation failed'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error deactivating customer status');
      next(error);
    }
  }

  // =============================================
  // COLLATERAL STATUS MANAGEMENT
  // =============================================

  /**
   * Get all active collateral statuses
   * @route GET /status-dict/collateral-status
   */
  async getActiveCollateralStatuses(req: Request, res: Response, next: NextFunction) {
    try {
      const statuses = await StatusDictRepository.getActiveCollateralStatuses();
      
      logger.info('Active collateral statuses retrieved successfully');
      
      return ResponseUtil.success(
        res,
        statuses,
        'Active collateral statuses retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error retrieving active collateral statuses');
      next(error);
    }
  }

  /**
   * Add new collateral status
   * @route POST /status-dict/collateral-status
   */
  async addCollateralStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, name, description, color, displayOrder } = req.body;

      // Validate required fields
      if (!code || !name) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Missing required fields: code, name',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }

      const statusId = await StatusDictRepository.addCollateralStatus({
        code,
        name,
        description,
        color,
        displayOrder,
        createdBy: req.user?.username || 'ADMIN'
      });

      logger.info({ statusId, code, name }, 'Collateral status added successfully');

      return ResponseUtil.success(
        res,
        { id: statusId, code, name, description, color, displayOrder },
        'Collateral status added successfully',
        201
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error adding collateral status');
      next(error);
    }
  }

  /**
   * Deactivate collateral status
   * @route DELETE /status-dict/collateral-status/:code
   */
  async deactivateCollateralStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;

      const success = await StatusDictRepository.deactivateCollateralStatus(
        code,
        req.user?.username || 'ADMIN'
      );

      logger.info({ code, success }, 'Collateral status deactivation completed');

      return ResponseUtil.success(
        res,
        { code, deactivated: success },
        success ? 'Collateral status deactivated successfully' : 'Collateral status deactivation failed'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error deactivating collateral status');
      next(error);
    }
  }

  // =============================================
  // PROCESSING STATE MANAGEMENT
  // =============================================

  /**
   * Get all active processing states
   * @route GET /status-dict/processing-state
   */
  async getActiveProcessingStates(req: Request, res: Response, next: NextFunction) {
    try {
      const states = await StatusDictRepository.getActiveProcessingStates();
      
      logger.info('Active processing states retrieved successfully');
      
      return ResponseUtil.success(
        res,
        states,
        'Active processing states retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error retrieving active processing states');
      next(error);
    }
  }

  /**
   * Get all active processing substates
   * @route GET /status-dict/processing-substate
   */
  async getActiveProcessingSubstates(req: Request, res: Response, next: NextFunction) {
    try {
      const substates = await StatusDictRepository.getActiveProcessingSubstates();
      
      logger.info('Active processing substates retrieved successfully');
      
      return ResponseUtil.success(
        res,
        substates,
        'Active processing substates retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error retrieving active processing substates');
      next(error);
    }
  }

  /**
   * Get available substates for a processing state
   * @route GET /status-dict/processing-state/:stateCode/substates
   */
  async getSubstatesForState(req: Request, res: Response, next: NextFunction) {
    try {
      const { stateCode } = req.params;
      
      const substates = await StatusDictRepository.getSubstatesForState(stateCode);
      
      logger.info({ stateCode }, 'Substates for processing state retrieved successfully');
      
      return ResponseUtil.success(
        res,
        substates,
        'Substates for processing state retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error retrieving substates for processing state');
      next(error);
    }
  }

  /**
   * Add new processing state
   * @route POST /status-dict/processing-state
   */
  async addProcessingState(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, name, description, color, displayOrder } = req.body;

      // Validate required fields
      if (!code || !name) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Missing required fields: code, name',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }

      const stateId = await StatusDictRepository.addProcessingState({
        code,
        name,
        description,
        color,
        displayOrder,
        createdBy: req.user?.username || 'ADMIN'
      });

      logger.info({ stateId, code, name }, 'Processing state added successfully');

      return ResponseUtil.success(
        res,
        { id: stateId, code, name, description, color, displayOrder },
        'Processing state added successfully',
        201
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error adding processing state');
      next(error);
    }
  }

  /**
   * Add new processing substate
   * @route POST /status-dict/processing-substate
   */
  async addProcessingSubstate(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, name, description, color, displayOrder } = req.body;

      // Validate required fields
      if (!code || !name) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Missing required fields: code, name',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }

      const substateId = await StatusDictRepository.addProcessingSubstate({
        code,
        name,
        description,
        color,
        displayOrder,
        createdBy: req.user?.username || 'ADMIN'
      });

      logger.info({ substateId, code, name }, 'Processing substate added successfully');

      return ResponseUtil.success(
        res,
        { id: substateId, code, name, description, color, displayOrder },
        'Processing substate added successfully',
        201
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error adding processing substate');
      next(error);
    }
  }

  /**
   * Map processing state to substate
   * @route POST /status-dict/processing-state-mapping
   */
  async mapStateToSubstate(req: Request, res: Response, next: NextFunction) {
    try {
      const { stateCode, substateCode } = req.body;

      // Validate required fields
      if (!stateCode || !substateCode) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Missing required fields: stateCode, substateCode',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }

      const mappingId = await StatusDictRepository.mapStateToSubstate(
        stateCode,
        substateCode,
        req.user?.username || 'ADMIN'
      );

      logger.info({ mappingId, stateCode, substateCode }, 'State-substate mapping created successfully');

      return ResponseUtil.success(
        res,
        { id: mappingId, stateCode, substateCode },
        'State-substate mapping created successfully',
        201
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error creating state-substate mapping');
      next(error);
    }
  }

  /**
   * Remove state-substate mapping
   * @route DELETE /status-dict/processing-state-mapping
   */
  async removeStateSubstateMapping(req: Request, res: Response, next: NextFunction) {
    try {
      const { stateCode, substateCode } = req.body;

      // Validate required fields
      if (!stateCode || !substateCode) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Missing required fields: stateCode, substateCode',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }

      const success = await StatusDictRepository.removeStateSubstateMapping(
        stateCode,
        substateCode,
        req.user?.username || 'ADMIN'
      );

      logger.info({ stateCode, substateCode, success }, 'State-substate mapping removal completed');

      return ResponseUtil.success(
        res,
        { stateCode, substateCode, removed: success },
        success ? 'State-substate mapping removed successfully' : 'State-substate mapping removal failed'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error removing state-substate mapping');
      next(error);
    }
  }

  // =============================================
  // LENDING VIOLATION STATUS MANAGEMENT
  // =============================================

  /**
   * Get all active lending violation statuses
   * @route GET /status-dict/lending-violation-status
   */
  async getActiveLendingViolationStatuses(req: Request, res: Response, next: NextFunction) {
    try {
      const statuses = await StatusDictRepository.getActiveLendingViolationStatuses();
      
      logger.info('Active lending violation statuses retrieved successfully');
      
      return ResponseUtil.success(
        res,
        statuses,
        'Active lending violation statuses retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error retrieving active lending violation statuses');
      next(error);
    }
  }

  /**
   * Add new lending violation status
   * @route POST /status-dict/lending-violation-status
   */
  async addLendingViolationStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, name, description, color, displayOrder } = req.body;

      // Validate required fields
      if (!code || !name) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Missing required fields: code, name',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }

      const statusId = await StatusDictRepository.addLendingViolationStatus({
        code,
        name,
        description,
        color,
        displayOrder,
        createdBy: req.user?.username || 'ADMIN'
      });

      logger.info({ statusId, code, name }, 'Lending violation status added successfully');

      return ResponseUtil.success(
        res,
        { id: statusId, code, name, description, color, displayOrder },
        'Lending violation status added successfully',
        201
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error adding lending violation status');
      next(error);
    }
  }

  // =============================================
  // RECOVERY ABILITY STATUS MANAGEMENT
  // =============================================

  /**
   * Get all active recovery ability statuses
   * @route GET /status-dict/recovery-ability-status
   */
  async getActiveRecoveryAbilityStatuses(req: Request, res: Response, next: NextFunction) {
    try {
      const statuses = await StatusDictRepository.getActiveRecoveryAbilityStatuses();
      
      logger.info('Active recovery ability statuses retrieved successfully');
      
      return ResponseUtil.success(
        res,
        statuses,
        'Active recovery ability statuses retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error retrieving active recovery ability statuses');
      next(error);
    }
  }

  /**
   * Add new recovery ability status
   * @route POST /status-dict/recovery-ability-status
   */
  async addRecoveryAbilityStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, name, description, color, displayOrder } = req.body;

      // Validate required fields
      if (!code || !name) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Missing required fields: code, name',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }

      const statusId = await StatusDictRepository.addRecoveryAbilityStatus({
        code,
        name,
        description,
        color,
        displayOrder,
        createdBy: req.user?.username || 'ADMIN'
      });

      logger.info({ statusId, code, name }, 'Recovery ability status added successfully');

      return ResponseUtil.success(
        res,
        { id: statusId, code, name, description, color, displayOrder },
        'Recovery ability status added successfully',
        201
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error adding recovery ability status');
      next(error);
    }
  }

  // =============================================
  // UTILITY FUNCTIONS
  // =============================================

  /**
   * Find status by code and type
   * @route GET /status-dict/find/:statusType/:code
   */
  async findStatusByCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { statusType, code } = req.params;

      const status = await StatusDictRepository.findStatusByCode(statusType, code);

      logger.info({ statusType, code, found: !!status }, 'Status lookup completed');

      return ResponseUtil.success(
        res,
        status,
        status ? 'Status found successfully' : 'Status not found'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error finding status by code');
      next(error);
    }
  }

  /**
   * Get status usage statistics
   * @route GET /status-dict/usage-stats
   */
  async getStatusUsageStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await StatusDictRepository.getStatusUsageStats();

      logger.info('Status usage statistics retrieved successfully');

      return ResponseUtil.success(
        res,
        stats,
        'Status usage statistics retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error retrieving status usage statistics');
      next(error);
    }
  }
}