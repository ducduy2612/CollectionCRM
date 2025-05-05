# Bank Synchronization Microservice API Contract

## Overview

This document defines the API contract for the Bank Synchronization Microservice, which is responsible for synchronizing data from external banking systems and providing access to customer, loan, and collateral data.

## Base URL

```
/api/v1/bank-sync
```

## Authentication

All API endpoints require authentication using JWT tokens. The token must be included in the `Authorization` header using the Bearer scheme.

```
Authorization: Bearer <token>
```

## Common Response Codes

| Status Code | Description |
|-------------|-------------|
| 200 | OK - The request was successful |
| 201 | Created - The resource was successfully created |
| 400 | Bad Request - The request was invalid or cannot be served |
| 401 | Unauthorized - Authentication is required or failed |
| 403 | Forbidden - The user does not have permission to access the resource |
| 404 | Not Found - The resource was not found |
| 409 | Conflict - The request conflicts with the current state of the resource |
| 500 | Internal Server Error - An error occurred on the server |

## Common Response Format

All responses follow a standard format:

```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "errors": []
}
```

For error responses:

```json
{
  "success": false,
  "data": null,
  "message": "Operation failed",
  "errors": [
    {
      "code": "ERROR_CODE",
      "message": "Detailed error message"
    }
  ]
}
```

## API Endpoints

### Synchronization Operations

#### Get Synchronization Status

Retrieves the status of synchronization operations.

**Endpoint:** `GET /sync/status`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| sourceSystem | string | No | Filter by source system (T24, W4, OTHER) |
| entityType | string | No | Filter by entity type (Customer, Loan, etc.) |
| startDate | string (date-time) | No | Filter by start date (ISO 8601 format) |
| endDate | string (date-time) | No | Filter by end date (ISO 8601 format) |

**Response:**

```json
{
  "success": true,
  "data": {
    "syncStatus": [
      {
        "id": "sync-123",
        "sourceSystem": "T24",
        "entityType": "Customer",
        "startTime": "2025-01-01T00:00:00Z",
        "endTime": "2025-01-01T01:00:00Z",
        "status": "COMPLETED",
        "recordsProcessed": 1000,
        "recordsSucceeded": 990,
        "recordsFailed": 10,
        "lastSyncedAt": "2025-01-01T01:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalPages": 5,
      "totalItems": 45
    }
  },
  "message": "Sync status retrieved successfully",
  "errors": []
}
```

#### Trigger Synchronization

Triggers a synchronization operation.

**Endpoint:** `POST /sync/run`

**Request Body:**

```json
{
  "sourceSystem": "T24",
  "entityType": "Customer",
  "fullSync": false,
  "syncOptions": {
    "batchSize": 1000,
    "priority": "HIGH"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "syncJobId": "sync-job-123",
    "status": "INITIATED",
    "estimatedCompletionTime": "2025-01-01T02:00:00Z"
  },
  "message": "Synchronization initiated successfully",
  "errors": []
}
```

### Customer Operations

#### Get Customer by CIF

Retrieves a customer by CIF number.

