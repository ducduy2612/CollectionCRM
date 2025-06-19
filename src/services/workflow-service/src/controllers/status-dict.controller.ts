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
      const includeInactive = req.query.includeInactive === 'true';
      const statuses = await StatusDictRepository.getAllCustomerStatuses(includeInactive);
      
      logger.info({ includeInactive }, 'Customer statuses retrieved successfully');
      
      return ResponseUtil.success(
        res,
        statuses,
        `${includeInactive ? 'All' : 'Active'} customer statuses retrieved successfully`
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error retrieving customer statuses');
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

  /**
   * Update customer status
   * @route PUT /status-dict/customer-status/:code
   */
  async updateCustomerStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;
      const { name, description, color, displayOrder } = req.body;

      // Check if status exists
      const existing = await StatusDictRepository.findStatusByCode('customer', code);
      if (!existing) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Customer status with code ${code} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }

      const updated = await StatusDictRepository.updateCustomerStatus(code, {
        name,
        description,
        color,
        displayOrder,
        updatedBy: req.user?.username || 'ADMIN'
      });

      logger.info({ code, updated }, 'Customer status updated successfully');

      return ResponseUtil.success(
        res,
        updated,
        'Customer status updated successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error updating customer status');
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
      const includeInactive = req.query.includeInactive === 'true';
      const statuses = await StatusDictRepository.getAllCollateralStatuses(includeInactive);
      
      logger.info({ includeInactive }, 'Collateral statuses retrieved successfully');
      
      return ResponseUtil.success(
        res,
        statuses,
        `${includeInactive ? 'All' : 'Active'} collateral statuses retrieved successfully`
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error retrieving collateral statuses');
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

  /**
   * Update collateral status
   * @route PUT /status-dict/collateral-status/:code
   */
  async updateCollateralStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;
      const { name, description, color, displayOrder } = req.body;

      // Check if status exists
      const existing = await StatusDictRepository.findStatusByCode('collateral', code);
      if (!existing) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Collateral status with code ${code} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }

      const updated = await StatusDictRepository.updateCollateralStatus(code, {
        name,
        description,
        color,
        displayOrder,
        updatedBy: req.user?.username || 'ADMIN'
      });

      logger.info({ code, updated }, 'Collateral status updated successfully');

      return ResponseUtil.success(
        res,
        updated,
        'Collateral status updated successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error updating collateral status');
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
      const includeInactive = req.query.includeInactive === 'true';
      const states = await StatusDictRepository.getAllProcessingStates(includeInactive);
      
      logger.info({ includeInactive }, 'Processing states retrieved successfully');
      
      return ResponseUtil.success(
        res,
        states,
        `${includeInactive ? 'All' : 'Active'} processing states retrieved successfully`
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error retrieving processing states');
      next(error);
    }
  }

  /**
   * Get all active processing substates
   * @route GET /status-dict/processing-substate
   */
  async getActiveProcessingSubstates(req: Request, res: Response, next: NextFunction) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const substates = await StatusDictRepository.getAllProcessingSubstates(includeInactive);
      
      logger.info({ includeInactive }, 'Processing substates retrieved successfully');
      
      return ResponseUtil.success(
        res,
        substates,
        `${includeInactive ? 'All' : 'Active'} processing substates retrieved successfully`
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error retrieving processing substates');
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

  /**
   * Update processing state
   * @route PUT /status-dict/processing-state/:code
   */
  async updateProcessingState(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;
      const { name, description, color, displayOrder } = req.body;

      // Check if status exists
      const existing = await StatusDictRepository.findStatusByCode('processing_state', code);
      if (!existing) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Processing state with code ${code} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }

      const updated = await StatusDictRepository.updateProcessingState(code, {
        name,
        description,
        color,
        displayOrder,
        updatedBy: req.user?.username || 'ADMIN'
      });

      logger.info({ code, updated }, 'Processing state updated successfully');

      return ResponseUtil.success(
        res,
        updated,
        'Processing state updated successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error updating processing state');
      next(error);
    }
  }

  /**
   * Update processing substate
   * @route PUT /status-dict/processing-substate/:code
   */
  async updateProcessingSubstate(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;
      const { name, description, color, displayOrder } = req.body;

      // Check if status exists
      const existing = await StatusDictRepository.findStatusByCode('processing_substate', code);
      if (!existing) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Processing substate with code ${code} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }

      const updated = await StatusDictRepository.updateProcessingSubstate(code, {
        name,
        description,
        color,
        displayOrder,
        updatedBy: req.user?.username || 'ADMIN'
      });

      logger.info({ code, updated }, 'Processing substate updated successfully');

      return ResponseUtil.success(
        res,
        updated,
        'Processing substate updated successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error updating processing substate');
      next(error);
    }
  }

  /**
   * Deactivate processing state
   * @route DELETE /status-dict/processing-state/:code
   */
  async deactivateProcessingState(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;

      const success = await StatusDictRepository.deactivateProcessingState(
        code,
        req.user?.username || 'ADMIN'
      );

      logger.info({ code, success }, 'Processing state deactivation completed');

      return ResponseUtil.success(
        res,
        { code, deactivated: success },
        success ? 'Processing state deactivated successfully' : 'Processing state deactivation failed'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error deactivating processing state');
      next(error);
    }
  }

  /**
   * Deactivate processing substate
   * @route DELETE /status-dict/processing-substate/:code
   */
  async deactivateProcessingSubstate(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;

      const success = await StatusDictRepository.deactivateProcessingSubstate(
        code,
        req.user?.username || 'ADMIN'
      );

      logger.info({ code, success }, 'Processing substate deactivation completed');

      return ResponseUtil.success(
        res,
        { code, deactivated: success },
        success ? 'Processing substate deactivated successfully' : 'Processing substate deactivation failed'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error deactivating processing substate');
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
      const includeInactive = req.query.includeInactive === 'true';
      const statuses = await StatusDictRepository.getAllLendingViolationStatuses(includeInactive);
      
      logger.info({ includeInactive }, 'Lending violation statuses retrieved successfully');
      
      return ResponseUtil.success(
        res,
        statuses,
        `${includeInactive ? 'All' : 'Active'} lending violation statuses retrieved successfully`
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error retrieving lending violation statuses');
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

  /**
   * Update lending violation status
   * @route PUT /status-dict/lending-violation-status/:code
   */
  async updateLendingViolationStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;
      const { name, description, color, displayOrder } = req.body;

      // Check if status exists
      const existing = await StatusDictRepository.findStatusByCode('lending_violation', code);
      if (!existing) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Lending violation status with code ${code} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }

      const updated = await StatusDictRepository.updateLendingViolationStatus(code, {
        name,
        description,
        color,
        displayOrder,
        updatedBy: req.user?.username || 'ADMIN'
      });

      logger.info({ code, updated }, 'Lending violation status updated successfully');

      return ResponseUtil.success(
        res,
        updated,
        'Lending violation status updated successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error updating lending violation status');
      next(error);
    }
  }

  /**
   * Deactivate lending violation status
   * @route DELETE /status-dict/lending-violation-status/:code
   */
  async deactivateLendingViolationStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;

      const success = await StatusDictRepository.deactivateLendingViolationStatus(
        code,
        req.user?.username || 'ADMIN'
      );

      logger.info({ code, success }, 'Lending violation status deactivation completed');

      return ResponseUtil.success(
        res,
        { code, deactivated: success },
        success ? 'Lending violation status deactivated successfully' : 'Lending violation status deactivation failed'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error deactivating lending violation status');
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
      const includeInactive = req.query.includeInactive === 'true';
      const statuses = await StatusDictRepository.getAllRecoveryAbilityStatuses(includeInactive);
      
      logger.info({ includeInactive }, 'Recovery ability statuses retrieved successfully');
      
      return ResponseUtil.success(
        res,
        statuses,
        `${includeInactive ? 'All' : 'Active'} recovery ability statuses retrieved successfully`
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error retrieving recovery ability statuses');
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

  /**
   * Update recovery ability status
   * @route PUT /status-dict/recovery-ability-status/:code
   */
  async updateRecoveryAbilityStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;
      const { name, description, color, displayOrder } = req.body;

      // Check if status exists
      const existing = await StatusDictRepository.findStatusByCode('recovery_ability', code);
      if (!existing) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Recovery ability status with code ${code} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }

      const updated = await StatusDictRepository.updateRecoveryAbilityStatus(code, {
        name,
        description,
        color,
        displayOrder,
        updatedBy: req.user?.username || 'ADMIN'
      });

      logger.info({ code, updated }, 'Recovery ability status updated successfully');

      return ResponseUtil.success(
        res,
        updated,
        'Recovery ability status updated successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error updating recovery ability status');
      next(error);
    }
  }

  /**
   * Deactivate recovery ability status
   * @route DELETE /status-dict/recovery-ability-status/:code
   */
  async deactivateRecoveryAbilityStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;

      const success = await StatusDictRepository.deactivateRecoveryAbilityStatus(
        code,
        req.user?.username || 'ADMIN'
      );

      logger.info({ code, success }, 'Recovery ability status deactivation completed');

      return ResponseUtil.success(
        res,
        { code, deactivated: success },
        success ? 'Recovery ability status deactivated successfully' : 'Recovery ability status deactivation failed'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error deactivating recovery ability status');
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