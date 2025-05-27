import { Request, Response } from 'express';
import { LoanController } from '../../src/controllers/loan.controller';
import { LoanRepository } from '../../src/repositories/loan.repository';
import { Errors, OperationType, SourceSystemType, ValidationErrorCodes, DatabaseErrorCodes } from '../../src/errors';
import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { Loan } from '../../src/models/loan.entity';
import { AppError, ErrorType } from '../../src/errors/error-types';

// Define custom error type to match the structure created by Errors.create
interface CustomError extends Error {
  code: string;
  message: string;
  operationType: string;
  sourceSystem: string;
}

// Mock the repositories
jest.mock('../../src/repositories/loan.repository', () => ({
  LoanRepository: {
    getLoanWithDetails: jest.fn()
  }
}));
jest.mock('../../src/config/data-source');

// Mock the errors module
jest.mock('../../src/errors', () => {
  // Create a mock error creation function inside the mock
  const mockCreate = jest.fn((code: string, message: string, operationType: string, sourceSystem: string) => {
    const error = new Error(message);
    Object.assign(error, {
      code,
      operationType,
      sourceSystem
    });
    return error;
  });

  return {
    ValidationErrorCodes: {
      REQUIRED_FIELD_MISSING: 'VAL_001'
    },
    DatabaseErrorCodes: {
      RECORD_NOT_FOUND: 'DB_005'
    },
    OperationType: {
      VALIDATION: 'VALIDATION',
      DATABASE: 'DATABASE'
    },
    SourceSystemType: {
      OTHER: 'OTHER'
    },
    Errors: {
      Database: {
        RECORD_NOT_FOUND: 'DB_005'
      },
      create: mockCreate
    }
  };
});

describe('LoanController', () => {
  let loanController: LoanController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    // Create controller instance
    loanController = new LoanController();
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock request, response, and next function
    mockRequest = {
      params: {}
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    } as unknown as Response;
    
    mockNext = jest.fn();
  });

  describe('getLoanByAccountNumber', () => {
    it('should return loan when valid account number is provided', async () => {
      // Arrange
      const testAccountNumber = 'LOAN10000001';
      const mockLoan = { 
        id: '123', 
        accountNumber: testAccountNumber, 
        balance: 10000,
        customer: { name: 'John Doe' },
        dueSegmentations: []
      };
      
      mockRequest.params = { accountNumber: testAccountNumber };
      
      // Mock repository method
      (LoanRepository.getLoanWithDetails as jest.Mock<any>).mockResolvedValue(mockLoan);
      
      // Act
      await loanController.getLoanByAccountNumber(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Assert
      expect(LoanRepository.getLoanWithDetails).toHaveBeenCalledWith(testAccountNumber);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockLoan,
        message: 'Loan retrieved successfully',
        errors: []
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error when account number is not provided', async () => {
      // Arrange
      mockRequest.params = {};
      
      // Act
      await loanController.getLoanByAccountNumber(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Assert
      expect(LoanRepository.getLoanWithDetails).not.toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
      
      // Verify error was passed to next
      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = mockNext.mock.calls[0][0] as CustomError;
      expect(error.code).toBe(ValidationErrorCodes.REQUIRED_FIELD_MISSING);
      expect(error.message).toBe('Account number is required');
      expect(error.operationType).toBe(OperationType.VALIDATION);
      expect(error.sourceSystem).toBe(SourceSystemType.OTHER);
    });

    it('should call next with error when loan is not found', async () => {
      // Arrange
      const testAccountNumber = 'NON-EXISTENT-LOAN';
      mockRequest.params = { accountNumber: testAccountNumber };
      
      // Mock repository method to return undefined (loan not found)
      (LoanRepository.getLoanWithDetails as jest.Mock<any>).mockResolvedValue(undefined);
      
      // Act
      await loanController.getLoanByAccountNumber(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Assert
      expect(LoanRepository.getLoanWithDetails).toHaveBeenCalledWith(testAccountNumber);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
      
      // Verify error was passed to next
      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = mockNext.mock.calls[0][0] as CustomError;
      expect(error.code).toBe(Errors.Database.RECORD_NOT_FOUND);
      expect(error.message).toBe(`Loan with account number ${testAccountNumber} not found`);
      expect(error.operationType).toBe(OperationType.DATABASE);
      expect(error.sourceSystem).toBe(SourceSystemType.OTHER);
    });

    it('should call next with error when repository throws an exception', async () => {
      // Arrange
      const testAccountNumber = 'LOAN123456';
      const testError = new Error('Database connection failed');
      
      mockRequest.params = { accountNumber: testAccountNumber };
      
      // Mock repository method to throw an error
      (LoanRepository.getLoanWithDetails as jest.Mock<any>).mockRejectedValue(testError);
      
      // Act
      await loanController.getLoanByAccountNumber(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Assert
      expect(LoanRepository.getLoanWithDetails).toHaveBeenCalledWith(testAccountNumber);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(testError);
    });
  });
});