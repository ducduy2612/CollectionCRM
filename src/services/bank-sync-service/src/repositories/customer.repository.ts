import { EntityRepository, Repository, getRepository } from 'typeorm';
import { Customer, CustomerStatus } from '../models/customer.entity';
import { BaseSyncRepository, PaginatedResult, PaginationOptions } from './sync-entity.repository';
import { SourceSystemType as ModelSourceSystemType } from '../models/sync-status.entity';
import { Errors, OperationType, SourceSystemType } from '../errors';

/**
 * Search criteria for customers
 */
export interface CustomerSearchCriteria extends PaginationOptions {
  name?: string;
  nationalId?: string;
  companyName?: string;
  registrationNumber?: string;
  segment?: string;
  status?: CustomerStatus;
}

/**
 * Repository for Customer entity
 */
@EntityRepository(Customer)
export class CustomerRepository extends BaseSyncRepository<Customer> {
  /**
   * Find a customer by CIF (natural key)
   * @param cif Customer CIF number
   * @returns The customer if found, undefined otherwise
   */
  async findByNaturalKey(cif: string): Promise<Customer | undefined> {
    try {
      return await this.findOne({ where: { cif } });
    } catch (error) {
      console.error(`Error finding customer by CIF ${cif}:`, error);
      throw Errors.wrap(
        error,
        OperationType.DATABASE,
        SourceSystemType.OTHER,
        { cif, operation: 'findByNaturalKey' }
      );
    }
  }

  /**
   * Upsert a customer by CIF (natural key)
   * @param customer The customer to upsert
   * @returns The upserted customer
   */
  async upsertByNaturalKey(customer: Customer): Promise<Customer> {
    try {
      const existingCustomer = await this.findByNaturalKey(customer.cif);
      
      if (existingCustomer) {
        // Update existing customer
        const mergedCustomer = this.merge(existingCustomer, customer);
        return await this.save(mergedCustomer);
      } else {
        // Create new customer
        return await this.save(customer);
      }
    } catch (error) {
      console.error(`Error upserting customer with CIF ${customer.cif}:`, error);
      throw Errors.wrap(
        error,
        OperationType.DATABASE,
        SourceSystemType.OTHER,
        { cif: customer.cif, operation: 'upsertByNaturalKey' }
      );
    }
  }

  /**
   * Search customers based on criteria
   * @param criteria Search criteria
   * @returns Paginated result of customers
   */
  async searchCustomers(criteria: CustomerSearchCriteria): Promise<PaginatedResult<Customer>> {
    try {
      const queryBuilder = this.createQueryBuilder('customer');
      
      // Apply filters
      if (criteria.name) {
        queryBuilder.andWhere('customer.name ILIKE :name', { name: `%${criteria.name}%` });
      }
      
      if (criteria.nationalId) {
        queryBuilder.andWhere('customer.national_id = :nationalId', { nationalId: criteria.nationalId });
      }
      
      if (criteria.companyName) {
        queryBuilder.andWhere('customer.company_name ILIKE :companyName', { companyName: `%${criteria.companyName}%` });
      }
      
      if (criteria.registrationNumber) {
        queryBuilder.andWhere('customer.registration_number = :registrationNumber', { registrationNumber: criteria.registrationNumber });
      }
      
      if (criteria.segment) {
        queryBuilder.andWhere('customer.segment = :segment', { segment: criteria.segment });
      }
      
      if (criteria.status) {
        queryBuilder.andWhere('customer.status = :status', { status: criteria.status });
      }
      
      // Get total count
      const total = await queryBuilder.getCount();
      
      // Apply pagination
      const paginatedQuery = this.applyPagination(queryBuilder, criteria);
      
      // Get paginated results
      const customers = await paginatedQuery.getMany();
      
      return this.createPaginatedResult(customers, total, criteria);
    } catch (error) {
      console.error('Error searching customers:', error);
      throw Errors.wrap(
        error,
        OperationType.DATABASE,
        SourceSystemType.OTHER,
        { criteria, operation: 'searchCustomers' }
      );
    }
  }

  /**
   * Find customers by source system with eager loading of related entities
   * @param source The source system
   * @returns Array of customers with related entities
   */
  async findBySourceSystemWithRelations(source: ModelSourceSystemType): Promise<Customer[]> {
    try {
      return await this.createQueryBuilder('customer')
        .leftJoinAndSelect('customer.phones', 'phones')
        .leftJoinAndSelect('customer.addresses', 'addresses')
        .leftJoinAndSelect('customer.emails', 'emails')
        .where('customer.source_system = :source', { source })
        .getMany();
    } catch (error) {
      console.error(`Error finding customers by source system ${source}:`, error);
      throw Errors.wrap(
        error,
        OperationType.DATABASE,
        SourceSystemType.OTHER,
        { source, operation: 'findBySourceSystemWithRelations' }
      );
    }
  }

  /**
   * Get customer with all related entities
   * @param cif Customer CIF number
   * @returns The customer with all related entities
   */
  async getCustomerWithDetails(cif: string): Promise<Customer | undefined> {
    try {
      return await this.createQueryBuilder('customer')
        .leftJoinAndSelect('customer.phones', 'phones')
        .leftJoinAndSelect('customer.addresses', 'addresses')
        .leftJoinAndSelect('customer.emails', 'emails')
        .leftJoinAndSelect('customer.loans', 'loans')
        .leftJoinAndSelect('customer.collaterals', 'collaterals')
        .leftJoinAndSelect('customer.referenceCustomers', 'referenceCustomers')
        .where('customer.cif = :cif', { cif })
        .getOne();
    } catch (error) {
      console.error(`Error getting customer details for CIF ${cif}:`, error);
      throw Errors.wrap(
        error,
        OperationType.DATABASE,
        SourceSystemType.OTHER,
        { cif, operation: 'getCustomerWithDetails' }
      );
    }
  }
}