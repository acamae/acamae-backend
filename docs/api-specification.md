# API Specification - Complete Developer Guide

## Overview

This document defines the **complete API specification** for the Acamae platform. It serves as the single source of truth for both frontend and backend teams, ensuring consistent API responses across all endpoints.

**Target Audience**: Frontend developers, backend developers, and new team members joining the project.

## Table of Contents

- [Quick Start](#quick-start)
- [Response Structure](#response-structure)
- [HTTP Status Codes](#http-status-codes)
- [Error Codes](#error-codes)
- [Authentication Endpoints](#authentication-endpoints)
- [Implementation Examples](#implementation-examples)
- [Testing Guidelines](#testing-guidelines)
- [Common Mistakes](#common-mistakes)

---

## Quick Start

### For New Developers

The API follows a **consistent structure** for all responses. Every endpoint returns the same basic format, making it predictable and easy to work with.

**Basic Rule**: All responses include these 7 fields:

```json
{
  "success": true,
  "data": "...",
  "status": 200,
  "code": "SUCCESS",
  "message": "Operation completed successfully",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### What Makes This API Special

1. **Predictable**: Same structure for all endpoints
2. **Traceable**: Every response has a unique `requestId`
3. **Clear**: Success/error states are always obvious
4. **Debuggable**: Timestamps and error details help with troubleshooting

---

## Response Structure

### Success Response

When an API call succeeds, you'll always get this structure:

```typescript
interface ApiSuccessResponse<T> {
  success: true; // Always true for success
  data: T | null; // The actual data you requested
  status: number; // HTTP status code (200, 201, etc.)
  code: 'SUCCESS'; // Always 'SUCCESS' for successful calls
  message: string; // Human-readable success message
  timestamp: string; // When the response was generated (ISO 8601)
  requestId: string; // Unique ID for this request (UUID)
  meta?: Record<string, unknown>; // Optional: pagination, totals, etc.
}
```

**Example - User Login Success**:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123456",
      "email": "user@example.com",
      "username": "user123",
      "role": "user"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "status": 200,
  "code": "SUCCESS",
  "message": "Login successful",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Error Response

When something goes wrong, you'll get this structure:

```typescript
interface ApiErrorResponse {
  success: false; // Always false for errors
  data: null; // Always null for errors
  status: number; // HTTP status code (400, 401, 500, etc.)
  code: string; // Specific error code (see Error Codes section)
  message: string; // Human-readable error message
  timestamp: string; // When the error occurred (ISO 8601)
  requestId: string; // Unique ID for this request (UUID)
  meta?: Record<string, unknown>; // Optional: additional context
  error?: {
    // Optional: detailed error information
    type: 'validation' | 'network' | 'server' | 'authentication' | 'authorization' | 'business';
    details?: Array<{
      field: string; // Which field caused the error
      code: string; // Field-specific error code
      message: string; // Field-specific error message
    }>;
    stack?: string; // Stack trace (development only)
  };
}
```

**Example - Validation Error**:

```json
{
  "success": false,
  "data": null,
  "status": 422,
  "code": "VALIDATION_ERROR",
  "message": "The submitted data is not valid",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "error": {
    "type": "validation",
    "details": [
      {
        "field": "email",
        "code": "INVALID_FORMAT",
        "message": "The email format is not valid"
      },
      {
        "field": "password",
        "code": "TOO_WEAK",
        "message": "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character"
      }
    ]
  }
}
```

### Key Differences from Standard APIs

Many APIs return different structures for different endpoints. **Our API is different**:

- **Every endpoint** uses the same structure
- **No exceptions** - even simple endpoints include all required fields
- **No naked data** - data is always wrapped in the standard structure
- **No mixed responses** - success/error distinction is always clear

---

## HTTP Status Codes

### Success Codes

- **200 OK**: Standard success response
- **201 Created**: Resource created successfully (e.g., user registration)

### Client Error Codes

- **400 Bad Request**: Invalid request format or malformed data
- **401 Unauthorized**: Authentication failed or token expired
- **404 Not Found**: Requested resource doesn't exist
- **409 Conflict**: Resource already exists (e.g., email already registered)
- **422 Unprocessable Entity**: Validation errors
- **429 Too Many Requests**: Rate limiting exceeded

### Server Error Codes

- **500 Internal Server Error**: Unexpected server error
- **503 Service Unavailable**: Service temporarily unavailable (e.g., email service down)

### Network Error Codes

- **0**: Network error (no HTTP response received)

---

## Error Codes

### Authentication & Authorization

- `AUTH_INVALID_CREDENTIALS` - Wrong email/password combination
- `AUTH_FORBIDDEN` - Incorrect password for valid user
- `AUTH_USER_NOT_FOUND` - User account doesn't exist
- `AUTH_TOKEN_EXPIRED` - Access token has expired
- `AUTH_TOKEN_INVALID` - Token is malformed or invalid
- `AUTH_TOKEN_ALREADY_USED` - Reset token has already been used
- `EMAIL_NOT_VERIFIED` - User hasn't verified their email
- `AUTH_RATE_LIMIT` - Too many authentication attempts

### User Management

- `AUTH_EMAIL_ALREADY_EXISTS` - Email is already registered
- `AUTH_USER_ALREADY_EXISTS` - Username is already taken
- `AUTH_USER_ALREADY_VERIFIED` - User is already verified

### Validation

- `VALIDATION_ERROR` - General validation failure
- `INVALID_RESET_TOKEN` - Password reset token is invalid

### System

- `DATABASE_ERROR` - Database operation failed
- `SERVICE_UNAVAILABLE` - External service is down
- `UNKNOWN_ERROR` - Unexpected error occurred
- `SUCCESS` - Operation completed successfully

### Network (Client-side only)

- `ERR_NETWORK` - Network connection failed
- `ERR_CANCELED` - Request was canceled
- `ECONNABORTED` - Connection was aborted
- `ETIMEDOUT` - Request timed out

---

## Authentication Endpoints

### POST /auth/login

Authenticate a user with email and password.

**Request**:

```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Success Response (200)**:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123456",
      "email": "user@example.com",
      "username": "user123",
      "role": "user",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "status": 200,
  "code": "SUCCESS",
  "message": "Login successful",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Error Responses**:

- **401**: Wrong password or email not verified
- **404**: Email not found
- **422**: Invalid email/password format
- **429**: Too many login attempts

### POST /auth/register

Create a new user account.

**Request**:

```json
{
  "email": "newuser@example.com",
  "username": "newuser",
  "password": "Password123!"
}
```

**Success Response (201)**:

```json
{
  "success": true,
  "data": {
    "id": "user_123456",
    "email": "newuser@example.com",
    "username": "newuser",
    "role": "user",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "status": 201,
  "code": "SUCCESS",
  "message": "User registered successfully. Check your email to verify your account.",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Error Responses**:

- **409**: Email or username already exists
- **422**: Validation errors
- **503**: Email service unavailable

### POST /auth/forgot-password

Request a password reset email.

**Request**:

```json
{
  "email": "user@example.com"
}
```

**Success Response (200)**:

```json
{
  "success": true,
  "data": null,
  "status": 200,
  "code": "SUCCESS",
  "message": "We have sent you a link to reset your password",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## Implementation Examples

### Frontend (TypeScript/React)

```typescript
// API Response Types
import { ApiSuccessResponse, ApiErrorResponse } from '@/types/api';

// Making an API call
async function loginUser(email: string, password: string) {
  try {
    const response = await axios.post<ApiSuccessResponse<LoginData>>('/auth/login', {
      email,
      password,
    });

    // Success - response always has the same structure
    console.log('Login successful:', response.data.message);
    console.log('User data:', response.data.data.user);
    console.log('Request ID:', response.data.requestId);

    return response.data;
  } catch (error) {
    // Error - also has consistent structure
    if (error.response?.data) {
      const errorData = error.response.data as ApiErrorResponse;
      console.log('Login failed:', errorData.message);
      console.log('Error code:', errorData.code);
      console.log('Request ID:', errorData.requestId);

      // Handle specific validation errors
      if (errorData.error?.details) {
        errorData.error.details.forEach(detail => {
          console.log(`Field ${detail.field}: ${detail.message}`);
        });
      }
    }
    throw error;
  }
}
```

### Backend (Node.js/Express)

```javascript
// Response helpers
const responseHelper = {
  success: (res, data = null, message = 'Operation successful', meta = null) => {
    return res.status(res.statusCode || 200).json({
      success: true,
      data,
      status: res.statusCode || 200,
      code: 'SUCCESS',
      message,
      timestamp: new Date().toISOString(),
      requestId: res.req.requestId,
      ...(meta && { meta }),
    });
  },

  error: (res, statusCode, code, message, errorDetails = null, meta = null) => {
    const errorResponse = {
      success: false,
      data: null,
      status: statusCode,
      code,
      message,
      timestamp: new Date().toISOString(),
      requestId: res.req.requestId,
      ...(meta && { meta }),
    };

    if (errorDetails) {
      errorResponse.error = errorDetails;
    }

    return res.status(statusCode).json(errorResponse);
  },
};

// Using in controllers
async function loginController(req, res) {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.apiError(422, 'VALIDATION_ERROR', 'Email and password are required', {
        type: 'validation',
        details: [
          { field: 'email', code: 'REQUIRED', message: 'Email is required' },
          { field: 'password', code: 'REQUIRED', message: 'Password is required' },
        ],
      });
    }

    // Business logic
    const user = await User.findOne({ email });
    if (!user) {
      return res.apiError(404, 'AUTH_INVALID_CREDENTIALS', 'Invalid credentials');
    }

    // Success
    const tokens = generateTokens(user);
    return res.apiSuccess(
      {
        user: sanitizeUser(user),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      'Login successful'
    );
  } catch (error) {
    console.error('Login error:', error);
    return res.apiError(500, 'DATABASE_ERROR', 'Database operation failed');
  }
}
```

---

## Testing Guidelines

### What to Test

1. **Response Structure**: Verify all required fields are present
2. **Success Cases**: Test happy path scenarios
3. **Error Cases**: Test validation errors, authentication failures, etc.
4. **Edge Cases**: Test boundary conditions and unexpected inputs

### Example Test (Jest)

```javascript
describe('POST /auth/login', () => {
  test('should return success response with correct structure', async () => {
    const response = await request(app).post('/auth/login').send({
      email: 'test@example.com',
      password: 'Password123!',
    });

    expect(response.status).toBe(200);

    // Verify response structure
    expect(response.body).toMatchObject({
      success: true,
      data: expect.any(Object),
      status: 200,
      code: 'SUCCESS',
      message: expect.any(String),
      timestamp: expect.any(String),
      requestId: expect.any(String),
    });

    // Verify data content
    expect(response.body.data).toHaveProperty('user');
    expect(response.body.data).toHaveProperty('accessToken');
    expect(response.body.data).toHaveProperty('refreshToken');
  });

  test('should return error response for invalid credentials', async () => {
    const response = await request(app).post('/auth/login').send({
      email: 'wrong@example.com',
      password: 'wrongpassword',
    });

    expect(response.status).toBe(404);

    // Verify error structure
    expect(response.body).toMatchObject({
      success: false,
      data: null,
      status: 404,
      code: 'AUTH_INVALID_CREDENTIALS',
      message: expect.any(String),
      timestamp: expect.any(String),
      requestId: expect.any(String),
    });
  });
});
```

---

## Common Mistakes

### ❌ What NOT to Do

1. **Don't return raw data**:

   ```json
   // Wrong
   { "id": 1, "name": "John" }

   // Correct
   {
     "success": true,
     "data": { "id": 1, "name": "John" },
     "status": 200,
     "code": "SUCCESS",
     "message": "User retrieved successfully",
     "timestamp": "2024-01-15T10:30:00.000Z",
     "requestId": "550e8400-e29b-41d4-a716-446655440000"
   }
   ```

2. **Don't use different structures for different endpoints**:

   ```json
   // Wrong - different structure
   { "result": "success", "user": {...} }

   // Correct - consistent structure
   { "success": true, "data": {...}, ... }
   ```

3. **Don't forget required fields**:

   ```json
   // Wrong - missing timestamp, requestId
   { "success": true, "data": {...}, "message": "OK" }
   ```

4. **Don't use generic error messages**:

   ```json
   // Wrong
   { "message": "Error" }

   // Correct
   { "message": "Invalid email format", "code": "VALIDATION_ERROR" }
   ```

### ✅ Best Practices

1. **Always include all required fields**
2. **Use meaningful error codes**
3. **Provide helpful error messages**
4. **Include request IDs for debugging**
5. **Use consistent field names**
6. **Validate response structure in tests**

---

## Need Help?

- **OpenAPI Specification**: See `docs/swagger.yml` for complete endpoint documentation
- **Frontend Implementation**: Check `src/infrastructure/api/AuthApiRepository.ts`
- **Type Definitions**: See `src/domain/types/apiSchema.ts`
- **Example Tests**: Look at `src/infrastructure/api/__tests__/AuthApiRepository.test.ts`

**Remember**: When in doubt, follow the structure. Every response should look the same, making your code predictable and easier to debug.
