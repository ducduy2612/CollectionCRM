import { Request, Response } from 'express';
import { CustomerController } from '../../src/controllers/customer.controller';
import { CustomerRepository } from '../../src/repositories/customer.repository';
import { describe, expect, it, beforeEach, jest } from '@jest/globals';

// Mock the repositories
jest.mock('../../src/repositories/customer.repository', () => ({
  CustomerRepository: {
    getCustomerWithDetails: jest.fn(),
    findByNaturalKey: jest.fn(),
    searchCustomers: jest.fn()
  }
}));
jest.mock('../../src/repositories/loan.repository');
jest.mock('../../src/repositories/collateral.repository');
jest.mock('../../src/repositories/reference-customer.repository');

describe('CustomerController', () => {
  let customerController: CustomerController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    // Create controller instance
    customerController = new CustomerController();
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock request, response, and next function
    mockRequest = {
      params: {},
      query: {}
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    } as unknown as Response;
    
    mockNext = jest.fn();
  });

  describe('getCustomerByCif', () => {
    it('should return customer when valid CIF is provided', async () => {
      // Arrange
      const testCif = 'CIF10000001';
      const mockCustomer = { 
        id: '123', 
        cif: testCif, 
        name: 'John Doe',
        phones: [],
        addresses: [],
        emails: []
      };
      
      mockRequest.params = { cif: testCif };
      
      // Mock repository method
      (CustomerRepository.getCustomerWithDetails as jest.Mock<any>).mockResolvedValue(mockCustomer);
      
      // Act
      await customerController.getCustomerByCif(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Assert
      expect(CustomerRepository.getCustomerWithDetails).toHaveBeenCalledWith(testCif);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCustomer,
        message: 'Customer retrieved successfully',
        errors: []
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error when CIF is not provided', async () => {
      // Arrange
      mockRequest.params = {};
      
      // Act
      await customerController.getCustomerByCif(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Assert
      expect(CustomerRepository.getCustomerWithDetails).not.toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next with error when customer is not found', async () => {
      // Arrange
      const testCif = 'non-existent-cif';
      mockRequest.params = { cif: testCif };
      
      // Mock repository method to return undefined (customer not found)
      (CustomerRepository.getCustomerWithDetails as jest.Mock<any>).mockResolvedValue(undefined);
      
      // Act
      await customerController.getCustomerByCif(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Assert
      expect(CustomerRepository.getCustomerWithDetails).toHaveBeenCalledWith(testCif);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('searchCustomers', () => {
    it('should return paginated customers when search criteria are provided', async () => {
      // Arrange
      const mockSearchResult = {
        items: [
          { id: '123', cif: '1001', name: 'John Doe' },
          { id: '456', cif: '1002', name: 'Jane Smith' }
        ],
        pagination: {
          page: 1,
          pageSize: 10,
          totalPages: 1,
          totalItems: 2
        }
      };
      
      mockRequest.query = {
        name: 'John',
        page: '1',
        pageSize: '10'
      };
      
      // Mock repository method
      (CustomerRepository.searchCustomers as jest.Mock<any>).mockResolvedValue(mockSearchResult);
      
      // Act
      await customerController.searchCustomers(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Assert
      expect(CustomerRepository.searchCustomers).toHaveBeenCalledWith({
        name: 'John',
        nationalId: undefined,
        companyName: undefined,
        registrationNumber: undefined,
        segment: undefined,
        status: undefined,
        page: 1,
        pageSize: 10
      });
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          customers: mockSearchResult.items,
          pagination: mockSearchResult.pagination
        },
        message: 'Customers retrieved successfully',
        errors: []
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});