# Status Dictionary API Routes Documentation

This document describes the comprehensive API routes for managing status dictionary entries in the workflow service.

## Overview

The status dictionary management system provides CRUD operations for all status types:
- Customer Status
- Collateral Status  
- Processing State & Substate
- Lending Violation Status
- Recovery Ability Status

## Base URL
All routes are prefixed with `/api/v1/status-dict/`

## Authentication & Authorization
- **GET routes**: Require authentication (`requireAuth`)
- **POST/DELETE routes**: Require ADMIN role (`requireRoles(['ADMIN'])`)
- **Usage stats**: Require ADMIN role

## Customer Status Routes

### GET /status-dict/customer-status
Get all active customer status entries.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "CONTACTED",
      "name": "Customer Contacted",
      "description": "Customer has been successfully contacted",
      "color": "#28a745",
      "display_order": 1
    }
  ],
  "message": "Active customer statuses retrieved successfully"
}
```

### POST /status-dict/customer-status
Add new customer status entry.

**Request Body:**
```json
{
  "code": "NEW_STATUS",
  "name": "New Status Name",
  "description": "Optional description",
  "color": "#007bff",
  "displayOrder": 10
}
```

### DELETE /status-dict/customer-status/:code
Deactivate customer status (only if not used in existing records).

## Collateral Status Routes

### GET /status-dict/collateral-status
Get all active collateral status entries.

### POST /status-dict/collateral-status
Add new collateral status entry.

### DELETE /status-dict/collateral-status/:code
Deactivate collateral status.

## Processing State Routes

### GET /status-dict/processing-state
Get all active processing states.

### GET /status-dict/processing-substate
Get all active processing substates.

### GET /status-dict/processing-state/:stateCode/substates
Get available substates for a specific processing state.

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "substate_id": "uuid",
      "substate_code": "INITIAL_CONTACT",
      "substate_name": "Initial Contact Attempt",
      "substate_description": "First attempt to contact customer",
      "substate_color": "#ffc107",
      "display_order": 1
    }
  ],
  "message": "Substates for processing state retrieved successfully"
}
```

### POST /status-dict/processing-state
Add new processing state.

### POST /status-dict/processing-substate
Add new processing substate.

### POST /status-dict/processing-state-mapping
Map processing state to substate.

**Request Body:**
```json
{
  "stateCode": "COLLECTION",
  "substateCode": "INITIAL_CONTACT"
}
```

### DELETE /status-dict/processing-state-mapping
Remove state-substate mapping.

**Request Body:**
```json
{
  "stateCode": "COLLECTION",
  "substateCode": "INITIAL_CONTACT"
}
```

## Lending Violation Status Routes

### GET /status-dict/lending-violation-status
Get all active lending violation status entries.

### POST /status-dict/lending-violation-status
Add new lending violation status entry.

## Recovery Ability Status Routes

### GET /status-dict/recovery-ability-status
Get all active recovery ability status entries.

### POST /status-dict/recovery-ability-status
Add new recovery ability status entry.

## Utility Routes

### GET /status-dict/find/:statusType/:code
Find specific status by type and code.

**Parameters:**
- `statusType`: One of `customer`, `collateral`, `processing_state`, `processing_substate`, `lending_violation`, `recovery_ability`
- `code`: Status code to search for

**Example:**
```
GET /status-dict/find/customer/CONTACTED
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "CONTACTED",
    "name": "Customer Contacted",
    "description": "Customer has been successfully contacted",
    "color": "#28a745",
    "display_order": 1,
    "is_active": true
  },
  "message": "Status found successfully"
}
```

### GET /status-dict/usage-stats
Get usage statistics for all status dictionary entries.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "status_type": "CUSTOMER_STATUS",
      "status_code": "CONTACTED",
      "status_name": "Customer Contacted",
      "is_active": true,
      "usage_count": 150,
      "can_be_deactivated": false
    },
    {
      "status_type": "COLLATERAL_STATUS",
      "status_code": "VERIFIED",
      "status_name": "Collateral Verified",
      "is_active": true,
      "usage_count": 0,
      "can_be_deactivated": true
    }
  ],
  "message": "Status usage statistics retrieved successfully"
}
```

## Error Handling

### Validation Errors (400)
```json
{
  "success": false,
  "data": null,
  "message": "Missing required fields: code, name",
  "errors": [
    {
      "code": "REQUIRED_FIELD_MISSING",
      "message": "Missing required fields: code, name",
      "type": "ValidationError"
    }
  ]
}
```

### Database Constraint Errors (400)
```json
{
  "success": false,
  "data": null,
  "message": "Cannot deactivate customer status CONTACTED. It is used in 150 existing status records. Historical data must be preserved.",
  "errors": [...]
}
```

### Authorization Errors (403)
```json
{
  "success": false,
  "data": null,
  "message": "Insufficient permissions. ADMIN role required.",
  "errors": [...]
}
```

## Implementation Details

### Database Functions Used
The API uses PostgreSQL stored procedures from `04b-workflow-service.sql`:

**Add Functions:**
- `workflow_service.add_customer_status()`
- `workflow_service.add_collateral_status()`
- `workflow_service.add_processing_state()`
- `workflow_service.add_processing_substate()`
- `workflow_service.add_lending_violation_status()`
- `workflow_service.add_recovery_ability_status()`

**Mapping Functions:**
- `workflow_service.map_state_to_substate()`
- `workflow_service.get_substates_for_state()`

**Deactivation Functions:**
- `workflow_service.deactivate_customer_status()`
- `workflow_service.deactivate_collateral_status()`
- `workflow_service.deactivate_processing_state()`
- `workflow_service.deactivate_processing_substate()`
- `workflow_service.deactivate_lending_violation_status()`
- `workflow_service.deactivate_recovery_ability_status()`

**Utility Functions:**
- `workflow_service.get_status_usage_stats()`
- `workflow_service.remove_state_substate_mapping()`

### Data Preservation
The system prevents deactivation of status entries that are referenced in existing records, ensuring historical data integrity.

### Repository Pattern
All database operations are handled through `StatusDictRepository` which provides a clean abstraction over the stored procedures.

## Usage Examples

### Add New Customer Status
```bash
curl -X POST /api/v1/status-dict/customer-status \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "PAYMENT_PLAN",
    "name": "Payment Plan Agreed",
    "description": "Customer agreed to payment plan",
    "color": "#17a2b8",
    "displayOrder": 5
  }'
```

### Get Processing State Substates
```bash
curl -X GET /api/v1/status-dict/processing-state/COLLECTION/substates \
  -H "Authorization: Bearer <token>"
```

### Map State to Substate
```bash
curl -X POST /api/v1/status-dict/processing-state-mapping \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "stateCode": "COLLECTION",
    "substateCode": "FOLLOW_UP"
  }'
```

### Get Usage Statistics
```bash
curl -X GET /api/v1/status-dict/usage-stats \
  -H "Authorization: Bearer <admin-token>"
```

## Integration with Status Recording

These dictionary entries are used when recording status updates:

```bash
# First, get available customer statuses
curl -X GET /api/v1/status-dict/customer-status

# Then record status using the status ID
curl -X POST /api/v1/cases/customer-status \
  -H "Authorization: Bearer <token>" \
  -d '{
    "cif": "CIF123456",
    "statusId": "uuid-from-dictionary",
    "notes": "Customer contacted successfully"
  }'
```

This ensures referential integrity and provides a centralized way to manage all status configurations.