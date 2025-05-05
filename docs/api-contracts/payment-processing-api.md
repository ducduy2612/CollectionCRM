# Payment Processing Microservice API Contract

## Overview

This document defines the API contract for the Payment Processing Microservice, which is responsible for handling real-time payment processing and synchronization with external payment systems.

## Base URL

```
/api/v1/payments
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

### Payment Operations

#### Get Payments for a Loan

Retrieves payments associated with a loan account.

**Endpoint:** `GET /loan/{accountNumber}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accountNumber | string | Yes | Loan account number |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string (date) | No | Filter by start date (YYYY-MM-DD) |
| endDate | string (date) | No | Filter by end date (YYYY-MM-DD) |
| status | string | No | Filter by payment status (PENDING, COMPLETED, FAILED, REVERSED) |
| page | integer | No | Page number (default: 1) |
| pageSize | integer | No | Page size (default: 10, max: 100) |

**Response:**

```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "referenceNumber": "PAY123456789",
        "loanAccountNumber": "L987654321",
        "cif": "C123456789",
        "amount": 1000.00,
        "currency": "VND",
        "paymentDate": "2025-01-15",
        "paymentMethod": "BANK_TRANSFER",
        "status": "COMPLETED",
        "createdAt": "2025-01-15T10:30:00Z",
        "updatedAt": "2025-01-15T10:35:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalPages": 1,
      "totalItems": 1
    }
  },
  "message": "Payments retrieved successfully",
  "errors": []
}
```

#### Get Payments for a Customer

Retrieves payments associated with a customer.

**Endpoint:** `GET /customer/{cif}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| cif | string | Yes | Customer CIF number |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string (date) | No | Filter by start date (YYYY-MM-DD) |
| endDate | string (date) | No | Filter by end date (YYYY-MM-DD) |
| status | string | No | Filter by payment status (PENDING, COMPLETED, FAILED, REVERSED) |
| page | integer | No | Page number (default: 1) |
| pageSize | integer | No | Page size (default: 10, max: 100) |

**Response:**

```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "referenceNumber": "PAY123456789",
        "loanAccountNumber": "L987654321",
        "cif": "C123456789",
        "amount": 1000.00,
        "currency": "VND",
        "paymentDate": "2025-01-15",
        "paymentMethod": "BANK_TRANSFER",
        "status": "COMPLETED",
        "createdAt": "2025-01-15T10:30:00Z",
        "updatedAt": "2025-01-15T10:35:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalPages": 1,
      "totalItems": 1
    }
  },
  "message": "Payments retrieved successfully",
  "errors": []
}
```

#### Record New Payment

Records a new payment in the system.

**Endpoint:** `POST /`

**Request Body:**

```json
{
  "loanAccountNumber": "L987654321",
  "cif": "C123456789",
  "amount": 1000.00,
  "currency": "VND",
  "paymentDate": "2025-01-15",
  "paymentMethod": "BANK_TRANSFER",
  "externalReferenceNumber": "EXT123456789",
  "notes": "Monthly payment"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "referenceNumber": "PAY123456789",
    "loanAccountNumber": "L987654321",
    "cif": "C123456789",
    "amount": 1000.00,
    "currency": "VND",
    "paymentDate": "2025-01-15",
    "paymentMethod": "BANK_TRANSFER",
    "status": "COMPLETED",
    "statusReason": null,
    "externalReferenceNumber": "EXT123456789",
    "notes": "Monthly payment",
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z",
    "sourceSystem": "CRM",
    "createdBy": "user123",
    "updatedBy": "user123",
    "isEditable": true,
    "lastSyncedAt": null
  },
  "message": "Payment recorded successfully",
  "errors": []
}
```

#### Get Payment Details

Retrieves details of a specific payment.

**Endpoint:** `GET /{referenceNumber}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| referenceNumber | string | Yes | Payment reference number |

**Response:**

```json
{
  "success": true,
  "data": {
    "referenceNumber": "PAY123456789",
    "loanAccountNumber": "L987654321",
    "cif": "C123456789",
    "amount": 1000.00,
    "currency": "VND",
    "paymentDate": "2025-01-15",
    "paymentMethod": "BANK_TRANSFER",
    "status": "COMPLETED",
    "statusReason": null,
    "externalReferenceNumber": "EXT123456789",
    "notes": "Monthly payment",
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z",
    "sourceSystem": "CRM",
    "createdBy": "user123",
    "updatedBy": "user123",
    "isEditable": true,
    "lastSyncedAt": null,
    "allocationDetails": {
      "principalAmount": 800.00,
      "interestAmount": 150.00,
      "feesAmount": 50.00,
      "penaltyAmount": 0.00
    }
  },
  "message": "Payment details retrieved successfully",
  "errors": []
}
```

### Payment Notification Operations

#### Handle Payment Notification

Processes a payment notification from an external system.

**Endpoint:** `POST /notification`

**Request Body:**

```json
{
  "externalReferenceNumber": "EXT123456789",
  "loanAccountNumber": "L987654321",
  "amount": 1000.00,
  "currency": "VND",
  "paymentDate": "2025-01-15T10:30:00Z",
  "paymentMethod": "BANK_TRANSFER",
  "status": "COMPLETED",
  "sourceSystem": "PAYMENT_GATEWAY",
  "requiresReceipt": true,
  "metadata": {
    "transactionId": "TX123456789",
    "channel": "INTERNET_BANKING",
    "processingTime": "2025-01-15T10:30:00Z"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "referenceNumber": "PAY123456789",
    "externalReferenceNumber": "EXT123456789",
    "status": "COMPLETED",
    "receiptGenerated": true,
    "receiptUrl": "https://example.com/receipts/PAY123456789.pdf"
  },
  "message": "Payment notification processed successfully",
  "errors": []
}
```

