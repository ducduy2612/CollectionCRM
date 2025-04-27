# API Specifications

This document outlines the API specifications for the Collection CRM system, including internal APIs, external integration points, and data exchange formats.

## API Architecture

The Collection CRM system implements a RESTful API architecture with the following characteristics:

1. **Resource-Based Endpoints**: APIs are organized around resources (e.g., customers, loans, cases)
2. **Standard HTTP Methods**: Uses GET, POST, PUT, PATCH, DELETE for CRUD operations
3. **JSON Data Format**: All requests and responses use JSON format
4. **Authentication**: JWT-based authentication for all API endpoints
5. **Versioning**: API versioning via URL path (e.g., /api/v1/customers)
6. **Rate Limiting**: Implemented to prevent abuse
7. **Pagination**: Standard pagination for list endpoints
8. **Data Source Tracking**: Implementation of source tracking and edit permissions for imported data

## Data Source Tracking and Edit Permissions

The API implements a data source tracking mechanism to handle data imported from external systems (T24, W4, LOS) and data created within the CRM. This affects the following entities:

- Customer
- ReferenceCustomer
- Phone
- Address
- Email
- Loan
- Collateral
- Payment

### Edit Permission Logic

1. **Read-Only Fields**:
   - Records with `sourceSystem` values of "T24", "W4", or "LOS" have `isEditable: false` and are read-only
   - Attempts to modify these records will return a 403 Forbidden response

2. **Editable Fields**:
   - Records with `sourceSystem` value of "CRM" have `isEditable: true` and can be modified
   - Only users who created the record (`createdBy` matches current user) or users with appropriate permissions can edit

3. **API Behavior**:
   - GET requests include source tracking fields in the response
   - POST/PUT/PATCH requests validate edit permissions before processing
   - All new records created via the API have `sourceSystem: "CRM"` and `isEditable: true`

## Internal APIs

These APIs are used by the web frontend to interact with the backend services.

### 1. Authentication API

#### Login

```
POST /api/v1/auth/login
```

Request:
```json
{
  "username": "string",
  "password": "string"
}
```

Response:
```json
{
  "token": "string",
  "refreshToken": "string",
  "expiresIn": "number",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "string"
  }
}
```

#### Refresh Token

```
POST /api/v1/auth/refresh
```

Request:
```json
{
  "refreshToken": "string"
}
```

Response:
```json
{
  "token": "string",
  "refreshToken": "string",
  "expiresIn": "number"
}
```

### 2. Customer API

#### Get Customer

```
GET /api/v1/customers/{id}
```

Response:
```json
{
  "id": "string",
  "cif": "string",
  "type": "INDIVIDUAL | ORGANIZATION",
  "name": "string",
  "dateOfBirth": "date",
  "nationalId": "string",
  "gender": "string",
  "companyName": "string",
  "registrationNumber": "string",
  "taxId": "string",
  "segment": "string",
  "status": "ACTIVE | INACTIVE ",
  "phoneNumbers": [
    {
      "id": "string",
      "type": "MOBILE | HOME | WORK | OTHER",
      "number": "string",
      "isPrimary": "boolean",
      "isVerified": "boolean",
      "verificationDate": "date"
    }
  ],
  "addresses": [
    {
      "id": "string",
      "type": "HOME | WORK | BILLING | OTHER",
      "addressLine1": "string",
      "addressLine2": "string",
      "city": "string",
      "state": "string",
      "district": "string",
      "country": "string",
      "isPrimary": "boolean",
      "isVerified": "boolean",
      "verificationDate": "date"
    }
  ],
  "emails": [
    {
      "id": "string",
      "address": "string",
      "isPrimary": "boolean",
      "isVerified": "boolean",
      "verificationDate": "date"
    }
  ],
  "createdAt": "date",
  "updatedAt": "date",
  "sourceSystem": "string",
  "sourceId": "string",
  "createdBy": "string",
  "updatedBy": "string",
  "isEditable": "boolean"
}
```

#### Search Customers

```
GET /api/v1/customers/search?query={query}&page={page}&limit={limit}
```

