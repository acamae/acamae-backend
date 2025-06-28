# Acamae Backend

A robust, scalable, and secure backend built with Node.js, Express, and Prisma, following Clean Architecture principles.

## Features

- Clean Architecture with clear separation of concerns
- Type safety with Zod validation
- Database integration with MySQL and Prisma
- JWT-based authentication
- Comprehensive security features
- Documentation with OpenAPI/Swagger
- Docker support for development and production
- Automated database migrations and backups

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

## Middleware Architecture

The Express application now centralizes core concerns in three composable helpers located in `src/infrastructure/middleware`:

| Concern     | Helper                        | Responsibilities                                                                                                            |
| ----------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Security    | `applySecurityMiddleware`     | Helmet, CORS, rate-limiting, HPP, XSS sanitisation, JSON & URL-encoded size limits, correlation-ID, extra security headers. |
| Compression | `applyCompression`            | Gzip compression with custom threshold & filter.                                                                            |
| Logging     | `requestLogger / errorLogger` | Structured request/response/error logging with Winston (console in dev/test, rotating files in prod).                       |

These helpers are applied **once** in `src/infrastructure/app.js` and replace the previous individual middlewares (helmet.js, cors.js, morgan.js, bodyParser.js, rateLimit.js, etc.). This removes duplication and ensures a single source of truth for configuration.

```js
// app.js (excerpt)
applySecurityMiddleware(app);
applyCompression(app);
app.use(requestLogger);
...
app.use(errorLogger);
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

> **📖 For detailed development guidelines, see [DEVELOPMENT.md](./DEVELOPMENT.md)**

## Docker Setup

### Windows with Docker Desktop

1. **Install Docker Desktop**: Download from [docker.com](https://www.docker.com/products/docker-desktop/)
2. **WSL 2 Integration**: Docker Desktop uses WSL 2 backend by default
3. **Restart Docker Desktop** if needed

### Verify setup

The `npm run setup` script automatically includes a complete Docker verification.

## Common Issues

> **📖 For detailed troubleshooting, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)**

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

> **📖 For detailed script documentation, see [SCRIPTS.md](./SCRIPTS.md)**

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

- **Health Check**: `GET /api/health`
- **API Root**: `GET /` (API metadata)
- **Swagger/OpenAPI**: Available at `/api-docs` (when implemented)

## Contributing

Please read `DEVELOPMENT.md` for detailed development guidelines.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Follow the development workflow in `DEVELOPMENT.md`
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
