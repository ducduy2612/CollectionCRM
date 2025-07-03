import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { ValidationErrorCodes, Errors, OperationType, SourceSystemType } from '../utils/errors';

/**
 * Interface for validation error
 */
interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Interface for field validator
 */
interface FieldValidator {
  field: string;
  validate: (value: any) => boolean;
  message: string;
}

/**
 * Middleware to validate request fields
 * @param validators Array of field validators
 */
export const validateFields = (validators: FieldValidator[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: ValidationError[] = [];
    
    // Check each validator
    validators.forEach(validator => {
      const value = req.body[validator.field] || req.query[validator.field] || req.params[validator.field];
      
      if (!validator.validate(value)) {
        errors.push({
          field: validator.field,
          message: validator.message,
          code: 'VALIDATION_ERROR'
        });
      }
    });
    
    if (errors.length === 0) {
      return next();
    }
    
    // Return validation error response
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Validation failed',
      errors
    });
  };
};

/**
 * Middleware to validate pagination parameters
 */
export const validatePagination = (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  
  const errors: ValidationError[] = [];
  
  // Validate page number
  if (page < 1) {
    errors.push({
      field: 'page',
      message: 'Page number must be greater than or equal to 1',
      code: 'VALIDATION_ERROR'
    });
  }
  
  // Validate page size
  if (pageSize < 1 || pageSize > 500) {
    errors.push({
      field: 'pageSize',
      message: 'Page size must be between 1 and 500',
      code: 'VALIDATION_ERROR'
    });
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Validation failed',
      errors
    });
  }
  
  // Add validated pagination parameters to request
  req.query.page = page.toString();
  req.query.pageSize = pageSize.toString();
  
  next();
};

/**
 * Common validators
 */
export const Validators = {
  required: (field: string) => ({
    field,
    validate: (value: any) => value !== undefined && value !== null && value !== '',
    message: `${field} is required`
  }),
  
  isString: (field: string) => ({
    field,
    validate: (value: any) => typeof value === 'string',
    message: `${field} must be a string`
  }),
  
  isNumber: (field: string) => ({
    field,
    validate: (value: any) => !isNaN(Number(value)),
    message: `${field} must be a number`
  }),
  
  isDate: (field: string) => ({
    field,
    validate: (value: any) => !isNaN(Date.parse(value)),
    message: `${field} must be a valid date`
  }),
  
  minLength: (field: string, min: number) => ({
    field,
    validate: (value: any) => typeof value === 'string' && value.length >= min,
    message: `${field} must be at least ${min} characters long`
  }),
  
  maxLength: (field: string, max: number) => ({
    field,
    validate: (value: any) => typeof value === 'string' && value.length <= max,
    message: `${field} must be at most ${max} characters long`
  }),
  
  isIn: (field: string, values: any[]) => ({
    field,
    validate: (value: any) => values.includes(value),
    message: `${field} must be one of: ${values.join(', ')}`
  }),
  
  isEnum: (field: string, enumType: any) => ({
    field,
    validate: (value: any) => Object.values(enumType).includes(value),
    message: `${field} must be one of: ${Object.values(enumType).join(', ')}`
  })
};

/**
 * Middleware to validate request using express-validator
 * @param validations Array of express-validator validation chains
 */
export const validateRequest = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    for (const validation of validations) {
      await validation.run(req);
    }

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(error => ({
          field: error.type === 'field' ? (error as any).path : error.type,
          message: error.msg,
          value: error.type === 'field' ? (error as any).value : undefined
        }))
      });
    }

    next();
  };
};