Response:
```json
{
  "data": [
    {
      "id": "string",
      "cif": "string",
      "name": "string",
      "companyName": "string",
      "nationalId": "string",
      "segment": "string",
      "status": "string"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "pages": "number"
  }
}
```

#### Add Customer Contact Information

```
POST /api/v1/customers/{id}/phones
```

Request:
```json
{
  "type": "MOBILE | HOME | WORK | OTHER",
  "number": "string",
  "isPrimary": "boolean"
}
```

Response:
```json
{
  "id": "string",
  "customerId": "string",
  "type": "MOBILE | HOME | WORK | OTHER",
  "number": "string",
  "isPrimary": "boolean",
  "isVerified": "boolean",
  "createdAt": "date",
  "updatedAt": "date",
  "sourceSystem": "string",
  "sourceId": "string",
  "createdBy": "string",
  "updatedBy": "string",
  "isEditable": "boolean"
}
```

Similar endpoints exist for:
- POST /api/v1/customers/{id}/addresses
- POST /api/v1/customers/{id}/emails

### 3. Loan API

#### Get Loan

```
GET /api/v1/loans/{id}
```

Response:
```json
{
  "id": "string",
  "customerId": "string",
  "accountNumber": "string",
  "productType": "string",
  "originalAmount": "number",
  "currency": "string",
  "disbursementDate": "date",
  "maturityDate": "date",
  "interestRate": "number",
  "term": "number",
  "paymentFrequency": "string",
  "limit": "number",
  "currentBalance": "number",
  "dueAmount": "number",
  "minPay": "number",
  "nextPaymentDate": "date",
  "dpd": "number",
  "delinquencyStatus": "string",
  "createdAt": "date",
  "updatedAt": "date",
  "sourceSystem": "string",
  "sourceId": "string",
  "createdBy": "string",
  "updatedBy": "string",
  "isEditable": "boolean"
}
```

#### List Customer Loans

```
GET /api/v1/customers/{customerId}/loans
```

Response:
```json
{
  "data": [
    {
      "id": "string",
      "accountNumber": "string",
      "productType": "string",
      "currentBalance": "number",
      "dueAmount": "number",
      "dpd": "number",
      "delinquencyStatus": "string"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "pages": "number"
  }
}
```

### 4. Case API

#### Get Case

```
GET /api/v1/cases/{id}
```

Response:
```json
{
  "id": "string",
  "loanId": "string",
  "caseNumber": "string",
  "status": "OPEN | PENDING | CLOSED | ESCALATED",
  "priority": "LOW | MEDIUM | HIGH | CRITICAL",
  "openDate": "date",
  "closeDate": "date",
  "resolutionCode": "string",
  "resolutionNotes": "string",
  "createdAt": "date",
  "updatedAt": "date",
  "sourceSystem": "string"
}
```

#### List Cases

```
GET /api/v1/cases?status={status}&priority={priority}&agentId={agentId}&page={page}&limit={limit}
```

Response:
```json
{
  "data": [
    {
      "id": "string",
      "caseNumber": "string",
      "loanId": "string",
      "customerName": "string",
      "status": "string",
      "priority": "string",
      "openDate": "date",
      "dpd": "number",
      "dueAmount": "number"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "pages": "number"
  }
}
```

### 5. Action API

#### Create Action Record

```
POST /api/v1/cases/{caseId}/actions
```

Request:
```json
{
  "type": "string",
  "subtype": "string",
  "actionResult": "string",
  "actionDate": "date",
  "notes": "string",
  "callTraceId": "number",
  "visitLocation": {
    "latitude": "number",
    "longitude": "number",
    "address": "string"
  }
}
```

Response:
```json
{
  "id": "string",
  "caseId": "string",
  "type": "string",
  "subtype": "string",
  "actionResult": "string",
  "actionDate": "date",
  "notes": "string",
  "callTraceId": "number",
  "visitLocation": {
    "latitude": "number",
    "longitude": "number",
    "address": "string"
  },
  "createdAt": "date",
  "createdBy": "string"
}
```

#### List Case Actions

```
GET /api/v1/cases/{caseId}/actions
```

