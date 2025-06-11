# Bulk Assignment API

## Overview
The bulk assignment API allows administrators and supervisors to upload a CSV file containing customer assignments to call agents and field agents.

## Endpoint
```
POST /assignments/bulk
```

## Authentication
- Requires authentication token
- Requires ADMIN or SUPERVISOR role

## Request
- **Content-Type**: `multipart/form-data`
- **File Field**: `csvFile`
- **File Type**: CSV (.csv)
- **Max File Size**: 5MB

## CSV Format
The CSV file must contain the following columns:

| Column Name | Required | Description |
|-------------|----------|-------------|
| CIF | Yes | Customer Identification Number |
| assignedCallAgentName | No* | Name of the call agent to assign |
| assignedFieldAgentName | No* | Name of the field agent to assign |

*At least one agent name must be provided per row.

### Sample CSV
```csv
CIF,assignedCallAgentName,assignedFieldAgentName
CIF001,John Doe,Jane Smith
CIF002,Alice Johnson,Bob Wilson
CIF003,Charlie Brown,Diana Prince
CIF004,Eve Adams,Frank Miller
CIF005,Grace Lee,Henry Davis
```

## Response

### Success Response (201 Created)
```json
{
  "success": true,
  "message": "Bulk assignments created successfully",
  "data": {
    "assignments": [
      {
        "id": "uuid",
        "cif": "CIF001",
        "assignedCallAgentId": "agent-uuid-1",
        "assignedFieldAgentId": "agent-uuid-2",
        "startDate": "2023-12-01T10:00:00.000Z",
        "isCurrent": true,
        "createdAt": "2023-12-01T10:00:00.000Z",
        "updatedAt": "2023-12-01T10:00:00.000Z"
      }
    ],
    "count": 5,
    "processed": 5
  }
}
```

### Error Responses

#### 400 Bad Request - Missing File
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_REQUIRED_FIELD_MISSING",
    "message": "CSV file is required"
  }
}
```

#### 400 Bad Request - CSV Validation Errors
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_INVALID_FORMAT",
    "message": "CSV validation errors: Line 2: CIF is required, Line 3: At least one agent name is required"
  }
}
```

#### 400 Bad Request - Agent Not Found
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_INVALID_FORMAT",
    "message": "Processing errors: Line 2: Call agent 'John Doe' not found, Line 3: Field agent 'Jane Smith' not found"
  }
}
```

## Usage Example

### Using curl
```bash
curl -X POST \
  http://localhost:3000/assignments/bulk \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: multipart/form-data' \
  -F 'csvFile=@sample-bulk-assignment.csv'
```

### Using JavaScript/Fetch
```javascript
const formData = new FormData();
formData.append('csvFile', csvFile); // csvFile is a File object

fetch('/assignments/bulk', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

## Business Logic
1. **File Validation**: Validates that the uploaded file is a CSV with proper format
2. **Data Validation**: Ensures each row has required fields (CIF and at least one agent name)
3. **Agent Lookup**: Finds agents by name in the database
4. **Assignment Creation**: Creates new assignments and marks previous assignments as inactive
5. **Transaction Safety**: All assignments are created within a database transaction

## Notes
- If a customer already has an active assignment, it will be marked as inactive and a new assignment will be created
- Agent names must match exactly with the names stored in the database
- The API processes all rows and reports any errors found during processing
- If any errors are found, the entire operation is rolled back