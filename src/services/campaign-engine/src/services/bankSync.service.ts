import axios from 'axios';
import logger from '../utils/logger';

const BANK_SYNC_SERVICE_API_URL = process.env.BANK_SYNC_SERVICE_API_URL || 'http://api-gateway:3000/bank'; // TODO: Confirm actual URL

interface CustomerData {
  id: string;
  // Add other customer fields as needed for condition evaluation
  // e.g., segment, status, custom_fields (if stored directly in bank-sync-service)
  phones: { type: string; number: string; }[];
  loans: LoanData[];
  // Add other related party data if needed, e.g., reference_customers
  reference_customers?: ReferenceCustomerData[];
  // Add custom fields directly to customer data if they are pre-calculated or directly available
  [key: string]: any; // For dynamic custom fields
}

export interface LoanData {
  id: string;
  customer_id: string;
  status: string;
  outstanding_balance: number;
  due_date: string; // Or Date type if parsed
  // Add other loan fields as needed for condition evaluation
}

export interface ReferenceCustomerData {
  id: string;
  customer_id: string;
  type: string; // e.g., 'parent', 'guarantor'
  phones: { type: string; number: string; }[];
  // Add other fields as needed
}

export const fetchCustomerAndLoanData = async (customerIds: string[]): Promise<CustomerData[]> => {
  logger.info(`Fetching data for ${customerIds.length} customers from bank-sync-service.`);
  try {
    // Assuming bank-sync-service has an endpoint to fetch multiple customers by ID
    // This endpoint should ideally return all necessary related data (loans, phones, reference customers)
    const response = await axios.post(`${BANK_SYNC_SERVICE_API_URL}/customers/batch`, { customerIds });
    logger.info(`Successfully fetched data for ${response.data.length} customers.`);
    return response.data;
  } catch (error) {
    logger.error(`Error fetching customer and loan data for IDs: ${customerIds.join(', ')}`, error);
    throw new Error('Failed to fetch customer and loan data');
  }
};

// TODO: Add more specific data retrieval functions if needed, e.g., for specific custom fields