Response:
```json
{
  "data": [
    {
      "id": "string",
      "type": "string",
      "subtype": "string",
      "actionResult": "string",
      "actionDate": "date",
      "notes": "string",
      "createdBy": "string",
      "createdAt": "date"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "pages": "number"
  }
}
```

### 6. Payment API

#### List Loan Payments

```
GET /api/v1/loans/{loanId}/payments
```

Response:
```json
{
  "data": [
    {
      "id": "string",
      "amount": "number",
      "currency": "string",
      "paymentDate": "date",
      "paymentMethod": "string",
      "referenceNumber": "string",
      "status": "PENDING | COMPLETED | FAILED | REVERSED",
      "principalAmount": "number",
      "interestAmount": "number",
      "feesAmount": "number",
      "penaltyAmount": "number",
      "createdAt": "date",
      "updatedAt": "date",
      "sourceSystem": "string",
      "sourceId": "string",
      "createdBy": "string",
      "updatedBy": "string",
      "isEditable": "boolean"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "pages": "number"
  }
}
```

### 7. CustomerCase API

#### Get CustomerCase

```
GET /api/v1/customer-cases/{id}
```

Response:
```json
{
  "id": "string",
  "customerId": "string",
  "assignedCallAgentId": "string",
  "assignedFieldAgentId": "string",
  "customerStatus": "string",
  "collateralStatus": "string",
  "processingStateStatus": "string",
  "lendingViolationStatus": "string",
  "recoveryAbilityStatus": "string",
  "createdAt": "date",
  "updatedAt": "date"
}
```

#### List CustomerCases

```
GET /api/v1/customer-cases?customerId={customerId}&agentId={agentId}&page={page}&limit={limit}
```

Response:
```json
{
  "data": [
    {
      "id": "string",
      "customerId": "string",
      "customerName": "string",
      "assignedCallAgentId": "string",
      "assignedFieldAgentId": "string",
      "customerStatus": "string",
      "collateralStatus": "string",
      "processingStateStatus": "string",
      "lendingViolationStatus": "string",
      "recoveryAbilityStatus": "string"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "pages": "number"
  }
}
```

#### Update CustomerCase Assignment

```
PATCH /api/v1/customer-cases/{id}/assignment
```

Request:
```json
{
  "assignedCallAgentId": "string",
  "assignedFieldAgentId": "string"
}
```

Response:
```json
{
  "id": "string",
  "customerId": "string",
  "assignedCallAgentId": "string",
  "assignedFieldAgentId": "string",
  "updatedAt": "date"
}
```

### 8. CustomerCaseAction API

#### Create CustomerCaseAction

```
POST /api/v1/customer-cases/{customerCaseId}/actions
```

Request:
```json
{
  "actionDate": "date",
  "actionType": "string",
  "notes": "string",
  "customerStatus": "string",
  "collateralStatus": "string",
  "processingStateStatus": "string",
  "lendingViolationStatus": "string",
  "recoveryAbilityStatus": "string"
}
```

Response:
```json
{
  "id": "string",
  "customerCaseId": "string",
  "actionDate": "date",
  "actionType": "string",
  "notes": "string",
  "customerStatus": "string",
  "collateralStatus": "string",
  "processingStateStatus": "string",
  "lendingViolationStatus": "string",
  "recoveryAbilityStatus": "string",
  "createdAt": "date",
  "createdBy": "string"
}
```

#### List CustomerCaseActions

```
GET /api/v1/customer-cases/{customerCaseId}/actions
```

Response:
```json
{
  "data": [
    {
      "id": "string",
      "actionDate": "date",
      "actionType": "string",
      "notes": "string",
      "customerStatus": "string",
      "collateralStatus": "string",
      "processingStateStatus": "string",
      "lendingViolationStatus": "string",
      "recoveryAbilityStatus": "string",
      "createdBy": "string",
      "createdAt": "date"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "pages": "number"
  }
}
```

### 9. LoanCollateral API

#### Associate Collateral with Loan

```
POST /api/v1/loans/{loanId}/collaterals
```

Request:
```json
{
  "collateralId": "string"
}
```

