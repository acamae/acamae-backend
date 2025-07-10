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
- **Spanish Localization** for all user-facing messages
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

### Input Validation and Sanitization

- **Zod Schema Validation**: All request data is validated using Zod schemas
- **Custom Sanitization**: Built-in sanitization for:
  - HTML content
  - SQL injection prevention
  - XSS protection
  - Parameter pollution prevention

### Security Middleware

- **Helmet**: Sets various HTTP headers for security
- **CORS**: Configurable Cross-Origin Resource Sharing
- **Rate Limiting**: Prevents brute force attacks
- **Custom HPP Protection**: Prevents HTTP Parameter Pollution
- **Custom XSS Protection**: Sanitizes all input data

### Authentication & Authorization

- JWT-based authentication
- Role-based access control
- Secure password hashing with bcryptjs
- Token refresh mechanism

## API Response Standards

All API responses follow a **mandatory standardized structure** to ensure consistency across the entire application:

### Success Response Structure

```json
{
  "success": true,
  "data": {},
  "status": 200,
  "code": "SUCCESS",
  "message": "Operación exitosa",
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
  "code": "VALIDATION_FAILED",
  "message": "Los datos enviados no son válidos",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "error": {
    "type": "validation",
    "details": [
      {
        "field": "email",
        "code": "INVALID_FORMAT",
        "message": "El formato del email no es válido"
      }
    ]
  }
}
```

### Key Features

- **Unique Request ID**: Every request gets a UUID for traceability
- **Consistent Structure**: All endpoints use the same response format
- **Semantic Error Codes**: Predefined codes for different error types
- **Spanish Messages**: All user-facing messages are in Spanish
- **Mandatory Fields**: `timestamp` and `requestId` in every response

## Middleware Architecture

The Express application centralizes core concerns in composable helpers located in `src/infrastructure/middleware`:

| Concern     | Helper                        | Responsibilities                                                                                                            |
| ----------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Security    | `applySecurityMiddleware`     | Helmet, CORS, rate-limiting, HPP, XSS sanitisation, JSON & URL-encoded size limits, correlation-ID, extra security headers. |
| Compression | `applyCompression`            | Gzip compression with custom threshold & filter.                                                                            |
| Logging     | `requestLogger / errorLogger` | Structured request/response/error logging with Winston (console in dev/test, rotating files in prod).                       |
| Response    | `responseHandler`             | Standardized API responses with `res.apiSuccess()` and `res.apiError()` methods.                                            |
| Request ID  | `requestId`                   | Generates unique UUID for each request and adds to headers for traceability.                                                |

These helpers are applied **once** in `src/infrastructure/app.js` and ensure consistent behavior across all endpoints:

```js
// app.js (excerpt)
applySecurityMiddleware(app);
applyCompression(app);
app.use(requestLogger);
app.use(responseHandler);
...
app.use(errorLogger);
```

### Response Helper Usage

```js
// Success response
return res.apiSuccess(userData, 'Usuario obtenido exitosamente');

// Error response
return res.apiError(404, 'RESOURCE_NOT_FOUND', 'Usuario no encontrado');
```

In test environment the helpers are mocked in `jest.setup.js` to keep the suites fast and isolated.

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
- **Email Verification**: `POST /auth/verify-email/:token` - Verify user email
- **Password Reset**: `POST /auth/forgot-password` - Request password reset
- **Token Refresh**: `POST /auth/refresh-token` - Refresh access tokens
- **Logout**: `POST /auth/logout` - End user session

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
  "message": "Sistema funcionando correctamente",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}

# Error example
curl -X POST https://localhost/auth/login -d '{"email":"invalid"}'
{
  "success": false,
  "data": null,
  "status": 422,
  "code": "VALIDATION_FAILED",
  "message": "Los datos enviados no son válidos",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "error": {
    "type": "validation",
    "details": [
      {
        "field": "email",
        "code": "INVALID_FORMAT",
        "message": "El formato del email no es válido"
      }
    ]
  }
}
```

### Documentation Resources

- **OpenAPI Specification**: `docs/swagger.yml` - Complete API documentation
- **API Requirements**: `docs/backend-api-requirements.md` - Detailed API standards
- **Error Codes**: `src/shared/constants/apiCodes.js` - All error code definitions

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
