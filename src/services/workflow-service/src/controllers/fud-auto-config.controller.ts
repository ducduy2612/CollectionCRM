import { Request, Response, NextFunction } from 'express';
import { FudAutoConfigRepository, CreateFudConfigDto, UpdateFudConfigDto } from '../repositories/fud-auto-config.repository';
import { ResponseUtil } from '../utils/response';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';
import { logger } from '../utils/logger';
import { FudCalculationType } from '../entities/fud-auto-config.entity';

/**
 * FUD Auto Configuration controller - handles FUD auto-calculation rules
 */
export class FudAutoConfigController {
  private repository: FudAutoConfigRepository;

  constructor() {
    this.repository = new FudAutoConfigRepository();
  }

  /**
   * Get all FUD configurations
   * @route GET /fud-auto-config
   */
  async getAllConfigs(req: Request, res: Response, next: NextFunction) {
    try {
      const includeInactive = req.query.include_inactive === 'true';
      const configs = await this.repository.findAll(includeInactive);
      
      return ResponseUtil.success(res, configs, 'FUD configurations retrieved successfully');
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting FUD configurations');
      next(error);
    }
  }

  /**
   * Get FUD configuration by ID
   * @route GET /fud-auto-config/:id
   */
  async getConfigById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const config = await this.repository.findById(id);
      
