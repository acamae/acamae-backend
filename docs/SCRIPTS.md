# Scripts Documentation - Acamae Backend

This document describes all available scripts in the Acamae Backend project, their purposes, usage instructions, and when to use them.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Environment Management](#environment-management)
- [Development Scripts](#development-scripts)
- [Database Management](#database-management)
- [Docker Operations](#docker-operations)
- [Testing](#testing)
- [Code Quality](#code-quality)
- [SSL Certificates](#ssl-certificates)
- [Build & Release](#build--release)
- [Maintenance](#maintenance)
- [Individual Script Details](#individual-script-details)
- [Recommended Usage Flow](#recommended-usage-flow)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

For new developers, run these commands in order:

```bash
# 1. Complete initial setup (does everything!)
npm run setup

# That's it! Your environment is ready.
# The setup includes: dependencies, environment, SSL, database, migrations, and verification
```

### **For existing developers (after setup):**

```bash
# Start development (database already configured)
npm run dev
```

---

## 🔧 Environment Management

| Command             | Description                                  | When to Use                         |
| ------------------- | -------------------------------------------- | ----------------------------------- |
| `npm run env:dev`   | Copy development environment variables       | Before running development commands |
| `npm run env:prod`  | Copy production environment variables        | Before production deployment        |
| `npm run env:test`  | Validate environment configuration           | Troubleshooting environment issues  |
| `npm run env:setup` | Complete environment setup (copy + validate) | Initial setup or after env changes  |

**Examples:**

```bash
npm run env:dev          # Setup development environment
npm run env:test         # Check if environment is properly configured
NODE_ENV=production npm run env:prod  # Setup production environment
```

---

## 💻 Development Scripts

| Command               | Description                                      | When to Use                |
| --------------------- | ------------------------------------------------ | -------------------------- |
| `npm start`           | Start development server (alias for `start:dev`) | Main development command   |
| `npm run dev`         | Start development server with hot reload         | Daily development          |
| `npm run start:dev`   | Start development server                         | Alternative to `dev`       |
| `npm run start:debug` | Start with debugger enabled                      | When debugging is needed   |
| `npm run start:prod`  | Start in production mode                         | Testing production locally |

**Examples:**

```bash
npm run dev              # Most common development command
npm run start:debug      # Debug with Chrome DevTools on port 9229
```

---

## 🗄️ Database Management

### Prisma Operations

| Command                   | Description                        | When to Use                   |
| ------------------------- | ---------------------------------- | ----------------------------- |
| `npm run prisma:generate` | Generate Prisma client             | After schema changes          |
| `npm run prisma:migrate`  | Create and apply migration         | When changing database schema |
| `npm run prisma:push`     | Push schema changes (dev only)     | Quick schema prototyping      |
| `npm run prisma:studio`   | Open Prisma Studio                 | Visual database browsing      |
| `npm run prisma:deploy`   | Apply migrations (production-safe) | Deployment                    |
| `npm run prisma:status`   | Check migration status             | Troubleshooting               |
| `npm run prisma:reset`    | Reset database to initial state    | When database is corrupted    |
| `npm run prisma:seed`     | Seed database with initial data    | After reset or initial setup  |

### Database Backup & Recovery

| Command                           | Description                          | When to Use            |
| --------------------------------- | ------------------------------------ | ---------------------- |
| `npm run db:backup`               | Create interactive database backup   | Before major changes   |
| `npm run db:backup:auto`          | Create automatic backup (no prompts) | Automated scripts/CI   |
| `npm run db:rollback <migration>` | Rollback specific migration          | After failed migration |
| `npm run db:status`               | Check database and backup status     | Health checks          |

**Examples:**

```bash
npm run db:backup                    # Create backup with confirmation
npm run db:backup:auto               # Silent backup for scripts
npm run db:rollback 20240101_120000  # Rollback specific migration
npm run db:status                    # Check database health
```

---

## 🐳 Docker Operations

| Command                        | Description                          | When to Use                       |
| ------------------------------ | ------------------------------------ | --------------------------------- |
| `npm run docker:up`            | Start all services                   | Development with Docker           |
| `npm run docker:down`          | Stop backend service                 | When done developing              |
| `npm run docker:down:all`      | Stop all services and remove volumes | Complete cleanup                  |
| `npm run docker:restart`       | Restart backend service              | After configuration changes       |
| `npm run docker:reset`         | Complete Docker reset                | When Docker environment is broken |
| `npm run docker:build`         | Build Docker images                  | After Dockerfile changes          |
| `npm run docker:build:nocache` | Build without cache                  | Force clean build                 |
| `npm run docker:logs`          | View backend logs                    | Debugging Docker issues           |
| `npm run docker:shell`         | Access backend container shell       | Advanced debugging                |
| `npm run docker:create:net`    | Create Docker network                | Initial Docker setup              |

**Examples:**

```bash
npm run docker:up           # Start development environment
npm run docker:logs         # Monitor application logs
npm run docker:shell        # Access container for debugging
npm run docker:reset        # Nuclear option - complete reset
```

---

## 🧪 Testing

| Command                    | Description                    | When to Use                      |
| -------------------------- | ------------------------------ | -------------------------------- |
| `npm test`                 | Run all tests                  | Before commits/deployment        |
| `npm run test:watch`       | Run tests in watch mode        | During test development          |
| `npm run test:coverage`    | Run tests with coverage report | Checking test coverage           |
| `npm run test:unit`        | Run only unit tests            | Quick testing during development |
| `npm run test:integration` | Run only integration tests     | Testing API endpoints            |
| `npm run test:ci`          | Run tests for CI/CD            | Automated testing                |

**Examples:**

```bash
npm test                 # Run all tests once
npm run test:watch       # Continuous testing during development
npm run test:coverage    # Generate coverage report
npm run test:unit        # Quick unit test run
```

---

## 🔍 Code Quality

| Command                | Description                      | When to Use      |
| ---------------------- | -------------------------------- | ---------------- |
| `npm run lint`         | Check code for issues            | Before commits   |
| `npm run lint:fix`     | Fix automatically fixable issues | Cleaning up code |
| `npm run lint:check`   | Check without fixing             | CI/CD pipelines  |
| `npm run format`       | Format code with Prettier        | Before commits   |
| `npm run format:check` | Check if code is formatted       | CI/CD pipelines  |

**Examples:**

```bash
npm run lint:fix         # Fix all auto-fixable issues
npm run format           # Format all code files
npm run lint && npm run format  # Complete code cleanup
```

---

## 🔒 SSL Certificates

| Command                | Description                     | When to Use              |
| ---------------------- | ------------------------------- | ------------------------ |
| `npm run ssl:generate` | Generate SSL certificates       | HTTPS development setup  |
| `npm run ssl:force`    | Overwrite existing certificates | When certificates expire |

**Examples:**

```bash
npm run ssl:generate     # Generate certificates for localhost
npm run ssl:force        # Regenerate expired certificates
```

---

## 🏗️ Build & Release

| Command              | Description                     | When to Use             |
| -------------------- | ------------------------------- | ----------------------- |
| `npm run build`      | Build for development           | Before testing build    |
| `npm run build:prod` | Build for production            | Before deployment       |
| `npm run release`    | Complete release process        | Creating releases       |
| `npm run health`     | Health check (lint + test + db) | Verifying project state |

**Examples:**

```bash
npm run build:prod      # Prepare for production deployment
npm run health          # Quick project health check
npm run release         # Complete release pipeline
```

---

## 🧹 Maintenance

| Command               | Description                  | When to Use           |
| --------------------- | ---------------------------- | --------------------- |
| `npm run clean`       | Clean cache and logs         | Troubleshooting       |
| `npm run clean:full`  | Complete cleanup + reinstall | Major issues          |
| `npm run setup:quick` | Quick setup (env + prisma)   | After pulling changes |

**Examples:**

```bash
npm run clean           # Clear temporary files
npm run clean:full      # Nuclear option - complete reinstall
npm run setup:quick     # Quick setup after git pull
```

---

## 📁 Individual Script Details

### `setup-initial-config.sh`

**Purpose**: Complete initial setup that handles everything needed for development.

**When to use**:

- ✅ First time setting up the project (recommended for new developers)
- ✅ New developer onboarding
- ✅ After major environment changes
- ✅ Complete development environment reset

**What it does**:

1. Verifies system requirements (Node.js, npm, Docker)
2. Sets up environment variables
3. Installs project dependencies
4. Generates SSL certificates for HTTPS
5. Configures backend environment
6. Sets up and starts database (Docker)
7. Applies initial database migrations
8. Verifies end-to-end functionality
9. Creates initial database backup
10. Provides ready-to-use development environment

**Usage**:

```bash
npm run setup
# or
bash scripts/setup-initial-config.sh [--non-interactive] [--skip-ssl]
```

**Options:**

- `--non-interactive`: Skip user prompts (use defaults)
- `--skip-ssl`: Skip SSL certificate generation

**Features**:

- Complete one-command setup for new developers
- Automatic Docker and database initialization
- End-to-end verification that everything works
- Initial backup for safety
- Robust error handling and progress tracking

**Estimated time**: 10-15 minutes (includes database setup)

---

### `setup-backend.sh`

**Purpose**: Specific backend configuration (Prisma, migrations).

**When to use**:

- ✅ After changes in `prisma/schema.prisma`
- ✅ After major npm package updates
- ✅ Migration issues
- ✅ Environment variable changes

**Usage**:

```bash
npm run setup:backend
# or
bash scripts/setup-backend.sh [--skip-deps]
```

**Options:**

- `--skip-deps`: Skip dependency installation

**Features**:

- Environment variable configuration
- Prisma client generation
- Database migration application
- Dependency management

**Estimated time**: 1-2 minutes

---

### `_env-manager.js` _(Internal)_

**Purpose**: Internal environment variable management utility.

**When to use**:

- 🔧 Called internally by other scripts
- ✅ Manual troubleshooting of environment issues
- ✅ Development debugging

**Usage**:

```bash
# Internal usage (called by other scripts)
node scripts/_env-manager.js setup

# Manual usage (troubleshooting via npm)
npm run env:test         # Verify configuration
npm run env:dev          # Copy development environment
npm run env:setup        # Complete setup
```

**Commands:**

- `setup` - Copy and verify (complete setup)
- `copy` - Copy environment variables for Prisma
- `test` - Verify environment configuration

**Features**:

- Cross-platform compatibility
- Environment validation
- Secure variable handling
- Primarily for internal orchestration

**Estimated time**: 5-10 seconds

---

### `db-manager.sh`

**Purpose**: Comprehensive database management including backup and rollback.

**When to use**:

- ✅ Create backups before important changes
- ✅ Rollback problematic migrations
- ✅ Verify database status
- ✅ Production maintenance

**Usage**:

```bash
bash scripts/db-manager.sh <command> [options]

Commands:
  backup [--auto]         - Create database backup
  rollback <migration>    - Rollback a migration (DESTRUCTIVE)
  status                  - Check database status
  help                    - Show help information
```

**Examples:**

```bash
npm run db:backup                    # Create backup with confirmation
npm run db:backup:auto               # Silent backup for scripts
npm run db:rollback 20240101_120000  # Rollback specific migration
npm run db:status                    # Check database health
```

**Features**:

- Automatic backup with cleanup (keeps last 10)
- Safe rollback with multiple confirmations
- Connectivity verification
- Migration management
- Cross-platform MySQL client detection

**Estimated time**: 30 seconds - 5 minutes

---

### `generate-ssl.js`

**Purpose**: Generate SSL certificates for local development.

**When to use**:

- ✅ First time running the project
- ✅ HTTPS issues in development
- ✅ Expired or corrupted certificates

**Usage**:

```bash
npm run ssl:generate
# or
node scripts/generate-ssl.js [options]

Options:
  --help, -h         - Show help information
  --force            - Overwrite existing certificates
  --domain <name>    - Custom domain name (default: localhost)
```

**Examples:**

```bash
npm run ssl:generate                    # Generate localhost certificates
npm run ssl:force                       # Overwrite existing certificates
node scripts/generate-ssl.js --domain dev.local # Custom domain
```

**Features**:

- Generates self-signed certificates
- Compatible with Windows/Linux/macOS
- Verifies OpenSSL installation
- Creates certificates in `docker/ssl/`
- Certificate validation
- Custom domain support

**Requirements**:

- OpenSSL installed on the system

**Estimated time**: 10-30 seconds

---

## 🔄 Recommended Usage Flow

### **For new developers:**

```bash
# 1. Complete initial setup (does everything!)
npm run setup

# That's it! Your environment is ready.
# The setup includes: dependencies, environment, SSL, database, migrations, and verification
```

### **For daily development:**

```bash
# 1. Verify environment
npm run env:test

# 2. Start services
npm run docker:up

# 3. Apply migrations (if any)
npm run prisma:deploy
```

### **For database changes:**

```bash
# 1. Create backup before changes
npm run db:backup

# 2. Make changes in schema.prisma
# 3. Create migration
npm run prisma:migrate -- --name descriptive_name

# 4. Apply migration
npm run prisma:deploy
```

### **For emergency rollback:**

```bash
# 1. Check current status
npm run db:status

# 2. Perform rollback
npm run db:rollback <migration_name>
```

---

## 📊 Script Comparison

| Script                    | Size | Lines | Status      | Purpose                         |
| ------------------------- | ---- | ----- | ----------- | ------------------------------- |
| `setup-initial-config.sh` | 18KB | 567   | ✅ Enhanced | Complete setup (with database)  |
| `setup-backend.sh`        | 9KB  | 338   | ✅ Active   | Specific backend configuration  |
| `_env-manager.js`         | 10KB | 336   | ✅ Internal | Environment variable management |
| `db-manager.sh`           | 16KB | 547   | ✅ Active   | Complete database management    |
| `generate-ssl.js`         | 13KB | 411   | ✅ Active   | Generate SSL certificates       |

---

## 🎯 Reorganization Benefits

### **Before (7 scripts, 1426 total lines):**

- ❌ Functionality duplication (773 lines in setup script alone)
- ❌ Monolithic scripts
- ❌ Lack of documentation
- ❌ Style inconsistencies
- ❌ Complex maintenance

### **After (5 scripts, 2199 total lines):**

- ✅ Comprehensive functionality (+54% more features)
- ✅ Modular scripts with orchestration pattern
- ✅ Complete documentation in English
- ✅ Cross-platform compatibility (Windows/macOS/Linux)
- ✅ Better maintainability and error handling
- ✅ Zero duplications - one responsibility per script

---

## 🆘 Troubleshooting

### **Environment Variables Not Loading:**

```bash
npm run env:test          # Check environment configuration
npm run env:setup         # Reconfigure environment
```

### **Database Connection Issues:**

```bash
npm run db:status         # Check database status
npm run docker:up         # Start database if using Docker
```

### **Prisma Client Issues:**

```bash
npm run prisma:generate   # Regenerate Prisma client
npm run prisma:reset      # Reset database if corrupted
```

### **Node.js Version Issues:**

```bash
bash scripts/setup-initial-config.sh  # Reconfigure Node.js/NVM
```

### **Docker Issues:**

```bash
npm run docker:reset      # Complete Docker reset
npm run docker:logs       # Check Docker logs
```

### **SSL Certificate Issues:**

```bash
npm run ssl:force         # Regenerate certificates
```

### **MySQL Client Missing (Windows):**

```bash
# Install MySQL client:
choco install mysql                    # Using Chocolatey
winget install Oracle.MySQL           # Using winget
scoop install mysql                    # Using Scoop
# Or download from: https://dev.mysql.com/downloads/mysql/
```

---

## 🚨 Important Notes

### **Cross-Platform Compatibility:**

All scripts work on Windows (Git Bash), macOS, and Linux. Use `bash` prefix for shell scripts on Windows.

### **Database Safety:**

- Always backup before major changes
- Test rollbacks in development first
- Keep multiple backup copies for production

### **Support:**

For script issues, consult:

1. This documentation
2. `TROUBLESHOOTING.md`
3. Execution logs
4. Project issues on GitHub

---

## 📚 Additional Resources

- [Development Guide](DEVELOPMENT.md)
- [Troubleshooting Guide](TROUBLESHOOTING.md)
- [Environment Variables Documentation](environment.md)
- [Database Schema](../prisma/schema.prisma)

---

## 🤝 Contributing

When creating new scripts:

1. Follow the style of existing scripts
2. Include comprehensive documentation header
3. Add robust error handling
4. Test on multiple operating systems (Windows/macOS/Linux)
5. Update this documentation
6. Add appropriate npm scripts to package.json
7. Include usage examples and error messages

For questions or issues, please refer to the project's issue tracker or contact the development team.
