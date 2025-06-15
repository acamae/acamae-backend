# EManager Backend

A robust, scalable, and secure backend built with Node.js, Express, and Prisma, following Clean Architecture principles.

## Features

- Clean Architecture with clear separation of concerns
- Type safety with Zod validation
- Database integration with PostgreSQL and Prisma
- JWT-based authentication
- Comprehensive security features
- Testing with Jest
- Documentation with OpenAPI/Swagger

## Project Structure

```
src/
├── application/    # Application business rules
├── domain/        # Enterprise business rules
├── infrastructure/# Frameworks, drivers, and tools
├── shared/        # Shared utilities and constants
└── index.js       # Application entry point
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

## Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 14.0

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm start`: Start the production server
- `npm run dev`: Start the development server with hot reload
- `npm test`: Run tests
- `npm run test:watch`: Run tests in watch mode
- `npm run test:coverage`: Run tests with coverage report
- `npm run lint`: Run ESLint
- `npm run format`: Format code with Prettier

## Testing

Tests are organized by layer:

- Unit tests for domain and application layers
- Integration tests for infrastructure layer
- E2E tests for API endpoints

## API Documentation

API documentation is available at `/api-docs` when running the server.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT

## Authors

EManager Team

## Acknowledgments

- Clean Architecture principles
- Express.js community
- Prisma team
