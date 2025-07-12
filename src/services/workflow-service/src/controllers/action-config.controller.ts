import { Request, Response, NextFunction } from 'express';
import { ActionConfigRepository, ActionTypeConfig, ActionSubtypeConfig, ActionResultConfig } from '../repositories/action-config.repository';
import { ActionTypeRepository, ActionSubtypeRepository, ActionResultRepository } from '../repositories/action-config.repository';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';
import { ResponseUtil } from '../utils/response';
import { logger } from '../utils/logger';
import { actionConfigPublisher } from '../kafka/publishers/action-config.publisher';

/**
 * Action configuration controller for workflow service admin functions
 */
export class ActionConfigController {
  /**
   * Add new action type
   * @route POST /action-config/action-types
   */
  async addActionType(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, name, description, display_order } = req.body;
      
      if (!code || !name) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Code and name are required',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      const config: ActionTypeConfig = {
        code,
        name,
        description,
        display_order
      };
      
      const id = await ActionConfigRepository.addActionType(
        config,
        req.user?.username || 'ADMIN'
      );
      
      logger.info({ id, code, name }, 'Action type added successfully');
      
      // Publish Kafka event
      try {
        await actionConfigPublisher.publishActionConfigUpdated({
          operation: 'add',
          entityType: 'action_type',
          entityCode: code,
          entityId: id,
          changes: config,
          updatedBy: req.user?.username || 'ADMIN',
          userId: req.user?.id || 'system'
        });
      } catch (kafkaError) {
        logger.warn({ kafkaError, id, code }, 'Failed to publish action config event, but action type was added successfully');
      }
      
      return ResponseUtil.success(
        res,
        { id, ...config },
        'Action type added successfully',
        201
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error adding action type');
      next(error);
    }
  }

  /**
   * Add new action subtype
   * @route POST /action-config/action-subtypes
   */
  async addActionSubtype(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, name, description, display_order } = req.body;
      
      if (!code || !name) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Code and name are required',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      const config: ActionSubtypeConfig = {
        code,
        name,
        description,
        display_order
      };
      
      const id = await ActionConfigRepository.addActionSubtype(
        config,
        req.user?.username || 'ADMIN'
      );
      
      logger.info({ id, code, name }, 'Action subtype added successfully');
      
      // Publish Kafka event
      try {
        await actionConfigPublisher.publishActionConfigUpdated({
          operation: 'add',
          entityType: 'action_subtype',
          entityCode: code,
          entityId: id,
          changes: config,
          updatedBy: req.user?.username || 'ADMIN',
          userId: req.user?.id || 'system'
        });
      } catch (kafkaError) {
        logger.warn({ kafkaError, id, code }, 'Failed to publish action config event, but action subtype was added successfully');
      }
      
      return ResponseUtil.success(
        res,
        { id, ...config },
        'Action subtype added successfully',
        201
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error adding action subtype');
      next(error);
    }
  }

  /**
   * Add new action result
   * @route POST /action-config/action-results
   */
  async addActionResult(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, name, description, display_order } = req.body;
      
      if (!code || !name) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Code and name are required',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      const config: ActionResultConfig = {
        code,
        name,
        description,
        display_order
      };
      
      const id = await ActionConfigRepository.addActionResult(
        config,
        req.user?.username || 'ADMIN'
      );
      
      logger.info({ id, code, name }, 'Action result added successfully');
      
      // Publish Kafka event
      try {
        await actionConfigPublisher.publishActionConfigUpdated({
          operation: 'add',
          entityType: 'action_result',
          entityCode: code,
          entityId: id,
          changes: config,
          updatedBy: req.user?.username || 'ADMIN',
          userId: req.user?.id || 'system'
        });
      } catch (kafkaError) {
        logger.warn({ kafkaError, id, code }, 'Failed to publish action config event, but action result was added successfully');
      }
      
      return ResponseUtil.success(
        res,
        { id, ...config },
        'Action result added successfully',
        201
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error adding action result');
      next(error);
    }
  }

  /**
   * Update existing action type
   * @route PUT /action-config/action-types/:typeCode
   */
  async updateActionType(req: Request, res: Response, next: NextFunction) {
    try {
      const { typeCode } = req.params;
      const { name, description, display_order } = req.body;
      
      const config: Partial<ActionTypeConfig> = {};
      if (name !== undefined) config.name = name;
      if (description !== undefined) config.description = description;
      if (display_order !== undefined) config.display_order = display_order;
      
      if (Object.keys(config).length === 0) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'At least one field must be provided for update',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      const success = await ActionConfigRepository.updateActionType(
        typeCode,
        config,
        req.user?.username || 'ADMIN'
      );
      
      logger.info({ typeCode, config, success }, 'Action type update attempted');
      
      if (success) {
        // Publish Kafka event
        try {
          await actionConfigPublisher.publishActionConfigUpdated({
            operation: 'update',
            entityType: 'action_type',
            entityCode: typeCode,
            entityId: typeCode,
            changes: config,
            updatedBy: req.user?.username || 'ADMIN',
            userId: req.user?.id || 'system'
          });
        } catch (kafkaError) {
          logger.warn({ kafkaError, typeCode }, 'Failed to publish action config event, but action type was updated successfully');
        }
      }
      
      return ResponseUtil.success(
        res,
        { success },
        success ? 'Action type updated successfully' : 'Action type update failed'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error updating action type');
      next(error);
    }
  }

  /**
   * Update existing action subtype
   * @route PUT /action-config/action-subtypes/:subtypeCode
   */
  async updateActionSubtype(req: Request, res: Response, next: NextFunction) {
    try {
      const { subtypeCode } = req.params;
      const { name, description, display_order } = req.body;
      
      const config: Partial<ActionSubtypeConfig> = {};
      if (name !== undefined) config.name = name;
      if (description !== undefined) config.description = description;
      if (display_order !== undefined) config.display_order = display_order;
      
      if (Object.keys(config).length === 0) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'At least one field must be provided for update',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      const success = await ActionConfigRepository.updateActionSubtype(
        subtypeCode,
        config,
        req.user?.username || 'ADMIN'
      );
      
      logger.info({ subtypeCode, config, success }, 'Action subtype update attempted');
      
      if (success) {
        // Publish Kafka event
        try {
          await actionConfigPublisher.publishActionConfigUpdated({
            operation: 'update',
            entityType: 'action_subtype',
            entityCode: subtypeCode,
            entityId: subtypeCode,
            changes: config,
            updatedBy: req.user?.username || 'ADMIN',
            userId: req.user?.id || 'system'
          });
        } catch (kafkaError) {
          logger.warn({ kafkaError, subtypeCode }, 'Failed to publish action config event, but action subtype was updated successfully');
        }
      }
      
      return ResponseUtil.success(
        res,
        { success },
        success ? 'Action subtype updated successfully' : 'Action subtype update failed'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error updating action subtype');
      next(error);
    }
  }

  /**
   * Update existing action result
   * @route PUT /action-config/action-results/:resultCode
   */
  async updateActionResult(req: Request, res: Response, next: NextFunction) {
    try {
      const { resultCode } = req.params;
      const { name, description, display_order, is_promise } = req.body;
      
      const config: Partial<ActionResultConfig> = {};
      if (name !== undefined) config.name = name;
      if (description !== undefined) config.description = description;
      if (display_order !== undefined) config.display_order = display_order;
      if (is_promise !== undefined) config.is_promise = is_promise;
      
      if (Object.keys(config).length === 0) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'At least one field must be provided for update',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      const success = await ActionConfigRepository.updateActionResult(
        resultCode,
        config,
        req.user?.username || 'ADMIN'
      );
      
      logger.info({ resultCode, config, success }, 'Action result update attempted');
      
      if (success) {
        // Publish Kafka event
        try {
          await actionConfigPublisher.publishActionConfigUpdated({
            operation: 'update',
            entityType: 'action_result',
            entityCode: resultCode,
            entityId: resultCode,
            changes: config,
            updatedBy: req.user?.username || 'ADMIN',
            userId: req.user?.id || 'system'
          });
        } catch (kafkaError) {
          logger.warn({ kafkaError, resultCode }, 'Failed to publish action config event, but action result was updated successfully');
        }
      }
      
      return ResponseUtil.success(
        res,
        { success },
        success ? 'Action result updated successfully' : 'Action result update failed'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error updating action result');
      next(error);
    }
  }

  /**
   * Map action type to subtype
   * @route POST /action-config/mappings/type-subtype
   */
  async mapTypeToSubtype(req: Request, res: Response, next: NextFunction) {
    try {
      const { type_code, subtype_code } = req.body;
      
      if (!type_code || !subtype_code) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Type code and subtype code are required',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      const id = await ActionConfigRepository.mapTypeToSubtype(
        type_code,
        subtype_code,
        req.user?.username || 'ADMIN'
      );
      
      logger.info({ id, type_code, subtype_code }, 'Type-subtype mapping created successfully');
      
      // Publish Kafka event
      try {
        await actionConfigPublisher.publishActionConfigUpdated({
          operation: 'map',
          entityType: 'type_subtype_mapping',
          entityCode: `${type_code}-${subtype_code}`,
          entityId: id,
          changes: { type_code, subtype_code },
          updatedBy: req.user?.username || 'ADMIN',
          userId: req.user?.id || 'system'
        });
      } catch (kafkaError) {
        logger.warn({ kafkaError, id, type_code, subtype_code }, 'Failed to publish action config event, but mapping was created successfully');
      }
      
      return ResponseUtil.success(
        res,
        { id, type_code, subtype_code },
        'Type-subtype mapping created successfully',
        201
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error creating type-subtype mapping');
      next(error);
    }
  }

  /**
   * Map action subtype to result
   * @route POST /action-config/mappings/subtype-result
   */
  async mapSubtypeToResult(req: Request, res: Response, next: NextFunction) {
    try {
      const { subtype_code, result_code } = req.body;
      
      if (!subtype_code || !result_code) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Subtype code and result code are required',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      const id = await ActionConfigRepository.mapSubtypeToResult(
        subtype_code,
        result_code,
        req.user?.username || 'ADMIN'
      );
      
      logger.info({ id, subtype_code, result_code }, 'Subtype-result mapping created successfully');
      
      // Publish Kafka event
      try {
        await actionConfigPublisher.publishActionConfigUpdated({
          operation: 'map',
          entityType: 'subtype_result_mapping',
          entityCode: `${subtype_code}-${result_code}`,
          entityId: id,
          changes: { subtype_code, result_code },
          updatedBy: req.user?.username || 'ADMIN',
          userId: req.user?.id || 'system'
        });
      } catch (kafkaError) {
        logger.warn({ kafkaError, id, subtype_code, result_code }, 'Failed to publish action config event, but mapping was created successfully');
      }
      
      return ResponseUtil.success(
        res,
        { id, subtype_code, result_code },
        'Subtype-result mapping created successfully',
        201
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error creating subtype-result mapping');
      next(error);
    }
  }

  /**
   * Get available subtypes for a type
   * @route GET /action-config/types/:typeCode/subtypes
   */
  async getSubtypesForType(req: Request, res: Response, next: NextFunction) {
    try {
      const { typeCode } = req.params;
      
      const subtypes = await ActionConfigRepository.getSubtypesForType(typeCode);
      
      return ResponseUtil.success(
        res,
        subtypes,
        'Subtypes retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting subtypes for type');
      next(error);
    }
  }

  /**
   * Get available results for a subtype
   * @route GET /action-config/subtypes/:subtypeCode/results
   */
  async getResultsForSubtype(req: Request, res: Response, next: NextFunction) {
    try {
      const { subtypeCode } = req.params;
      
      const results = await ActionConfigRepository.getResultsForSubtype(subtypeCode);
      
      return ResponseUtil.success(
        res,
        results,
        'Results retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting results for subtype');
      next(error);
    }
  }

  /**
   * Validate action configuration
   * @route POST /action-config/validate
   */
  async validateActionConfiguration(req: Request, res: Response, next: NextFunction) {
    try {
      const { type_id, subtype_id, result_id } = req.body;
      
      if (!type_id || !subtype_id || !result_id) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Type ID, subtype ID, and result ID are required',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      const isValid = await ActionConfigRepository.validateActionConfiguration(
        type_id,
        subtype_id,
        result_id
      );
      
      return ResponseUtil.success(
        res,
        { is_valid: isValid },
        'Configuration validation completed'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error validating action configuration');
      next(error);
    }
  }

  /**
   * Deactivate action type
   * @route DELETE /action-config/action-types/:typeCode
   */
  async deactivateActionType(req: Request, res: Response, next: NextFunction) {
    try {
      const { typeCode } = req.params;
      
      const success = await ActionConfigRepository.deactivateActionType(
        typeCode,
        req.user?.username || 'ADMIN'
      );
      
      logger.info({ typeCode, success }, 'Action type deactivation attempted');
      
      if (success) {
        // Publish Kafka event
        try {
          await actionConfigPublisher.publishActionConfigUpdated({
            operation: 'deactivate',
            entityType: 'action_type',
            entityCode: typeCode,
            entityId: typeCode,
            changes: { is_active: false },
            updatedBy: req.user?.username || 'ADMIN',
            userId: req.user?.id || 'system'
          });
        } catch (kafkaError) {
          logger.warn({ kafkaError, typeCode }, 'Failed to publish action config event, but action type was deactivated successfully');
        }
      }
      
      return ResponseUtil.success(
        res,
        { success },
        success ? 'Action type deactivated successfully' : 'Action type deactivation failed'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error deactivating action type');
      next(error);
    }
  }

  /**
   * Deactivate action subtype
   * @route DELETE /action-config/action-subtypes/:subtypeCode
   */
  async deactivateActionSubtype(req: Request, res: Response, next: NextFunction) {
    try {
      const { subtypeCode } = req.params;
      
      const success = await ActionConfigRepository.deactivateActionSubtype(
        subtypeCode,
        req.user?.username || 'ADMIN'
      );
      
      logger.info({ subtypeCode, success }, 'Action subtype deactivation attempted');
      
      if (success) {
        // Publish Kafka event
        try {
          await actionConfigPublisher.publishActionConfigUpdated({
            operation: 'deactivate',
            entityType: 'action_subtype',
            entityCode: subtypeCode,
            entityId: subtypeCode,
            changes: { is_active: false },
            updatedBy: req.user?.username || 'ADMIN',
            userId: req.user?.id || 'system'
          });
        } catch (kafkaError) {
          logger.warn({ kafkaError, subtypeCode }, 'Failed to publish action config event, but action subtype was deactivated successfully');
        }
      }
      
      return ResponseUtil.success(
        res,
        { success },
        success ? 'Action subtype deactivated successfully' : 'Action subtype deactivation failed'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error deactivating action subtype');
      next(error);
    }
  }

  /**
   * Deactivate action result
   * @route DELETE /action-config/action-results/:resultCode
   */
  async deactivateActionResult(req: Request, res: Response, next: NextFunction) {
    try {
      const { resultCode } = req.params;
      
      const success = await ActionConfigRepository.deactivateActionResult(
        resultCode,
        req.user?.username || 'ADMIN'
      );
      
      logger.info({ resultCode, success }, 'Action result deactivation attempted');
      
      if (success) {
        // Publish Kafka event
        try {
          await actionConfigPublisher.publishActionConfigUpdated({
            operation: 'deactivate',
            entityType: 'action_result',
            entityCode: resultCode,
            entityId: resultCode,
            changes: { is_active: false },
            updatedBy: req.user?.username || 'ADMIN',
            userId: req.user?.id || 'system'
          });
        } catch (kafkaError) {
          logger.warn({ kafkaError, resultCode }, 'Failed to publish action config event, but action result was deactivated successfully');
        }
      }
      
      return ResponseUtil.success(
        res,
        { success },
        success ? 'Action result deactivated successfully' : 'Action result deactivation failed'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error deactivating action result');
      next(error);
    }
  }

  /**
   * Remove type-subtype mapping
   * @route DELETE /action-config/mappings/type-subtype
   */
  async removeTypeSubtypeMapping(req: Request, res: Response, next: NextFunction) {
    try {
      const { type_code, subtype_code } = req.body;
      
      if (!type_code || !subtype_code) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Type code and subtype code are required',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      const success = await ActionConfigRepository.removeTypeSubtypeMapping(
        type_code,
        subtype_code,
        req.user?.username || 'ADMIN'
      );
      
      logger.info({ type_code, subtype_code, success }, 'Type-subtype mapping removal attempted');
      
      if (success) {
        // Publish Kafka event
        try {
          await actionConfigPublisher.publishActionConfigUpdated({
            operation: 'unmap',
            entityType: 'type_subtype_mapping',
            entityCode: `${type_code}-${subtype_code}`,
            entityId: `${type_code}-${subtype_code}`,
            changes: { type_code, subtype_code },
            updatedBy: req.user?.username || 'ADMIN',
            userId: req.user?.id || 'system'
          });
        } catch (kafkaError) {
          logger.warn({ kafkaError, type_code, subtype_code }, 'Failed to publish action config event, but mapping was removed successfully');
        }
      }
      
      return ResponseUtil.success(
        res,
        { success },
        success ? 'Type-subtype mapping removed successfully' : 'Type-subtype mapping removal failed'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error removing type-subtype mapping');
      next(error);
    }
  }

  /**
   * Remove subtype-result mapping
   * @route DELETE /action-config/mappings/subtype-result
   */
  async removeSubtypeResultMapping(req: Request, res: Response, next: NextFunction) {
    try {
      const { subtype_code, result_code } = req.body;
      
      if (!subtype_code || !result_code) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Subtype code and result code are required',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      const success = await ActionConfigRepository.removeSubtypeResultMapping(
        subtype_code,
        result_code,
        req.user?.username || 'ADMIN'
      );
      
      logger.info({ subtype_code, result_code, success }, 'Subtype-result mapping removal attempted');
      
      if (success) {
        // Publish Kafka event
        try {
          await actionConfigPublisher.publishActionConfigUpdated({
            operation: 'unmap',
            entityType: 'subtype_result_mapping',
            entityCode: `${subtype_code}-${result_code}`,
            entityId: `${subtype_code}-${result_code}`,
            changes: { subtype_code, result_code },
            updatedBy: req.user?.username || 'ADMIN',
            userId: req.user?.id || 'system'
          });
        } catch (kafkaError) {
          logger.warn({ kafkaError, subtype_code, result_code }, 'Failed to publish action config event, but mapping was removed successfully');
        }
      }
      
      return ResponseUtil.success(
        res,
        { success },
        success ? 'Subtype-result mapping removed successfully' : 'Subtype-result mapping removal failed'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error removing subtype-result mapping');
      next(error);
    }
  }

  /**
   * Get configuration usage statistics
   * @route GET /action-config/usage-stats
   */
  async getConfigurationUsageStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await ActionConfigRepository.getConfigurationUsageStats();
      
      return ResponseUtil.success(
        res,
        stats,
        'Configuration usage statistics retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting configuration usage statistics');
      next(error);
    }
  }

  /**
   * Get all action types
   * @route GET /action-config/action-types
   */
  async getAllActionTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const actionTypes = await ActionTypeRepository.findAll();
      
      return ResponseUtil.success(
        res,
        actionTypes,
        'Action types retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting action types');
      next(error);
    }
  }

  /**
   * Get all action subtypes
   * @route GET /action-config/action-subtypes
   */
  async getAllActionSubtypes(req: Request, res: Response, next: NextFunction) {
    try {
      const actionSubtypes = await ActionSubtypeRepository.findAll();
      
      return ResponseUtil.success(
        res,
        actionSubtypes,
        'Action subtypes retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting action subtypes');
      next(error);
    }
  }

  /**
   * Get all action results
   * @route GET /action-config/action-results
   */
  async getAllActionResults(req: Request, res: Response, next: NextFunction) {
    try {
      const actionResults = await ActionResultRepository.findAll();
      
      return ResponseUtil.success(
        res,
        actionResults,
        'Action results retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting action results');
      next(error);
    }
  }

  /**
   * Get all active action types
   * @route GET /action-config/action-types/active
   */
  async getAllActiveActionTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const actionTypes = await ActionTypeRepository.findAllActive();
      
      return ResponseUtil.success(
        res,
        actionTypes,
        'Action types retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting action types');
      next(error);
    }
  }

  /**
   * Get all active action subtypes
   * @route GET /action-config/action-subtypes/active
   */
  async getAllActiveActionSubtypes(req: Request, res: Response, next: NextFunction) {
    try {
      const actionSubtypes = await ActionSubtypeRepository.findAllActive();
      
      return ResponseUtil.success(
        res,
        actionSubtypes,
        'Action subtypes retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting action subtypes');
      next(error);
    }
  }

  /**
   * Get all active action results
   * @route GET /action-config/action-results/active
   */
  async getAllActiveActionResults(req: Request, res: Response, next: NextFunction) {
    try {
      const actionResults = await ActionResultRepository.findAllActive();
      
      return ResponseUtil.success(
        res,
        actionResults,
        'Action results retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting action results');
      next(error);
    }
  }
}