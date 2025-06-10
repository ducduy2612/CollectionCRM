import { Request, Response, NextFunction } from 'express';
import { PhoneRepository } from '../repositories/phone.repository';
import { Phone } from '../entities/phone.entity';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';
import { ResponseUtil } from '../utils/response';
import { logger } from '../utils/logger';

/**
 * Phone controller
 */
export class PhoneController {
  /**
   * Get phones with optional filtering
   * @route GET /phones
   */
  async getPhones(req: Request, res: Response, next: NextFunction) {
    try {
      const { cif, type, isVerified, page = 1, pageSize = 10 } = req.query;
      
      const result = await PhoneRepository.searchPhones({
        cif: cif as string,
        type: type as string,
        isVerified: isVerified === 'true' ? true : isVerified === 'false' ? false : undefined,
        page: Number(page),
        pageSize: Math.min(Number(pageSize), 100)
      });
      
      return ResponseUtil.success(
        res,
        {
          phones: result.items,
          pagination: result.pagination
        },
        'Phones retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting phones');
      next(error);
    }
  }

  /**
   * Get phones by CIF
   * @route GET /phones/by-cif/:cif
   */
  async getPhonesByCif(req: Request, res: Response, next: NextFunction) {
    try {
      const { cif } = req.params;
      
      const phones = await PhoneRepository.findByCif(cif);
      
      return ResponseUtil.success(
        res,
        phones,
        'Phones retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting phones by CIF');
      next(error);
    }
  }

  /**
   * Get phone by ID
   * @route GET /phones/:id
   */
  async getPhoneById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const phone = await PhoneRepository.findOneBy({ id });
      
      if (!phone) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Phone with ID ${id} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      return ResponseUtil.success(
        res,
        phone,
        'Phone retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting phone by ID');
      next(error);
    }
  }
  
  /**
   * Create a new phone
   * @route POST /phones
   */
  async createPhone(req: Request, res: Response, next: NextFunction) {
    try {
      const { cif, type, number, isPrimary, isVerified, verificationDate } = req.body;
      
      // Validate required fields
      if (!cif || !type || !number) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Missing required fields: cif, type, number',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      // Create phone
      const phone = await PhoneRepository.createPhone({
        cif,
        type,
        number,
        isPrimary: isPrimary || false,
        isVerified: isVerified || false,
        verificationDate: verificationDate ? new Date(verificationDate) : null,
        createdBy: req.user?.userId || 'system',
        updatedBy: req.user?.userId || 'system'
      });
      
      logger.info({ phoneId: phone.id, cif }, 'Phone created successfully');
      
      return ResponseUtil.success(
        res,
        phone,
        'Phone created successfully',
        201
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error creating phone');
      next(error);
    }
  }
  
  /**
   * Update an existing phone
   * @route PUT /phones/:id
   */
  async updatePhone(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { type, number, isPrimary, isVerified, verificationDate } = req.body;
      
      // Update phone
      const updatedPhone = await PhoneRepository.updatePhone(id, {
        type,
        number,
        isPrimary,
        isVerified,
        verificationDate: verificationDate ? new Date(verificationDate) : undefined,
        updatedBy: req.user?.userId || 'system'
      });
      
      logger.info({ phoneId: id }, 'Phone updated successfully');
      
      return ResponseUtil.success(
        res,
        updatedPhone,
        'Phone updated successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error updating phone');
      next(error);
    }
  }
  
  /**
   * Delete a phone
   * @route DELETE /phones/:id
   */
  async deletePhone(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const deleted = await PhoneRepository.deletePhone(id);
      
      if (!deleted) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Phone with ID ${id} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      logger.info({ phoneId: id }, 'Phone deleted successfully');
      
      return ResponseUtil.success(
        res,
        { deleted: true },
        'Phone deleted successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error deleting phone');
      next(error);
    }
  }
}