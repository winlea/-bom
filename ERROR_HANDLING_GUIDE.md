# Error Handling Guide

## Overview

This guide outlines the standardized error handling approach for the BOM System API. It provides guidelines for consistent error responses, best practices, and examples of error handling patterns.

## Error Response Format

All API endpoints should use the standardized error response format provided by the `APIResponse` class. This ensures consistent error messages across all endpoints.

### Standard Error Response Structure

```json
{
  "success": false,
  "message": "Error message describing the issue",
  "errors": {
    "error": "Error code or identifier"
  }
}
```

### Success Response Structure

```json
{
  "success": true,
  "message": "Success message",
  "data": {
    "key": "value"
  }
}
```

## HTTP Status Codes

| Status Code | Description | Usage |
|-------------|-------------|-------|
| 200 | OK | Success |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request parameters |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server-side error |

## Error Response Methods

The `APIResponse` class provides the following error response methods:

### 1. Bad Request (400)

```python
return APIResponse.bad_request(
    message="Invalid request parameters",
    errors={"error": "invalid_parameters"}
)
```

### 2. Not Found (404)

```python
return APIResponse.not_found(
    message="Resource not found"
)
```

### 3. Internal Server Error (500)

```python
return APIResponse.internal_server_error(
    message="An internal server error occurred",
    errors={"error": "server_error"}
)
```

## Best Practices

### 1. Consistent Error Messages

- Use clear, descriptive error messages
- Include both English and Chinese error messages when appropriate
- Be specific about what caused the error
- Provide guidance on how to fix the issue when possible

### 2. Error Handling Patterns

#### For Required Fields

```python
if not required_field:
    return APIResponse.bad_request(
        message="Required field is missing",
        errors={"error": "missing_field"}
    )
```

#### For Resource Not Found

```python
resource = Model.query.get(id)
if not resource:
    return APIResponse.not_found(
        message="Resource not found"
    )
```

#### For Validation Errors

```python
try:
    # Validation logic
    validate_data(data)
except ValueError as e:
    return APIResponse.bad_request(
        message=str(e),
        errors={"error": "validation_error"}
    )
```

#### For Server Errors

```python
try:
    # Business logic
    result = process_data(data)
except Exception as e:
    return APIResponse.internal_server_error(
        message=f"An error occurred: {str(e)}",
        errors={"error": "server_error"}
    )
```

### 3. Logging

- Always log exceptions with traceback
- Log error details for debugging
- Do not expose sensitive error details to the client

### 4. Error Codes

Use consistent error codes to identify different types of errors:

| Error Code | Description |
|------------|-------------|
| missing_field | Required field is missing |
| invalid_parameter | Invalid parameter value |
| resource_not_found | Requested resource not found |
| validation_error | Data validation failed |
| server_error | Internal server error |
| file_error | File upload/processing error |

## Examples

### 1. Create Project Error

**Request:**
```json
POST /api/projects
{
  "description": "Test project"
}
```

**Response:**
```json
{
  "success": false,
  "message": "项目名称不能为空",
  "errors": {
    "error": "name required"
  }
}
```

### 2. Get Non-Existent Part

**Request:**
```
GET /api/parts/999999
```

**Response:**
```json
{
  "success": false,
  "message": "part not found",
  "errors": null
}
```

### 3. Invalid BOM Import

**Request:**
```
POST /api/import/bom
```

**Response:**
```json
{
  "success": false,
  "message": "请上传CSV或Excel文件",
  "errors": {
    "error": "file is required"
  }
}
```

## Testing Error Handling

Use the `test_error_handling.py` script to test error handling for all major endpoints:

```bash
python test_error_handling.py
```

This script tests various error scenarios and verifies that endpoints return the correct error messages and status codes.

## Conclusion

Consistent error handling is essential for a robust API. By following these guidelines, we ensure that:

1. Error messages are clear and consistent
2. Clients receive meaningful error responses
3. Debugging is easier for developers
4. The API behaves predictably in error scenarios

Always use the `APIResponse` class for error responses to maintain consistency across all endpoints.