### Payment Reconciliation Operations

#### Trigger Payment Reconciliation

Triggers a reconciliation process for payments within a specified date range.

**Endpoint:** `POST /reconciliation`

**Request Body:**

```json
{
  "date": "2025-01-15",
  "sourceSystem": "T24",
  "reconciliationOptions": {
    "includeFailedPayments": true,
    "generateReport": true
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "reconciliationId": "REC123456789",
    "status": "INITIATED",
    "estimatedCompletionTime": "2025-01-15T11:30:00Z"
  },
  "message": "Payment reconciliation initiated successfully",
  "errors": []
}
```

#### Get Reconciliation Status

Retrieves the status of a reconciliation process.

**Endpoint:** `GET /reconciliation/{reconciliationId}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| reconciliationId | string | Yes | Reconciliation ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "reconciliationId": "REC123456789",
    "date": "2025-01-15",
    "sourceSystem": "T24",
    "status": "COMPLETED",
    "startTime": "2025-01-15T10:30:00Z",
    "endTime": "2025-01-15T11:00:00Z",
    "summary": {
      "totalPaymentsProcessed": 1000,
      "matchedPayments": 990,
      "unmatchedPayments": 10,
      "missingInCrm": 5,
      "missingInSource": 5
    },
    "reportUrl": "https://example.com/reports/REC123456789.pdf"
  },
  "message": "Reconciliation status retrieved successfully",
  "errors": []
}
```

### Payment Receipt Operations

#### Generate Payment Receipt

Generates a receipt for a payment.

**Endpoint:** `GET /receipt/{referenceNumber}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| referenceNumber | string | Yes | Payment reference number |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| format | string | No | Receipt format (PDF, HTML, JSON) (default: PDF) |

**Response:**

For PDF format, the response will be a binary PDF file with appropriate headers:

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="receipt-PAY123456789.pdf"
```

For HTML format:

```
Content-Type: text/html
```

For JSON format:

```json
{
  "success": true,
  "data": {
    "receipt": {
      "referenceNumber": "PAY123456789",
      "loanAccountNumber": "L987654321",
      "customerName": "John Doe",
      "amount": 1000.00,
      "currency": "VND",
      "paymentDate": "2025-01-15",
      "paymentMethod": "BANK_TRANSFER",
      "status": "COMPLETED",
      "allocationDetails": {
        "principalAmount": 800.00,
        "interestAmount": 150.00,
        "feesAmount": 50.00,
        "penaltyAmount": 0.00
      },
      "receiptDate": "2025-01-15T10:35:00Z",
      "receiptNumber": "RCP123456789"
    }
  },
  "message": "Receipt generated successfully",
  "errors": []
}
```

## Data Models

### Payment

```json
{
  "referenceNumber": "string",
  "loanAccountNumber": "string",
  "cif": "string",
  "amount": "number",
  "currency": "string",
  "paymentDate": "string (date)",
  "paymentMethod": "string",
  "status": "PENDING | COMPLETED | FAILED | REVERSED",
  "statusReason": "string",
  "externalReferenceNumber": "string",
  "notes": "string",
  "sourceSystem": "string",
  "createdBy": "string",
  "updatedBy": "string",
  "createdAt": "string (date-time)",
  "updatedAt": "string (date-time)",
  "isEditable": "boolean",
  "lastSyncedAt": "string (date-time)",
  "allocationDetails": {
    "principalAmount": "number",
    "interestAmount": "number",
    "feesAmount": "number",
    "penaltyAmount": "number"
  }
}
```

### PaymentNotification

```json
{
  "externalReferenceNumber": "string",
  "loanAccountNumber": "string",
  "amount": "number",
  "currency": "string",
  "paymentDate": "string (date-time)",
  "paymentMethod": "string",
  "status": "string",
  "sourceSystem": "string",
  "requiresReceipt": "boolean",
  "metadata": {
    "transactionId": "string",
    "channel": "string",
    "processingTime": "string (date-time)"
  }
}
```

### ReconciliationReport

```json
{
  "reconciliationId": "string",
  "date": "string (date)",
  "sourceSystem": "string",
  "status": "string",
  "startTime": "string (date-time)",
  "endTime": "string (date-time)",
  "summary": {
    "totalPaymentsProcessed": "integer",
    "matchedPayments": "integer",
    "unmatchedPayments": "integer",
    "missingInCrm": "integer",
    "missingInSource": "integer"
  },
  "reportUrl": "string"
}
```

### PaymentReceipt

```json
{
  "receipt": {
    "referenceNumber": "string",
    "loanAccountNumber": "string",
    "customerName": "string",
    "amount": "number",
    "currency": "string",
    "paymentDate": "string (date)",
    "paymentMethod": "string",
    "status": "string",
    "allocationDetails": {
      "principalAmount": "number",
      "interestAmount": "number",
      "feesAmount": "number",
      "penaltyAmount": "number"
    },
    "receiptDate": "string (date-time)",
    "receiptNumber": "string"
  }
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