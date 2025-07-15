# Acamae Backend

A robust, scalable, and secure backend built with Node.js, Express, and Prisma, following Clean Architecture principles.

## Features

- **Clean Architecture** with clear separation of concerns
- **Standardized API Responses** with consistent structure across all endpoints
- **Request Tracking** with unique requestId for every API call
- **Type Safety** with Zod validation and input sanitization
- **Database Integration** with MySQL and Prisma ORM
- **JWT-based Authentication** with role-based access control
- **Comprehensive Security** features and middleware
- **Centralized Error Handling** with semantic error codes
- **English Localization** for all user-facing messages (until i18n is implemented)
- **OpenAPI/Swagger Documentation** for API contracts
- **Docker Support** for development and production environments
- **Automated Database Migrations** and backup systems

## Project Structure

```
src/
├── application/    # Application business rules
│   ├── services/   # Business logic services
│   └── dtos/       # Data Transfer Objects
├── domain/         # Enterprise business rules
│   ├── entities/   # Domain models
│   └── repositories/ # Repository interfaces
├── infrastructure/ # Frameworks, drivers, and tools
│   ├── controllers/ # HTTP controllers
│   ├── middleware/  # Express middleware
│   ├── repositories/ # Repository implementations
│   └── routes/      # API routes
├── shared/         # Shared utilities and constants
│   ├── constants/   # Application constants
│   └── utils/       # Utility functions
└── index.js        # Application entry point
```

## Security Features

### 🔒 Database Security

**SQL Injection Prevention**

- **Prisma ORM**: Uses prepared statements automatically for all database queries
- **Parameter Escaping**: All user inputs are automatically escaped before database operations
- **Type Safety**: Strong typing prevents injection through type coercion
- **Query Validation**: All queries are validated at the ORM level

**Database Connection Security**

- **Connection Pooling**: Efficient connection management with automatic cleanup
- **Transaction Support**: Atomic operations for data integrity
- **Migration Safety**: Schema changes are versioned and reversible

### 🛡️ Input Validation & Sanitization

**Multi-Layer Validation System**

- **Zod Schema Validation**: All request data validated using comprehensive Zod schemas
- **Type Validation**: Strict type checking for all inputs
- **Format Validation**: Email, UUID, and custom format validation
- **Length Validation**: Enforced limits on all string inputs

**Advanced Sanitization**

- **HTML Sanitization**: `sanitize-html` library with zero allowed tags
- **XSS Prevention**: `html-escaper` for comprehensive HTML escaping
- **String Sanitization**: Automatic trimming and cleaning of all strings
- **Email Sanitization**: Lowercase conversion and format validation
- **Number Sanitization**: Safe conversion with fallback to defaults

**Validation Examples**

```javascript
// Email validation with sanitization
email: z
  .string()
  .email(ERROR_MESSAGES.INVALID_EMAIL)
  .transform(sanitizeEmail),

// UUID validation for tokens
token: z.string().uuid('Invalid token format'),

// String sanitization with length limits
username: z
  .string()
  .min(MIN_USERNAME_LENGTH)
  .max(MAX_USERNAME_LENGTH)
  .regex(REGEX.USERNAME)
  .transform(sanitizeString),
```

### 🚨 Security Middleware

**HTTP Security Headers (Helmet)**

- **XSS Protection**: `X-XSS-Protection: 1; mode=block`
- **Content Security Policy**: Strict CSP headers
- **Frame Options**: `X-Frame-Options: DENY`
- **Content Type Options**: `X-Content-Type-Options: nosniff`
- **Referrer Policy**: `Referrer-Policy: strict-origin-when-cross-origin`

**Cross-Origin Resource Sharing (CORS)**

- **Configurable Origins**: Environment-based CORS configuration
- **Method Restrictions**: Only allowed HTTP methods
- **Header Restrictions**: Limited allowed headers
- **Credentials Support**: Secure cookie handling

**Rate Limiting**

- **Authentication Routes**: Stricter limits (5 requests per 15 minutes)
- **General Routes**: Standard limits (100 requests per 15 minutes)
- **IP-based Tracking**: Prevents brute force attacks
- **Custom Error Responses**: Standardized rate limit error messages

**HTTP Parameter Pollution (HPP) Protection**

- **Array Handling**: Keeps only the last value of duplicate parameters
- **Query Parameters**: Prevents parameter pollution in URLs
- **Body Parameters**: Prevents pollution in request bodies
- **Automatic Cleanup**: Removes malicious duplicate parameters

