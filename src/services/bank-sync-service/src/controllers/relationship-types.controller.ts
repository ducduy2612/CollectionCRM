import { Request, Response, NextFunction } from 'express';
import { RelationshipTypesRepository } from '../repositories/relationship-types.repository';
import { logger } from '../utils/logger';

export class RelationshipTypesController {
  private relationshipTypesRepository: RelationshipTypesRepository;

  constructor() {
    this.relationshipTypesRepository = new RelationshipTypesRepository();
  }

  /**
   * Get all active relationship types
   * GET /relationship-types
   */
  getRelationshipTypes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      logger.info('Getting relationship types');

      const relationshipTypes = await this.relationshipTypesRepository.findActiveTypes();

      // Transform to match frontend ContactType interface
      const transformedTypes = relationshipTypes.map(type => ({
        value: type.value,
        label: type.label,
        description: type.description || undefined
      }));

      res.status(200).json({
        success: true,
        data: transformedTypes,
        message: 'Relationship types retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting relationship types:', error instanceof Error ? error : new Error(String(error)));
      next(error);
    }
  };

  /**
   * Get relationship type by value
   * GET /relationship-types/:value
   */
  getRelationshipTypeByValue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { value } = req.params;
      logger.info(`Getting relationship type by value: ${value}`);

      const relationshipType = await this.relationshipTypesRepository.findByValue(value);

      if (!relationshipType) {
        res.status(404).json({
          success: false,
          message: 'Relationship type not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          value: relationshipType.value,
          label: relationshipType.label,
          description: relationshipType.description || undefined
        },
        message: 'Relationship type retrieved successfully'
      });
    } catch (error) {
      logger.error(`Error getting relationship type by value ${req.params.value}:`, error instanceof Error ? error : new Error(String(error)));
      next(error);
    }
  };

  /**
   * Create new relationship type
   * POST /relationship-types
   */
  createRelationshipType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { value, label, description, sort_order } = req.body;
      logger.info(`Creating relationship type: ${value}`);

      const relationshipType = await this.relationshipTypesRepository.create({
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
          value: relationshipType.value,
          label: relationshipType.label,
          description: relationshipType.description || undefined
        },
        message: 'Relationship type created successfully'
      });
    } catch (error) {
      logger.error('Error creating relationship type:', error instanceof Error ? error : new Error(String(error)));
      next(error);
    }
  };

  /**
   * Update relationship type
   * PUT /relationship-types/:id
   */
  updateRelationshipType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { label, description, sort_order, is_active } = req.body;
      logger.info(`Updating relationship type: ${id}`);

      const relationshipType = await this.relationshipTypesRepository.update(id, {
        label,
        description,
        sort_order,
        is_active,
        updated_by: req.user?.username || 'SYSTEM'
      });

      if (!relationshipType) {
        res.status(404).json({
          success: false,
          message: 'Relationship type not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          value: relationshipType.value,
          label: relationshipType.label,
          description: relationshipType.description || undefined
        },
        message: 'Relationship type updated successfully'
      });
    } catch (error) {
      logger.error(`Error updating relationship type ${req.params.id}:`, error instanceof Error ? error : new Error(String(error)));
      next(error);
    }
  };

  /**
   * Deactivate relationship type
   * DELETE /relationship-types/:id
   */
  deactivateRelationshipType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      logger.info(`Deactivating relationship type: ${id}`);

      const success = await this.relationshipTypesRepository.deactivate(id);

      if (!success) {
        res.status(404).json({
          success: false,
          message: 'Relationship type not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Relationship type deactivated successfully'
      });
    } catch (error) {
      logger.error(`Error deactivating relationship type ${req.params.id}:`, error instanceof Error ? error : new Error(String(error)));
      next(error);
    }
  };
}