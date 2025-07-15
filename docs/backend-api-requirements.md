# Backend API Specifications - Node.js + Express

## 📚 Table of Contents

- [🎯 Main Objective](#-main-objective)
- [⚠️ Non-Negotiable Requirements](#️-non-negotiable-requirements)
- [📋 Base Structure](#-base-structure)
- [🔧 Backend Implementation (Node.js + Express)](#-backend-implementation-nodejs--express)
- [📊 Response Codes](#-response-codes)
- [🚨 Error Handling](#-error-handling)
- [💡 Specific Examples by Endpoint](#-specific-examples-by-endpoint)
- [⚡ Special Cases](#-special-cases)
- [🔒 Mandatory Validations](#-mandatory-validations)
- [🧪 Testing](#-testing)
- [📊 Logs Configuration](#-logs-configuration)
- [🎯 Expected Result](#-expected-result)

---

## 🎯 **Main Objective**

Refactor **ALL** backend API responses to follow a completely consistent structure that the React frontend is already prepared to consume.

**Only exception**: Endpoints that only require HTTP status 204 No Content (without body).

## ⚠️ **Non-Negotiable Requirements**

### **1. MANDATORY STRUCTURE - No Exceptions**

**EVERY API response MUST follow exactly this structure:**

#### **SUCCESS Response**

```typescript
interface ApiSuccessResponse<T> {
  success: true; // ALWAYS boolean true
  data: T | null; // Requested data or null
  status: number; // HTTP code (200, 201, etc.)
  code: 'SUCCESS'; // ALWAYS "SUCCESS" for successful cases
  message: string; // Descriptive message in English
  timestamp: string; // ISO 8601 timestamp (MANDATORY)
  requestId: string; // Unique UUID per request (MANDATORY)
  meta?: Record<string, any>; // OPTIONAL: pagination, totals, etc.
}
```

#### **ERROR Response**

```typescript
interface ApiErrorResponse {
  success: false; // ALWAYS boolean false
  data: null; // ALWAYS null in errors
  status: number; // HTTP code (400, 401, 500, etc.)
  code: string; // Semantic code (see list below)
  message: string; // Error message in English
  timestamp: string; // ISO 8601 timestamp (MANDATORY)
  requestId: string; // Unique UUID per request (MANDATORY)
  meta?: Record<string, any>; // OPTIONAL
  error?: {
    // OPTIONAL but recommended
    type: 'validation' | 'network' | 'server' | 'authentication' | 'authorization' | 'business';
    details?: Array<{
      // Array of specific errors
      field: string; // Field that caused the error
      code: string; // Field-specific code
      message: string; // Specific message in English
    }>;
    stack?: string; // ONLY in development (NODE_ENV !== 'production')
  };
}
```

### **2. Mandatory vs Optional Fields**

#### ✅ **MANDATORY (Always present)**

- `success`: boolean
- `data`: T | null
- `status`: number
- `code`: string
- `message`: string
- `timestamp`: string (ISO 8601)
- `requestId`: string (UUID)

#### 📝 **OPTIONAL (Depending on context)**

- `meta`: Record<string, any> - For pagination, totals, etc.
- `error`: object - Additional error details

## 📋 **Base Structure**

### **JSON Examples**

#### **Simple Success Response**

```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "username": "user123",
    "role": "user"
  },
  "status": 200,
  "code": "SUCCESS",
  "message": "Login successful",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "req_abc123"
}
```

#### **Success Response with Metadata**

```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "User 1" },
    { "id": 2, "name": "User 2" }
  ],
  "status": 200,
  "code": "SUCCESS",
  "message": "Users retrieved successfully",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "req_abc123",
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### **Server Error Response**

```json
{
  "success": false,
  "data": null,
  "status": 422,
  "code": "VALIDATION_ERROR",
  "message": "The submitted data is not valid",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "req_abc123",
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
        "code": "TOO_SHORT",
        "message": "Password must be at least 8 characters"
      }
    ]
  }
}
```

#### **Network Error Response**

```json
{
  "success": false,
  "data": null,
  "status": 0,
  "code": "ERR_NETWORK",
  "message": "Network error. Check your connection",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "req_generated_client_side",
  "error": {
    "type": "network",
    "details": [
      {
        "field": "network",
        "code": "ERR_NETWORK",
        "message": "Request failed"
      }
    ]
  }
}
```

## 🔧 **Backend Implementation (Node.js + Express)**

### **Mandatory Middleware**

Implement this middleware **BEFORE** all routes:

```javascript
const { v4: uuidv4 } = require('uuid');

// Middleware to add requestId to all requests
app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// Middleware for consistent responses
const responseHandler = {
  success: (res, data = null, message = 'Operation successful', meta = null) => {
    return res.json({
      success: true,
      data,
      status: res.statusCode,
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

// Make available in all responses
app.use((req, res, next) => {
  res.apiSuccess = responseHandler.success.bind(null, res);
  res.apiError = responseHandler.error.bind(null, res);
  next();
});
```

### **TypeScript Type Extensions**

```typescript
declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
    interface Response {
      apiSuccess: (data?: any, message?: string, meta?: any) => Response;
      apiError: (
        statusCode: number,
        code: string,
        message: string,
        errorDetails?: any,
        meta?: any
      ) => Response;
    }
  }
}
```

## 📊 **Response Codes**

### **Success Code**

```javascript
const API_SUCCESS_CODES = {
  SUCCESS: 'SUCCESS',
};
```

### **Error Codes - USE EXACTLY THESE**

```javascript
const API_ERROR_CODES = {
  // Authentication & Authorization
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_USER_ALREADY_EXISTS: 'AUTH_USER_ALREADY_EXISTS',
  AUTH_EMAIL_ALREADY_EXISTS: 'AUTH_EMAIL_ALREADY_EXISTS',
  AUTH_USER_ALREADY_VERIFIED: 'AUTH_USER_ALREADY_VERIFIED',
  AUTH_NO_ACTIVE_SESSION: 'AUTH_NO_ACTIVE_SESSION',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_TOKEN_ALREADY_USED: 'AUTH_TOKEN_ALREADY_USED',
  AUTH_TOKEN_REVOKED: 'AUTH_TOKEN_REVOKED',
  AUTH_TOKEN_MALICIOUS: 'AUTH_TOKEN_MALICIOUS',
  AUTH_TOKEN_OTHER_FLOW: 'AUTH_TOKEN_OTHER_FLOW',
  AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',
  AUTH_UPDATE_FAILED: 'AUTH_UPDATE_FAILED',
  AUTH_RATE_LIMIT: 'AUTH_RATE_LIMIT',
  AUTH_USER_NOT_FOUND: 'AUTH_USER_NOT_FOUND',
  AUTH_USER_BLOCKED: 'AUTH_USER_BLOCKED',

  // Token & Session Management
  INVALID_REFRESH_TOKEN: 'INVALID_REFRESH_TOKEN',
  INVALID_RESET_TOKEN: 'INVALID_RESET_TOKEN',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  EMAIL_ALREADY_VERIFIED: 'EMAIL_ALREADY_VERIFIED',

  // Validation & Resources
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',

  // Database & Server
  DATABASE_ERROR: 'DATABASE_ERROR',

  // Network errors (do not change - Axios specific)
  ERR_NETWORK: 'ERR_NETWORK',
  ERR_CANCELED: 'ERR_CANCELED',
  ECONNABORTED: 'ECONNABORTED',
  ETIMEDOUT: 'ETIMEDOUT',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',

  // System
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
};
```

## 🚨 **Error Handling**

### **Global Error Handler**

```javascript
// Global error handler (MUST go at the end)
app.use((error, req, res, next) => {
  console.error('Error:', error);

  // Log for Morgan
  req.log = {
    error: error.message,
    stack: error.stack,
    requestId: req.requestId,
  };

  // If response already sent, do nothing
  if (res.headersSent) {
    return next(error);
  }

  // Express Validator validation errors
  if (error.type === 'validation') {
    return res.apiError(422, API_ERROR_CODES.VALIDATION_ERROR, 'The submitted data is not valid', {
      type: 'validation',
      details: error.details,
      ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
    });
  }

  // JWT authentication errors
  if (error.name === 'JsonWebTokenError') {
    return res.apiError(401, API_ERROR_CODES.AUTH_TOKEN_INVALID, 'Invalid access token');
  }

  if (error.name === 'TokenExpiredError') {
    return res.apiError(401, API_ERROR_CODES.AUTH_TOKEN_EXPIRED, 'Expired access token');
  }

  // Database error
  if (error.code === 'ER_DUP_ENTRY') {
    return res.apiError(409, API_ERROR_CODES.AUTH_USER_ALREADY_EXISTS, 'Resource already exists');
  }

  // Generic error
  return res.apiError(500, API_ERROR_CODES.UNKNOWN_ERROR, 'Internal server error', {
    type: 'server',
    ...(process.env.NODE_ENV !== 'production' && {
      details: [{ field: 'server', code: 'INTERNAL_ERROR', message: error.message }],
      stack: error.stack,
    }),
  });
});

// 404 Handler
app.use('*', (req, res) => {
  return res.apiError(
    404,
    API_ERROR_CODES.RESOURCE_NOT_FOUND,
    `Route ${req.originalUrl} does not exist`
  );
});
```

### **Differentiation: Server vs Network Errors**

#### **Server Errors (with response)**

The server responds but with error:

```javascript
// Authentication error
return res.apiError(
  401,
  API_ERROR_CODES.AUTH_INVALID_CREDENTIALS,
  'The provided credentials are incorrect',
  {
    type: 'authentication',
    details: [
      {
        field: 'credentials',
        code: 'INVALID',
        message: 'Incorrect email or password',
      },
    ],
  }
);
```

#### **Network Errors (no response)**

Handled by the client when there's no server response:

```javascript
// In the client (axios interceptor)
if (!error.response) {
  // Network error, timeout, etc.
  return {
    success: false,
    data: null,
    status: 0,
    code: error.code || 'ERR_NETWORK',
    message: getNetworkErrorMessage(error.code),
    timestamp: new Date().toISOString(),
    requestId: error.config?.headers?.['X-Request-ID'] || 'req_' + Date.now(),
    error: {
      type: 'network',
      details: [
        {
          field: 'network',
          code: error.code || 'ERR_NETWORK',
          message: error.message,
        },
      ],
    },
  };
}
```

## 💡 **Specific Examples by Endpoint**

### **POST /auth/login - Success**

```javascript
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Authentication logic...
    const user = await authenticateUser(email, password);
    const tokens = await generateTokens(user.id);

    return res.apiSuccess(
      {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      'Login successful'
    );
  } catch (error) {
    if (error.code === 'INVALID_CREDENTIALS') {
      return res.apiError(
        401,
        API_ERROR_CODES.AUTH_INVALID_CREDENTIALS,
        'The provided credentials are incorrect'
      );
    }

    return res.apiError(500, API_ERROR_CODES.UNKNOWN_ERROR, 'Internal server error');
  }
});
```

### **POST /auth/register - Validation Error**

```javascript
app.post('/auth/register', async (req, res) => {
  try {
    const validationErrors = validateRegistrationData(req.body);

    if (validationErrors.length > 0) {
      return res.apiError(
        422,
        API_ERROR_CODES.VALIDATION_ERROR,
        'The submitted data is not valid',
        {
          type: 'validation',
          details: validationErrors.map((err) => ({
            field: err.field,
            code: err.code,
            message: err.message,
          })),
        }
      );
    }

    // Registration logic...
    const user = await createUser(req.body);

    return res.apiSuccess(
      user,
      'User registered successfully. Check your email to verify your account.'
    );
  } catch (error) {
    if (error.code === 'USER_EXISTS') {
      return res.apiError(
        409,
        API_ERROR_CODES.AUTH_EMAIL_ALREADY_EXISTS,
        'Email is already registered'
      );
    }

    return res.apiError(500, API_ERROR_CODES.UNKNOWN_ERROR, 'Internal server error');
  }
});
```

### **GET /auth/verify-email/:token - Token Error**

```javascript
app.get('/auth/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const verificationResult = await verifyEmailToken(token);

    if (!verificationResult.isValid) {
      const errorCode = getTokenErrorCode(verificationResult.reason);
      const errorMessage = getTokenErrorMessage(verificationResult.reason);

      return res.apiError(400, errorCode, errorMessage, {
        type: 'authentication',
        details: [
          {
            field: 'token',
            code: errorCode,
            message: errorMessage,
          },
        ],
      });
    }

    return res.apiSuccess(verificationResult.user, 'Email verified successfully');
  } catch (error) {
    return res.apiError(500, API_ERROR_CODES.UNKNOWN_ERROR, 'Internal server error');
  }
});

function getTokenErrorCode(reason) {
  switch (reason) {
    case 'EXPIRED':
      return API_ERROR_CODES.AUTH_TOKEN_EXPIRED;
    case 'INVALID':
      return API_ERROR_CODES.AUTH_TOKEN_INVALID;
    case 'ALREADY_USED':
      return API_ERROR_CODES.AUTH_TOKEN_ALREADY_USED;
    case 'REVOKED':
      return API_ERROR_CODES.AUTH_TOKEN_REVOKED;
    default:
      return API_ERROR_CODES.AUTH_TOKEN_INVALID;
  }
}

function getTokenErrorMessage(reason) {
  switch (reason) {
    case 'EXPIRED':
      return 'The verification link has expired';
    case 'INVALID':
      return 'The verification link is not valid';
    case 'ALREADY_USED':
      return 'This link has already been used';
    case 'REVOKED':
      return 'The verification link has been revoked';
    default:
      return 'The verification link is not valid';
  }
}
```

### **GET /users - List with Pagination**

```javascript
app.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await getUsersPaginated(page, limit);

    return res.apiSuccess(
      result.users.map((user) => ({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      'Users retrieved successfully',
      {
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
          hasNext: result.hasNext,
          hasPrev: result.hasPrev,
        },
      }
    );
  } catch (error) {
    return res.apiError(500, API_ERROR_CODES.UNKNOWN_ERROR, 'Internal server error');
  }
});
```

## ⚡ **Special Cases**

### **Rate Limiting**

```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    return res.apiError(
      429,
      API_ERROR_CODES.AUTH_RATE_LIMIT,
      'Too many login attempts. Try again in 15 minutes'
    );
  },
});

app.use('/auth/login', loginLimiter);
```

### **Maintenance Mode**

```javascript
app.use((req, res, next) => {
  if (process.env.MAINTENANCE_MODE === 'true') {
    return res.apiError(
      503,
      API_ERROR_CODES.SERVICE_UNAVAILABLE,
      'Service is under maintenance. Try again later'
    );
  }
  next();
});
```

### **HTTP 204 No Content - Only Exception**

For endpoints that don't require response with body:

```javascript
app.delete('/users/:id', async (req, res) => {
  try {
    await deleteUser(req.params.id);

    // Only exception: No body, only status
    return res.status(204).send();
  } catch (error) {
    // Even in errors, follow the structure
    return res.apiError(404, API_ERROR_CODES.RESOURCE_NOT_FOUND, 'User not found');
  }
});
```

## 🔒 **Mandatory Validations**

### **1. NEVER return responses that don't follow the structure**

### **2. ALWAYS include timestamp and requestId**

### **3. ALWAYS use the exact codes from the list**

### **4. ALL messages in ENGLISH (until i18n is implemented)**

### **5. NEVER use console.log in production, use Morgan**

### **6. ALWAYS handle async/await with try/catch**

### **7. NEVER expose stack traces in production**

### **8. ALWAYS use res.apiSuccess() and res.apiError()**

### **9. ALL code must be in English until internationalization is implemented**

## 🧪 **Testing**

Each endpoint MUST return responses that comply exactly with this structure. The frontend is already prepared to consume these responses and will fail if they are not consistent.

### **Structure Test Example**

```javascript
describe('API Response Structure', () => {
  test('successful response should have correct structure', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    // Verify successful response structure
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('code', 'SUCCESS');
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('requestId');

    // Verify types
    expect(typeof response.body.success).toBe('boolean');
    expect(typeof response.body.status).toBe('number');
    expect(typeof response.body.code).toBe('string');
    expect(typeof response.body.message).toBe('string');
    expect(typeof response.body.timestamp).toBe('string');
    expect(typeof response.body.requestId).toBe('string');
  });

  test('error response should have correct structure', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'invalid@example.com', password: 'wrongpassword' });

    // Verify error response structure
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('data', null);
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('code');
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('requestId');

    // Verify that error code is valid
    expect(Object.values(API_ERROR_CODES)).toContain(response.body.code);
  });
});
```

### **Testing Utility**

```javascript
// Utility to verify response structure
function validateApiResponseStructure(response, shouldBeSuccess = true) {
  const requiredFields = ['success', 'data', 'status', 'code', 'message', 'timestamp', 'requestId'];

  requiredFields.forEach((field) => {
    expect(response.body).toHaveProperty(field);
  });

  expect(response.body.success).toBe(shouldBeSuccess);

  if (shouldBeSuccess) {
    expect(response.body.code).toBe('SUCCESS');
  } else {
    expect(response.body.data).toBeNull();
    expect(Object.values(API_ERROR_CODES)).toContain(response.body.code);
  }
}