**Endpoint:** `GET /customers/{cif}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| cif | string | Yes | Customer CIF number |

**Response:**

```json
{
  "success": true,
  "data": {
    "cif": "C123456789",
    "type": "INDIVIDUAL",
    "name": "John Doe",
    "dateOfBirth": "1980-01-01",
    "nationalId": "ID12345678",
    "gender": "MALE",
    "segment": "RETAIL",
    "status": "ACTIVE",
    "sourceSystem": "T24",
    "createdBy": "SYSTEM",
    "updatedBy": "SYSTEM",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z",
    "isEditable": false,
    "lastSyncedAt": "2025-01-01T00:00:00Z",
    "contactInfo": {
      "phones": [
        {
          "type": "MOBILE",
          "number": "+84123456789",
          "isPrimary": true,
          "isVerified": true,
          "verificationDate": "2025-01-01T00:00:00Z"
        }
      ],
      "addresses": [
        {
          "type": "HOME",
          "addressLine1": "123 Main St",
          "addressLine2": "Apt 4B",
          "city": "Hanoi",
          "state": "Hanoi",
          "district": "Ba Dinh",
          "country": "Vietnam",
          "isPrimary": true,
          "isVerified": true,
          "verificationDate": "2025-01-01T00:00:00Z"
        }
      ],
      "emails": [
        {
          "address": "john.doe@example.com",
          "isPrimary": true,
          "isVerified": true,
          "verificationDate": "2025-01-01T00:00:00Z"
        }
      ]
    }
  },
  "message": "Customer retrieved successfully",
  "errors": []
}
```

#### Search Customers

Searches for customers based on criteria.

**Endpoint:** `GET /customers`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| name | string | No | Customer name (partial match) |
| nationalId | string | No | National ID number (exact match) |
| companyName | string | No | Company name (partial match) |
| registrationNumber | string | No | Registration number (exact match) |
| segment | string | No | Customer segment |
| status | string | No | Customer status (ACTIVE, INACTIVE) |
| page | integer | No | Page number (default: 1) |
| pageSize | integer | No | Page size (default: 10, max: 100) |

**Response:**

```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "cif": "C123456789",
        "type": "INDIVIDUAL",
        "name": "John Doe",
        "nationalId": "ID12345678",
        "segment": "RETAIL",
        "status": "ACTIVE"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalPages": 5,
      "totalItems": 45
    }
  },
  "message": "Customers retrieved successfully",
  "errors": []
}
```

#### Get Customer Loans

Retrieves loans associated with a customer.

**Endpoint:** `GET /customers/{cif}/loans`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| cif | string | Yes | Customer CIF number |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Loan status (OPEN, CLOSED) |
| productType | string | No | Loan product type |
| page | integer | No | Page number (default: 1) |
| pageSize | integer | No | Page size (default: 10, max: 100) |

**Response:**

```json
{
  "success": true,
  "data": {
    "loans": [
      {
        "accountNumber": "L987654321",
        "cif": "C123456789",
        "productType": "MORTGAGE",
        "originalAmount": 100000.00,
        "currency": "VND",
        "disbursementDate": "2024-01-01",
        "maturityDate": "2034-01-01",
        "interestRate": 5.5,
        "term": 120,
        "paymentFrequency": "MONTHLY",
        "outstanding": 95000.00,
        "remainingAmount": 94000.00,
        "dueAmount": 1000.00,
        "nextPaymentDate": "2025-02-01",
        "dpd": 0,
        "delinquencyStatus": "CURRENT",
        "status": "OPEN"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalPages": 1,
      "totalItems": 1
    }
  },
  "message": "Customer loans retrieved successfully",
  "errors": []
}
```

#### Get Customer Collaterals

Retrieves collaterals associated with a customer.

**Endpoint:** `GET /customers/{cif}/collaterals`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| cif | string | Yes | Customer CIF number |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | string | No | Collateral type |
| page | integer | No | Page number (default: 1) |
| pageSize | integer | No | Page size (default: 10, max: 100) |

**Response:**

```json
{
  "success": true,
  "data": {
    "collaterals": [
      {
        "collateralNumber": "COL123456",
        "cif": "C123456789",
        "type": "REAL_ESTATE",
        "description": "Residential property",
        "value": 200000.00,
        "valuationDate": "2024-12-01",
        "propertyType": "RESIDENTIAL",
        "address": "123 Main St, Hanoi, Vietnam",
        "size": 120.5,
        "titleNumber": "TITLE123456"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalPages": 1,
      "totalItems": 1
    }
  },
  "message": "Customer collaterals retrieved successfully",
  "errors": []
}
```

### Loan Operations

#### Get Loan by Account Number

Retrieves a loan by account number.

**Endpoint:** `GET /loans/{accountNumber}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountNumber | string | Yes | Loan account number |

**Response:**

```json
{
  "success": true,
  "data": {
    "accountNumber": "L987654321",
    "cif": "C123456789",
    "productType": "MORTGAGE",
    "originalAmount": 100000.00,
    "currency": "VND",
    "disbursementDate": "2024-01-01",
    "maturityDate": "2034-01-01",
    "interestRate": 5.5,
    "term": 120,
    "paymentFrequency": "MONTHLY",
    "limit": 0,
    "outstanding": 95000.00,
    "remainingAmount": 94000.00,
    "dueAmount": 1000.00,
    "minPay": 0,
    "nextPaymentDate": "2025-02-01",
    "dpd": 0,
    "delinquencyStatus": "CURRENT",
    "status": "OPEN",
    "sourceSystem": "T24",
    "createdBy": "SYSTEM",
    "updatedBy": "SYSTEM",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z",
    "isEditable": false,
    "lastSyncedAt": "2025-01-01T00:00:00Z",
    "dueSegmentation": [
      {
        "dueDate": "2025-02-01",
        "principalAmount": 800.00,
        "interestAmount": 150.00,
        "feesAmount": 50.00,
        "penaltyAmount": 0.00
      }
    ],
    "collaterals": [
      {
        "collateralNumber": "COL123456",
        "type": "REAL_ESTATE",
        "description": "Residential property",
        "value": 200000.00
      }
    ]
  },
  "message": "Loan retrieved successfully",
  "errors": []
}
```

### Collateral Operations

#### Get Collateral by Number

Retrieves a collateral by collateral number.

**Endpoint:** `GET /collaterals/{collateralNumber}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| collateralNumber | string | Yes | Collateral number |

**Response:**

```json
{
  "success": true,
  "data": {
    "collateralNumber": "COL123456",
    "cif": "C123456789",
    "type": "REAL_ESTATE",
    "description": "Residential property",
    "value": 200000.00,
    "valuationDate": "2024-12-01",
    "propertyType": "RESIDENTIAL",
    "address": "123 Main St, Hanoi, Vietnam",
    "size": 120.5,
    "titleNumber": "TITLE123456",
    "sourceSystem": "T24",
    "createdBy": "SYSTEM",
    "updatedBy": "SYSTEM",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z",
    "isEditable": false,
    "lastSyncedAt": "2025-01-01T00:00:00Z",
    "associatedLoans": [
      {
        "accountNumber": "L987654321",
        "productType": "MORTGAGE",
        "outstanding": 95000.00
      }
    ]
  },
  "message": "Collateral retrieved successfully",
  "errors": []
}
```

### Reference Customer Operations

#### Get Reference Customers

Retrieves reference customers associated with a primary customer.

**Endpoint:** `GET /customers/{cif}/references`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| cif | string | Yes | Primary customer CIF number |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| relationshipType | string | No | Relationship type (GUARANTOR, SPOUSE, etc.) |
| page | integer | No | Page number (default: 1) |
| pageSize | integer | No | Page size (default: 10, max: 100) |

**Response:**

```json
{
  "success": true,
  "data": {
    "references": [
      {
        "refCif": "C987654321",
        "primaryCif": "C123456789",
        "relationshipType": "SPOUSE",
        "type": "INDIVIDUAL",
        "name": "Jane Doe",
        "dateOfBirth": "1982-05-15",
        "nationalId": "ID87654321",
        "gender": "FEMALE",
        "contactInfo": {
          "phones": [
            {
              "type": "MOBILE",
              "number": "+84987654321",
              "isPrimary": true
            }
          ],
          "addresses": [
            {
              "type": "HOME",
              "addressLine1": "123 Main St",
              "city": "Hanoi",
              "country": "Vietnam",
              "isPrimary": true
            }
          ],
          "emails": [
            {
              "address": "jane.doe@example.com",
              "isPrimary": true
            }
          ]
        }
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalPages": 1,
      "totalItems": 1
    }
  },
  "message": "Reference customers retrieved successfully",
  "errors": []
}
```

## Data Models

### Customer

```json
{
  "cif": "string",
  "type": "INDIVIDUAL | ORGANIZATION",
  "name": "string",
  "dateOfBirth": "string (date)",
  "nationalId": "string",
  "gender": "string",
  "companyName": "string",
  "registrationNumber": "string",
  "taxId": "string",
  "segment": "string",
  "status": "ACTIVE | INACTIVE",
  "sourceSystem": "string",
  "createdBy": "string",
  "updatedBy": "string",
  "createdAt": "string (date-time)",
  "updatedAt": "string (date-time)",
  "isEditable": "boolean",
  "lastSyncedAt": "string (date-time)",
  "contactInfo": {
    "phones": [
      {
        "type": "string",
        "number": "string",
        "isPrimary": "boolean",
        "isVerified": "boolean",
        "verificationDate": "string (date-time)"
      }
    ],
    "addresses": [
      {
        "type": "string",
        "addressLine1": "string",
        "addressLine2": "string",
        "city": "string",
        "state": "string",
        "district": "string",
        "country": "string",
        "isPrimary": "boolean",
        "isVerified": "boolean",
        "verificationDate": "string (date-time)"
      }
    ],
    "emails": [
      {
        "address": "string",
        "isPrimary": "boolean",
        "isVerified": "boolean",
        "verificationDate": "string (date-time)"
      }
    ]
  }
}
```

### Loan

```json
{
  "accountNumber": "string",
  "cif": "string",
  "productType": "string",
  "originalAmount": "number",
  "currency": "string",
  "disbursementDate": "string (date)",
  "maturityDate": "string (date)",
  "interestRate": "number",
  "term": "integer",
  "paymentFrequency": "string",
  "limit": "number",
  "outstanding": "number",
  "remainingAmount": "number",
  "dueAmount": "number",
  "minPay": "number",
  "nextPaymentDate": "string (date)",
  "dpd": "integer",
  "delinquencyStatus": "string",
  "status": "OPEN | CLOSED",
  "closeDate": "string (date)",
  "resolutionCode": "string",
  "resolutionNotes": "string",
  "sourceSystem": "string",
  "createdBy": "string",
  "updatedBy": "string",
  "createdAt": "string (date-time)",
  "updatedAt": "string (date-time)",
  "isEditable": "boolean",
  "lastSyncedAt": "string (date-time)",
  "dueSegmentation": [
    {
      "dueDate": "string (date)",
      "principalAmount": "number",
      "interestAmount": "number",
      "feesAmount": "number",
      "penaltyAmount": "number"
    }
  ]
}
```

### Collateral

```json
{
  "collateralNumber": "string",
  "cif": "string",
  "type": "string",
  "description": "string",
  "value": "number",
  "valuationDate": "string (date)",
  "make": "string",
  "model": "string",
  "year": "integer",
  "vin": "string",
  "licensePlate": "string",
  "propertyType": "string",
  "address": "string",
  "size": "number",
  "titleNumber": "string",
  "sourceSystem": "string",
  "createdBy": "string",
  "updatedBy": "string",
  "createdAt": "string (date-time)",
  "updatedAt": "string (date-time)",
  "isEditable": "boolean",
  "lastSyncedAt": "string (date-time)"
}
```

### ReferenceCustomer

```json
{
  "refCif": "string",
  "primaryCif": "string",
  "relationshipType": "string",
  "type": "INDIVIDUAL | ORGANIZATION",
  "name": "string",
  "dateOfBirth": "string (date)",
  "nationalId": "string",
  "gender": "string",
  "companyName": "string",
  "registrationNumber": "string",
  "taxId": "string",
  "sourceSystem": "string",
  "createdBy": "string",
  "updatedBy": "string",
  "createdAt": "string (date-time)",
  "updatedAt": "string (date-time)",
  "isEditable": "boolean",
  "lastSyncedAt": "string (date-time)"
}
```

### SyncStatus

```json
{
  "id": "string",
  "sourceSystem": "string",
  "entityType": "string",
  "startTime": "string (date-time)",
  "endTime": "string (date-time)",
  "status": "string",
  "recordsProcessed": "integer",
  "recordsSucceeded": "integer",
  "recordsFailed": "integer",
  "lastSyncedAt": "string (date-time)"
}
```

### Pagination

```json
{
  "page": "integer",
  "pageSize": "integer",
  "totalPages": "integer",
  "totalItems": "integer"
}