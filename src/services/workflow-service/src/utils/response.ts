import { Response } from 'express';

/**
 * Standard API response interface
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
  errors: ApiError[];
}

/**
 * API error interface
 */
export interface ApiError {
  code: string;
  message: string;
  type?: string;
  details?: Record<string, any>;
}

/**
 * Pagination interface
 */
export interface Pagination {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

/**
 * Paginated response interface
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
}

/**
 * Response utilities
 */
export const ResponseUtil = {
  /**
   * Send a success response
   * @param res Express response object
   * @param data Response data
   * @param message Success message
   * @param statusCode HTTP status code (default: 200)
   */
  success: <T>(
    res: Response,
    data: T,
    message: string = 'Operation successful',
    statusCode: number = 200
  ): Response => {
    return res.status(statusCode).json({
      success: true,
      data,
      message,
      errors: []
    });
  },

  /**
   * Send an error response
   * @param res Express response object
   * @param errors Array of errors
   * @param message Error message
   * @param statusCode HTTP status code (default: 400)
   */
  error: (
    res: Response,
    errors: ApiError[],
    message: string = 'Operation failed',
    statusCode: number = 400
  ): Response => {
    return res.status(statusCode).json({
      success: false,
      data: null,
      message,
      errors
    });
  },

  /**
   * Create a paginated response
   * @param items Array of items
   * @param total Total number of items
   * @param page Current page number
   * @param pageSize Page size
   * @returns Paginated response object
   */
  paginate: <T>(
    items: T[],
    total: number,
    page: number,
    pageSize: number
  ): PaginatedResponse<T> => {
    const totalPages = Math.ceil(total / pageSize);
    
    return {
      items,
      pagination: {
        page,
        pageSize,
        totalPages,
        totalItems: total
      }
    };
  }
};