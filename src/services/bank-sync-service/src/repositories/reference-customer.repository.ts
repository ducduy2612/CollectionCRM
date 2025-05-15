import { EntityRepository } from 'typeorm';
import { ReferenceCustomer, RelationshipType } from '../models/reference-customer.entity';
import { BaseSyncRepository, PaginatedResult, PaginationOptions } from './sync-entity.repository';
import { SourceSystemType } from '../models/sync-status.entity';

/**
 * Search criteria for reference customers
 */
export interface ReferenceSearchCriteria extends PaginationOptions {
  relationshipType?: RelationshipType;
  name?: string;
  nationalId?: string;
}

/**
 * Repository for ReferenceCustomer entity
 */
@EntityRepository(ReferenceCustomer)
export class ReferenceCustomerRepository extends BaseSyncRepository<ReferenceCustomer> {
  /**
   * Find a reference customer by reference CIF (natural key)
   * @param refCif Reference CIF number
   * @returns The reference customer if found, undefined otherwise
   */
  async findByNaturalKey(refCif: string): Promise<ReferenceCustomer | undefined> {
    try {
      return await this.findOne({ where: { refCif } });
    } catch (error) {
      console.error(`Error finding reference customer by CIF ${refCif}:`, error);
      throw new Error(`Failed to find reference customer by CIF: ${error.message}`);
    }
  }

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
      throw new Error(`Failed to upsert reference customer: ${error.message}`);
    }
  }

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
      const paginatedQuery = this.applyPagination(queryBuilder, criteria || {});
      
      // Get paginated results
      const referenceCustomers = await paginatedQuery.getMany();
      
      return this.createPaginatedResult(referenceCustomers, total, criteria || {});
    } catch (error) {
      console.error(`Error finding reference customers by primary CIF ${primaryCif}:`, error);
      throw new Error(`Failed to find reference customers by primary CIF: ${error.message}`);
    }
  }

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
      const paginatedQuery = this.applyPagination(queryBuilder, criteria || {});
      
      // Get paginated results
      const referenceCustomers = await paginatedQuery.getMany();
      
      return this.createPaginatedResult(referenceCustomers, total, criteria || {});
    } catch (error) {
      console.error(`Error finding reference customers by relationship type ${relationshipType}:`, error);
      throw new Error(`Failed to find reference customers by relationship type: ${error.message}`);
    }
  }

  /**
   * Get reference customer with primary customer details
   * @param refCif Reference CIF number
   * @returns The reference customer with primary customer details
   */
  async getReferenceCustomerWithDetails(refCif: string): Promise<ReferenceCustomer | undefined> {
    try {
      return await this.createQueryBuilder('refCustomer')
        .leftJoinAndSelect('refCustomer.primaryCustomer', 'primaryCustomer')
        .where('refCustomer.ref_cif = :refCif', { refCif })
        .getOne();
    } catch (error) {
      console.error(`Error getting reference customer details for CIF ${refCif}:`, error);
      throw new Error(`Failed to get reference customer details: ${error.message}`);
    }
  }

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
      throw new Error(`Failed to find guarantors for loan: ${error.message}`);
    }
  }
}