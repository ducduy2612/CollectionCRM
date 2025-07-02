import { Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import pino from 'pino';
import { PaymentService } from '@/services/PaymentService';

export class PaymentController {
  private paymentService: PaymentService;
  private logger: pino.Logger;

  constructor(
    paymentService: PaymentService,
    logger: pino.Logger
  ) {
    this.paymentService = paymentService;
    this.logger = logger;
  }

  // Validation for CIF-based payment queries with optional filters
  static validatePaymentByCifQueries = [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Limit must be an integer between 1 and 1000'),
    
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be a non-negative integer'),
      
    query('loan_account_number')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Loan account number must be a string between 1 and 50 characters'),
      
    query('start_date')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
      
    query('end_date')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date'),
  ];

  // Get payments by CIF with optional filters
  getPaymentsByCif = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
      return;
    }

    const { cif } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    const loanAccountNumber = req.query.loan_account_number as string;
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;

    if (!cif) {
      res.status(400).json({
        success: false,
        error: 'CIF is required',
      });
      return;
    }

    // Validate date range if provided
    if ((startDate && !endDate) || (!startDate && endDate)) {
      res.status(400).json({
        success: false,
        error: 'Both start_date and end_date must be provided when using date filtering',
      });
      return;
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start >= end) {
        res.status(400).json({
          success: false,
          error: 'start_date must be before end_date',
        });
        return;
      }
    }

    try {
      let payments;
      
      if (loanAccountNumber || (startDate && endDate)) {
        // Use the enhanced filtering method
        const filters: {
          loan_account_number?: string;
          start_date?: Date;
          end_date?: Date;
          limit: number;
          offset: number;
        } = {
          limit,
          offset,
        };
        
        if (loanAccountNumber) {
          filters.loan_account_number = loanAccountNumber;
        }
        
        if (startDate && endDate) {
          filters.start_date = new Date(startDate);
          filters.end_date = new Date(endDate);
        }
        
        payments = await this.paymentService.getPaymentsByCifWithFilters(cif, filters);
      } else {
        // Use the basic CIF filtering method
        payments = await this.paymentService.getPaymentsByCif(cif, limit, offset);
      }

      res.json({
        success: true,
        data: {
          payments,
          pagination: {
            limit,
            offset,
            count: payments.length,
          },
          filters: {
            cif,
            loan_account_number: loanAccountNumber || null,
            start_date: startDate || null,
            end_date: endDate || null,
          },
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.logger.error({ 
        error: errorMessage, 
        cif,
        loan_account_number: loanAccountNumber,
        start_date: startDate,
        end_date: endDate,
      }, 'Error getting payments by CIF');

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: errorMessage,
      });
    }
  };
}