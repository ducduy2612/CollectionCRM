import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { env } from '../config/env.config';
import { logger } from '../utils/logger';

export interface ContactType {
  value: string;
  label: string;
  description?: string;
}

export interface BankSyncApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export class BankSyncService {
  private httpClient: AxiosInstance;

  constructor() {
    this.httpClient = axios.create({
      baseURL: env.BANK_SYNC_SERVICE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for logging
    this.httpClient.interceptors.request.use(
      (config) => {
        logger.debug(`Bank Sync API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('Bank Sync API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.httpClient.interceptors.response.use(
      (response) => {
        logger.debug(`Bank Sync API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error('Bank Sync API Response Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get phone types from bank-sync-service
   * @returns Promise<ContactType[]>
   */
  async getPhoneTypes(): Promise<ContactType[]> {
    try {
      logger.info('Fetching phone types from bank-sync-service');
      
      const response: AxiosResponse<BankSyncApiResponse<ContactType[]>> = await this.httpClient.get(`${env.BANK_SYNC_API_PREFIX}/phone-types`);
      
      if (!response.data.success) {
        throw new Error(`Bank Sync API error: ${response.data.message}`);
      }

      logger.info(`Retrieved ${response.data.data.length} phone types from bank-sync-service`);
      return response.data.data;
    } catch (error: any) {
      logger.error('Failed to fetch phone types from bank-sync-service:', {
        message: error?.message,
        code: error?.code,
        response: error?.response?.data,
        status: error?.response?.status,
        url: error?.config?.url,
        baseURL: this.httpClient.defaults.baseURL,
        fullURL: `${this.httpClient.defaults.baseURL}${env.BANK_SYNC_API_PREFIX}/phone-types`
      });
      
      throw new Error(`Failed to fetch phone types from bank-sync-service: ${error?.message}`);
    }
  }

  /**
   * Get fallback phone types when bank-sync-service is unavailable
   * @returns ContactType[]
   */
  private getFallbackPhoneTypes(): ContactType[] {
    return [
      { value: 'mobile1', label: 'Mobile Phone 1', description: 'Primary mobile/cellular phone number' },
      { value: 'mobile2', label: 'Mobile Phone 2', description: 'Secondary mobile/cellular phone number' },
      { value: 'home1', label: 'Home Phone 1', description: 'Primary home landline phone number' },
      { value: 'work1', label: 'Work Phone 1', description: 'Primary work/office phone number' },
      { value: 'emergency1', label: 'Emergency Contact 1', description: 'Primary emergency contact phone number' },
    ];
  }
}