import { Request, Response, NextFunction } from 'express';
import { getCustomRepository } from 'typeorm';
import { LoanRepository } from '../repositories/loan.repository';
import { ApiError } from '../middleware/error-handler.middleware';

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
        throw new ApiError(400, 'Account number is required');
      }
      
      const loanRepository = getCustomRepository(LoanRepository);
      const loan = await loanRepository.getLoanWithDetails(accountNumber);
      
      if (!loan) {
        throw new ApiError(404, `Loan with account number ${accountNumber} not found`);
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