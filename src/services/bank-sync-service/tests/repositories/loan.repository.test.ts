import { LoanRepository } from '../../src/repositories/loan.repository';
import { AppDataSource } from '../../src/config/data-source';
import { describe, expect, it } from '@jest/globals';

describe('LoanRepository', () => {
  // No need for beforeAll and afterAll here as they are handled in jest-setup.ts

  describe('findByNaturalKey', () => {
    it('should find a loan by account number', async () => {
      // Test using existing data in the test database
      const accountNumber = 'LOAN10000001'; // Assuming this account number exists in the test data
      const loan = await LoanRepository.findByNaturalKey(accountNumber);
      
      expect(loan).toBeDefined();
      expect(loan?.accountNumber).toBe(accountNumber);
    });

    it('should return undefined for non-existent account number', async () => {
      const nonExistentAccountNumber = 'non-existent-loan';
      const loan = await LoanRepository.findByNaturalKey(nonExistentAccountNumber);
      
      expect(loan).toBeUndefined();
    });
  });

  describe('findByCif', () => {
    it('should find loans by customer CIF', async () => {
      // Test using existing data in the test database
      const cif = 'CIF10000001'; // Assuming this CIF exists in the test data
      const result = await LoanRepository.findByCif(cif, {
        page: 1,
        pageSize: 10
      });
      
      expect(result).toBeDefined();
      expect(result.items).toBeInstanceOf(Array);
      expect(result.pagination).toBeDefined();
      
      if (result.items.length > 0) {
        expect(result.items[0].cif).toBe(cif);
      }
    });

    it('should filter loans by status', async () => {
      // Test using existing data in the test database
      const cif = 'CIF10000001'; // Assuming this CIF exists in the test data
      const status = 'OPEN'; // Assuming there are active loans in the test data
      
      const result = await LoanRepository.findByCif(cif, {
        status: status as any,
        page: 1,
        pageSize: 10
      });
      
      expect(result).toBeDefined();
      expect(result.items).toBeInstanceOf(Array);
      
      if (result.items.length > 0) {
        expect(result.items[0].status).toBe(status);
      }
    });

    it('should filter loans by product type', async () => {
      // Test using existing data in the test database
      const cif = 'CIF10000001'; // Assuming this CIF exists in the test data
      const productType = 'PERSONAL'; // Assuming there are PERSONAL loans in the test data
      
      const result = await LoanRepository.findByCif(cif, {
        productType,
        page: 1,
        pageSize: 10
      });
      
      expect(result).toBeDefined();
      expect(result.items).toBeInstanceOf(Array);
      
      if (result.items.length > 0) {
        expect(result.items[0].productType).toBe(productType);
      }
    });
  });

  describe('getLoanWithDetails', () => {
    it('should retrieve loan with all related entities', async () => {
      // Test using existing data in the test database
      const accountNumber = 'LOAN10000001'; // Assuming this account number exists in the test data
      const loan = await LoanRepository.getLoanWithDetails(accountNumber);
      
      expect(loan).toBeDefined();
      expect(loan?.accountNumber).toBe(accountNumber);
      
      // Check that related entities are loaded
      expect(loan?.customer).toBeDefined();
    });
    
    it('should return undefined for non-existent account number', async () => {
      const nonExistentAccountNumber = 'non-existent-loan';
      const loan = await LoanRepository.getLoanWithDetails(nonExistentAccountNumber);
      
      expect(loan).toBeUndefined();
    });
  });

  describe('findBySourceSystem', () => {
    it('should find loans by source system', async () => {
      // Test using existing data in the test database
      const sourceSystem = 'T24'; // Assuming this source system exists in test data
      const loans = await LoanRepository.findBySourceSystem(sourceSystem as any);
      
      expect(loans).toBeDefined();
      expect(loans).toBeInstanceOf(Array);
      
      if (loans.length > 0) {
        expect(loans[0].sourceSystem).toBe(sourceSystem);
      }
    });
  });
});