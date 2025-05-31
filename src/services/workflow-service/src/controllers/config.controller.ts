import { Request, Response, NextFunction } from 'express';
import { ConfigRepository, ActionTypeConfig, ActionSubtypeConfig, ActionResultConfig } from '../repositories/config.repository';
import { ActionTypeRepository, ActionSubtypeRepository, ActionResultRepository } from '../repositories/action-config.repository';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';
import { ResponseUtil } from '../utils/response';
import { logger } from '../utils/logger';

/**
 * Configuration controller for workflow service admin functions
 */
export class ConfigController {
  /**
   * Add new action type
   * @route POST /config/action-types
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
      
      const id = await ConfigRepository.addActionType(
        config,
        req.user?.userId || 'ADMIN'
      );
      
      logger.info({ id, code, name }, 'Action type added successfully');
      
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
   * @route POST /config/action-subtypes
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
      
      const id = await ConfigRepository.addActionSubtype(
        config,
        req.user?.userId || 'ADMIN'
      );
      
      logger.info({ id, code, name }, 'Action subtype added successfully');
      
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
   * @route POST /config/action-results
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
      
      const id = await ConfigRepository.addActionResult(
        config,
        req.user?.userId || 'ADMIN'
      );
      
      logger.info({ id, code, name }, 'Action result added successfully');
      
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
   * Map action type to subtype
   * @route POST /config/mappings/type-subtype
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
      
      const id = await ConfigRepository.mapTypeToSubtype(
        type_code,
        subtype_code,
        req.user?.userId || 'ADMIN'
      );
      
      logger.info({ id, type_code, subtype_code }, 'Type-subtype mapping created successfully');
      
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
   * @route POST /config/mappings/subtype-result
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
      
      const id = await ConfigRepository.mapSubtypeToResult(
        subtype_code,
        result_code,
        req.user?.userId || 'ADMIN'
      );
      
      logger.info({ id, subtype_code, result_code }, 'Subtype-result mapping created successfully');
      
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
   * @route GET /config/types/:typeCode/subtypes
   */
  async getSubtypesForType(req: Request, res: Response, next: NextFunction) {
    try {
      const { typeCode } = req.params;
      
      const subtypes = await ConfigRepository.getSubtypesForType(typeCode);
      
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
   * @route GET /config/subtypes/:subtypeCode/results
   */
  async getResultsForSubtype(req: Request, res: Response, next: NextFunction) {
    try {
      const { subtypeCode } = req.params;
      
      const results = await ConfigRepository.getResultsForSubtype(subtypeCode);
      
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
   * @route POST /config/validate
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
      
      const isValid = await ConfigRepository.validateActionConfiguration(
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
   * @route DELETE /config/action-types/:typeCode
   */
  async deactivateActionType(req: Request, res: Response, next: NextFunction) {
    try {
      const { typeCode } = req.params;
      
      const success = await ConfigRepository.deactivateActionType(
        typeCode,
        req.user?.userId || 'ADMIN'
      );
      
      logger.info({ typeCode, success }, 'Action type deactivation attempted');
      
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
   * @route DELETE /config/action-subtypes/:subtypeCode
   */
  async deactivateActionSubtype(req: Request, res: Response, next: NextFunction) {
    try {
      const { subtypeCode } = req.params;
      
      const success = await ConfigRepository.deactivateActionSubtype(
        subtypeCode,
        req.user?.userId || 'ADMIN'
      );
      
      logger.info({ subtypeCode, success }, 'Action subtype deactivation attempted');
      
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
   * @route DELETE /config/action-results/:resultCode
   */
  async deactivateActionResult(req: Request, res: Response, next: NextFunction) {
    try {
      const { resultCode } = req.params;
      
      const success = await ConfigRepository.deactivateActionResult(
        resultCode,
        req.user?.userId || 'ADMIN'
      );
      
      logger.info({ resultCode, success }, 'Action result deactivation attempted');
      
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
   * @route DELETE /config/mappings/type-subtype
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
      
      const success = await ConfigRepository.removeTypeSubtypeMapping(
        type_code,
        subtype_code,
        req.user?.userId || 'ADMIN'
      );
      
      logger.info({ type_code, subtype_code, success }, 'Type-subtype mapping removal attempted');
      
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
   * @route DELETE /config/mappings/subtype-result
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
      
      const success = await ConfigRepository.removeSubtypeResultMapping(
        subtype_code,
        result_code,
        req.user?.userId || 'ADMIN'
      );
      
      logger.info({ subtype_code, result_code, success }, 'Subtype-result mapping removal attempted');
      
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
   * @route GET /config/usage-stats
   */
  async getConfigurationUsageStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await ConfigRepository.getConfigurationUsageStats();
      
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
   * @route GET /config/action-types
   */
  async getAllActionTypes(req: Request, res: Response, next: NextFunction) {
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
   * Get all action subtypes
   * @route GET /config/action-subtypes
   */
  async getAllActionSubtypes(req: Request, res: Response, next: NextFunction) {
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
   * Get all action results
   * @route GET /config/action-results
   */
  async getAllActionResults(req: Request, res: Response, next: NextFunction) {
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