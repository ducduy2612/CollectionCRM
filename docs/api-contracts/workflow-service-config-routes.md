# Workflow Service Configuration Routes

This document describes the new configuration management routes added to the workflow service for managing action types, subtypes, results, and their mappings.

## Overview

The configuration routes provide administrative functionality to manage the workflow service configuration using the PostgreSQL functions defined in `infrastructure/database/init/scripts/04b-workflow-service.sql`.

## Files Created/Modified

### New Files
- `src/services/workflow-service/src/repositories/config.repository.ts` - Repository layer for configuration management
- `src/services/workflow-service/src/controllers/config.controller.ts` - Controller layer for configuration endpoints

### Modified Files
- `src/services/workflow-service/src/routes/action.routes.ts` - Added configuration routes

## API Endpoints

All configuration endpoints require authentication and are prefixed with `/config/`.

### Action Types Management

#### Add Action Type
- **POST** `/config/action-types`
- **Body**: `{ code: string, name: string, description?: string, display_order?: number }`
- **Description**: Adds a new action type
- **Database Function**: `workflow_service.add_action_type()`

#### Deactivate Action Type
- **DELETE** `/config/action-types/:typeCode`
- **Description**: Safely deactivates an action type (prevents if used in existing records)
- **Database Function**: `workflow_service.deactivate_action_type()`

### Action Subtypes Management

#### Add Action Subtype
- **POST** `/config/action-subtypes`
- **Body**: `{ code: string, name: string, description?: string, display_order?: number }`
- **Description**: Adds a new action subtype
- **Database Function**: `workflow_service.add_action_subtype()`

#### Deactivate Action Subtype
- **DELETE** `/config/action-subtypes/:subtypeCode`
- **Description**: Safely deactivates an action subtype (prevents if used in existing records)
- **Database Function**: `workflow_service.deactivate_action_subtype()`

### Action Results Management

#### Add Action Result
- **POST** `/config/action-results`
- **Body**: `{ code: string, name: string, description?: string, display_order?: number }`
- **Description**: Adds a new action result
- **Database Function**: `workflow_service.add_action_result()`

#### Deactivate Action Result
- **DELETE** `/config/action-results/:resultCode`
- **Description**: Safely deactivates an action result (prevents if used in existing records)
- **Database Function**: `workflow_service.deactivate_action_result()`

### Mapping Management

#### Map Type to Subtype
- **POST** `/config/mappings/type-subtype`
- **Body**: `{ type_code: string, subtype_code: string }`
- **Description**: Creates a mapping between action type and subtype
- **Database Function**: `workflow_service.map_type_to_subtype()`

#### Map Subtype to Result
- **POST** `/config/mappings/subtype-result`
- **Body**: `{ subtype_code: string, result_code: string }`
- **Description**: Creates a mapping between action subtype and result
- **Database Function**: `workflow_service.map_subtype_to_result()`

#### Remove Type-Subtype Mapping
- **DELETE** `/config/mappings/type-subtype`
- **Body**: `{ type_code: string, subtype_code: string }`
- **Description**: Safely removes type-subtype mapping (prevents if used in existing records)
- **Database Function**: `workflow_service.remove_type_subtype_mapping()`

#### Remove Subtype-Result Mapping
- **DELETE** `/config/mappings/subtype-result`
- **Body**: `{ subtype_code: string, result_code: string }`
- **Description**: Safely removes subtype-result mapping (prevents if used in existing records)
- **Database Function**: `workflow_service.remove_subtype_result_mapping()`

### Query Endpoints

#### Get Subtypes for Type
- **GET** `/config/types/:typeCode/subtypes`
- **Description**: Retrieves available subtypes for a given action type
- **Database Function**: `workflow_service.get_subtypes_for_type()`
- **Response**: Array of subtype objects with id, code, name, description, display_order

#### Get Results for Subtype
- **GET** `/config/subtypes/:subtypeCode/results`
- **Description**: Retrieves available results for a given action subtype
- **Database Function**: `workflow_service.get_results_for_subtype()`
- **Response**: Array of result objects with id, code, name, description, display_order

#### Validate Configuration
- **POST** `/config/validate`
- **Body**: `{ type_id: string, subtype_id: string, result_id: string }`
- **Description**: Validates if the action type, subtype, and result combination is allowed
- **Database Function**: `workflow_service.validate_action_configuration()`
- **Response**: `{ is_valid: boolean }`

#### Get Usage Statistics
- **GET** `/config/usage-stats`
- **Description**: Returns usage statistics for all configuration items and whether they can be safely deactivated
- **Database Function**: `workflow_service.get_configuration_usage_stats()`
- **Response**: Array of usage statistics with config_type, config_code, config_name, is_active, usage_count, can_be_deactivated

## Data Preservation

The configuration management system includes built-in data preservation features:

1. **Safe Deactivation**: Configuration items cannot be deactivated if they are used in existing action records
2. **Historical Data Protection**: Mappings cannot be removed if the combination is used in existing records
3. **Usage Tracking**: The system tracks usage counts for all configuration items
4. **Audit Trail**: All configuration changes are tracked with created_by/updated_by fields

## Error Handling

All endpoints include comprehensive error handling:
- Validation errors for missing required fields
- Database constraint violations
- Data preservation violations (attempting to delete used configurations)
- Proper HTTP status codes and error messages

## Authentication & Authorization

All configuration endpoints require:
- Valid authentication token
- Appropriate user permissions (admin level recommended)
- User context for audit trail (created_by/updated_by fields)

## Usage Examples

### Adding a New Action Type
```bash
POST /config/action-types
{
  "code": "FOLLOW_UP",
  "name": "Follow Up Call",
  "description": "Follow up call with customer",
  "display_order": 10
}
```

### Creating Type-Subtype Mapping
```bash
POST /config/mappings/type-subtype
{
  "type_code": "FOLLOW_UP",
  "subtype_code": "PAYMENT_REMINDER"
}
```

### Getting Available Subtypes
```bash
GET /config/types/FOLLOW_UP/subtypes
```

### Validating Configuration
```bash
POST /config/validate
{
  "type_id": "uuid-here",
  "subtype_id": "uuid-here", 
  "result_id": "uuid-here"
}
```

## Integration Notes

These routes integrate with the existing workflow service architecture:
- Uses the same authentication middleware as action routes
- Follows the same error handling patterns
- Uses the established repository pattern
- Maintains consistency with existing API design