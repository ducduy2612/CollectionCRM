import { Request, Response, NextFunction } from 'express';
import { EmailRepository } from '../repositories/email.repository';
import { Email } from '../entities/email.entity';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';
import { ResponseUtil } from '../utils/response';
import { logger } from '../utils/logger';

/**
 * Email controller
 */
export class EmailController {
  /**
   * Get emails with optional filtering
   * @route GET /emails
   */
  async getEmails(req: Request, res: Response, next: NextFunction) {
    try {
      const { cif, address, isVerified, page = 1, pageSize = 10 } = req.query;
      
      const result = await EmailRepository.searchEmails({
        cif: cif as string,
        address: address as string,
        isVerified: isVerified === 'true' ? true : isVerified === 'false' ? false : undefined,
        page: Number(page),
        pageSize: Math.min(Number(pageSize), 100)
      });
      
      return ResponseUtil.success(
        res,
        {
          emails: result.items,
          pagination: result.pagination
        },
        'Emails retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting emails');
      next(error);
    }
  }

  /**
   * Get emails by CIF
   * @route GET /emails/by-cif/:cif
   */
  async getEmailsByCif(req: Request, res: Response, next: NextFunction) {
    try {
      const { cif } = req.params;
      
      const emails = await EmailRepository.findByCif(cif);
      
      return ResponseUtil.success(
        res,
        emails,
        'Emails retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting emails by CIF');
      next(error);
    }
  }

  /**
   * Get email by ID
   * @route GET /emails/:id
   */
  async getEmailById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const email = await EmailRepository.findOneBy({ id });
      
      if (!email) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Email with ID ${id} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      return ResponseUtil.success(
        res,
        email,
        'Email retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting email by ID');
      next(error);
    }
  }
  
  /**
   * Create a new email
   * @route POST /emails
   */
  async createEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { cif, address, isPrimary, isVerified, verificationDate } = req.body;
      
      // Validate required fields
      if (!cif || !address) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Missing required fields: cif, address',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(address)) {
        throw Errors.create(
          Errors.Validation.INVALID_FORMAT,
          'Invalid email address format',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      // Create email
      const email = await EmailRepository.createEmail({
        cif,
        address,
        isPrimary: isPrimary || false,
        isVerified: isVerified || false,
        verificationDate: verificationDate ? new Date(verificationDate) : null,
        createdBy: req.user?.userId || 'system',
        updatedBy: req.user?.userId || 'system'
      });
      
      logger.info({ emailId: email.id, cif }, 'Email created successfully');
      
      return ResponseUtil.success(
        res,
        email,
        'Email created successfully',
        201
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error creating email');
      next(error);
    }
  }
  
  /**
   * Update an existing email
   * @route PUT /emails/:id
   */
  async updateEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { address, isPrimary, isVerified, verificationDate } = req.body;
      
      // Basic email validation if address is being updated
      if (address) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(address)) {
          throw Errors.create(
            Errors.Validation.INVALID_FORMAT,
            'Invalid email address format',
            OperationType.VALIDATION,
            SourceSystemType.WORKFLOW_SERVICE
          );
        }
      }
      
      // Update email
      const updatedEmail = await EmailRepository.updateEmail(id, {
        address,
        isPrimary,
        isVerified,
        verificationDate: verificationDate ? new Date(verificationDate) : undefined,
        updatedBy: req.user?.userId || 'system'
      });
      
      logger.info({ emailId: id }, 'Email updated successfully');
      
      return ResponseUtil.success(
        res,
        updatedEmail,
        'Email updated successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error updating email');
      next(error);
    }
  }
  
  /**
   * Delete an email
   * @route DELETE /emails/:id
   */
  async deleteEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const deleted = await EmailRepository.deleteEmail(id);
      
      if (!deleted) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Email with ID ${id} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      logger.info({ emailId: id }, 'Email deleted successfully');
      
      return ResponseUtil.success(
        res,
        { deleted: true },
        'Email deleted successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error deleting email');
      next(error);
    }
  }
}