// Usage in tests
test('login should return valid success response', async () => {
  const response = await request(app).post('/auth/login').send(validCredentials);

  validateApiResponseStructure(response, true);
  expect(response.body.data).toHaveProperty('user');
  expect(response.body.data).toHaveProperty('accessToken');
});
```

## 📊 **Logs Configuration**

### **Morgan Logs**

```javascript
const morgan = require('morgan');

// Custom token for requestId
morgan.token('requestId', (req) => req.requestId);
morgan.token('errorDetails', (req) => (req.log ? JSON.stringify(req.log) : ''));

// Custom log format
const logFormat =
  process.env.NODE_ENV === 'production'
    ? ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :requestId :errorDetails'
    : ':method :url :status :response-time ms - :res[content-length] :requestId :errorDetails';

app.use(morgan(logFormat));
```

### **Structured Logs**

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Add requestId to all logs
app.use((req, res, next) => {
  req.logger = logger.child({ requestId: req.requestId });
  next();
});
```

## 🎯 **Expected Result**

After this implementation:

### ✅ **Guarantees**

1. **Total Consistency**: EVERY response follows the same structure
2. **Predictability**: Frontend always knows what to expect
3. **Traceability**: requestId for complete tracking
4. **Debugging**: Rich information to diagnose problems
5. **Localization**: Appropriate messages in English (until i18n is implemented)
6. **Strong Typing**: Complete TypeScript for better DX
7. **Maintainability**: Clean and easy-to-maintain code

### 📋 **Development Benefits**

- **Frontend**: Unified response handling
- **Backend**: Cleaner and more maintainable code
- **Testing**: Consistent and automatable validations
- **Debugging**: Complete request traceability
- **Monitoring**: Structured and useful logs
- **Documentation**: Clear and complete specification

### 🚀 **Implementation**

**NO EXCEPTIONS. EVERY response must follow this structure.**

The React + TypeScript frontend is already completely prepared to consume this exact structure.

---

> 🔗 **Unified API Documentation** - Version 2.0
> 📅 Last updated: 2024-12-19
> ✅ **Status**: Complete specification ready for implementation
