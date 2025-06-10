import { Request, Response, NextFunction } from 'express';
import { AddressRepository } from '../repositories/address.repository';
import { Address } from '../entities/address.entity';
import { Errors, OperationType, SourceSystemType } from '../utils/errors';
import { ResponseUtil } from '../utils/response';
import { logger } from '../utils/logger';

/**
 * Address controller
 */
export class AddressController {
  /**
   * Get addresses with optional filtering
   * @route GET /addresses
   */
  async getAddresses(req: Request, res: Response, next: NextFunction) {
    try {
      const { cif, type, city, state, isVerified, page = 1, pageSize = 10 } = req.query;
      
      const result = await AddressRepository.searchAddresses({
        cif: cif as string,
        type: type as string,
        city: city as string,
        state: state as string,
        isVerified: isVerified === 'true' ? true : isVerified === 'false' ? false : undefined,
        page: Number(page),
        pageSize: Math.min(Number(pageSize), 100)
      });
      
      return ResponseUtil.success(
        res,
        {
          addresses: result.items,
          pagination: result.pagination
        },
        'Addresses retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting addresses');
      next(error);
    }
  }

  /**
   * Get addresses by CIF
   * @route GET /addresses/by-cif/:cif
   */
  async getAddressesByCif(req: Request, res: Response, next: NextFunction) {
    try {
      const { cif } = req.params;
      
      const addresses = await AddressRepository.findByCif(cif);
      
      return ResponseUtil.success(
        res,
        addresses,
        'Addresses retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting addresses by CIF');
      next(error);
    }
  }

  /**
   * Get address by ID
   * @route GET /addresses/:id
   */
  async getAddressById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const address = await AddressRepository.findOneBy({ id });
      
      if (!address) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Address with ID ${id} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      return ResponseUtil.success(
        res,
        address,
        'Address retrieved successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error getting address by ID');
      next(error);
    }
  }
  
  /**
   * Create a new address
   * @route POST /addresses
   */
  async createAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const { 
        cif, 
        type, 
        addressLine1, 
        addressLine2, 
        city, 
        state, 
        district, 
        country, 
        isPrimary, 
        isVerified, 
        verificationDate 
      } = req.body;
      
      // Validate required fields
      if (!cif || !type || !addressLine1 || !city || !state || !district || !country) {
        throw Errors.create(
          Errors.Validation.REQUIRED_FIELD_MISSING,
          'Missing required fields: cif, type, addressLine1, city, state, district, country',
          OperationType.VALIDATION,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      // Create address
      const address = await AddressRepository.createAddress({
        cif,
        type,
        addressLine1,
        addressLine2,
        city,
        state,
        district,
        country,
        isPrimary: isPrimary || false,
        isVerified: isVerified || false,
        verificationDate: verificationDate ? new Date(verificationDate) : null,
        createdBy: req.user?.userId || 'system',
        updatedBy: req.user?.userId || 'system'
      });
      
      logger.info({ addressId: address.id, cif }, 'Address created successfully');
      
      return ResponseUtil.success(
        res,
        address,
        'Address created successfully',
        201
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error creating address');
      next(error);
    }
  }
  
  /**
   * Update an existing address
   * @route PUT /addresses/:id
   */
  async updateAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { 
        type, 
        addressLine1, 
        addressLine2, 
        city, 
        state, 
        district, 
        country, 
        isPrimary, 
        isVerified, 
        verificationDate 
      } = req.body;
      
      // Update address
      const updatedAddress = await AddressRepository.updateAddress(id, {
        type,
        addressLine1,
        addressLine2,
        city,
        state,
        district,
        country,
        isPrimary,
        isVerified,
        verificationDate: verificationDate ? new Date(verificationDate) : undefined,
        updatedBy: req.user?.userId || 'system'
      });
      
      logger.info({ addressId: id }, 'Address updated successfully');
      
      return ResponseUtil.success(
        res,
        updatedAddress,
        'Address updated successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error updating address');
      next(error);
    }
  }
  
  /**
   * Delete an address
   * @route DELETE /addresses/:id
   */
  async deleteAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const deleted = await AddressRepository.deleteAddress(id);
      
      if (!deleted) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Address with ID ${id} not found`,
          OperationType.DATABASE,
          SourceSystemType.WORKFLOW_SERVICE
        );
      }
      
      logger.info({ addressId: id }, 'Address deleted successfully');
      
      return ResponseUtil.success(
        res,
        { deleted: true },
        'Address deleted successfully'
      );
    } catch (error) {
      logger.error({ error, path: req.path }, 'Error deleting address');
      next(error);
    }
  }
}