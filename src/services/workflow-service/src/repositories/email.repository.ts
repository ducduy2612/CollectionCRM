import { Email } from '../entities/email.entity';
import { AppDataSource } from '../config/data-source';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';
import { ResponseUtil, PaginatedResponse } from '../utils/response';
import { IsNull } from 'typeorm';

/**
 * Search criteria for emails
 */
export interface EmailSearchCriteria {
  cif?: string;
  address?: string;
  isVerified?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * Repository for Email entity
 */
export const EmailRepository = AppDataSource.getRepository(Email).extend({
  /**
   * Find emails by CIF
   * @param cif Customer CIF
   * @returns Array of emails for the customer
   */
  async findByCif(cif: string): Promise<Email[]> {
    try {
      return await this.findBy({ cif });
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { cif, operation: 'findByCif' }
      );
    }
  },

  /**
   * Find emails by CIF for primary customer only (refCif is null)
   * @param cif Customer CIF
   * @returns Array of emails for the primary customer only
   */
  async findByCifPrimaryOnly(cif: string): Promise<Email[]> {
    try {
      return await this.find({ 
        where: { 
          cif,
          refCif: IsNull() 
        } 
      });
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { cif, operation: 'findByCifPrimaryOnly' }
      );
    }
  },

  /**
   * Find emails by reference CIF
   * @param primaryCif Primary customer CIF
   * @param refCif Reference customer CIF
   * @returns Array of emails for the reference customer
   */
  async findByRefCif(primaryCif: string, refCif: string): Promise<Email[]> {
    try {
      return await this.findBy({ cif: primaryCif, refCif });
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { primaryCif, refCif, operation: 'findByRefCif' }
      );
    }
  },

  /**
   * Search emails based on criteria
   * @param criteria Search criteria
   * @returns Paginated result of emails
   */
  async searchEmails(criteria: EmailSearchCriteria): Promise<PaginatedResponse<Email>> {
    try {
      const queryBuilder = this.createQueryBuilder('email');
      
      // Apply filters
      if (criteria.cif) {
        queryBuilder.andWhere('email.cif = :cif', { cif: criteria.cif });
      }
      
      if (criteria.address) {
        queryBuilder.andWhere('email.address ILIKE :address', { address: `%${criteria.address}%` });
      }
      
      if (criteria.isVerified !== undefined) {
        queryBuilder.andWhere('email.is_verified = :isVerified', { isVerified: criteria.isVerified });
      }
      
      // Get total count
      const total = await queryBuilder.getCount();
      
      // Apply pagination
      const page = criteria.page || 1;
      const pageSize = criteria.pageSize || 10;
      
      queryBuilder
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy('email.created_at', 'DESC');
      
      // Get paginated results
      const emails = await queryBuilder.getMany();
      
      return ResponseUtil.paginate(emails, total, page, pageSize);
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { criteria, operation: 'searchEmails' }
      );
    }
  },

  /**
   * Create a new email
   * @param email Email data
   * @returns The created email
   */
  async createEmail(email: Partial<Email>): Promise<Email> {
    try {
      // Check for duplicate email before creating
      if (email.cif && email.address) {
        const existingEmail = await this.findOne({
          where: {
            cif: email.cif,
            refCif: email.refCif || IsNull(),
            address: email.address
          }
        });
        
        if (existingEmail) {
          throw Errors.create(
            Errors.Database.DUPLICATE_RECORD,
            `Email address ${email.address} already exists for this ${email.refCif ? 'reference customer' : 'customer'}`,
            OperationType.DATABASE,
            SourceSystemType.WORKFLOW_SERVICE
          );
        }
      }
      
      // If this is set as primary, unset other primary emails for the same CIF
      if (email.isPrimary && email.cif) {
        await this.update(
          { cif: email.cif, isPrimary: true },
          { isPrimary: false }
        );
      }
      
      const newEmail = this.create(email);
      return await this.save(newEmail);
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { email, operation: 'createEmail' }
      );
    }
  },

  /**
   * Update an existing email
   * @param id Email ID
   * @param emailData Updated email data
   * @returns The updated email
   */
  async updateEmail(id: string, emailData: Partial<Email>): Promise<Email> {
    try {
      const email = await this.findOneBy({ id });
      
      if (!email) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Email with ID ${id} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      // If this is set as primary, unset other primary emails for the same CIF
      if (emailData.isPrimary && email.cif) {
        await this.update(
          { cif: email.cif, isPrimary: true },
          { isPrimary: false }
        );
      }
      
      // Update email properties
      Object.assign(email, emailData);
      
      return await this.save(email);
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { id, emailData, operation: 'updateEmail' }
      );
    }
  },

  /**
   * Delete an email
   * @param id Email ID
   * @returns True if deleted successfully
   */
  async deleteEmail(id: string): Promise<boolean> {
    try {
      const result = await this.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { id, operation: 'deleteEmail' }
      );
    }
  }
});