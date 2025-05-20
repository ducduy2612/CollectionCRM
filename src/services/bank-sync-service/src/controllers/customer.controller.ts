import { Request, Response, NextFunction } from 'express';
import { CustomerRepository } from '../repositories/customer.repository';
import { LoanRepository } from '../repositories/loan.repository';
import { CollateralRepository } from '../repositories/collateral.repository';
import { ReferenceCustomerRepository } from '../repositories/reference-customer.repository';
import { Errors, OperationType, SourceSystemType, ValidationErrorCodes } from '../errors';
import { AppDataSource } from '../config/data-source';

/**
 * Customer controller
 */
export class CustomerController {
  /**
   * Get customer by CIF
   * @route GET /customers/:cif
   */
  async getCustomerByCif(req: Request, res: Response, next: NextFunction) {
    try {
      const { cif } = req.params;
      
      if (!cif) {
        throw Errors.create(
          ValidationErrorCodes.REQUIRED_FIELD_MISSING,
          'CIF is required',
          OperationType.VALIDATION,
          SourceSystemType.OTHER
        );
      }
      
      const customer = await CustomerRepository.getCustomerWithDetails(cif);
      
      if (!customer) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Customer with CIF ${cif} not found`,
          OperationType.DATABASE,
          SourceSystemType.OTHER
        );
      }
      
      return res.status(200).json({
        success: true,
        data: customer,
        message: 'Customer retrieved successfully',
        errors: []
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Search customers
   * @route GET /customers
   */
  async searchCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        name,
        nationalId,
        companyName,
        registrationNumber,
        segment,
        status,
        page = 1,
        pageSize = 10
      } = req.query;
      
      const result = await CustomerRepository.searchCustomers({
        name: name as string,
        nationalId: nationalId as string,
        companyName: companyName as string,
        registrationNumber: registrationNumber as string,
        segment: segment as string,
        status: status as any,
        page: Number(page),
        pageSize: Math.min(Number(pageSize), 100)
      });
      
      return res.status(200).json({
        success: true,
        data: {
          customers: result.items,
          pagination: {
            page: result.pagination.page,
            pageSize: result.pagination.pageSize,
            totalPages: result.pagination.totalPages,
            totalItems: result.pagination.totalItems
          }
        },
        message: 'Customers retrieved successfully',
        errors: []
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get customer loans
   * @route GET /customers/:cif/loans
   */
  async getCustomerLoans(req: Request, res: Response, next: NextFunction) {
    try {
      const { cif } = req.params;
      const { status, productType, page = 1, pageSize = 10 } = req.query;
      
      if (!cif) {
        throw Errors.create(
          ValidationErrorCodes.REQUIRED_FIELD_MISSING,
          'CIF is required',
          OperationType.VALIDATION,
          SourceSystemType.OTHER
        );
      }
      
      const customer = await CustomerRepository.findByNaturalKey(cif);
      
      if (!customer) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Customer with CIF ${cif} not found`,
          OperationType.DATABASE,
          SourceSystemType.OTHER
        );
      }
      
      const result = await LoanRepository.findByCif(cif, {
        status: status as any,
        productType: productType as string,
        page: Number(page),
        pageSize: Math.min(Number(pageSize), 100)
      });
      
      return res.status(200).json({
        success: true,
        data: {
          loans: result.items,
          pagination: {
            page: result.pagination.page,
            pageSize: result.pagination.pageSize,
            totalPages: result.pagination.totalPages,
            totalItems: result.pagination.totalItems
          }
        },
        message: 'Customer loans retrieved successfully',
        errors: []
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get customer collaterals
   * @route GET /customers/:cif/collaterals
   */
  async getCustomerCollaterals(req: Request, res: Response, next: NextFunction) {
    try {
      const { cif } = req.params;
      const { type, page = 1, pageSize = 10 } = req.query;
      
      if (!cif) {
        throw Errors.create(
          ValidationErrorCodes.REQUIRED_FIELD_MISSING,
          'CIF is required',
          OperationType.VALIDATION,
          SourceSystemType.OTHER
        );
      }
      
      const customer = await CustomerRepository.findByNaturalKey(cif);
      
      if (!customer) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Customer with CIF ${cif} not found`,
          OperationType.DATABASE,
          SourceSystemType.OTHER
        );
      }
      
      const result = await CollateralRepository.findByCif(cif, {
        type: type as any,
        page: Number(page),
        pageSize: Math.min(Number(pageSize), 100)
      });
      
      return res.status(200).json({
        success: true,
        data: {
          collaterals: result.items,
          pagination: {
            page: result.pagination.page,
            pageSize: result.pagination.pageSize,
            totalPages: result.pagination.totalPages,
            totalItems: result.pagination.totalItems
          }
        },
        message: 'Customer collaterals retrieved successfully',
        errors: []
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get customer references
   * @route GET /customers/:cif/references
   */
  async getCustomerReferences(req: Request, res: Response, next: NextFunction) {
    try {
      const { cif } = req.params;
      const { relationshipType, page = 1, pageSize = 10 } = req.query;
      
      if (!cif) {
        throw Errors.create(
          ValidationErrorCodes.REQUIRED_FIELD_MISSING,
          'CIF is required',
          OperationType.VALIDATION,
          SourceSystemType.OTHER
        );
      }
      
      const customer = await CustomerRepository.findByNaturalKey(cif);
      
      if (!customer) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Customer with CIF ${cif} not found`,
          OperationType.DATABASE,
          SourceSystemType.OTHER
        );
      }
      
      const result = await ReferenceCustomerRepository.findByPrimaryCif(cif, {
        relationshipType: relationshipType as any,
        page: Number(page),
        pageSize: Math.min(Number(pageSize), 100)
      });
      
      return res.status(200).json({
        success: true,
        data: {
          references: result.items,
          pagination: {
            page: result.pagination.page,
            pageSize: result.pagination.pageSize,
            totalPages: result.pagination.totalPages,
            totalItems: result.pagination.totalItems
          }
        },
        message: 'Customer references retrieved successfully',
        errors: []
      });
    } catch (error) {
      next(error);
    }
  }
}