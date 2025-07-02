import { Request, Response, NextFunction } from 'express';
import { PhoneTypesRepository } from '../repositories/phone-types.repository';
import { logger } from '../utils/logger';

export class PhoneTypesController {
  private phoneTypesRepository: PhoneTypesRepository;

  constructor() {
    this.phoneTypesRepository = new PhoneTypesRepository();
  }

  /**
   * Get all active phone types
   * GET /phone-types
   */
  getPhoneTypes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      logger.info('Getting phone types');

      const phoneTypes = await this.phoneTypesRepository.findActiveTypes();

      // Transform to match frontend ContactType interface
      const transformedTypes = phoneTypes.map(type => ({
        value: type.value,
        label: type.label,
        description: type.description || undefined
      }));

      res.status(200).json({
        success: true,
        data: transformedTypes,
        message: 'Phone types retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting phone types:', error instanceof Error ? error : new Error(String(error)));
      next(error);
    }
  };

  /**
   * Get phone type by value
   * GET /phone-types/:value
   */
  getPhoneTypeByValue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { value } = req.params;
      logger.info(`Getting phone type by value: ${value}`);

      const phoneType = await this.phoneTypesRepository.findByValue(value);

      if (!phoneType) {
        res.status(404).json({
          success: false,
          message: 'Phone type not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          value: phoneType.value,
          label: phoneType.label,
          description: phoneType.description || undefined
        },
        message: 'Phone type retrieved successfully'
      });
    } catch (error) {
      logger.error(`Error getting phone type by value ${req.params.value}:`, error instanceof Error ? error : new Error(String(error)));
      next(error);
    }
  };

  /**
   * Create new phone type
   * POST /phone-types
   */
  createPhoneType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { value, label, description, sort_order } = req.body;
      logger.info(`Creating phone type: ${value}`);

      const phoneType = await this.phoneTypesRepository.create({
        value,
        label,
        description,
        sort_order: sort_order || 0,
        created_by: req.user?.username || 'SYSTEM',
        updated_by: req.user?.username || 'SYSTEM'
      });

      res.status(201).json({
        success: true,
        data: {
          value: phoneType.value,
          label: phoneType.label,
          description: phoneType.description || undefined
        },
        message: 'Phone type created successfully'
      });
    } catch (error) {
      logger.error('Error creating phone type:', error instanceof Error ? error : new Error(String(error)));
      next(error);
    }
  };

  /**
   * Update phone type
   * PUT /phone-types/:id
   */
  updatePhoneType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { label, description, sort_order, is_active } = req.body;
      logger.info(`Updating phone type: ${id}`);

      const phoneType = await this.phoneTypesRepository.update(id, {
        label,
        description,
        sort_order,
        is_active,
        updated_by: req.user?.username || 'SYSTEM'
      });

      if (!phoneType) {
        res.status(404).json({
          success: false,
          message: 'Phone type not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          value: phoneType.value,
          label: phoneType.label,
          description: phoneType.description || undefined
        },
        message: 'Phone type updated successfully'
      });
    } catch (error) {
      logger.error(`Error updating phone type ${req.params.id}:`, error instanceof Error ? error : new Error(String(error)));
      next(error);
    }
  };

  /**
   * Deactivate phone type
   * DELETE /phone-types/:id
   */
  deactivatePhoneType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      logger.info(`Deactivating phone type: ${id}`);

      const success = await this.phoneTypesRepository.deactivate(id);

      if (!success) {
        res.status(404).json({
          success: false,
          message: 'Phone type not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Phone type deactivated successfully'
      });
    } catch (error) {
      logger.error(`Error deactivating phone type ${req.params.id}:`, error instanceof Error ? error : new Error(String(error)));
      next(error);
    }
  };
}