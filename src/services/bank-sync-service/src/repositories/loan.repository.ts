import { EntityRepository } from 'typeorm';
import { Loan, LoanStatus, DelinquencyStatus } from '../models/loan.entity';
import { BaseSyncRepository, PaginatedResult, PaginationOptions } from './sync-entity.repository';
import { SourceSystemType } from '../models/sync-status.entity';

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

/**
 * Repository for Loan entity
 */
@EntityRepository(Loan)
export class LoanRepository extends BaseSyncRepository<Loan> {
  /**
   * Find a loan by account number (natural key)
   * @param accountNumber Loan account number
   * @returns The loan if found, undefined otherwise
   */
  async findByNaturalKey(accountNumber: string): Promise<Loan | undefined> {
    try {
      return await this.findOne({ where: { accountNumber } });
    } catch (error) {
      console.error(`Error finding loan by account number ${accountNumber}:`, error);
      throw new Error(`Failed to find loan by account number: ${error.message}`);
    }
  }

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
      throw new Error(`Failed to upsert loan: ${error.message}`);
    }
  }

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
      const paginatedQuery = this.applyPagination(queryBuilder, criteria || {});
      
      // Get paginated results
      const loans = await paginatedQuery.getMany();
      
      return this.createPaginatedResult(loans, total, criteria || {});
    } catch (error) {
      console.error(`Error finding loans by CIF ${cif}:`, error);
      throw new Error(`Failed to find loans by CIF: ${error.message}`);
    }
  }

  /**
   * Get loan with all related entities
   * @param accountNumber Loan account number
   * @returns The loan with all related entities
   */
  async getLoanWithDetails(accountNumber: string): Promise<Loan | undefined> {
    try {
      return await this.createQueryBuilder('loan')
        .leftJoinAndSelect('loan.customer', 'customer')
        .leftJoinAndSelect('loan.dueSegmentations', 'dueSegmentations')
        .where('loan.account_number = :accountNumber', { accountNumber })
        .getOne();
    } catch (error) {
      console.error(`Error getting loan details for account number ${accountNumber}:`, error);
      throw new Error(`Failed to get loan details: ${error.message}`);
    }
  }

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
      const paginatedQuery = this.applyPagination(queryBuilder, criteria || {});
      
      // Get paginated results
      const loans = await paginatedQuery.getMany();
      
      return this.createPaginatedResult(loans, total, criteria || {});
    } catch (error) {
      console.error('Error finding delinquent loans:', error);
      throw new Error(`Failed to find delinquent loans: ${error.message}`);
    }
  }

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
      const paginatedQuery = this.applyPagination(queryBuilder, criteria || {});
      
      // Get paginated results
      const loans = await paginatedQuery.getMany();
      
      return this.createPaginatedResult(loans, total, criteria || {});
    } catch (error) {
      console.error('Error finding loans with upcoming payments:', error);
      throw new Error(`Failed to find loans with upcoming payments: ${error.message}`);
    }
  }
}