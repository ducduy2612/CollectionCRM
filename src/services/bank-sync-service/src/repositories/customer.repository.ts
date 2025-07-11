import { Customer } from '../models/customer.entity';
import { CustomerStatus } from '../models/customer-types';
import { PaginatedResult, PaginationOptions, createBaseSyncRepository } from './sync-entity.repository';
import { SourceSystemType as ModelSourceSystemType } from '../models/sync-status.entity';
import { Errors, OperationType, SourceSystemType } from '../errors';
import { AppDataSource } from '../config/data-source';

/**
 * Search criteria for customers
 */
export interface CustomerSearchCriteria extends PaginationOptions {
  cif?: string;
  name?: string;
  nationalId?: string;
  companyName?: string;
  registrationNumber?: string;
  segment?: string;
  status?: CustomerStatus;
}

// Create base repository functions
const baseSyncRepository = createBaseSyncRepository(Customer);

/**
 * Repository for Customer entity
 */
export const CustomerRepository = AppDataSource.getRepository(Customer).extend({
  /**
   * Find a customer by CIF (natural key)
   * @param cif Customer CIF number
   * @returns The customer if found, undefined otherwise
   */
  async findByNaturalKey(cif: string): Promise<Customer | undefined> {
    try {
      const customer = await this.findOneBy({ cif });
      return customer || undefined;
    } catch (error) {
      console.error(`Error finding customer by CIF ${cif}:`, error);
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.OTHER,
        { cif, operation: 'findByNaturalKey' }
      );
    }
  },

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
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.OTHER,
        { cif: customer.cif, operation: 'upsertByNaturalKey' }
      );
    }
  },

  /**
   * Search customers based on criteria
   * @param criteria Search criteria
   * @returns Paginated result of customers
   */
  async searchCustomers(criteria: CustomerSearchCriteria): Promise<PaginatedResult<Customer>> {
    try {
      const queryBuilder = this.createQueryBuilder('customer');
      
      // Apply filters
      if (criteria.cif) {
        queryBuilder.andWhere('customer.cif ILIKE :cif', { cif: `%${criteria.cif}%` });
      }
      
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
      const paginatedQuery = baseSyncRepository.applyPagination(queryBuilder, criteria);
      
      // Get paginated results
      const customers = await paginatedQuery.getMany();
      
      return baseSyncRepository.createPaginatedResult(customers, total, criteria);
    } catch (error) {
      console.error('Error searching customers:', error);
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.OTHER,
        { criteria, operation: 'searchCustomers' }
      );
    }
  },

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
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.OTHER,
        { source, operation: 'findBySourceSystemWithRelations' }
      );
    }
  },

  /**
   * Get customer with all related entities
   * @param cif Customer CIF number
   * @returns The customer with all related entities
   */
  async getCustomerWithDetails(cif: string): Promise<Customer | undefined> {
    try {
      const customer = await this.createQueryBuilder('customer')
        .leftJoinAndSelect('customer.phones', 'phones', 'phones.refCif IS NULL')
        .leftJoinAndSelect('customer.addresses', 'addresses', 'addresses.refCif IS NULL')
        .leftJoinAndSelect('customer.emails', 'emails', 'emails.refCif IS NULL')
        .leftJoinAndSelect('customer.loans', 'loans')
        .leftJoinAndSelect('customer.collaterals', 'collaterals')
        .leftJoinAndSelect('customer.referenceCustomers', 'referenceCustomers')
        .where('customer.cif = :cif', { cif })
        .getOne();
      return customer || undefined;
    } catch (error) {
      console.error(`Error getting customer details for CIF ${cif}:`, error);
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.OTHER,
        { cif, operation: 'getCustomerWithDetails' }
      );
    }
  },

  /**
   * Get multiple customers by CIF list (basic info only)
   * @param cifs Array of customer CIF numbers
   * @returns Array of customers with basic info
   */
  async getCustomersByCifs(cifs: string[]): Promise<Customer[]> {
    try {
      if (cifs.length === 0) {
        return [];
      }

      const customers = await this.createQueryBuilder('customer')
        .select([
          'customer.cif',
          'customer.name',
          'customer.companyName',
          'customer.segment',
          'customer.status',
          'customer.createdAt',
          'customer.updatedAt'
        ])
        .where('customer.cif IN (:...cifs)', { cifs })
        .getMany();

      return customers;
    } catch (error) {
      console.error(`Error getting customers by CIFs:`, error);
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.OTHER,
        { cifs, operation: 'getCustomersByCifs' }
      );
    }
  },

  // Add base repository methods
  findBySourceSystem: baseSyncRepository.findBySourceSystem,
  findStaleRecords: baseSyncRepository.findStaleRecords
});