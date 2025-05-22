import { Request, Response, NextFunction } from 'express';
import { LoanRepository } from '../repositories/loan.repository';
import { Errors, OperationType, SourceSystemType, ValidationErrorCodes } from '../errors';
import { AppDataSource } from '../config/data-source';

/**
 * Loan controller
 */
export class LoanController {
  /**
   * Get loan by account number
   * @route GET /loans/:accountNumber
   */
  async getLoanByAccountNumber(req: Request, res: Response, next: NextFunction) {
    try {
      const { accountNumber } = req.params;
      
      if (!accountNumber) {
        throw Errors.create(
          ValidationErrorCodes.REQUIRED_FIELD_MISSING,
          'Account number is required',
          OperationType.VALIDATION,
          SourceSystemType.OTHER
        );
      }
      
      const loan = await LoanRepository.getLoanWithDetails(accountNumber);
      
      if (!loan) {
        throw Errors.create(
          Errors.Database.RECORD_NOT_FOUND,
          `Loan with account number ${accountNumber} not found`,
          OperationType.DATABASE,
          SourceSystemType.OTHER
        );
      }
      
      return res.status(200).json({
        success: true,
        data: loan,
        message: 'Loan retrieved successfully',
        errors: []
      });
    } catch (error) {
      next(error);
    }
  }
}