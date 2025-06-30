import { Address } from '../entities/address.entity';
import { AppDataSource } from '../config/data-source';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';
import { ResponseUtil, PaginatedResponse } from '../utils/response';

/**
 * Search criteria for addresses
 */
export interface AddressSearchCriteria {
  cif?: string;
  type?: string;
  city?: string;
  state?: string;
  isVerified?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * Repository for Address entity
 */
export const AddressRepository = AppDataSource.getRepository(Address).extend({
  /**
   * Find addresses by CIF
   * @param cif Customer CIF
   * @returns Array of addresses for the customer
   */
  async findByCif(cif: string): Promise<Address[]> {
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
   * Search addresses based on criteria
   * @param criteria Search criteria
   * @returns Paginated result of addresses
   */
  async searchAddresses(criteria: AddressSearchCriteria): Promise<PaginatedResponse<Address>> {
    try {
      const queryBuilder = this.createQueryBuilder('address');
      
      // Apply filters
      if (criteria.cif) {
        queryBuilder.andWhere('address.cif = :cif', { cif: criteria.cif });
      }
      
      if (criteria.type) {
        queryBuilder.andWhere('address.type = :type', { type: criteria.type });
      }
      
      if (criteria.city) {
        queryBuilder.andWhere('address.city ILIKE :city', { city: `%${criteria.city}%` });
      }
      
      if (criteria.state) {
        queryBuilder.andWhere('address.state ILIKE :state', { state: `%${criteria.state}%` });
      }
      
      if (criteria.isVerified !== undefined) {
        queryBuilder.andWhere('address.is_verified = :isVerified', { isVerified: criteria.isVerified });
      }
      
      // Get total count
      const total = await queryBuilder.getCount();
      
      // Apply pagination
      const page = criteria.page || 1;
      const pageSize = criteria.pageSize || 10;
      
      queryBuilder
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .orderBy('address.created_at', 'DESC');
      
      // Get paginated results
      const addresses = await queryBuilder.getMany();
      
      return ResponseUtil.paginate(addresses, total, page, pageSize);
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { criteria, operation: 'searchAddresses' }
      );
    }
  },

  /**
   * Create a new address
   * @param address Address data
   * @returns The created address
   */
  async createAddress(address: Partial<Address>): Promise<Address> {
    try {
      // If this is set as primary, unset other primary addresses for the same CIF
      if (address.isPrimary && address.cif) {
        await this.update(
          { cif: address.cif, isPrimary: true },
          { isPrimary: false }
        );
      }
      
      const newAddress = this.create(address);
      return await this.save(newAddress);
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { address, operation: 'createAddress' }
      );
    }
  },

  /**
   * Update an existing address
   * @param id Address ID
   * @param addressData Updated address data
   * @returns The updated address
   */
  async updateAddress(id: string, addressData: Partial<Address>): Promise<Address> {
    try {
      const address = await this.findOneBy({ id });
      
      if (!address) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Address with ID ${id} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      // If this is set as primary, unset other primary addresses for the same CIF
      if (addressData.isPrimary && address.cif) {
        await this.update(
          { cif: address.cif, isPrimary: true },
          { isPrimary: false }
        );
      }
      
      // Update address properties
      Object.assign(address, addressData);
      
      return await this.save(address);
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { id, addressData, operation: 'updateAddress' }
      );
    }
  },

  /**
   * Delete an address
   * @param id Address ID
   * @returns True if deleted successfully
   */
  async deleteAddress(id: string): Promise<boolean> {
    try {
      const result = await this.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (error) {
      throw Errors.wrap(
        error as Error,
        OperationType.DATABASE,
        SourceSystemType.WORKFLOW_SERVICE,
        { id, operation: 'deleteAddress' }
      );
    }
  }
});