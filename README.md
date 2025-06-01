# @emanager.com/backend

Backend API for the Esports Management platform.
Built with Node.js, Express, and Prisma ORM, following Clean/Hexagonal Architecture.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [API Endpoints](#api-endpoints)
- [Database & Persistence](#database--persistence)
- [Security](#security)
- [Testing & Quality](#testing--quality)
- [Docker & Deployment](#docker--deployment)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

This package provides the backend API for the Esports Management platform, with robust authentication, business logic, and data persistence.
It is designed for scalability, security, and maintainability.

---

## Tech Stack

- Node.js 20+
- Express
- Prisma ORM (MariaDB/MySQL)
- JWT for authentication
- Joi for validation
- Docker for local and production environments
- Jest for unit and integration tests
- GitHub Actions for CI/CD

---

## Architecture

- Hexagonal/Clean Architecture:
  - `domain/`, `application/`, `infrastructure/`, `shared/`
- CQRS Pattern:
  - Separation of read and write operations
- Repository Pattern:
  - Abstracted data access via repositories

---

## Project Structure

```
src/
  domain/
  application/
  infrastructure/
  shared/
prisma/
```

---

## Development Workflow

### Prerequisites

- Node.js 20+
- MariaDB/MySQL
- npm or yarn

### Installation

```
npm install
```

### Database Setup

```
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate
```

### Running Locally

```
npm run dev
```

### Running with Docker

```
npm run docker-start
```

### Linting & Testing

```
npm run lint
npm run test
```

---

## API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

> See OpenAPI/Swagger documentation for the full API specification.

---

## Database & Persistence

- Prisma ORM: Type-safe, auto-generated client
- Migrations: Managed with Prisma Migrate
- Entities: User, Team, Tournament, etc.
- Session Management: Stateless JWT, session expiration enforced

---

## Security

- Cookie-based authentication (httpOnly)
- Password hashing with bcrypt
- CSRF protection
- Input validation with Joi
- Security headers with Helmet
- Rate limiting
- CORS: Secure configuration

---

## Testing & Quality

- Unit tests: Isolated functions and services
- Integration tests: APIs and endpoints
- Repository tests: Database interactions
- Coverage: Minimum 90% for statements, branches, functions, and lines
- Linting: ESLint with strict rules

---

## Docker & Deployment

- Dockerfile: Located in this package
- Docker Compose: For local and production environments
- Nginx: Used as reverse proxy in production
- CI/CD: GitHub Actions for linting, testing, and deployment

### Running in Production

```
npm run docker-prod
```

---

## Environment Variables

| Variable      | Description                          | Sensitive |
| ------------- | ------------------------------------ | :-------: |
| COOKIE_SECRET | Cookie secret                        |    Yes    |
| DATABASE_URL  | Database connection URL              |    Yes    |
| JWT_SECRET    | JWT signing secret                   |    Yes    |
| ...           | See `.env.development` for full list |           |

> Never commit real secrets to the repository.

---

## Contributing

- Follow [Conventional Commits](https://www.conventionalcommits.org/)
- Use `npm run commit` for standardized commit messages
- See [Architecture](#architecture) and [Testing & Quality](#testing--quality) for guidelines

---

## License

[MIT](LICENSE)
