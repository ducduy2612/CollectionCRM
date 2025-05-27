import { Request, Response } from 'express';
import { CollateralController } from '../../src/controllers/collateral.controller';
import { CollateralRepository } from '../../src/repositories/collateral.repository';
import { Errors, OperationType, SourceSystemType, ValidationErrorCodes } from '../../src/errors';
import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { Collateral } from '../../src/models/collateral.entity';

// Define custom error type to match the structure created by Errors.create
interface CustomError extends Error {
  code: string;
  message: string;
  operationType: string;
  sourceSystem: string;
}

// Mock the repositories
jest.mock('../../src/repositories/collateral.repository', () => ({
  CollateralRepository: {
    getCollateralWithDetails: jest.fn()
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

describe('CollateralController', () => {
  let collateralController: CollateralController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    // Create controller instance
    collateralController = new CollateralController();
    
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

  describe('getCollateralByNumber', () => {
    it('should return collateral when valid collateral number is provided', async () => {
      // Arrange
      const testCollateralNumber = 'COLL10000001';
      const mockCollateral = { 
        id: '123', 
        collateralNumber: testCollateralNumber, 
        value: 50000,
        type: 'REAL_ESTATE',
        customer: { name: 'John Doe' },
        associatedLoans: []
      };
      
      mockRequest.params = { collateralNumber: testCollateralNumber };
      
      // Mock repository method
      (CollateralRepository.getCollateralWithDetails as jest.Mock<any>).mockResolvedValue(mockCollateral);
      
      // Act
      await collateralController.getCollateralByNumber(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Assert
      expect(CollateralRepository.getCollateralWithDetails).toHaveBeenCalledWith(testCollateralNumber);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCollateral,
        message: 'Collateral retrieved successfully',
        errors: []
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error when collateral number is not provided', async () => {
      // Arrange
      mockRequest.params = {};
      
      // Act
      await collateralController.getCollateralByNumber(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Assert
      expect(CollateralRepository.getCollateralWithDetails).not.toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
      
      // Verify error was passed to next
      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = mockNext.mock.calls[0][0] as CustomError;
      expect(error.code).toBe(ValidationErrorCodes.REQUIRED_FIELD_MISSING);
      expect(error.message).toBe('Collateral number is required');
      expect(error.operationType).toBe(OperationType.VALIDATION);
      expect(error.sourceSystem).toBe(SourceSystemType.OTHER);
    });

    it('should call next with error when collateral is not found', async () => {
      // Arrange
      const testCollateralNumber = 'NON-EXISTENT-COLLATERAL';
      mockRequest.params = { collateralNumber: testCollateralNumber };
      
      // Mock repository method to return undefined (collateral not found)
      (CollateralRepository.getCollateralWithDetails as jest.Mock<any>).mockResolvedValue(undefined);
      
      // Act
      await collateralController.getCollateralByNumber(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Assert
      expect(CollateralRepository.getCollateralWithDetails).toHaveBeenCalledWith(testCollateralNumber);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
      
      // Verify error was passed to next
      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = mockNext.mock.calls[0][0] as CustomError;
      expect(error.code).toBe(Errors.Database.RECORD_NOT_FOUND);
      expect(error.message).toBe(`Collateral with number ${testCollateralNumber} not found`);
      expect(error.operationType).toBe(OperationType.DATABASE);
      expect(error.sourceSystem).toBe(SourceSystemType.OTHER);
    });

    it('should call next with error when repository throws an exception', async () => {
      // Arrange
      const testCollateralNumber = 'COLL123456';
      const testError = new Error('Database connection failed');
      
      mockRequest.params = { collateralNumber: testCollateralNumber };
      
      // Mock repository method to throw an error
      (CollateralRepository.getCollateralWithDetails as jest.Mock<any>).mockRejectedValue(testError);
      
      // Act
      await collateralController.getCollateralByNumber(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Assert
      expect(CollateralRepository.getCollateralWithDetails).toHaveBeenCalledWith(testCollateralNumber);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(testError);
    });
  });
});