**XSS Protection Middleware**

- **Request Sanitization**: All incoming data sanitized automatically
- **HTML Escaping**: Comprehensive HTML entity escaping
- **Tag Removal**: Zero HTML tags allowed in user input
- **Recursive Sanitization**: Deep object sanitization

### 🔐 Authentication & Authorization

**JWT-Based Authentication**

- **Access Tokens**: Short-lived tokens (1 day default)
- **Refresh Tokens**: Long-lived tokens with rotation (7 days)
- **Secure Storage**: HTTP-only cookies for refresh tokens
- **Token Validation**: Comprehensive JWT signature verification

**Password Security**

- **bcrypt Hashing**: Industry-standard password hashing (salt rounds: 10)
- **Secure Comparison**: Timing-attack resistant password comparison
- **Password Requirements**: Enforced complexity rules
- **Hash Storage**: Only hashed passwords stored in database

**Role-Based Access Control (RBAC)**

- **User Roles**: User, Manager, Admin hierarchy
- **Permission System**: Granular permission checking
- **Route Protection**: Middleware-based route protection
- **Role Validation**: Automatic role verification

**Session Management**

- **Token Rotation**: Automatic refresh token rotation
- **Session Tracking**: Database-stored session tokens
- **Automatic Cleanup**: Expired session cleanup
- **Concurrent Sessions**: Support for multiple active sessions

**Email Verification System**

- **Secure Tokens**: UUID-based verification tokens
- **Token Expiration**: Time-limited verification links (10 minutes)
- **One-Time Use**: Tokens invalidated after use
- **Resend Protection**: Rate-limited resend functionality

### 🚫 Attack Prevention

**Suspicious Request Detection**

- **User Agent Blocking**: Blocks known attack tools (sqlmap, nikto, nmap, etc.)
- **Header Validation**: Validates and sanitizes all request headers
- **Request Size Limits**: Prevents oversized request attacks
- **Content Type Validation**: Strict content type checking

**Error Handling Security**

- **Information Disclosure Prevention**: No sensitive data in error messages
- **Stack Trace Protection**: Stack traces only in development
- **Generic Error Messages**: Production-safe error responses
- **Log Sanitization**: Sensitive data removed from logs

**Request Tracking**

- **Unique Request IDs**: UUID-based request tracking
- **Correlation IDs**: Request correlation across services
- **Audit Logging**: Comprehensive request/response logging
- **Performance Monitoring**: Request timing and performance tracking

### 🔍 Security Monitoring

**Comprehensive Logging**

- **Request Logging**: All requests logged with context
- **Error Logging**: Detailed error logging with sanitization
- **Security Events**: Suspicious activity logging
- **Performance Metrics**: Request timing and resource usage

**Health Monitoring**

- **Database Connectivity**: Real-time database health checks
- **Service Availability**: External service monitoring
- **Resource Monitoring**: Memory and CPU usage tracking
- **Uptime Monitoring**: System availability tracking

### 🛠️ Security Configuration

**Environment-Based Security**

- **Development**: Enhanced debugging with detailed errors
- **Production**: Strict security with minimal information disclosure
- **Testing**: Isolated security settings for testing
- **Staging**: Production-like security configuration

**Security Headers Configuration**

```javascript
// Automatic security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);
```

### 📋 Security Checklist

✅ **Input Validation**: All inputs validated with Zod schemas
✅ **SQL Injection Prevention**: Prisma ORM with prepared statements
✅ **XSS Protection**: HTML sanitization and escaping
✅ **CSRF Protection**: JWT tokens with secure storage
✅ **Rate Limiting**: IP-based rate limiting on all routes
✅ **Authentication**: Secure JWT-based authentication
✅ **Authorization**: Role-based access control
✅ **Password Security**: bcrypt hashing with salt
✅ **Session Security**: Secure session management
✅ **Error Handling**: Secure error responses
✅ **Logging**: Comprehensive security logging
✅ **Headers**: Security headers with Helmet
✅ **CORS**: Proper CORS configuration
✅ **HTTPS**: SSL/TLS encryption support
✅ **Monitoring**: Security event monitoring

## API Response Standards

All API responses follow a **mandatory standardized structure** to ensure consistency across the entire application:

### Success Response Structure

```json
{
  "success": true,
  "data": {},
  "status": 200,
  "code": "SUCCESS",
  "message": "Operation successful",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "meta": {}
}
```