Response:
```json
{
  "id": "string",
  "loanId": "string",
  "collateralId": "string",
  "createdAt": "date"
}
```

#### List Loan Collaterals

```
GET /api/v1/loans/{loanId}/collaterals
```

Response:
```json
{
  "data": [
    {
      "id": "string",
      "collateralNumber": "string",
      "customerId": "string",
      "type": "string",
      "description": "string",
      "value": "number",
      "valuationDate": "date",
      "createdAt": "date",
      "updatedAt": "date",
      "sourceSystem": "string",
      "sourceId": "string",
      "createdBy": "string",
      "updatedBy": "string",
      "isEditable": "boolean"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "pages": "number"
  }
}
```

#### List Collateral Loans

```
GET /api/v1/collaterals/{collateralId}/loans
```

Response:
```json
{
  "data": [
    {
      "id": "string",
      "accountNumber": "string",
      "productType": "string",
      "currentBalance": "number",
      "dueAmount": "number",
      "dpd": "number",
      "delinquencyStatus": "string"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "pages": "number"
  }
}
```

### 10. ReferenceCustomer API

#### Get ReferenceCustomer

```
GET /api/v1/reference-customers/{id}
```

Response:
```json
{
  "id": "string",
  "customerId": "string",
  "relationshipType": "string",
  "cif": "string",
  "type": "INDIVIDUAL | ORGANIZATION",
  "name": "string",
  "dateOfBirth": "date",
  "nationalId": "string",
  "gender": "string",
  "companyName": "string",
  "registrationNumber": "string",
  "taxId": "string",
  "phoneNumbers": [
    {
      "id": "string",
      "type": "MOBILE | HOME | WORK | OTHER",
      "number": "string",
      "isPrimary": "boolean",
      "isVerified": "boolean"
    }
  ],
  "addresses": [
    {
      "id": "string",
      "type": "HOME | WORK | BILLING | OTHER",
      "addressLine1": "string",
      "addressLine2": "string",
      "city": "string",
      "state": "string",
      "district": "string",
      "country": "string",
      "isPrimary": "boolean",
      "isVerified": "boolean"
    }
  ],
  "emails": [
    {
      "id": "string",
      "address": "string",
      "isPrimary": "boolean",
      "isVerified": "boolean"
    }
  ],
  "createdAt": "date",
  "updatedAt": "date",
  "sourceSystem": "string",
  "sourceId": "string",
  "createdBy": "string",
  "updatedBy": "string",
  "isEditable": "boolean"
}
```

#### List Customer References

```
GET /api/v1/customers/{customerId}/references
```

Response:
```json
{
  "data": [
    {
      "id": "string",
      "relationshipType": "string",
      "type": "INDIVIDUAL | ORGANIZATION",
      "name": "string",
      "companyName": "string",
      "nationalId": "string"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "pages": "number"
  }
}
```

#### Create Reference Customer

```
POST /api/v1/customers/{customerId}/references
```

Request:
```json
{
  "relationshipType": "string",
  "cif": "string",
  "type": "INDIVIDUAL | ORGANIZATION",
  "name": "string",
  "dateOfBirth": "date",
  "nationalId": "string",
  "gender": "string",
  "companyName": "string",
  "registrationNumber": "string",
  "taxId": "string",
  "phoneNumbers": [
    {
      "type": "MOBILE | HOME | WORK | OTHER",
      "number": "string",
      "isPrimary": "boolean"
    }
  ],
  "addresses": [
    {
      "type": "HOME | WORK | BILLING | OTHER",
      "addressLine1": "string",
      "addressLine2": "string",
      "city": "string",
      "state": "string",
      "district": "string",
      "country": "string",
      "isPrimary": "boolean"
    }
  ],
  "emails": [
    {
      "address": "string",
      "isPrimary": "boolean"
    }
  ]
}
```

Response:
```json
{
  "id": "string",
  "customerId": "string",
  "relationshipType": "string",
  "createdAt": "date",
  "createdBy": "string"
}
```

#### Get Collateral

```
GET /api/v1/collaterals/{id}
```

