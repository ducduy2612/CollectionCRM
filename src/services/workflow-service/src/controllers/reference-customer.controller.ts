import { Request, Response, NextFunction } from 'express';
import { ReferenceCustomerRepository } from '../repositories/reference-customer.repository';
import { ReferenceCustomer, CustomerType } from '../entities/reference-customer.entity';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';
import { ResponseUtil } from '../utils/response';
import { logger } from '../utils/logger';

/**
 * Reference Customer controller
 */
export class ReferenceCustomerController {
  /**
   * Get reference customers with optional filtering
   * @route GET /reference-customers
   */
  async getReferenceCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const { primaryCif, relationshipType, type, name, page = 1, pageSize = 10 } = req.query;
      
      const result = await ReferenceCustomerRepository.searchReferenceCustomers({
        primaryCif: primaryCif as string,
        relationshipType: relationshipType as string,
        type: type as CustomerType,
        name: name as string,
        page: Number(page),
        pageSize: Math.min(Number(pageSize), 100)
      });
      
      return ResponseUtil.success(
        res,
        {
          referenceCustomers: result.items,
          pagination: result.pagination
        },
        'Reference customers retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting reference customers');
      next(error);
    }
  }

  /**
   * Get reference customers by primary CIF
   * @route GET /reference-customers/by-primary-cif/:primaryCif
   */
  async getReferenceCustomersByPrimaryCif(req: Request, res: Response, next: NextFunction) {
    try {
      const { primaryCif } = req.params;
      
      const referenceCustomers = await ReferenceCustomerRepository.findByPrimaryCif(primaryCif);
      
      return ResponseUtil.success(
        res,
        referenceCustomers,
        'Reference customers retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting reference customers by primary CIF');
      next(error);
    }
  }

  /**
   * Get reference customers by primary CIF with contact information
   * @route GET /reference-customers/by-primary-cif/:primaryCif/with-contacts
   */
  async getReferenceCustomersByPrimaryCifWithContacts(req: Request, res: Response, next: NextFunction) {
    try {
      const { primaryCif } = req.params;
      
      const referenceCustomers = await ReferenceCustomerRepository.findByPrimaryCifWithContacts(primaryCif);
      
      return ResponseUtil.success(
        res,
        referenceCustomers,
        'Reference customers with contacts retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting reference customers with contacts by primary CIF');
      next(error);
    }
  }

  /**
   * Get reference customer by ID
   * @route GET /reference-customers/:id
   */
  async getReferenceCustomerById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const referenceCustomer = await ReferenceCustomerRepository.findOneBy({ id });
      
      if (!referenceCustomer) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Reference customer with ID ${id} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      return ResponseUtil.success(
        res,
        referenceCustomer,
        'Reference customer retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting reference customer by ID');
      next(error);
    }
  }

  /**
   * Get reference customer by ID with contact information
   * @route GET /reference-customers/:id/with-contacts
   */
  async getReferenceCustomerByIdWithContacts(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const referenceCustomer = await ReferenceCustomerRepository.findByIdWithContacts(id);
      
      if (!referenceCustomer) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Reference customer with ID ${id} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      return ResponseUtil.success(
        res,
        referenceCustomer,
        'Reference customer with contacts retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting reference customer with contacts by ID');
      next(error);
    }
  }
  
  /**
   * Generate a unique reference CIF (20 characters)
   * Format: REF + 17 random alphanumeric characters
   * @returns A unique reference CIF string
   */
  private static async generateUniqueCif(): Promise<string> {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let attempt = 0;
    
    while (attempt < 50) {
      // Generate 17 random characters after "REF" prefix
      let randomSuffix = '';
      for (let i = 0; i < 17; i++) {
        randomSuffix += charset.charAt(Math.floor(Math.random() * charset.length));
      }
      
      const generatedCif = `REF${randomSuffix}`;
      
      // Check if CIF already exists
      const existing = await ReferenceCustomerRepository.findOneBy({ refCif: generatedCif });
      if (!existing) {
        return generatedCif;
      }
      
      attempt++;
    }
    
    throw Errors.create(
      Errors.Database.QUERY_ERROR,
      'Failed to generate unique reference CIF after multiple attempts',
      OperationType.DATABASE,
      SourceSystemType.WORKFLOW_SERVICE
    );
  }

  /**
   * Create a new reference customer
   * @route POST /reference-customers
   */
  async createReferenceCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const { 
        primaryCif, 
        relationshipType, 
        type, 
        name, 
        dateOfBirth, 
        nationalId, 
        gender, 
        companyName, 
        registrationNumber, 
        taxId 
      } = req.body;
      
      // Validate required fields (refCif is now auto-generated)
      if (!primaryCif || !relationshipType || !type) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Missing required fields: primaryCif, relationshipType, type',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }

      // Generate unique reference CIF
      const refCif = await ReferenceCustomerController.generateUniqueCif();

      // Validate customer type specific fields
      if (type === CustomerType.INDIVIDUAL && !name) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Name is required for individual customers',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }

      if (type === CustomerType.CORPORATE && !companyName) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Company name is required for corporate customers',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      // Create reference customer
      const referenceCustomer = await ReferenceCustomerRepository.createReferenceCustomer({
        refCif,
        primaryCif,
        relationshipType,
        type,
        name,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        nationalId,
        gender,
        companyName,
        registrationNumber,
        taxId,
        createdBy: req.user?.username || 'system',
        updatedBy: req.user?.username || 'system'
      });
      
      logger.info({ referenceCustomerId: referenceCustomer.id, primaryCif, refCif }, 'Reference customer created successfully');
      
      return ResponseUtil.success(
        res,
        referenceCustomer,
        'Reference customer created successfully',
        201
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error creating reference customer');
      next(error);
    }
  }
  
  /**
   * Update an existing reference customer
   * @route PUT /reference-customers/:id
   */
  async updateReferenceCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { 
        relationshipType, 
        type, 
        name, 
        dateOfBirth, 
        nationalId, 
        gender, 
        companyName, 
        registrationNumber, 
        taxId 
      } = req.body;
      
      // Update reference customer
      const updatedReferenceCustomer = await ReferenceCustomerRepository.updateReferenceCustomer(id, {
        relationshipType,
        type,
        name,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        nationalId,
        gender,
        companyName,
        registrationNumber,
        taxId,
        updatedBy: req.user?.username || 'system'
      });
      
      logger.info({ referenceCustomerId: id }, 'Reference customer updated successfully');
      
      return ResponseUtil.success(
        res,
        updatedReferenceCustomer,
        'Reference customer updated successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error updating reference customer');
      next(error);
    }
  }
  
  /**
   * Delete a reference customer
   * @route DELETE /reference-customers/:id
   */
  async deleteReferenceCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const deleted = await ReferenceCustomerRepository.deleteReferenceCustomer(id);
      
      if (!deleted) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Reference customer with ID ${id} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      logger.info({ referenceCustomerId: id }, 'Reference customer deleted successfully');
      
      return ResponseUtil.success(
        res,
        { deleted: true },
        'Reference customer deleted successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error deleting reference customer');
      next(error);
    }
  }
}