### Error Response Structure

```json
{
  "success": false,
  "data": null,
  "status": 400,
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
      }
    ]
  }
}
```

### Key Features

- **Unique Request ID**: Every request gets a UUID for traceability
- **Consistent Structure**: All endpoints use the same response format
- **Semantic Error Codes**: Predefined codes for different error types
- **English Messages**: All user-facing messages are in English (until i18n is implemented)
- **Mandatory Fields**: `timestamp` and `requestId` in every response

## Error Codes Reference

### Authentication & Authorization

- `AUTH_INVALID_CREDENTIALS` - Invalid email or password
- `AUTH_TOKEN_EXPIRED` - JWT token has expired
- `AUTH_TOKEN_INVALID` - Invalid JWT token
- `AUTH_FORBIDDEN` - Access denied (incorrect password)
- `AUTH_USER_NOT_FOUND` - User not found
- `AUTH_USER_ALREADY_EXISTS` - Username already exists
- `AUTH_EMAIL_ALREADY_EXISTS` - Email already exists
- `AUTH_USER_ALREADY_VERIFIED` - User already verified
- `AUTH_RATE_LIMIT` - Too many authentication attempts

### Validation & Resources

- `VALIDATION_ERROR` - Input validation failed
- `RESOURCE_NOT_FOUND` - Requested resource not found
- `INVALID_REFRESH_TOKEN` - Invalid refresh token
- `EMAIL_NOT_VERIFIED` - Email not verified

### System & Network

- `DATABASE_ERROR` - Database operation failed
- `SERVICE_UNAVAILABLE` - External service unavailable
- `UNKNOWN_ERROR` - Unexpected server error

## Authentication Endpoints

### Updated Response Behaviors

**POST /auth/login**

- Success: Returns user object with tokens
- 404: Invalid email (user not found)
- 401: Invalid password or email not verified
- 422: Validation errors

**POST /auth/register**

- Success: Returns created user object (not null)
- 409: Email or username already exists (separate error codes)
- 503: Email service unavailable

**GET /auth/verify-email/:token**

- Success: Returns verified user object
- 400: Invalid token format
- 401: Expired or invalid token
- 409: User already verified

**POST /auth/refresh-token**

- Success: Returns new access and refresh tokens
- 400: Missing refresh token
- 401: Invalid refresh token or user not found
- 404: Token not found
- 500: Database error

## Middleware Architecture

The Express application centralizes core concerns in composable helpers located in `src/infrastructure/middleware`:

| Concern     | Helper                        | Responsibilities                                                                                                            |
| ----------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Security    | `applySecurityMiddleware`     | Helmet, CORS, rate-limiting, HPP, XSS sanitisation, JSON & URL-encoded size limits, correlation-ID, extra security headers. |
| Compression | `applyCompression`            | Gzip compression with custom threshold & filter.                                                                            |
| Logging     | `requestLogger / errorLogger` | Structured request/response/error logging with Winston (console in dev/test, rotating files in prod).                       |
| Response    | `responseHelpersMiddleware`   | Standardized API responses with `res.apiSuccess()` and `res.apiError()` methods.                                            |
| Request ID  | `requestIdMiddleware`         | Generates unique UUID for each request and adds to headers for traceability.                                                |

### Response Helper Usage

```js
// Success response
return res.apiSuccess(userData, 'User retrieved successfully');

// Error response
return res.apiError(404, 'RESOURCE_NOT_FOUND', 'User not found');
```

## Prerequisites

### For Windows:

- **Docker Desktop**: With WSL 2 backend (default)
- **Node.js >= 22.16.0**
- **Git**

### For Linux/Mac:

- **Node.js >= 22.16.0**
- **Docker Desktop** or **Docker Engine**
- **Git**

### For all systems:

- **MySQL >= 8.0** or **MariaDB >= 10.5** (optional, included in Docker)

## Quick Start

```bash
# Clone and setup
git clone <repository-url>
cd backend
npm run setup

# Configure environment
nano .env.development

# Start development environment
npm run docker:up

# Access the application
# API: https://localhost/api
# phpMyAdmin: https://localhost/phpmyadmin
```

> **📖 For detailed development guidelines, see [DEVELOPMENT.md](./docs/DEVELOPMENT.md)**

## Docker Setup

### Windows with Docker Desktop