Response:
```json
{
  "id": "string",
  "collateralNumber": "string",
  "customerId": "string",
  "type": "string",
  "description": "string",
  "value": "number",
  "valuationDate": "date",
  "make": "string",
  "model": "string",
  "year": "number",
  "vin": "string",
  "licensePlate": "string",
  "propertyType": "string",
  "address": "string",
  "size": "number",
  "titleNumber": "string",
  "createdAt": "date",
  "updatedAt": "date",
  "sourceSystem": "string",
  "sourceId": "string",
  "createdBy": "string",
  "updatedBy": "string",
  "isEditable": "boolean"
}
```

#### List Customer Collaterals

```
GET /api/v1/customers/{customerId}/collaterals
```

Response:
```json
{
  "data": [
    {
      "id": "string",
      "collateralNumber": "string",
      "type": "string",
      "description": "string",
      "value": "number",
      "valuationDate": "date"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "pages": "number"
  }
}
```

## External Integration APIs

These APIs define how the Collection CRM system integrates with external systems.

### 1. ETL Integration

#### Import Customer Data

```
POST /api/v1/integration/import/customers
```

Request:
```json
{
  "customers": [
    {
      "id": "string",
      "cif": "string",
      "type": "INDIVIDUAL | ORGANIZATION",
      "name": "string",
      "dateOfBirth": "date",
      "nationalId": "string",
      "gender": "string",
      "companyName": "string",
      "registrationNumber": "string",
      "taxId": "string",
      "segment": "string",
      "status": "ACTIVE | INACTIVE | BLACKLISTED",
      "phoneNumbers": [
        {
          "type": "MOBILE | HOME | WORK | OTHER",
          "number": "string",
          "isPrimary": "boolean"
        }
      ],
      "addresses": [
        {
          "type": "HOME | WORK | BILLING | OTHER",
          "addressLine1": "string",
          "addressLine2": "string",
          "city": "string",
          "state": "string",
          "district": "string",
          "country": "string",
          "isPrimary": "boolean"
        }
      ],
      "emails": [
        {
          "address": "string",
          "isPrimary": "boolean"
        }
      ],
      "sourceSystem": "string"
    }
  ]
}
```

Response:
```json
{
  "status": "success | partial | failed",
  "processed": "number",
  "successful": "number",
  "failed": "number",
  "errors": [
    {
      "id": "string",
      "error": "string"
    }
  ]
}
```

Similar endpoints exist for:
- POST /api/v1/integration/import/loans
- POST /api/v1/integration/import/cases
- POST /api/v1/integration/import/collaterals
- POST /api/v1/integration/import/reference-customers

#### Import Collateral Data

```
POST /api/v1/integration/import/collaterals
```

Request:
```json
{
  "collaterals": [
    {
      "id": "string",
      "collateralNumber": "string",
      "customerId": "string",
      "type": "string",
      "description": "string",
      "value": "number",
      "valuationDate": "date",
      "make": "string",
      "model": "string",
      "year": "number",
      "vin": "string",
      "licensePlate": "string",
      "propertyType": "string",
      "address": "string",
      "size": "number",
      "titleNumber": "string",
      "sourceSystem": "string"
    }
  ]
}
```

Response:
```json
{
  "status": "success | partial | failed",
  "processed": "number",
  "successful": "number",
  "failed": "number",
  "errors": [
    {
      "id": "string",
      "error": "string"
    }
  ]
}
```

#### Import Reference Customer Data

```
POST /api/v1/integration/import/reference-customers
```

Request:
```json
{
  "referenceCustomers": [
    {
      "id": "string",
      "customerId": "string",
      "relationshipType": "string",
      "cif": "string",
      "type": "INDIVIDUAL | ORGANIZATION",
      "name": "string",
      "dateOfBirth": "date",
      "nationalId": "string",
      "gender": "string",
      "companyName": "string",
      "registrationNumber": "string",
      "taxId": "string",
      "phoneNumbers": [
        {
          "type": "MOBILE | HOME | WORK | OTHER",
          "number": "string",
          "isPrimary": "boolean"
        }
      ],
      "addresses": [
        {
          "type": "HOME | WORK | BILLING | OTHER",
          "addressLine1": "string",
          "addressLine2": "string",
          "city": "string",
          "state": "string",
          "district": "string",
          "country": "string",
          "isPrimary": "boolean"
        }
      ],
      "emails": [
        {
          "address": "string",
          "isPrimary": "boolean"
        }
      ],
      "sourceSystem": "string"
    }
  ]
}
```

