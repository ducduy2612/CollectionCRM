import { Request, Response, NextFunction } from 'express';
import { PhoneRepository } from '../repositories/phone.repository';
import { AddressRepository } from '../repositories/address.repository';
import { EmailRepository } from '../repositories/email.repository';
import { Phone } from '../entities/phone.entity';
import { Address } from '../entities/address.entity';
import { Email } from '../entities/email.entity';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';
import { ResponseUtil } from '../utils/response';
import { logger } from '../utils/logger';

/**
 * Customer Contact controller - handles phones, addresses, and emails
 */
export class CustomerContactController {
  // =============================================
  // PHONE ENDPOINTS
  // =============================================

  /**
   * Get phones by CIF
   * @route GET /customers/:cif/phones
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
   * Create a new phone for customer
   * @route POST /customers/:cif/phones
   */
  async createPhone(req: Request, res: Response, next: NextFunction) {
    try {
      const { cif } = req.params;
      const { type, number, isPrimary, isVerified, verificationDate } = req.body;
      
      // Validate required fields
      if (!type || !number) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Missing required fields: type, number',
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
        createdBy: req.user?.username || 'system',
        updatedBy: req.user?.username || 'system'
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
   * Update a phone
   * @route PUT /customers/:cif/phones/:phoneId
   */
  async updatePhone(req: Request, res: Response, next: NextFunction) {
    try {
      const { phoneId } = req.params;
      const { type, number, isPrimary, isVerified, verificationDate } = req.body;
      
      // Update phone
      const updatedPhone = await PhoneRepository.updatePhone(phoneId, {
        type,
        number,
        isPrimary,
        isVerified,
        verificationDate: verificationDate ? new Date(verificationDate) : undefined,
        updatedBy: req.user?.username || 'system'
      });
      
      logger.info({ phoneId }, 'Phone updated successfully');
      
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
   * @route DELETE /customers/:cif/phones/:phoneId
   */
  async deletePhone(req: Request, res: Response, next: NextFunction) {
    try {
      const { phoneId } = req.params;
      
      const deleted = await PhoneRepository.deletePhone(phoneId);
      
      if (!deleted) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Phone with ID ${phoneId} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      logger.info({ phoneId }, 'Phone deleted successfully');
      
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

  // =============================================
  // ADDRESS ENDPOINTS
  // =============================================

  /**
   * Get addresses by CIF
   * @route GET /customers/:cif/addresses
   */
  async getAddressesByCif(req: Request, res: Response, next: NextFunction) {
    try {
      const { cif } = req.params;
      
      const addresses = await AddressRepository.findByCif(cif);
      
      return ResponseUtil.success(
        res,
        addresses,
        'Addresses retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting addresses by CIF');
      next(error);
    }
  }

  /**
   * Create a new address for customer
   * @route POST /customers/:cif/addresses
   */
  async createAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const { cif } = req.params;
      const { 
        type, 
        addressLine1, 
        addressLine2, 
        city, 
        state, 
        district, 
        country, 
        isPrimary, 
        isVerified, 
        verificationDate 
      } = req.body;
      
      // Validate required fields
      if (!type || !addressLine1 || !city || !state || !district || !country) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Missing required fields: type, addressLine1, city, state, district, country',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      // Create address
      const address = await AddressRepository.createAddress({
        cif,
        type,
        addressLine1,
        addressLine2,
        city,
        state,
        district,
        country,
        isPrimary: isPrimary || false,
        isVerified: isVerified || false,
        verificationDate: verificationDate ? new Date(verificationDate) : null,
        createdBy: req.user?.username || 'system',
        updatedBy: req.user?.username || 'system'
      });
      
      logger.info({ addressId: address.id, cif }, 'Address created successfully');
      
      return ResponseUtil.success(
        res,
        address,
        'Address created successfully',
        201
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error creating address');
      next(error);
    }
  }

  /**
   * Update an address
   * @route PUT /customers/:cif/addresses/:addressId
   */
  async updateAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const { addressId } = req.params;
      const { 
        type, 
        addressLine1, 
        addressLine2, 
        city, 
        state, 
        district, 
        country, 
        isPrimary, 
        isVerified, 
        verificationDate 
      } = req.body;
      
      // Update address
      const updatedAddress = await AddressRepository.updateAddress(addressId, {
        type,
        addressLine1,
        addressLine2,
        city,
        state,
        district,
        country,
        isPrimary,
        isVerified,
        verificationDate: verificationDate ? new Date(verificationDate) : undefined,
        updatedBy: req.user?.username || 'system'
      });
      
      logger.info({ addressId }, 'Address updated successfully');
      
      return ResponseUtil.success(
        res,
        updatedAddress,
        'Address updated successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error updating address');
      next(error);
    }
  }

  /**
   * Delete an address
   * @route DELETE /customers/:cif/addresses/:addressId
   */
  async deleteAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const { addressId } = req.params;
      
      const deleted = await AddressRepository.deleteAddress(addressId);
      
      if (!deleted) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Address with ID ${addressId} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      logger.info({ addressId }, 'Address deleted successfully');
      
      return ResponseUtil.success(
        res,
        { deleted: true },
        'Address deleted successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error deleting address');
      next(error);
    }
  }

  // =============================================
  // EMAIL ENDPOINTS
  // =============================================

  /**
   * Get emails by CIF
   * @route GET /customers/:cif/emails
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
   * Create a new email for customer
   * @route POST /customers/:cif/emails
   */
  async createEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { cif } = req.params;
      const { address, isPrimary, isVerified, verificationDate } = req.body;
      
      // Validate required fields
      if (!address) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Missing required field: address',
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
        createdBy: req.user?.username || 'system',
        updatedBy: req.user?.username || 'system'
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
   * Update an email
   * @route PUT /customers/:cif/emails/:emailId
   */
  async updateEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { emailId } = req.params;
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
      const updatedEmail = await EmailRepository.updateEmail(emailId, {
        address,
        isPrimary,
        isVerified,
        verificationDate: verificationDate ? new Date(verificationDate) : undefined,
        updatedBy: req.user?.username || 'system'
      });
      
      logger.info({ emailId }, 'Email updated successfully');
      
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
   * @route DELETE /customers/:cif/emails/:emailId
   */
  async deleteEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { emailId } = req.params;
      
      const deleted = await EmailRepository.deleteEmail(emailId);
      
      if (!deleted) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Email with ID ${emailId} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      logger.info({ emailId }, 'Email deleted successfully');
      
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

  // =============================================
  // CONSOLIDATED ENDPOINTS
  // =============================================

  /**
   * Get all contact information for a customer
   * @route GET /customers/:cif/contacts
   */
  async getAllContactsByCif(req: Request, res: Response, next: NextFunction) {
    try {
      const { cif } = req.params;
      
      const [phones, addresses, emails] = await Promise.all([
        PhoneRepository.findByCif(cif),
        AddressRepository.findByCif(cif),
        EmailRepository.findByCif(cif)
      ]);
      
      return ResponseUtil.success(
        res,
        {
          phones,
          addresses,
          emails
        },
        'All contact information retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting all contacts by CIF');
      next(error);
    }
  }
}