import { ReferenceCustomer, RelationshipType } from '../models/reference-customer.entity';
import { PaginatedResult, PaginationOptions, createBaseSyncRepository } from './sync-entity.repository';
import { SourceSystemType } from '../models/sync-status.entity';
import { AppDataSource } from '../config/data-source';

/**
 * Search criteria for reference customers
 */
export interface ReferenceSearchCriteria extends PaginationOptions {
  relationshipType?: RelationshipType;
  name?: string;
  nationalId?: string;
}

// Create base repository functions
const baseSyncRepository = createBaseSyncRepository(ReferenceCustomer);

/**
 * Repository for ReferenceCustomer entity
 */
export const ReferenceCustomerRepository = AppDataSource.getRepository(ReferenceCustomer).extend({
  /**
   * Find a reference customer by reference CIF (natural key)
   * @param refCif Reference CIF number
   * @returns The reference customer if found, undefined otherwise
   */
  async findByNaturalKey(refCif: string): Promise<ReferenceCustomer | undefined> {
    try {
      const referenceCustomer = await this.findOneBy({ refCif });
      return referenceCustomer || undefined;
    } catch (error) {
      console.error(`Error finding reference customer by CIF ${refCif}:`, error);
      throw new Error(`Failed to find reference customer by CIF: ${(error as Error).message}`);
    }
  },

  /**
   * Upsert a reference customer by reference CIF (natural key)
   * @param referenceCustomer The reference customer to upsert
   * @returns The upserted reference customer
   */
  async upsertByNaturalKey(referenceCustomer: ReferenceCustomer): Promise<ReferenceCustomer> {
    try {
      const existingReferenceCustomer = await this.findByNaturalKey(referenceCustomer.refCif);
      
      if (existingReferenceCustomer) {
        // Update existing reference customer
        const mergedReferenceCustomer = this.merge(existingReferenceCustomer, referenceCustomer);
        return await this.save(mergedReferenceCustomer);
      } else {
        // Create new reference customer
        return await this.save(referenceCustomer);
      }
    } catch (error) {
      console.error(`Error upserting reference customer with CIF ${referenceCustomer.refCif}:`, error);
      throw new Error(`Failed to upsert reference customer: ${(error as Error).message}`);
    }
  },

  /**
   * Find reference customers by primary customer CIF
   * @param primaryCif Primary customer CIF number
   * @param criteria Search criteria
   * @returns Paginated result of reference customers
   */
  async findByPrimaryCif(primaryCif: string, criteria?: ReferenceSearchCriteria): Promise<PaginatedResult<ReferenceCustomer>> {
    try {
      const queryBuilder = this.createQueryBuilder('refCustomer')
        .where('refCustomer.primary_cif = :primaryCif', { primaryCif });
      
      // Apply filters
      if (criteria?.relationshipType) {
        queryBuilder.andWhere('refCustomer.relationship_type = :relationshipType', { relationshipType: criteria.relationshipType });
      }
      
      if (criteria?.name) {
        queryBuilder.andWhere('refCustomer.name ILIKE :name', { name: `%${criteria.name}%` });
      }
      
      if (criteria?.nationalId) {
        queryBuilder.andWhere('refCustomer.national_id = :nationalId', { nationalId: criteria.nationalId });
      }
      
      // Get total count
      const total = await queryBuilder.getCount();
      
      // Apply pagination
      const paginatedQuery = baseSyncRepository.applyPagination(queryBuilder, criteria || {});
      
      // Get paginated results
      const referenceCustomers = await paginatedQuery.getMany();
      
      return baseSyncRepository.createPaginatedResult(referenceCustomers, total, criteria || {});
    } catch (error) {
      console.error(`Error finding reference customers by primary CIF ${primaryCif}:`, error);
      throw new Error(`Failed to find reference customers by primary CIF: ${(error as Error).message}`);
    }
  },

  /**
   * Find reference customers by primary CIF with contact information
   * @param primaryCif Primary customer CIF
   * @returns Array of reference customers with their contact information
   */
  async findByPrimaryCifWithContacts(primaryCif: string): Promise<ReferenceCustomer[]> {
    try {
      return await this.createQueryBuilder('referenceCustomer')
        .leftJoinAndSelect('referenceCustomer.phones', 'phones')
        .leftJoinAndSelect('referenceCustomer.addresses', 'addresses')
        .leftJoinAndSelect('referenceCustomer.emails', 'emails')
        .where('referenceCustomer.primary_cif = :primaryCif', { primaryCif })
        .orderBy('referenceCustomer.created_at', 'DESC')
        .getMany();
    } catch (error) {
      console.error(`Error finding reference customers with contacts by primary CIF ${primaryCif}:`, error);
      throw new Error(`Failed to find reference customers with contacts by primary CIF: ${(error as Error).message}`);
    }
  },

  /**
   * Find reference customer by ID with contact information
   * @param id Reference customer ID
   * @returns Reference customer with contact information
   */
  async findByIdWithContacts(id: string): Promise<ReferenceCustomer | undefined> {
    try {
      const referenceCustomer = await this.findOne({
        where: { id },
        relations: ['phones', 'addresses', 'emails']
      });
      return referenceCustomer || undefined;
    } catch (error) {
      console.error(`Error finding reference customer with contacts by ID ${id}:`, error);
      throw new Error(`Failed to find reference customer with contacts by ID: ${(error as Error).message}`);
    }
  },

  /**
   * Search reference customers based on criteria
   * @param criteria Search criteria
   * @returns Paginated result of reference customers
   */
  async searchReferenceCustomers(criteria: ReferenceSearchCriteria): Promise<PaginatedResult<ReferenceCustomer>> {
    try {
      const queryBuilder = this.createQueryBuilder('referenceCustomer');
      
      // Apply filters
      if (criteria.relationshipType) {
        queryBuilder.andWhere('referenceCustomer.relationship_type = :relationshipType', { relationshipType: criteria.relationshipType });
      }
      
      if (criteria.name) {
        queryBuilder.andWhere('referenceCustomer.name ILIKE :name', { name: `%${criteria.name}%` });
      }
      
      if (criteria.nationalId) {
        queryBuilder.andWhere('referenceCustomer.national_id = :nationalId', { nationalId: criteria.nationalId });
      }
      
      // Get total count
      const total = await queryBuilder.getCount();
      
      // Apply pagination
      const paginatedQuery = baseSyncRepository.applyPagination(queryBuilder, criteria);
      
      // Get paginated results
      const referenceCustomers = await paginatedQuery.getMany();
      
      return baseSyncRepository.createPaginatedResult(referenceCustomers, total, criteria);
    } catch (error) {
      console.error(`Error searching reference customers:`, error);
      throw new Error(`Failed to search reference customers: ${(error as Error).message}`);
    }
  },

  /**
   * Find reference customers by relationship type
   * @param relationshipType Relationship type
   * @param criteria Search criteria
   * @returns Paginated result of reference customers
   */
  async findByRelationshipType(relationshipType: RelationshipType, criteria?: PaginationOptions): Promise<PaginatedResult<ReferenceCustomer>> {
    try {
      const queryBuilder = this.createQueryBuilder('refCustomer')
        .where('refCustomer.relationship_type = :relationshipType', { relationshipType });
      
      // Get total count
      const total = await queryBuilder.getCount();
      
      // Apply pagination
      const paginatedQuery = baseSyncRepository.applyPagination(queryBuilder, criteria || {});
      
      // Get paginated results
      const referenceCustomers = await paginatedQuery.getMany();
      
      return baseSyncRepository.createPaginatedResult(referenceCustomers, total, criteria || {});
    } catch (error) {
      console.error(`Error finding reference customers by relationship type ${relationshipType}:`, error);
      throw new Error(`Failed to find reference customers by relationship type: ${(error as Error).message}`);
    }
  },

  /**
   * Get reference customer with primary customer details
   * @param refCif Reference CIF number
   * @returns The reference customer with primary customer details
   */
  async getReferenceCustomerWithDetails(refCif: string): Promise<ReferenceCustomer | undefined> {
    try {
      const referenceCustomer = await this.createQueryBuilder('refCustomer')
        .leftJoinAndSelect('refCustomer.primaryCustomer', 'primaryCustomer')
        .where('refCustomer.ref_cif = :refCif', { refCif })
        .getOne();
      return referenceCustomer || undefined;
    } catch (error) {
      console.error(`Error getting reference customer details for CIF ${refCif}:`, error);
      throw new Error(`Failed to get reference customer details: ${(error as Error).message}`);
    }
  },

  /**
   * Find guarantors for a specific loan
   * @param accountNumber Loan account number
   * @returns Array of reference customers who are guarantors for the loan
   */
  async findGuarantorsByLoanAccountNumber(accountNumber: string): Promise<ReferenceCustomer[]> {
    try {
      return await this.createQueryBuilder('refCustomer')
        .innerJoin('refCustomer.primaryCustomer', 'primaryCustomer')
        .innerJoin('primaryCustomer.loans', 'loan')
        .where('loan.account_number = :accountNumber', { accountNumber })
        .andWhere('refCustomer.relationship_type = :relationshipType', { relationshipType: RelationshipType.GUARANTOR })
        .getMany();
    } catch (error) {
      console.error(`Error finding guarantors for loan account number ${accountNumber}:`, error);
      throw new Error(`Failed to find guarantors for loan: ${(error as Error).message}`);
    }
  },

  // Add base repository methods
  findBySourceSystem: baseSyncRepository.findBySourceSystem,
  findStaleRecords: baseSyncRepository.findStaleRecords
});