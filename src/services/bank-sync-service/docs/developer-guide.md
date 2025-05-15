# Bank Synchronization Service Developer Guide

This guide provides comprehensive information for developers working with the Bank Synchronization Microservice. It covers setup, configuration, development practices, and common use cases.

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
   - [Configuration](#configuration)
3. [Architecture Overview](#architecture-overview)
4. [Core Components](#core-components)
   - [API Layer](#api-layer)
   - [Core Business Logic](#core-business-logic)
   - [Data Access Layer](#data-access-layer)
   - [Synchronization Engine](#synchronization-engine)
5. [Development Guidelines](#development-guidelines)
   - [Code Structure](#code-structure)
   - [Coding Standards](#coding-standards)
   - [Error Handling](#error-handling)
   - [Logging](#logging)
   - [Testing](#testing)
6. [Common Development Tasks](#common-development-tasks)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

## Introduction

The Bank Synchronization Microservice is responsible for synchronizing data from external banking systems and providing access to customer, loan, and collateral data. It implements robust error handling, retry mechanisms, and monitoring to ensure reliable data synchronization.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- Node.js 18+ (LTS)
- npm 9+
- PostgreSQL 15+
- Redis 7+
- Git

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-organization/collectioncrm.git
cd collectioncrm/src/services/bank-sync-service
```

2. Install dependencies:

```bash
npm install
```

3. Set up the database:

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE bank_sync_db;"

# Run migrations
npm run migrate
```

4. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

### Configuration

The service uses a hierarchical configuration system with the following sources (in order of precedence):

1. Environment variables
2. `.env` file
3. Default configuration

Key configuration files:

- `src/config/env.config.ts`: Environment variable configuration
- `src/config/database.ts`: Database configuration
- `src/config/swagger.ts`: API documentation configuration

Example `.env` file:

```
# Server
PORT=3002
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bank_sync_db
DB_USER=postgres
DB_PASSWORD=postgres

# Authentication
JWT_SECRET=your-jwt-secret
JWT_EXPIRATION=1h

# External Systems
T24_API_URL=https://t24-api.example.com
T24_API_KEY=your-t24-api-key
W4_API_URL=https://w4-api.example.com
W4_API_KEY=your-w4-api-key

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Logging
LOG_LEVEL=info
```

## Architecture Overview

The Bank Synchronization Microservice follows a layered architecture:

1. **API Layer**: Handles HTTP requests and responses
2. **Core Business Logic**: Implements business rules and orchestrates operations
3. **Data Access Layer**: Manages database interactions
4. **Synchronization Engine**: Handles data synchronization with external systems

For a detailed architecture diagram, see [Architecture Diagrams](./architecture-diagrams.md).

## Core Components

### API Layer

The API layer is built using Express.js and implements the API contract defined in the [API Documentation](./api-documentation.md).

Key components:

- **Routes**: Define API endpoints and map them to controllers
- **Controllers**: Handle request processing and response formatting
- **Middleware**: Implement cross-cutting concerns like authentication, validation, and error handling

Example route definition:

```typescript
// src/routes/customer.routes.ts
import { Router } from 'express';
import { CustomerController } from '../controllers';
import { authMiddleware, validationMiddleware } from '../middleware';

const router = Router();

router.get(
  '/:cif',
  authMiddleware.authenticate,
  authMiddleware.authorize(['READ_CUSTOMER']),
  CustomerController.getCustomerByNaturalKey
);

router.get(
  '/',
  authMiddleware.authenticate,
  authMiddleware.authorize(['READ_CUSTOMER']),
  validationMiddleware.validateQuery(['name', 'nationalId', 'status']),
  CustomerController.searchCustomers
);

export default router;
```

### Core Business Logic

The core business logic is implemented in service classes that encapsulate business rules and orchestrate operations.

Key components:

- **Services**: Implement business logic and orchestrate operations
- **DTOs**: Define data transfer objects for service interfaces
- **Validators**: Validate business rules

Example service implementation:

```typescript
// src/services/customer.service.ts
import { CustomerRepository } from '../repositories';
import { Customer } from '../models';
import { Errors } from '../errors';

export class CustomerService {
  constructor(private customerRepository: CustomerRepository) {}

  async getCustomerByNaturalKey(cif: string): Promise<Customer> {
    const customer = await this.customerRepository.findByNaturalKey(cif);
    
    if (!customer) {
      throw Errors.create(
### Data Access Layer

The data access layer manages database interactions using TypeORM.

Key components:

- **Entity Models**: Define database schema using TypeORM decorators
- **Repositories**: Implement data access operations
- **Migrations**: Handle database schema changes

Example entity model:

```typescript
// src/models/customer.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { Phone, Address, Email, Loan, Collateral } from './';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column({ unique: true })
  cif: string;
  
  @Column({ type: 'enum', enum: CustomerType })
  type: CustomerType;
  
  @Column({ nullable: true })
  name: string;
  
  // Other fields...
  
  @OneToMany(() => Phone, phone => phone.customer)
  phones: Phone[];
  
  @OneToMany(() => Address, address => address.customer)
  addresses: Address[];
  
  @OneToMany(() => Email, email => email.customer)
  emails: Email[];
  
  @OneToMany(() => Loan, loan => loan.customer)
  loans: Loan[];
  
  @OneToMany(() => Collateral, collateral => collateral.customer)
  collaterals: Collateral[];
  
  @CreateDateColumn()
  createdAt: Date;
  
  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Synchronization Engine

The synchronization engine handles data synchronization with external systems.

Key components:

- **Source Connectors**: Connect to external systems
- **Data Extractors**: Extract data from external systems
- **Data Transformers**: Transform data to match internal models
- **Data Loaders**: Load transformed data into the database
- **Sync Orchestrator**: Coordinate the ETL process

Example source connector:

```typescript
// src/sync/connectors/t24-connector.ts
import axios from 'axios';
import { SourceConnector, ExtractOptions, RawData } from '../types';
import { config } from '../../config';
import { withRetryPolicy } from '../../utils/retry';
import { OperationType, SourceSystemType } from '../../errors';

export class T24Connector implements SourceConnector {
  private client: any;
  private isConnected: boolean = false;

  async connect(): Promise<void> {
    this.client = axios.create({
      baseURL: config.t24.apiUrl,
      headers: {
        'Authorization': `ApiKey ${config.t24.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    this.isConnected = true;
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
  }

  isConnected(): boolean {
    return this.isConnected;
  }

  async extractData(entityType: string, options?: ExtractOptions): Promise<RawData[]> {
    if (!this.isConnected) {
      await this.connect();
    }

    return withRetryPolicy(
      OperationType.API_CALL,
      async () => {
        const response = await this.client.get(`/api/${entityType}`, {
          params: options?.queryParams
        });
        
        return response.data;
      },
      {
        sourceSystem: SourceSystemType.T24
      }
    );
  }
}
```

## Development Guidelines

### Code Structure

The codebase follows a modular structure:

```
src/
├── app.ts                 # Express application setup
├── index.ts               # Application entry point
├── config/                # Configuration files
├── controllers/           # API controllers
├── errors/                # Error handling
├── middleware/            # Express middleware
├── models/                # TypeORM entity models
├── repositories/          # Data access repositories
├── routes/                # API routes
├── services/              # Business logic services
├── sync/                  # Synchronization engine
│   ├── connectors/        # Source system connectors
│   ├── extractors/        # Data extractors
│   ├── transformers/      # Data transformers
│   ├── loaders/           # Data loaders
│   └── orchestrator.ts    # Sync orchestrator
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions
```

### Coding Standards

The project follows these coding standards:

- Use TypeScript for type safety
- Follow ESLint rules defined in `.eslintrc.js`
- Format code using Prettier
- Write JSDoc comments for public APIs
- Use async/await for asynchronous code
- Use dependency injection for testability

### Error Handling

The service uses a centralized error handling approach:

1. Use the `Errors` utility for creating and handling errors
2. Classify errors into appropriate types
3. Include relevant context in error details
4. Use middleware for consistent error responses

Example error handling:

```typescript
import { Errors, OperationType, SourceSystemType } from '../errors';

try {
  // Operation that might fail
  await someOperation();
} catch (error) {
  // Wrap the error with context
  throw Errors.wrap(
    error as Error,
    OperationType.SYNC,
    SourceSystemType.T24,
    { entityType: 'Customer', identifier: 'C123456789' }
  );
}
```

### Logging

The service uses a structured logging approach:

1. Use the logger utility for all logging
2. Include relevant context in log entries
3. Use appropriate log levels (debug, info, warn, error)

Example logging:

```typescript
import { logger } from '../utils/logger';

// Simple logging
logger.info('Processing customer data');

// Logging with context
logger.info('Customer data processed', {
  cif: 'C123456789',
  recordCount: 10,
  duration: 1500
});

// Error logging
try {
  // Operation that might fail
  await someOperation();
} catch (error) {
  logger.error('Failed to process customer data', error, {
    cif: 'C123456789'
  });
}
```

### Testing

The project uses Jest for testing:

1. Write unit tests for business logic
2. Write integration tests for API endpoints
3. Use mocks and stubs for external dependencies
4. Aim for high test coverage

## Common Development Tasks

### Adding a New API Endpoint

To add a new API endpoint:

1. Define the route in the appropriate route file:

```typescript
// src/routes/customer.routes.ts
router.get(
  '/:cif/references',
  authMiddleware.authenticate,
  authMiddleware.authorize(['READ_CUSTOMER']),
  CustomerController.getCustomerReferences
);
```

2. Implement the controller method:

```typescript
// src/controllers/customer.controller.ts
static async getCustomerReferences(req: Request, res: Response, next: NextFunction) {
  try {
    const { cif } = req.params;
    const { page, pageSize } = req.query;
    
    const customerService = new CustomerService(new CustomerRepository());
    const result = await customerService.getCustomerReferences(
      cif,
      {
        page: parseInt(page as string) || 1,
        pageSize: parseInt(pageSize as string) || 10
      }
    );
    
    res.json({
      success: true,
      data: result,
      message: 'Customer references retrieved successfully',
      errors: []
    });
  } catch (error) {
    next(error);
  }
}
```

3. Implement the service method:

```typescript
// src/services/customer.service.ts
async getCustomerReferences(
  cif: string,
  pagination: PaginationOptions
): Promise<PaginatedResult<ReferenceCustomer>> {
  const customer = await this.getCustomerByNaturalKey(cif);
  return this.referenceCustomerRepository.findByPrimaryCustomer(customer.id, pagination);
}
```

4. Update the API documentation in `swagger.ts`

### Creating a New Entity

To create a new entity:

1. Define the entity model:

```typescript
// src/models/payment-schedule.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { Loan } from './loan.entity';

@Entity('payment_schedules')
export class PaymentSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column()
  loanId: string;
  
  @Column({ type: 'date' })
  dueDate: Date;
  
  @Column({ type: 'decimal', precision: 18, scale: 2 })
  principalAmount: number;
  
  @Column({ type: 'decimal', precision: 18, scale: 2 })
  interestAmount: number;
  
  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  feesAmount: number;
  
  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  penaltyAmount: number;
  
  @Column({ type: 'boolean', default: false })
  isPaid: boolean;
  
  @Column({ type: 'date', nullable: true })
  paidDate: Date;
  
  @ManyToOne(() => Loan, loan => loan.paymentSchedules)
  @JoinColumn({ name: 'loanId' })
  loan: Loan;
  
  @CreateDateColumn()
  createdAt: Date;
  
  @UpdateDateColumn()
  updatedAt: Date;
}
```

2. Update the related entity:

```typescript
// src/models/loan.entity.ts
// Add the relationship
@OneToMany(() => PaymentSchedule, schedule => schedule.loan)
paymentSchedules: PaymentSchedule[];
```

3. Create a repository:

```typescript
// src/repositories/payment-schedule.repository.ts
import { Repository, EntityRepository } from 'typeorm';
import { PaymentSchedule } from '../models';

@EntityRepository(PaymentSchedule)
export class PaymentScheduleRepository extends Repository<PaymentSchedule> {
  async findByLoanId(loanId: string): Promise<PaymentSchedule[]> {
    return this.find({
      where: { loanId },
      order: { dueDate: 'ASC' }
    });
  }
  
  async findUpcomingPayments(loanId: string): Promise<PaymentSchedule[]> {
    const today = new Date();
    
    return this.find({
      where: {
        loanId,
        isPaid: false,
        dueDate: MoreThanOrEqual(today)
      },
      order: { dueDate: 'ASC' }
    });
  }
}
```

4. Create a migration:

```bash
npm run migration:create -- -n CreatePaymentScheduleTable
```

## Testing

### Unit Testing

Unit tests focus on testing individual components in isolation.

Example unit test:

```typescript
// src/services/__tests__/customer.service.test.ts
import { CustomerService } from '../customer.service';
import { CustomerRepository } from '../../repositories';
import { Customer } from '../../models';
import { Errors } from '../../errors';

// Mock the repository
jest.mock('../../repositories/customer.repository');

describe('CustomerService', () => {
  let customerService: CustomerService;
  let mockCustomerRepository: jest.Mocked<CustomerRepository>;

  beforeEach(() => {
    mockCustomerRepository = new CustomerRepository() as jest.Mocked<CustomerRepository>;
    customerService = new CustomerService(mockCustomerRepository);
  });

  describe('getCustomerByNaturalKey', () => {
    it('should return customer when found', async () => {
      // Arrange
      const mockCustomer = new Customer();
      mockCustomer.cif = 'C123456789';
      mockCustomer.name = 'John Doe';
      
      mockCustomerRepository.findByNaturalKey.mockResolvedValue(mockCustomer);

      // Act
      const result = await customerService.getCustomerByNaturalKey('C123456789');

      // Assert
      expect(result).toBe(mockCustomer);
      expect(mockCustomerRepository.findByNaturalKey).toHaveBeenCalledWith('C123456789');
    });

    it('should throw error when customer not found', async () => {
      // Arrange
      mockCustomerRepository.findByNaturalKey.mockResolvedValue(null);

      // Act & Assert
      await expect(customerService.getCustomerByNaturalKey('C123456789'))
        .rejects
        .toThrow(expect.objectContaining({
          details: expect.objectContaining({
            code: Errors.Database.RECORD_NOT_FOUND
          })
        }));
    });
  });
});
```

## Troubleshooting

### Common Issues

#### Database Connection Issues

**Symptoms:**
- Error messages like "Connection refused" or "Authentication failed"
- Service fails to start

**Solutions:**
1. Check database connection settings in `.env` file
2. Verify that the PostgreSQL server is running
3. Check network connectivity to the database server
4. Verify database user permissions

#### External System Connection Issues

**Symptoms:**
- Synchronization jobs fail with connection errors
- Error messages like "Connection timeout" or "Service unavailable"

**Solutions:**
1. Check external system connection settings in `.env` file
2. Verify network connectivity to the external system
3. Check if the external system is operational
4. Verify API credentials

#### Memory Leaks

**Symptoms:**
- Service memory usage increases over time
- Service becomes unresponsive after running for a while

**Solutions:**
1. Check for unhandled promises or unclosed resources
2. Monitor memory usage with tools like `node-memwatch`
3. Implement proper cleanup in error handling paths
4. Consider implementing a memory limit and automatic restart

### Debugging Techniques

#### Using Debug Logs

Enable debug logs by setting the `LOG_LEVEL` environment variable:

```
LOG_LEVEL=debug
```

This will output detailed logs that can help identify issues.

#### Using Node.js Inspector

Start the service with the inspector enabled:

```bash
node --inspect src/index.js
```

Then connect to the inspector using Chrome DevTools or VS Code.

#### Analyzing Database Queries

Enable query logging in TypeORM by setting the `logging` option to `true` in the database configuration:

```typescript
// src/config/database.ts
export const databaseConfig = {
  // ...other options
  logging: true
};
```

This will log all SQL queries to the console.
        Errors.Database.RECORD_NOT_FOUND,
        `Customer with CIF ${cif} not found`
      );
    }
    
    return customer;
  }

  async searchCustomers(criteria: CustomerSearchCriteria): Promise<PaginatedResult<Customer>> {
    return this.customerRepository.search(criteria);
  }
}