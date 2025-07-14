# Troubleshooting Guide - Acamae Backend

This guide covers common issues and their solutions for the Acamae Backend project.

## Table of Contents

- [Docker Issues](#docker-issues)
- [Database Issues](#database-issues)
- [Node.js Issues](#nodejs-issues)
- [SSL Certificate Issues](#ssl-certificate-issues)
- [Environment Issues](#environment-issues)
- [Git Issues](#git-issues)

---

## Docker Issues

### Docker Not Running

**Problem**: Docker commands fail with connection errors.

**Solution**:

1. **Verify Docker Desktop is running in Windows**
2. **Check Docker Desktop settings**:
   - Open Docker Desktop
   - Go to Settings > General
   - Ensure "Use WSL 2 based engine" is selected (default)
3. **Restart Docker Desktop**

### Docker Permission Denied

**Problem**: Docker commands fail with permission errors.

**Solution**:

```bash
# Add user to docker group (Linux/Mac)
sudo usermod -aG docker $USER

# Apply changes (log out and back in, or run)
newgrp docker

# Test Docker
docker run hello-world
```

### Docker Network Issues

**Problem**: Containers can't communicate or external network access fails.

**Solution**:

```bash
# Create Docker network
npm run docker:create:net

# Reset Docker network
docker network prune

# Check network status
docker network ls
```

---

## Database Issues

### Error P3005 (Database not empty)

**Problem**: Prisma migration fails because database contains data.

**Solution**:

```bash
# Option 1: Full reset (development only)
npm run docker:reset

# Option 2: Create baseline migration
npm run prisma:migrate -- --name baseline
npm run prisma:deploy:dev

# Option 3: Manual sync
npm run prisma:push
```

### Migration Conflicts

**Problem**: Migration files conflict or database is out of sync.

**Solution**:

```bash
# Check current status
npm run prisma:status

# Reset migrations (development only)
npx prisma migrate reset

# Recreate initial migration
npm run prisma:migrate -- --name baseline
```

### Database Connection Issues

**Problem**: Can't connect to database or connection times out.

**Solution**:

1. **Verify Docker containers are running**:

   ```bash
   docker compose -f docker/docker-compose.yml ps
   ```

2. **Check database URL in environment**:

   ```bash
   cat .env.development | grep DATABASE_URL
   ```

3. **Restart database container**:
   ```bash
   docker compose -f docker/docker-compose.yml restart db
   ```

---

## Node.js Issues

### Node.js Version Too Old

**Problem**: Scripts fail because Node.js version is below 22.

**Solution**:

```bash
# Using NVM (recommended)
nvm install 22
nvm use 22
nvm alias default 22

# Or download from nodejs.org
# https://nodejs.org/
```

### npm Install Fails

**Problem**: Dependencies fail to install.

**Solution**:

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for network issues
npm config get registry
```

---

## SSL Certificate Issues

### SSL Certificate Not Found

**Problem**: HTTPS connections fail due to missing SSL certificates.

**Solution**:

```bash
# Generate SSL certificates
npm run generate-ssl

# Verify certificates exist
ls -la docker/ssl/

# Regenerate if needed
rm -f docker/ssl/selfsigned.*
npm run generate-ssl
```

### SSL Certificate Errors in Browser

**Problem**: Browser shows SSL certificate warnings.

**Solution**:

1. **Accept self-signed certificate**:
   - Click "Advanced" in browser warning
   - Click "Proceed to localhost (unsafe)"

2. **Add certificate to trusted store** (optional):
   - Download certificate from `docker/ssl/selfsigned.crt`
   - Import to browser/system certificate store

---

## Environment Issues

### Environment Variables Not Found

**Problem**: Application fails to start due to missing environment variables.

**Solution**:

```bash
# Copy environment configuration
npm run env:dev

# Check if environment files exist
ls -la .env*

# Create from example if missing
cp .env.example .env.development
```

### Wrong Environment Loaded

**Problem**: Application loads wrong environment (production instead of development).

**Solution**:

```bash
# Set environment explicitly
export NODE_ENV=development

# Or use npm scripts
npm run env:dev
npm run start:dev
```

---

## Git Issues

### Git Permission Errors

**Problem**: Git fails to change file permissions.

**Solution**:

```bash
# Configure Git to ignore file mode changes
git config --global core.fileMode false
```

### Git Line Ending Issues

**Problem**: Files show different line endings between Windows and Linux.

**Solution**:

```bash
# Configure Git for cross-platform compatibility
git config --global core.autocrlf input
git config --global core.eol lf

# Normalize line endings
git add --renormalize .
```

---

## Getting Help

If you encounter an issue not covered in this guide:

1. **Check the logs**:

   ```bash
   docker compose -f docker/docker-compose.yml logs -f backend
   ```

2. **Run environment tests**:

   ```bash
   npm run test:env
   ```

3. **Check system requirements**:

   ```bash
   npm run setup
   ```

4. **Create an issue** on GitHub with:
   - Error message
   - Steps to reproduce
   - System information (OS, Node.js version, etc.)
   - Relevant logs

---

## Quick Commands Reference

```bash
# Docker management
npm run docker:reset
npm run docker:create:net
docker compose -f docker/docker-compose.yml logs -f

# Database management
npm run prisma:status
npm run prisma:migrate -- --name baseline
npm run prisma:deploy:dev

# Environment management
npm run env:dev
npm run env:prod
npm run test:env

# SSL certificates
npm run generate-ssl
```