      if (!config) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `FUD configuration with ID ${id} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      return ResponseUtil.success(res, config, 'FUD configuration retrieved successfully');
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting FUD configuration by ID');
      next(error);
    }
  }

  /**
   * Get FUD configuration by action result ID
   * @route GET /fud-auto-config/action-result/:actionResultId
   */
  async getConfigByActionResult(req: Request, res: Response, next: NextFunction) {
    try {
      const { actionResultId } = req.params;
      const config = await this.repository.findByActionResultId(actionResultId);
      
      if (!config) {
        return ResponseUtil.success(res, null, 'No FUD configuration found for this action result');
      }
      
      return ResponseUtil.success(res, config, 'FUD configuration retrieved successfully');
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting FUD configuration by action result ID');
      next(error);
    }
  }

  /**
   * Create new FUD configuration
   * @route POST /fud-auto-config
   */
  async createConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const { action_result_id, calculation_type, days_offset, is_active, priority } = req.body;
      console.log(req.user);
      const userId = req.user?.username || req.user?.id || 'system';

      // Ensure userId is a valid string
      if (!userId || typeof userId !== 'string') {
        throw Errors.create(
          Errors.Auth.INVALID_TOKEN,
          'User authentication required',
          OperationType.AUTHENTICATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }

      // Validate required fields
      if (!action_result_id || !calculation_type || days_offset === undefined) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Missing required fields: action_result_id, calculation_type, days_offset',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }

      // Validate calculation type
      if (!Object.values(FudCalculationType).includes(calculation_type)) {
        throw Errors.create(
          Errors.Validation.INVALID_FORMAT,
          'Invalid calculation type. Must be PROMISE_DATE or ACTION_DATE',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }

      const createDto: CreateFudConfigDto = {
        action_result_id,
        calculation_type,
        days_offset,
        is_active: is_active ?? true,
        priority: priority ?? 0,
        createdBy: userId
      };

      const config = await this.repository.create(createDto);
      
      logger.info({ configId: config.id, action_result_id }, 'FUD configuration created successfully');
      
      return ResponseUtil.success(res, config, 'FUD configuration created successfully', 201);
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error creating FUD configuration');
      next(error);
    }
  }

  /**
   * Update FUD configuration
   * @route PUT /fud-auto-config/:id
   */
  async updateConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { calculation_type, days_offset, is_active, priority } = req.body;
      const userId = req.user?.username || req.user?.id || 'system';

      // Ensure userId is a valid string
      if (!userId || typeof userId !== 'string') {
        throw Errors.create(
          Errors.Auth.INVALID_TOKEN,
          'User authentication required',
          OperationType.AUTHENTICATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }

      // Validate calculation type if provided
      if (calculation_type && !Object.values(FudCalculationType).includes(calculation_type)) {
        throw Errors.create(
          Errors.Validation.INVALID_FORMAT,
          'Invalid calculation type. Must be PROMISE_DATE or ACTION_DATE',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }

      const updateDto: UpdateFudConfigDto = {
        calculation_type,
        days_offset,
        is_active,
        priority,
        updatedBy: userId
      };

      // Remove undefined values
      Object.keys(updateDto).forEach(key => {
        if (updateDto[key as keyof UpdateFudConfigDto] === undefined) {
          delete updateDto[key as keyof UpdateFudConfigDto];
        }
      });

      const config = await this.repository.update(id, updateDto);
      
      logger.info({ configId: id }, 'FUD configuration updated successfully');
      
      return ResponseUtil.success(res, config, 'FUD configuration updated successfully');
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error updating FUD configuration');
      next(error);
    }
  }

  /**
   * Delete FUD configuration
   * @route DELETE /fud-auto-config/:id
   */
  async deleteConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.repository.delete(id);
      
      logger.info({ configId: id }, 'FUD configuration deleted successfully');
      
      return ResponseUtil.success(res, { deleted: true }, 'FUD configuration deleted successfully');
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error deleting FUD configuration');
      next(error);
    }
  }

  /**
   * Calculate FUD date based on configuration
   * @route POST /fud-auto-config/calculate
   */
  async calculateFudDate(req: Request, res: Response, next: NextFunction) {
    try {
      const { action_result_id, action_date, promise_date } = req.body;

      // Validate required fields
      if (!action_result_id || !action_date) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Missing required fields: action_result_id, action_date',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }

      const fudDate = await this.repository.calculateFudDate({
        action_result_id,
        action_date: new Date(action_date),
        promise_date: promise_date ? new Date(promise_date) : undefined
      });

      return ResponseUtil.success(res, {
        fud_date: fudDate,
        auto_calculated: fudDate !== null
      }, 'FUD date calculated successfully');
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error calculating FUD date');
      next(error);
    }
  }

  /**
   * Calculate FUD dates for multiple actions in bulk
   * @route POST /fud-auto-config/calculate-bulk
   */
  async calculateBulkFudDates(req: Request, res: Response, next: NextFunction) {
    try {
      const { calculations } = req.body;

      // Validate required fields
      if (!Array.isArray(calculations) || calculations.length === 0) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Missing required field: calculations array',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }

      // Validate each calculation request
      for (const calc of calculations) {
        if (!calc.action_result_id || !calc.action_date) {
          throw Errors.create(
            Errors.Validation.REQUIRED_FIELD_MISSING,
            'Each calculation must have action_result_id and action_date',
            OperationType.VALIDATION,
            SourceSystemType.WORKFLOW_SERVICE
          );
        }
      }

      // Calculate FUD for each request
      const results = await Promise.all(
        calculations.map(async (calc: any) => {
          try {
            const fudDate = await this.repository.calculateFudDate({
              action_result_id: calc.action_result_id,
              action_date: new Date(calc.action_date),
              promise_date: calc.promise_date ? new Date(calc.promise_date) : undefined
            });

            return {
              action_result_id: calc.action_result_id,
              fud_date: fudDate,
              auto_calculated: fudDate !== null,
              original_request: calc
            };
          } catch (error) {
            logger.error({ error, calc }, 'Error calculating FUD for individual request');
            return {
              action_result_id: calc.action_result_id,
              fud_date: null,
              auto_calculated: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              original_request: calc
            };
          }
        })
      );

      return ResponseUtil.success(res, {
        results,
        total_processed: calculations.length,
        successful: results.filter(r => r.fud_date !== null).length,
        failed: results.filter(r => r.fud_date === null).length
      }, 'Bulk FUD dates calculated successfully');
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error calculating bulk FUD dates');
      next(error);
    }
  }

  /**
   * Get configuration statistics
   * @route GET /fud-auto-config/stats
   */
  async getConfigStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await this.repository.getConfigurationStats();
      
      return ResponseUtil.success(res, stats, 'FUD configuration statistics retrieved successfully');
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting FUD configuration statistics');
      next(error);
    }
  }
}