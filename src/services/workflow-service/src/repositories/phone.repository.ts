import { Phone } from '../entities/phone.entity';
import { AppDataSource } from '../config/data-source';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';
import { ResponseUtil, PaginatedResponse } from '../utils/response';
import { IsNull } from 'typeorm';

/**
 * Search criteria for phones
 */
export interface PhoneSearchCriteria {
  cif?: string;
  type?: string;
  isVerified?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * Repository for Phone entity
 */
export const PhoneRepository = AppDataSource.getRepository(Phone).extend({
  /**
   * Find phones by CIF
   * @param cif Customer CIF
   * @returns Array of phones for the customer
   */
  async findByCif(cif: string): Promise<Phone[]> {
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
   * Find phones by CIF for primary customer only (refCif is null)
   * @param cif Customer CIF
   * @returns Array of phones for the primary customer only
   */
  async findByCifPrimaryOnly(cif: string): Promise<Phone[]> {
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
   * Find phones by reference CIF
   * @param primaryCif Primary customer CIF
   * @param refCif Reference customer CIF
   * @returns Array of phones for the reference customer
   */
  async findByRefCif(primaryCif: string, refCif: string): Promise<Phone[]> {
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
   * Search phones based on criteria
   * @param criteria Search criteria
   * @returns Paginated result of phones
   */
  async searchPhones(criteria: PhoneSearchCriteria): Promise<PaginatedResponse<Phone>> {
    try {
      const queryBuilder = this.createQueryBuilder('phone');
      
      // Apply filters
      if (criteria.cif) {
        queryBuilder.andWhere('phone.cif = :cif', { cif: criteria.cif });
      }
      
      if (criteria.type) {
        queryBuilder.andWhere('phone.type = :type', { type: criteria.type });
      }
      
      if (criteria.isVerified !== undefined) {
        queryBuilder.andWhere('phone.is_verified = :isVerified', { isVerified: criteria.isVerified });
      }
      
      // Get total count
      const total = await queryBuilder.getCount();
      
      // Apply pagination
      const page = criteria.page || 1;
      const pageSize = criteria.pageSize || 10;
      
      queryBuilder
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy('phone.created_at', 'DESC');
      
      // Get paginated results
      const phones = await queryBuilder.getMany();
      
      return ResponseUtil.paginate(phones, total, page, pageSize);
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { criteria, operation: 'searchPhones' }
      );
    }
  },

  /**
   * Create a new phone
   * @param phone Phone data
   * @returns The created phone
   */
  async createPhone(phone: Partial<Phone>): Promise<Phone> {
    try {
      // Check for duplicate phone before creating
      if (phone.cif && phone.type) {
        const existingPhone = await this.findOne({
          where: {
            cif: phone.cif,
            refCif: phone.refCif || IsNull(),
            type: phone.type
          }
        });
        
        if (existingPhone) {
          throw Errors.create(
            Errors.Database.DUPLICATE_RECORD,
            `Phone with type ${phone.type} already exists for this ${phone.refCif ? 'reference customer' : 'customer'}`,
            OperationType.DATABASE,
            SourceSystemType.WORKFLOW_SERVICE
          );
        }
      }
      
      // If this is set as primary, unset other primary phones for the same CIF
      if (phone.isPrimary && phone.cif) {
        await this.update(
          { cif: phone.cif, isPrimary: true },
          { isPrimary: false }
        );
      }
      
      const newPhone = this.create(phone);
      return await this.save(newPhone);
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { phone, operation: 'createPhone' }
      );
    }
  },

  /**
   * Update an existing phone
   * @param id Phone ID
   * @param phoneData Updated phone data
   * @returns The updated phone
   */
  async updatePhone(id: string, phoneData: Partial<Phone>): Promise<Phone> {
    try {
      const phone = await this.findOneBy({ id });
      
      if (!phone) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Phone with ID ${id} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      // If this is set as primary, unset other primary phones for the same CIF
      if (phoneData.isPrimary && phone.cif) {
        await this.update(
          { cif: phone.cif, isPrimary: true },
          { isPrimary: false }
        );
      }
      
      // Update phone properties
      Object.assign(phone, phoneData);
      
      return await this.save(phone);
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { id, phoneData, operation: 'updatePhone' }
      );
    }
  },

  /**
   * Delete a phone
   * @param id Phone ID
   * @returns True if deleted successfully
   */
  async deletePhone(id: string): Promise<boolean> {
    try {
      const result = await this.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { id, operation: 'deletePhone' }
      );
    }
  }
});