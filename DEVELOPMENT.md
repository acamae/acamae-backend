# Development Guide - Acamae Backend

## 🎯 Strategy: Prisma Migrations First

> **Always use migrations for production changes. `db push` only for rapid development.**

## 🚀 Initial Setup

### Prerequisites

#### For Windows:

- Node.js >= 22.16.0
- Docker Desktop (with WSL 2 backend)
- Git

#### For all systems:

- Node.js >= 22.16.0
- Docker Desktop
- Git

### Automatic Setup (Recommended)

```bash
# 1. Clone repository
git clone <repository-url>
cd backend

# 2. Complete automatic setup
npm run setup

# This command automatically:
# - Verifies requirements (Node.js >= 22, npm, Docker)
# - Installs dependencies
# - Creates environment files (.env.development, .env.production)
# - Generates Prisma client
# - Creates Docker network
# - Generates SSL certificates (interactive)
```

### Complete Setup

```bash
# 1. Edit environment variables (especially DATABASE_URL)
nano .env.development

# 2. Start development environment
npm run docker:up

# 3. Verify it works
# API: https://localhost/api/health
# phpMyAdmin: https://localhost/phpmyadmin
```

### SSL Certificate Note

If this is your first time running the project, you may need to generate SSL certificates:

```bash
npm run generate-ssl
```

## 🔄 Daily Workflow

### When starting work:

```bash
# 1. Update code
git pull origin main

# 2. Verify Docker Desktop is open and running
# (Docker Desktop application should be started)

# 3. Start complete environment
npm run docker:up

# 4. Apply migrations (if any)
docker compose -f docker/docker-compose.yml exec backend npm run prisma:deploy
```

### Useful commands during development:

```bash
# Database only
docker compose -f docker/docker-compose.yml up db -d

# View logs
docker compose -f docker/docker-compose.yml logs -f backend

# Complete reset
npm run docker:reset
```

### When making schema changes:

```bash
# 1. Modify prisma/schema.prisma

# 2. Create migration
npm run prisma:migrate -- --name descriptive_name

# 3. Verify it works
npm test

# 4. Commit and push
git add .
git commit -m "feat: add user phone number field"
git push origin feature/user-phone
```

### When finishing work:

```bash
# 1. Ensure everything works
npm test
npm run lint

# 2. Commit changes
git add .
git commit -m "feat: implement user phone validation"

# 3. Push to repository
git push origin feature/user-phone
```

## 🗄️ Database Management

### Schema changes:

- ✅ **Always use migrations** for production changes
- ✅ **Create descriptive migrations** with `--name`
- ✅ **Test migrations** before committing
- ❌ **Never use `db push`** in production

### Migration example:

```bash
# Add phone_number field
npm run prisma:migrate -- --name add_user_phone_number

# Verify status
npm run prisma:status

# Revert migration (development only)
npm run prisma:migrate reset
```

## 🐳 Docker for Development

### Application access:

- **Backend API**: https://localhost/api (port 443)
- **phpMyAdmin**: https://localhost/phpmyadmin (port 443)
- **Debug Inspector**: http://localhost:9229 (development only)

## 🧪 Testing

### Before committing:

```bash
npm test
npm run lint
npm run format
```

## 🛠️ Useful Scripts

### Configuration and Environment

- `npm run setup` - Complete initial project setup
- `npm run setup:backend` - Configure backend (Prisma, migrations)
- `npm run setup:env` - Copy environment variables for Prisma
- `npm run test:env` - Test environment configuration
- `npm run env:setup` - Complete environment setup (copy + verify)
- `npm run generate-ssl` - Generate SSL certificates for local development

### Database Management

- `npm run db:backup` - Create database backup
- `npm run db:rollback` - Rollback migration (with confirmation)
- `npm run db:status` - Check database status and migrations

### Docker

- `npm run docker:create:net` - Create Docker network
- `npm run docker:build:nocache` - Rebuild images without cache

## 🚨 Common Issues

> **📖 For detailed troubleshooting, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)**

### Quick fixes for common problems:

```bash
# Environment issues
npm run env:dev
npm run test:env

# Database issues
npm run prisma:status
npm run docker:reset

# Docker issues
npm run docker:create:net
docker compose -f docker/docker-compose.yml logs -f
```

## 🎯 Pre-merge Checklist

- [ ] Tests passing
- [ ] Linting without errors
- [ ] Migrations applied correctly
- [ ] Documentation updated
- [ ] Environment variables documented
- [ ] No secrets in code

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Migrations Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Docker Compose Reference](https://docs.docker.com/compose/)

## 📥 Required Downloads

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) - For running containers locally
- [Node.js](https://nodejs.org/) - JavaScript runtime (version 22+ recommended)
- [Git](https://git-scm.com/) - Version control

```

```
