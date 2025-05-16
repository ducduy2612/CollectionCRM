import { EntityRepository } from 'typeorm';
import { Collateral, CollateralType } from '../models/collateral.entity';
import { BaseSyncRepository, PaginatedResult, PaginationOptions } from './sync-entity.repository';
import { SourceSystemType as ModelSourceSystemType } from '../models/sync-status.entity';
import { Errors, OperationType, SourceSystemType } from '../errors';

/**
 * Search criteria for collaterals
 */
export interface CollateralSearchCriteria extends PaginationOptions {
  type?: CollateralType;
  minValue?: number;
  maxValue?: number;
}

/**
 * Repository for Collateral entity
 */
@EntityRepository(Collateral)
export class CollateralRepository extends BaseSyncRepository<Collateral> {
  /**
   * Find a collateral by collateral number (natural key)
   * @param collateralNumber Collateral number
   * @returns The collateral if found, undefined otherwise
   */
  async findByNaturalKey(collateralNumber: string): Promise<Collateral | undefined> {
    try {
      return await this.findOne({ where: { collateralNumber } });
    } catch (error) {
      console.error(`Error finding collateral by number ${collateralNumber}:`, error);
      throw Errors.wrap(
        error,
        OperationType.DATABASE,
        SourceSystemType.OTHER,
        { collateralNumber, operation: 'findByNaturalKey' }
      );
    }
  }

  /**
   * Upsert a collateral by collateral number (natural key)
   * @param collateral The collateral to upsert
   * @returns The upserted collateral
   */
  async upsertByNaturalKey(collateral: Collateral): Promise<Collateral> {
    try {
      const existingCollateral = await this.findByNaturalKey(collateral.collateralNumber);
      
      if (existingCollateral) {
        // Update existing collateral
        const mergedCollateral = this.merge(existingCollateral, collateral);
        return await this.save(mergedCollateral);
      } else {
        // Create new collateral
        return await this.save(collateral);
      }
    } catch (error) {
      console.error(`Error upserting collateral with number ${collateral.collateralNumber}:`, error);
      throw Errors.wrap(
        error,
        OperationType.DATABASE,
        SourceSystemType.OTHER,
        { collateralNumber: collateral.collateralNumber, operation: 'upsertByNaturalKey' }
      );
    }
  }

  /**
   * Find collaterals by customer CIF
   * @param cif Customer CIF number
   * @param criteria Search criteria
   * @returns Paginated result of collaterals
   */
  async findByCif(cif: string, criteria?: CollateralSearchCriteria): Promise<PaginatedResult<Collateral>> {
    try {
      const queryBuilder = this.createQueryBuilder('collateral')
        .where('collateral.cif = :cif', { cif });
      
      // Apply filters
      if (criteria?.type) {
        queryBuilder.andWhere('collateral.type = :type', { type: criteria.type });
      }
      
      if (criteria?.minValue !== undefined) {
        queryBuilder.andWhere('collateral.value >= :minValue', { minValue: criteria.minValue });
      }
      
      if (criteria?.maxValue !== undefined) {
        queryBuilder.andWhere('collateral.value <= :maxValue', { maxValue: criteria.maxValue });
      }
      
      // Get total count
      const total = await queryBuilder.getCount();
      
      // Apply pagination
      const paginatedQuery = this.applyPagination(queryBuilder, criteria || {});
      
      // Get paginated results
      const collaterals = await paginatedQuery.getMany();
      
      return this.createPaginatedResult(collaterals, total, criteria || {});
    } catch (error) {
      console.error(`Error finding collaterals by CIF ${cif}:`, error);
      throw Errors.wrap(
        error,
        OperationType.DATABASE,
        SourceSystemType.OTHER,
        { cif, criteria, operation: 'findByCif' }
      );
    }
  }

  /**
   * Get collateral with all related entities
   * @param collateralNumber Collateral number
   * @returns The collateral with all related entities
   */
  async getCollateralWithDetails(collateralNumber: string): Promise<Collateral | undefined> {
    try {
      return await this.createQueryBuilder('collateral')
        .leftJoinAndSelect('collateral.customer', 'customer')
        .leftJoinAndSelect('collateral.associatedLoans', 'associatedLoans')
        .where('collateral.collateral_number = :collateralNumber', { collateralNumber })
        .getOne();
    } catch (error) {
      console.error(`Error getting collateral details for number ${collateralNumber}:`, error);
      throw Errors.wrap(
        error,
        OperationType.DATABASE,
        SourceSystemType.OTHER,
        { collateralNumber, operation: 'getCollateralWithDetails' }
      );
    }
  }

  /**
   * Find collaterals by loan account number
   * @param accountNumber Loan account number
   * @returns Array of collaterals associated with the loan
   */
  async findByLoanAccountNumber(accountNumber: string): Promise<Collateral[]> {
    try {
      return await this.createQueryBuilder('collateral')
        .innerJoin('collateral.associatedLoans', 'loan')
        .where('loan.account_number = :accountNumber', { accountNumber })
        .getMany();
    } catch (error) {
      console.error(`Error finding collaterals by loan account number ${accountNumber}:`, error);
      throw Errors.wrap(
        error,
        OperationType.DATABASE,
        SourceSystemType.OTHER,
        { accountNumber, operation: 'findByLoanAccountNumber' }
      );
    }
  }

  /**
   * Find collaterals by type
   * @param type Collateral type
   * @param criteria Search criteria
   * @returns Paginated result of collaterals
   */
  async findByType(type: CollateralType, criteria?: PaginationOptions): Promise<PaginatedResult<Collateral>> {
    try {
      const queryBuilder = this.createQueryBuilder('collateral')
        .where('collateral.type = :type', { type });
      
      // Get total count
      const total = await queryBuilder.getCount();
      
      // Apply pagination
      const paginatedQuery = this.applyPagination(queryBuilder, criteria || {});
      
      // Get paginated results
      const collaterals = await paginatedQuery.getMany();
      
      return this.createPaginatedResult(collaterals, total, criteria || {});
    } catch (error) {
      console.error(`Error finding collaterals by type ${type}:`, error);
      throw Errors.wrap(
        error,
        OperationType.DATABASE,
        SourceSystemType.OTHER,
        { type, criteria, operation: 'findByType' }
      );
    }
  }
}