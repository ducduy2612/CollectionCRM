import { body, param, query } from 'express-validator';

// Document types that are allowed
const DOCUMENT_TYPES = [
  'NATIONAL_ID',
  'PASSPORT', 
  'DRIVER_LICENSE',
  'BANK_STATEMENT',
  'SALARY_SLIP',
  'TAX_RETURN',
  'LOAN_AGREEMENT',
  'PROMISSORY_NOTE',
  'COLLATERAL_DOCS',
  'PAYMENT_RECEIPT',
  'SETTLEMENT_AGREEMENT',
  'LEGAL_NOTICE',
  'CORRESPONDENCE',
  'OTHER'
];

// Document categories that are allowed
const DOCUMENT_CATEGORIES = [
  'IDENTITY',
  'FINANCIAL',
  'LOAN',
  'COLLECTION',
  'LEGAL',
  'OTHER'
];

export const documentValidation = {
  /**
   * Validation for document upload
   */
  upload: [
    body('cif')
      .notEmpty()
      .withMessage('Customer CIF is required')
      .isString()
      .withMessage('CIF must be a string')
      .isLength({ min: 1, max: 50 })
      .withMessage('CIF must be between 1 and 50 characters'),
    
    body('loanAccountNumber')
      .optional()
      .isString()
      .withMessage('Loan account number must be a string')
      .isLength({ max: 50 })
      .withMessage('Loan account number must not exceed 50 characters'),
    
    body('documentType')
      .notEmpty()
      .withMessage('Document type is required')
      .isIn(DOCUMENT_TYPES)
      .withMessage(`Document type must be one of: ${DOCUMENT_TYPES.join(', ')}`),
    
    body('documentCategory')
      .notEmpty()
      .withMessage('Document category is required')
      .isIn(DOCUMENT_CATEGORIES)
      .withMessage(`Document category must be one of: ${DOCUMENT_CATEGORIES.join(', ')}`),
    
    body('metadata')
      .optional()
      .custom((value) => {
        if (typeof value === 'string') {
          try {
            JSON.parse(value);
            return true;
          } catch {
            throw new Error('Metadata must be valid JSON');
          }
        }
        if (typeof value === 'object' && value !== null) {
          return true;
        }
        throw new Error('Metadata must be a JSON object');
      }),
    
    body('tags')
      .optional()
      .custom((value) => {
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            if (!Array.isArray(parsed)) {
              throw new Error('Tags must be an array');
            }
            return true;
          } catch {
            throw new Error('Tags must be a valid JSON array');
          }
        }
        if (Array.isArray(value)) {
          return true;
        }
        throw new Error('Tags must be an array');
      })
  ],

  /**
   * Validation for getting customer documents
   */
  getByCustomer: [
    param('cif')
      .notEmpty()
      .withMessage('Customer CIF is required')
      .isString()
      .withMessage('CIF must be a string')
      .isLength({ min: 1, max: 50 })
      .withMessage('CIF must be between 1 and 50 characters'),
    
    query('documentType')
      .optional()
      .isIn(DOCUMENT_TYPES)
      .withMessage(`Document type must be one of: ${DOCUMENT_TYPES.join(', ')}`),
    
    query('documentCategory')
      .optional()
      .isIn(DOCUMENT_CATEGORIES)
      .withMessage(`Document category must be one of: ${DOCUMENT_CATEGORIES.join(', ')}`),
    
    query('loanAccountNumber')
      .optional()
      .isString()
      .withMessage('Loan account number must be a string')
      .isLength({ max: 50 })
      .withMessage('Loan account number must not exceed 50 characters'),

    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('pageSize')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Page size must be between 1 and 100')
  ],

  /**
   * Validation for getting loan documents
   */
  getByLoan: [
    param('loanAccountNumber')
      .notEmpty()
      .withMessage('Loan account number is required')
      .isString()
      .withMessage('Loan account number must be a string')
      .isLength({ min: 1, max: 50 })
      .withMessage('Loan account number must be between 1 and 50 characters'),
    
    query('documentType')
      .optional()
      .isIn(DOCUMENT_TYPES)
      .withMessage(`Document type must be one of: ${DOCUMENT_TYPES.join(', ')}`),
    
    query('documentCategory')
      .optional()
      .isIn(DOCUMENT_CATEGORIES)
      .withMessage(`Document category must be one of: ${DOCUMENT_CATEGORIES.join(', ')}`),

    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('pageSize')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Page size must be between 1 and 100')
  ],

  /**
   * Validation for document download
   */
  download: [
    param('id')
      .notEmpty()
      .withMessage('Document ID is required')
      .isUUID()
      .withMessage('Document ID must be a valid UUID')
  ],

  /**
   * Validation for presigned URL generation
   */
  presignedUrl: [
    param('id')
      .notEmpty()
      .withMessage('Document ID is required')
      .isUUID()
      .withMessage('Document ID must be a valid UUID'),
    
    query('expiry')
      .optional()
      .isInt({ min: 60, max: 86400 }) // 1 minute to 24 hours
      .withMessage('Expiry must be between 60 seconds and 24 hours')
  ],

  /**
   * Validation for document deletion
   */
  delete: [
    param('id')
      .notEmpty()
      .withMessage('Document ID is required')
      .isUUID()
      .withMessage('Document ID must be a valid UUID')
  ],

  /**
   * Validation for getting document by ID
   */
  getById: [
    param('id')
      .notEmpty()
      .withMessage('Document ID is required')
      .isUUID()
      .withMessage('Document ID must be a valid UUID')
  ],

  /**
   * Validation for updating document metadata
   */
  updateMetadata: [
    param('id')
      .notEmpty()
      .withMessage('Document ID is required')
      .isUUID()
      .withMessage('Document ID must be a valid UUID'),
    
    body('metadata')
      .optional()
      .custom((value) => {
        if (typeof value === 'string') {
          try {
            JSON.parse(value);
            return true;
          } catch {
            throw new Error('Metadata must be valid JSON');
          }
        }
        if (typeof value === 'object' && value !== null) {
          return true;
        }
        throw new Error('Metadata must be a JSON object');
      }),
    
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    
    body('tags.*')
      .optional()
      .isString()
      .withMessage('Each tag must be a string')
      .isLength({ min: 1, max: 50 })
      .withMessage('Each tag must be between 1 and 50 characters')
  ],

  /**
   * Validation for document search
   */
  search: [
    query('cif')
      .optional()
      .isString()
      .withMessage('CIF must be a string')
      .isLength({ min: 1, max: 50 })
      .withMessage('CIF must be between 1 and 50 characters'),
    
    query('loanAccountNumber')
      .optional()
      .isString()
      .withMessage('Loan account number must be a string')
      .isLength({ max: 50 })
      .withMessage('Loan account number must not exceed 50 characters'),
    
    query('documentType')
      .optional()
      .isIn(DOCUMENT_TYPES)
      .withMessage(`Document type must be one of: ${DOCUMENT_TYPES.join(', ')}`),
    
    query('documentCategory')
      .optional()
      .isIn(DOCUMENT_CATEGORIES)
      .withMessage(`Document category must be one of: ${DOCUMENT_CATEGORIES.join(', ')}`),
    
    query('uploadedBy')
      .optional()
      .isUUID()
      .withMessage('Uploaded by must be a valid UUID'),
    
    query('status')
      .optional()
      .isIn(['active', 'deleted'])
      .withMessage('Status must be either active or deleted'),
    
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('pageSize')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Page size must be between 1 and 100')
  ]
};

export { DOCUMENT_TYPES, DOCUMENT_CATEGORIES };