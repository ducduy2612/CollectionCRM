import { Request, Response, NextFunction } from 'express';
import { AddressTypesRepository } from '../repositories/address-types.repository';
import { logger } from '../utils/logger';

export class AddressTypesController {
  private addressTypesRepository: AddressTypesRepository;

  constructor() {
    this.addressTypesRepository = new AddressTypesRepository();
  }

  /**
   * Get all active address types
   * GET /address-types
   */
  getAddressTypes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      logger.info('Getting address types');

      const addressTypes = await this.addressTypesRepository.findActiveTypes();

      // Transform to match frontend ContactType interface
      const transformedTypes = addressTypes.map(type => ({
        value: type.value,
        label: type.label,
        description: type.description || undefined
      }));

      res.status(200).json({
        success: true,
        data: transformedTypes,
        message: 'Address types retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting address types:', error instanceof Error ? error : new Error(String(error)));
      next(error);
    }
  };

  /**
   * Get address type by value
   * GET /address-types/:value
   */
  getAddressTypeByValue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { value } = req.params;
      logger.info(`Getting address type by value: ${value}`);

      const addressType = await this.addressTypesRepository.findByValue(value);

      if (!addressType) {
        res.status(404).json({
          success: false,
          message: 'Address type not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          value: addressType.value,
          label: addressType.label,
          description: addressType.description || undefined
        },
        message: 'Address type retrieved successfully'
      });
    } catch (error) {
      logger.error(`Error getting address type by value ${req.params.value}:`, error instanceof Error ? error : new Error(String(error)));
      next(error);
    }
  };

  /**
   * Create new address type
   * POST /address-types
   */
  createAddressType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { value, label, description, sort_order } = req.body;
      logger.info(`Creating address type: ${value}`);

      const addressType = await this.addressTypesRepository.create({
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
          value: addressType.value,
          label: addressType.label,
          description: addressType.description || undefined
        },
        message: 'Address type created successfully'
      });
    } catch (error) {
      logger.error('Error creating address type:', error instanceof Error ? error : new Error(String(error)));
      next(error);
    }
  };

  /**
   * Update address type
   * PUT /address-types/:id
   */
  updateAddressType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { label, description, sort_order, is_active } = req.body;
      logger.info(`Updating address type: ${id}`);

      const addressType = await this.addressTypesRepository.update(id, {
        label,
        description,
        sort_order,
        is_active,
        updated_by: req.user?.username || 'SYSTEM'
      });

      if (!addressType) {
        res.status(404).json({
          success: false,
          message: 'Address type not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          value: addressType.value,
          label: addressType.label,
          description: addressType.description || undefined
        },
        message: 'Address type updated successfully'
      });
    } catch (error) {
      logger.error(`Error updating address type ${req.params.id}:`, error instanceof Error ? error : new Error(String(error)));
      next(error);
    }
  };

  /**
   * Deactivate address type
   * DELETE /address-types/:id
   */
  deactivateAddressType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      logger.info(`Deactivating address type: ${id}`);

      const success = await this.addressTypesRepository.deactivate(id);

      if (!success) {
        res.status(404).json({
          success: false,
          message: 'Address type not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Address type deactivated successfully'
      });
    } catch (error) {
      logger.error(`Error deactivating address type ${req.params.id}:`, error instanceof Error ? error : new Error(String(error)));
      next(error);
    }
  };
}