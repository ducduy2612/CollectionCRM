import { Loan } from '../models/loan.entity';
import { LoanStatus, DelinquencyStatus } from '../models/loan.entity';
import { PaginatedResult, PaginationOptions, createBaseSyncRepository } from './sync-entity.repository';
import { SourceSystemType as ModelSourceSystemType } from '../models/sync-status.entity';
import { Errors, OperationType, SourceSystemType } from '../errors';
import { AppDataSource } from '../config/data-source';

/**
 * Search criteria for loans
 */
export interface LoanSearchCriteria extends PaginationOptions {
  status?: LoanStatus;
  productType?: string;
  delinquencyStatus?: DelinquencyStatus;
  minDpd?: number;
  maxDpd?: number;
}

// Create base repository functions
const baseSyncRepository = createBaseSyncRepository(Loan);

/**
 * Repository for Loan entity
 */
export const LoanRepository = AppDataSource.getRepository(Loan).extend({
  /**
   * Find a loan by account number (natural key)
   * @param accountNumber Loan account number
   * @returns The loan if found, undefined otherwise
   */
  async findByNaturalKey(accountNumber: string): Promise<Loan | undefined> {
    try {
      const loan = await this.findOneBy({ accountNumber });
      return loan || undefined;
    } catch (error) {
      console.error(`Error finding loan by account number ${accountNumber}:`, error);
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.OTHER,
        { accountNumber, operation: 'findByNaturalKey' }
      );
    }
  },

  /**
   * Upsert a loan by account number (natural key)
   * @param loan The loan to upsert
   * @returns The upserted loan
   */
  async upsertByNaturalKey(loan: Loan): Promise<Loan> {
    try {
      const existingLoan = await this.findByNaturalKey(loan.accountNumber);
      
      if (existingLoan) {
        // Update existing loan
        const mergedLoan = this.merge(existingLoan, loan);
        return await this.save(mergedLoan);
      } else {
        // Create new loan
        return await this.save(loan);
      }
    } catch (error) {
      console.error(`Error upserting loan with account number ${loan.accountNumber}:`, error);
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.OTHER,
        { accountNumber: loan.accountNumber, operation: 'upsertByNaturalKey' }
      );
    }
  },

  /**
   * Find loans by customer CIF
   * @param cif Customer CIF number
   * @param criteria Search criteria
   * @returns Paginated result of loans
   */
  async findByCif(cif: string, criteria?: LoanSearchCriteria): Promise<PaginatedResult<Loan>> {
    try {
      const queryBuilder = this.createQueryBuilder('loan')
        .where('loan.cif = :cif', { cif });
      
      // Apply filters
      if (criteria?.status) {
        queryBuilder.andWhere('loan.status = :status', { status: criteria.status });
      }
      
      if (criteria?.productType) {
        queryBuilder.andWhere('loan.product_type = :productType', { productType: criteria.productType });
      }
      
      if (criteria?.delinquencyStatus) {
        queryBuilder.andWhere('loan.delinquency_status = :delinquencyStatus', { delinquencyStatus: criteria.delinquencyStatus });
      }
      
      if (criteria?.minDpd !== undefined) {
        queryBuilder.andWhere('loan.dpd >= :minDpd', { minDpd: criteria.minDpd });
      }
      
      if (criteria?.maxDpd !== undefined) {
        queryBuilder.andWhere('loan.dpd <= :maxDpd', { maxDpd: criteria.maxDpd });
      }
      
      // Get total count
      const total = await queryBuilder.getCount();
      
      // Apply pagination
      const paginatedQuery = baseSyncRepository.applyPagination(queryBuilder, criteria || {});
      
      // Get paginated results
      const loans = await paginatedQuery.getMany();
      
      return baseSyncRepository.createPaginatedResult(loans, total, criteria || {});
    } catch (error) {
      console.error(`Error finding loans by CIF ${cif}:`, error);
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.OTHER,
        { cif, criteria, operation: 'findByCif' }
      );
    }
  },

  /**
   * Get loan with all related entities
   * @param accountNumber Loan account number
   * @returns The loan with all related entities
   */
  async getLoanWithDetails(accountNumber: string): Promise<Loan | undefined> {
    try {
      const loan = await this.createQueryBuilder('loan')
        .leftJoinAndSelect('loan.customer', 'customer')
        .leftJoinAndSelect('loan.dueSegmentations', 'dueSegmentations')
        .where('loan.account_number = :accountNumber', { accountNumber })
        .getOne();
      return loan || undefined;
    } catch (error) {
      console.error(`Error getting loan details for account number ${accountNumber}:`, error);
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.OTHER,
        { accountNumber, operation: 'getLoanWithDetails' }
      );
    }
  },

  /**
   * Find delinquent loans
   * @param criteria Search criteria
   * @returns Paginated result of delinquent loans
   */
  async findDelinquentLoans(criteria?: LoanSearchCriteria): Promise<PaginatedResult<Loan>> {
    try {
      const queryBuilder = this.createQueryBuilder('loan')
        .where('loan.delinquency_status = :delinquencyStatus', { delinquencyStatus: DelinquencyStatus.DELINQUENT })
        .orWhere('loan.delinquency_status = :defaultStatus', { defaultStatus: DelinquencyStatus.DEFAULT });
      
      // Apply additional filters
      if (criteria?.productType) {
        queryBuilder.andWhere('loan.product_type = :productType', { productType: criteria.productType });
      }
      
      if (criteria?.minDpd !== undefined) {
        queryBuilder.andWhere('loan.dpd >= :minDpd', { minDpd: criteria.minDpd });
      }
      
      if (criteria?.maxDpd !== undefined) {
        queryBuilder.andWhere('loan.dpd <= :maxDpd', { maxDpd: criteria.maxDpd });
      }
      
      // Get total count
      const total = await queryBuilder.getCount();
      
      // Apply pagination
      const paginatedQuery = baseSyncRepository.applyPagination(queryBuilder, criteria || {});
      
      // Get paginated results
      const loans = await paginatedQuery.getMany();
      
      return baseSyncRepository.createPaginatedResult(loans, total, criteria || {});
    } catch (error) {
      console.error('Error finding delinquent loans:', error);
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.OTHER,
        { criteria, operation: 'findDelinquentLoans' }
      );
    }
  },

  /**
   * Find loans with upcoming payments
   * @param startDate Start date for payment range
   * @param endDate End date for payment range
   * @param criteria Search criteria
   * @returns Paginated result of loans with upcoming payments
   */
  async findLoansWithUpcomingPayments(
    startDate: Date,
    endDate: Date,
    criteria?: LoanSearchCriteria
  ): Promise<PaginatedResult<Loan>> {
    try {
      const queryBuilder = this.createQueryBuilder('loan')
        .where('loan.next_payment_date BETWEEN :startDate AND :endDate', { startDate, endDate })
        .andWhere('loan.status = :status', { status: LoanStatus.OPEN });
      
      // Apply additional filters
      if (criteria?.productType) {
        queryBuilder.andWhere('loan.product_type = :productType', { productType: criteria.productType });
      }
      
      // Get total count
      const total = await queryBuilder.getCount();
      
      // Apply pagination
      const paginatedQuery = baseSyncRepository.applyPagination(queryBuilder, criteria || {});
      
      // Get paginated results
      const loans = await paginatedQuery.getMany();
      
      return baseSyncRepository.createPaginatedResult(loans, total, criteria || {});
    } catch (error) {
      console.error('Error finding loans with upcoming payments:', error);
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.OTHER,
        { startDate, endDate, criteria, operation: 'findLoansWithUpcomingPayments' }
      );
    }
  },

  // Add base repository methods
  findBySourceSystem: baseSyncRepository.findBySourceSystem,
  findStaleRecords: baseSyncRepository.findStaleRecords
});