Response:
```json
{
  "status": "success | partial | failed",
  "processed": "number",
  "successful": "number",
  "failed": "number",
  "errors": [
    {
      "id": "string",
      "error": "string"
    }
  ]
}
```

### 2. Payment Update API

#### Update Payment

```
POST /api/v1/integration/payments
```

Request:
```json
{
  "id": "string",
  "loanId": "string",
  "amount": "number",
  "currency": "string",
  "paymentDate": "date",
  "paymentMethod": "string",
  "referenceNumber": "string",
  "status": "PENDING | COMPLETED | FAILED | REVERSED",
  "statusReason": "string",
  "principalAmount": "number",
  "interestAmount": "number",
  "feesAmount": "number",
  "penaltyAmount": "number",
  "sourceSystem": "string"
}
```

Response:
```json
{
  "status": "success | failed",
  "message": "string"
}
```

### 3. Call Center Integration API

#### Get Customer Info for Call

```
GET /api/v1/integration/callcenter/customers?phone={phoneNumber}
```

Response:
```json
{
  "customerId": "string",
  "name": "string",
  "loans": [
    {
      "id": "string",
      "accountNumber": "string",
      "productType": "string",
      "currentBalance": "number",
      "dueAmount": "number",
      "dpd": "number",
      "delinquencyStatus": "string"
    }
  ],
  "cases": [
    {
      "id": "string",
      "caseNumber": "string",
      "status": "string",
      "priority": "string"
    }
  ]
}
```

#### Log Call

```
POST /api/v1/integration/callcenter/calls
```

Request:
```json
{
  "callTraceId": "number",
  "customerId": "string",
  "caseId": "string",
  "agentId": "string",
  "startTime": "datetime",
  "endTime": "datetime",
  "duration": "number",
  "outcome": "string",
  "notes": "string"
}
```

Response:
```json
{
  "id": "string",
  "status": "success | failed",
  "message": "string"
}
```

### 4. Mobile App Integration API

#### Sync Field Visit

```
POST /api/v1/integration/mobile/visits
```

Request:
```json
{
  "caseId": "string",
  "agentId": "string",
  "visitTime": "datetime",
  "location": {
    "latitude": "number",
    "longitude": "number",
    "address": "string"
  },
  "outcome": "string",
  "notes": "string",
  "photos": [
    {
      "data": "base64string",
      "description": "string"
    }
  ]
}
```

Response:
```json
{
  "id": "string",
  "status": "success | failed",
  "message": "string"
}
```

## API Security

1. **Authentication**:
   - JWT-based authentication for all API endpoints
   - Token expiration and refresh mechanism
   - API keys for external system integration

2. **Authorization**:
   - Role-based access control
   - Resource-level permissions
   - IP whitelisting for external integrations

3. **Data Protection**:
   - TLS encryption for all API traffic
   - PII data masking in responses
   - Input validation and sanitization

4. **Rate Limiting**:
   - Per-user rate limits
   - Per-IP rate limits for public endpoints
   - Burst allowances for legitimate high-volume operations

5. **Monitoring and Logging**:
   - Request/response logging (excluding sensitive data)
   - Error tracking and alerting
   - Performance monitoring

## API Versioning Strategy

1. **URL Path Versioning**:
   - Format: /api/v{major_version}/{resource}
   - Example: /api/v1/customers, /api/v2/customers

2. **Version Lifecycle**:
   - New features added to current version when backward compatible
   - New major version created for breaking changes
   - Old versions supported for at least 12 months after deprecation notice

3. **Documentation**:
   - OpenAPI/Swagger documentation for each version
   - Deprecation notices and migration guides
   - Changelog for each version