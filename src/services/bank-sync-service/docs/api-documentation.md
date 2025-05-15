# Bank Synchronization Microservice API Documentation

## Overview

The Bank Synchronization Microservice is responsible for synchronizing data from external banking systems and providing access to customer, loan, and collateral data. This document provides detailed information about the API endpoints, request/response formats, and usage examples.

## Base URL

```
/api/v1/bank-sync
```

## Authentication

All API endpoints require authentication using JWT tokens. The token must be included in the `Authorization` header using the Bearer scheme.

```
Authorization: Bearer <token>
```

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
| page | integer | No | Page number (default: 1) |
| pageSize | integer | No | Page size (default: 10, max: 100) |

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

**Example:**

```bash
curl -X GET "https://api.example.com/api/v1/bank-sync/sync/status?sourceSystem=T24&entityType=Customer" \
  -H "Authorization: Bearer <token>"
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

**Example:**

```bash
curl -X POST "https://api.example.com/api/v1/bank-sync/sync/run" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceSystem": "T24",
    "entityType": "Customer",
    "fullSync": false,
    "syncOptions": {
      "batchSize": 1000,
      "priority": "HIGH"
    }
  }'
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

**Example:**

```bash
curl -X GET "https://api.example.com/api/v1/bank-sync/customers/C123456789" \
  -H "Authorization: Bearer <token>"
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

**Example:**

```bash
curl -X GET "https://api.example.com/api/v1/bank-sync/customers?name=John&status=ACTIVE" \
  -H "Authorization: Bearer <token>"
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

**Example:**

```bash
curl -X GET "https://api.example.com/api/v1/bank-sync/customers/C123456789/loans?status=OPEN" \
  -H "Authorization: Bearer <token>"
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

**Example:**

```bash
curl -X GET "https://api.example.com/api/v1/bank-sync/customers/C123456789/collaterals" \
  -H "Authorization: Bearer <token>"
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

**Example:**

```bash
curl -X GET "https://api.example.com/api/v1/bank-sync/loans/L987654321" \
  -H "Authorization: Bearer <token>"
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

**Example:**

```bash
curl -X GET "https://api.example.com/api/v1/bank-sync/collaterals/COL123456" \
  -H "Authorization: Bearer <token>"
```

## Error Handling

The API uses a standardized error handling approach. All errors include:

1. An HTTP status code indicating the type of error
2. A structured JSON response with error details
3. An error code that uniquely identifies the error type
4. A human-readable error message

### Common Error Codes

| Error Code | Description |
|------------|-------------|
| AUTH_001 | Invalid token |
| AUTH_002 | Token expired |
| AUTH_003 | Insufficient permissions |
| DB_005 | Record not found |
| SYNC_001 | Extraction failed |
| SYNC_002 | Transformation failed |
| SYNC_003 | Loading failed |
| VAL_001 | Required field missing |
| VAL_002 | Invalid format |

## Rate Limiting

The API implements rate limiting to prevent abuse. The current limits are:

- 100 requests per minute per IP address
- 1000 requests per hour per user

When rate limits are exceeded, the API returns a 429 Too Many Requests response.

## Pagination

All endpoints that return collections support pagination using the following query parameters:

- `page`: The page number (1-based)
- `pageSize`: The number of items per page (default: 10, max: 100)

The response includes pagination metadata:

```json
"pagination": {
  "page": 1,
  "pageSize": 10,
  "totalPages": 5,
  "totalItems": 45
}
```

## Versioning

The API is versioned using URL path versioning. The current version is v1.

## Support

For API support, please contact:

- Email: api-support@collectioncrm.com
- Support Portal: https://support.collectioncrm.com