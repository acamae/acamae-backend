# Project Scripts - Acamae Backend

This documentation describes all available scripts in the project, their purpose and when to use them.

## 📋 Index

- [Configuration Scripts](#configuration-scripts)
- [Database Scripts](#database-scripts)
- [Development Scripts](#development-scripts)
- [Utility Scripts](#utility-scripts)
- [Recommended Usage Flow](#recommended-usage-flow)

---

## 🚀 Configuration Scripts

### `setup-initial-config.sh`

**Purpose**: Complete initial development environment setup.

**When to use**:

- ✅ First time setting up the project
- ✅ New developer on the team
- ✅ Development environment change
- ✅ Dependency issues

**Features**:

- Verifies system requirements (Node.js, npm, Docker)
- Installs/configures NVM
- Manages Node.js versions
- Configures Docker and networks
- Generates SSL certificates
- Installs dependencies
- Creates environment files

**Usage**:

```bash
npm run setup
# or
./scripts/setup-initial-config.sh
```

**Estimated time**: 5-10 minutes

---

### `setup-backend.sh`

**Purpose**: Specific backend configuration (Prisma, migrations).

**When to use**:

- ✅ After changes in `prisma/schema.prisma`
- ✅ After `npm run setup`
- ✅ Migration issues
- ✅ Environment variable changes

**Features**:

- Copies environment variables for Prisma
- Generates Prisma client
- Applies database migrations

**Usage**:

```bash
npm run setup:backend
# or
./scripts/setup-backend.sh
```

**Estimated time**: 1-2 minutes

---

## 🗄️ Database Scripts

### `db-manager.sh`

**Purpose**: Complete database management (backup, rollback, status).

**When to use**:

- ✅ Create backups before important changes
- ✅ Rollback problematic migrations
- ✅ Verify database status
- ✅ Production maintenance

**Available commands**:

```bash
# Create backup
./scripts/db-manager.sh backup

# Create automatic backup (no confirmation)
./scripts/db-manager.sh backup --auto

# Rollback migration
./scripts/db-manager.sh rollback 20240101_120000_add_user_phone

# Check status
./scripts/db-manager.sh status

# Show help
./scripts/db-manager.sh help
```

**Features**:

- Automatic backup with cleanup (keeps last 10)
- Safe rollback with multiple confirmations
- Connectivity verification
- Migration management

**Estimated time**: 30 seconds - 5 minutes

---

## 🔧 Development Scripts

### `env-manager.js`

**Purpose**: Environment variable management (copy, verify, configure).

**When to use**:

- ✅ Configure environment for Prisma
- ✅ Verify environment variables
- ✅ Changes in `.env.*` files
- ✅ Configuration issues

**Available commands**:

```bash
# Copy variables for Prisma
node scripts/env-manager.js copy

# Verify configuration
node scripts/env-manager.js test

# Complete setup (copy + verify)
node scripts/env-manager.js setup
```

**Features**:

- Copies environment variables for Prisma
- Verifies critical variables
- Automatic environment detection
- Windows/Linux/macOS support

**Estimated time**: 5-10 seconds

---

## 🛠️ Utility Scripts

### `generate-ssl.js`

**Purpose**: Generate SSL certificates for local development.

**When to use**:

- ✅ First time running the project
- ✅ HTTPS issues in development
- ✅ Expired or corrupted certificates

**Features**:

- Generates self-signed certificates
- Compatible with Windows/Linux/macOS
- Verifies OpenSSL installation
- Creates certificates in `docker/ssl/`

**Usage**:

```bash
npm run generate-ssl
# or
node scripts/generate-ssl.js
```

**Estimated time**: 10-30 seconds

**Requirements**:

- OpenSSL installed on the system

---

## 🔄 Recommended Usage Flow

### **For new developers:**

```bash
# 1. Complete initial setup
npm run setup

# 2. Configure backend
npm run setup:backend

# 3. Start development
npm run docker:up
```

### **For daily development:**

```bash
# 1. Verify environment
node scripts/env-manager.js test

# 2. Start services
npm run docker:up

# 3. Apply migrations (if any)
npm run prisma:deploy
```

### **For database changes:**

```bash
# 1. Create backup before changes
./scripts/db-manager.sh backup

# 2. Make changes in schema.prisma
# 3. Create migration
npm run prisma:migrate -- --name descriptive_name

# 4. Apply migration
npm run prisma:deploy
```

### **For emergency rollback:**

```bash
# 1. Check current status
./scripts/db-manager.sh status

# 2. Perform rollback
./scripts/db-manager.sh rollback <migration_name>
```

---

## 📊 Script Comparison

| Script                    | Size  | Lines | Status    | Purpose                         |
| ------------------------- | ----- | ----- | --------- | ------------------------------- |
| `setup-initial-config.sh` | 30KB  | 773   | ✅ Active | Complete initial configuration  |
| `setup-backend.sh`        | 2.0KB | 74    | ✅ Active | Specific backend configuration  |
| `env-manager.js`          | 4.5KB | 150   | ✅ Active | Environment variable management |
| `db-manager.sh`           | 8.0KB | 280   | ✅ Active | Complete database management    |
| `generate-ssl.js`         | 2.0KB | 66    | ✅ Active | Generate SSL certificates       |

---

## 🎯 Reorganization Benefits

### **Before (7 scripts):**

- ❌ Functionality duplication
- ❌ Monolithic scripts
- ❌ Lack of documentation
- ❌ Style inconsistencies

### **After (5 scripts):**

- ✅ Consolidated functionality
- ✅ Modular scripts
- ✅ Complete documentation
- ✅ Consistent style
- ✅ Better maintainability

---

## 🚨 Important Notes

### **Compatibility:**

All scripts maintain compatibility with existing npm commands.

### **Support:**

For script issues, consult:

1. This documentation
2. `TROUBLESHOOTING.md`
3. Execution logs
4. Project issues

---

## 📝 Contributing

When creating new scripts:

1. Follow the style of consolidated scripts
2. Include complete documentation
3. Add robust error handling
4. Test on multiple operating systems
5. Update this documentation