1. **Install Docker Desktop**: Download from [docker.com](https://www.docker.com/products/docker-desktop/)
2. **WSL 2 Integration**: Docker Desktop uses WSL 2 backend by default
3. **Restart Docker Desktop** if needed

### Verify setup

The `npm run setup` script automatically includes a complete Docker verification.

## Common Issues

> **📖 For detailed troubleshooting, see [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)**

### Quick fixes:

```bash
# Docker setup
npm run docker:reset

# Environment issues
npm run env:dev
npm run test:env

# Database issues
npm run docker:reset
```

## Available Scripts

> **📖 For detailed script documentation, see [SCRIPTS.md](./docs/SCRIPTS.md)**

### Configuration

```bash
npm run setup              # Complete initial setup
npm run setup:backend      # Configure backend
npm run setup:env          # Copy environment variables
npm run test:env           # Verify configuration
npm run env:setup          # Complete environment setup
```

### Database

```bash
npm run db:backup          # Create backup
npm run db:rollback        # Perform rollback
npm run db:status          # Check status
```

### Utilities

```bash
npm run generate-ssl       # Generate SSL certificates
```

## API Documentation

### Available Endpoints

- **Health Check**: `GET /api/health` - System health status
- **API Root**: `GET /` - API metadata and version information

### Authentication Endpoints

- **Login**: `POST /auth/login` - User authentication
- **Register**: `POST /auth/register` - User registration
- **Email Verification**: `GET /auth/verify-email/:token` - Verify user email
- **Password Reset**: `POST /auth/forgot-password` - Request password reset
- **Reset Password**: `POST /auth/reset-password/:token` - Change password with token
- **Token Refresh**: `POST /auth/refresh-token` - Refresh access tokens
- **Logout**: `POST /auth/logout` - End user session
- **Current User**: `GET /auth/me` - Get current user info
- **Resend Verification**: `POST /auth/resend-verification` - Resend verification email

### User Management Endpoints

- **Get Users**: `GET /users` - List users with pagination
- **Get User**: `GET /users/:id` - Get user by ID
- **Update User**: `PUT /users/:id` - Update user information
- **Delete User**: `DELETE /users/:id` - Delete user

### Response Examples

All endpoints return standardized responses with consistent structure:

```bash
# Success example
curl -X GET https://localhost/api/health
{
  "success": true,
  "data": { "status": "healthy", "uptime": 12345 },
  "status": 200,
  "code": "SUCCESS",
  "message": "System is running correctly",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}

# Error example
curl -X POST https://localhost/auth/login -d '{"email":"invalid"}'
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
      }
    ]
  }
}
```

### Documentation Resources

- **OpenAPI Specification**: `docs/swagger.yml` - Complete API documentation
- **API Requirements**: `docs/backend-api-requirements.md` - Detailed API standards
- **Error Codes**: `src/shared/constants/apiCodes.js` - All error code definitions

## Recent Updates

### Authentication System

- **Enhanced Error Handling**: More specific error codes for different failure scenarios
- **Email Verification**: Improved flow with better error messages
- **Token Management**: Secure refresh token rotation
- **Rate Limiting**: Enhanced protection against brute force attacks

### API Improvements

- **Consistent Responses**: All endpoints now use standardized response structure
- **Better Validation**: Comprehensive input validation with Zod schemas
- **Error Traceability**: Unique request IDs for better debugging
- **English Messages**: All user-facing messages in English (until i18n is implemented)

### Security Enhancements

- **Input Sanitization**: XSS and injection protection
- **CORS Configuration**: Proper cross-origin resource sharing
- **Security Headers**: Comprehensive HTTP security headers
- **Request Tracking**: Correlation IDs for request tracing

## Language Requirements

**CRITICAL**: All code must be in English until internationalization is implemented:

- **NO exceptions**: variables, functions, comments, messages, documentation
- **User-facing messages**: Use English until i18n system is in place
- **API responses**: All messages in English
- **Error messages**: English only
- **Comments**: English only
- **Documentation**: English only
- **Variable names**: English only
- **Function names**: English only

## Contributing

Please read `docs/DEVELOPMENT.md` for detailed development guidelines.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Follow the development workflow in `docs/DEVELOPMENT.md`
4. Commit your changes: `git commit -m 'feat: add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Create a Pull Request

## License

MIT

## Authors

@alfonsomartinde (Alfonso Martin)

## Acknowledgments

- Clean Architecture principles
- Express.js community
- Prisma team
- Docker community
