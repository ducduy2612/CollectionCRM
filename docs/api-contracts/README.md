# Collection CRM API Contracts

This directory contains the API contracts for the Collection CRM system, organized by microservice. Each API contract follows the OpenAPI 3.0 specification format and includes detailed information about endpoints, request/response formats, and data models.

## Overview

The Collection CRM system is divided into four microservices, each with its own API:

1. **Bank Synchronization Microservice**: Manages data synchronization from external banking systems and provides access to customer, loan, and collateral data.
2. **Payment Processing Microservice**: Handles real-time payment processing and synchronization with external payment systems.
3. **Collection Workflow Microservice**: Manages the collection process workflow, including agent management, action tracking, customer assignments, and case management.
4. **Authentication Microservice**: Manages user authentication, authorization, and session management by integrating with the bank's Active Directory system.

## API Versioning

All APIs use URI path versioning (e.g., `/api/v1/customers`). This approach makes versioning explicit and allows for easy routing to different API versions.

## Common Features

All APIs share the following common features:

### Authentication

All API endpoints require authentication using JWT tokens. The token must be included in the `Authorization` header using the Bearer scheme:

```
Authorization: Bearer <token>
```

### Response Format

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

### Status Codes

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

### Pagination

List endpoints support pagination with the following query parameters:

- `page`: Page number (default: 1)
- `pageSize`: Page size (default: 10, max: 100)

Paginated responses include a pagination object:

```json
"pagination": {
  "page": 1,
  "pageSize": 10,
  "totalPages": 5,
  "totalItems": 45
}
```

## API Contracts

### Bank Synchronization Microservice API

**Base URL**: `/api/v1/bank-sync`

**Key Endpoints**:

- `GET /sync/status`: Get synchronization status
- `POST /sync/run`: Trigger synchronization
- `GET /customers/{cif}`: Get customer by CIF
- `GET /customers`: Search customers
- `GET /customers/{cif}/loans`: Get customer loans
- `GET /customers/{cif}/collaterals`: Get customer collaterals
- `GET /loans/{accountNumber}`: Get loan by account number
- `GET /collaterals/{collateralNumber}`: Get collateral by number
- `GET /customers/{cif}/references`: Get reference customers

[View Full API Contract](./bank-sync-api.md)

### Payment Processing Microservice API

**Base URL**: `/api/v1/payments`

**Key Endpoints**:

- `GET /loan/{accountNumber}`: Get payments for a loan
- `GET /customer/{cif}`: Get payments for a customer
- `POST /`: Record new payment
- `GET /{referenceNumber}`: Get payment details
- `POST /notification`: Handle payment notification
- `POST /reconciliation`: Trigger payment reconciliation
- `GET /reconciliation/{reconciliationId}`: Get reconciliation status
- `GET /receipt/{referenceNumber}`: Generate payment receipt

[View Full API Contract](./payment-processing-api.md)

### Collection Workflow Microservice API

**Base URL**: `/api/v1/collection`

**Key Endpoints**:

- `GET /agents`: List agents
- `POST /agents`: Create agent
- `PUT /agents/{id}`: Update agent
- `GET /agents/{id}/performance`: Get agent performance
- `POST /actions`: Record action
- `GET /actions/customer/{cif}`: Get customer actions
- `GET /actions/loan/{accountNumber}`: Get loan actions
- `PUT /actions/{id}/result`: Update action result
- `GET /assignments/agent/{agentId}`: Get agent assignments
- `POST /assignments`: Create assignment
- `PUT /assignments/{id}`: Update assignment
- `GET /assignments/history/{cif}`: Get assignment history
- `GET /cases/customer/{cif}`: Get customer case history
- `POST /cases`: Record case action
- `GET /cases/status/{cif}`: Get customer case status

[View Full API Contract](./collection-workflow-api.md)

### Authentication Microservice API

**Base URL**: `/api/v1/auth`

**Key Endpoints**:

- `POST /login`: Authenticate user
- `POST /logout`: Logout user
- `POST /token/refresh`: Refresh token
- `POST /token/validate`: Validate token
- `POST /password/reset`: Request password reset
- `POST /password/change`: Change password
- `GET /users`: List users
- `POST /users`: Create user
- `GET /users/{id}`: Get user by ID
- `PUT /users/{id}`: Update user
- `PUT /users/{id}/activate`: Activate user
- `PUT /users/{id}/deactivate`: Deactivate user
- `GET /users/{id}/sessions`: Get user sessions
- `DELETE /users/{id}/sessions`: Terminate user sessions
- `GET /roles`: List roles
- `POST /roles`: Create role
- `GET /roles/{id}`: Get role by ID
- `PUT /roles/{id}`: Update role
- `DELETE /roles/{id}`: Delete role
- `GET /roles/{id}/users`: Get users with role
- `POST /roles/{id}/users`: Assign role to users
- `GET /audit/logs`: Search audit logs
- `GET /audit/reports`: Generate audit report

[View Full API Contract](./authentication-api.md)

## Implementation Notes

1. **Security**: All APIs must be secured using JWT tokens and implement proper authorization checks based on user roles and permissions.
2. **Validation**: All request inputs must be validated before processing to prevent security vulnerabilities and data corruption.
3. **Error Handling**: Errors should be handled gracefully and return appropriate error codes and messages.
4. **Logging**: All API calls should be logged for audit and debugging purposes.
5. **Rate Limiting**: APIs should implement rate limiting to prevent abuse.
6. **Documentation**: API documentation should be kept up-to-date as the APIs evolve.

## Next Steps

1. Implement API contracts in the respective microservices
2. Set up API testing using Postman or similar tools
3. Create integration tests to verify inter-service communication
4. Develop client SDKs for frontend applications