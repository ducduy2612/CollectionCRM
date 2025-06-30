import { ReferenceCustomer, CustomerType } from '../entities/reference-customer.entity';
import { AppDataSource } from '../config/data-source';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';
import { ResponseUtil, PaginatedResponse } from '../utils/response';

/**
 * Search criteria for reference customers
 */
export interface ReferenceCustomerSearchCriteria {
  primaryCif?: string;
  relationshipType?: string;
  type?: CustomerType;
  name?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Repository for ReferenceCustomer entity
 */
export const ReferenceCustomerRepository = AppDataSource.getRepository(ReferenceCustomer).extend({
  /**
   * Find reference customers by primary CIF with contact information
   * @param primaryCif Primary customer CIF
   * @returns Array of reference customers with their contact information
   */
  async findByPrimaryCifWithContacts(primaryCif: string): Promise<ReferenceCustomer[]> {
    try {
      return await this.find({
        where: { primaryCif },
        relations: ['phones', 'addresses', 'emails'],
        order: { createdAt: 'DESC' }
      });
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { primaryCif, operation: 'findByPrimaryCifWithContacts' }
      );
    }
  },

  /**
   * Find reference customers by primary CIF
   * @param primaryCif Primary customer CIF
   * @returns Array of reference customers for the primary customer
   */
  async findByPrimaryCif(primaryCif: string): Promise<ReferenceCustomer[]> {
    try {
      return await this.findBy({ primaryCif });
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { primaryCif, operation: 'findByPrimaryCif' }
      );
    }
  },

  /**
   * Find reference customer by ID with contact information
   * @param id Reference customer ID
   * @returns Reference customer with contact information
   */
  async findByIdWithContacts(id: string): Promise<ReferenceCustomer | null> {
    try {
      return await this.findOne({
        where: { id },
        relations: ['phones', 'addresses', 'emails']
      });
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { id, operation: 'findByIdWithContacts' }
      );
    }
  },

  /**
   * Search reference customers based on criteria
   * @param criteria Search criteria
   * @returns Paginated result of reference customers
   */
  async searchReferenceCustomers(criteria: ReferenceCustomerSearchCriteria): Promise<PaginatedResponse<ReferenceCustomer>> {
    try {
      const queryBuilder = this.createQueryBuilder('referenceCustomer');
      
      // Apply filters
      if (criteria.primaryCif) {
        queryBuilder.andWhere('referenceCustomer.primary_cif = :primaryCif', { primaryCif: criteria.primaryCif });
      }
      
      if (criteria.relationshipType) {
        queryBuilder.andWhere('referenceCustomer.relationship_type = :relationshipType', { relationshipType: criteria.relationshipType });
      }
      
      if (criteria.type) {
        queryBuilder.andWhere('referenceCustomer.type = :type', { type: criteria.type });
      }
      
      if (criteria.name) {
        queryBuilder.andWhere('referenceCustomer.name ILIKE :name', { name: `%${criteria.name}%` });
      }
      
      // Get total count
      const total = await queryBuilder.getCount();
      
      // Apply pagination
      const page = criteria.page || 1;
      const pageSize = criteria.pageSize || 10;
      
      queryBuilder
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy('referenceCustomer.created_at', 'DESC');
      
      // Get paginated results
      const referenceCustomers = await queryBuilder.getMany();
      
      return ResponseUtil.paginate(referenceCustomers, total, page, pageSize);
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { criteria, operation: 'searchReferenceCustomers' }
      );
    }
  },

  /**
   * Create a new reference customer
   * @param referenceCustomer Reference customer data
   * @returns The created reference customer
   */
  async createReferenceCustomer(referenceCustomer: Partial<ReferenceCustomer>): Promise<ReferenceCustomer> {
    try {
      const newReferenceCustomer = this.create(referenceCustomer);
      return await this.save(newReferenceCustomer);
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { referenceCustomer, operation: 'createReferenceCustomer' }
      );
    }
  },

  /**
   * Update an existing reference customer
   * @param id Reference customer ID
   * @param referenceCustomerData Updated reference customer data
   * @returns The updated reference customer
   */
  async updateReferenceCustomer(id: string, referenceCustomerData: Partial<ReferenceCustomer>): Promise<ReferenceCustomer> {
    try {
      const referenceCustomer = await this.findOneBy({ id });
      
      if (!referenceCustomer) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Reference customer with ID ${id} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      // Update reference customer properties
      Object.assign(referenceCustomer, referenceCustomerData);
      
      return await this.save(referenceCustomer);
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { id, referenceCustomerData, operation: 'updateReferenceCustomer' }
      );
    }
  },

  /**
   * Delete a reference customer
   * @param id Reference customer ID
   * @returns True if deleted successfully
   */
  async deleteReferenceCustomer(id: string): Promise<boolean> {
    try {
      const result = await this.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { id, operation: 'deleteReferenceCustomer' }
      );
    }
  }
});