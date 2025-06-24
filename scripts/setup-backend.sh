#!/bin/bash

# Backend configuration script
# This script configures the backend environment and applies migrations

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Output helper functions
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}
print_error() {
    echo -e "${RED}❌ $1${NC}"
}
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo "🚀 Configuring backend..."

# Verify we are in the correct directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Run this script from the project root."
    exit 1
fi

# Configure environment variables for Prisma
print_info "🔧 Configuring environment variables..."
if [ -f "scripts/copy-env-for-prisma.js" ]; then
    node scripts/copy-env-for-prisma.js
    if [ $? -eq 0 ]; then
        print_status "Environment variables configured"
    else
        print_error "Error configuring environment variables"
        exit 1
    fi
else
    print_warning "copy-env-for-prisma.js script not found"
fi

# Generate Prisma client
print_info "📦 Generating Prisma client..."
npm run prisma:generate
if [ $? -eq 0 ]; then
    print_status "Prisma client generated successfully"
else
    print_error "Error generating Prisma client"
    exit 1
fi

# Apply migrations
print_info "🗄️ Applying database migrations..."
if npm run prisma:deploy; then
    print_status "✅ Migrations applied successfully"
    print_info "💡 Backend configured successfully"
    print_info "💡 To start the application: npm start"
else
    print_error "❌ Error applying migrations"
    echo
    print_info "💡 Available options:"
    print_info "   1. Run: npm run prisma:migrate -- --name baseline (create initial migration)"
    print_info "   2. Run: npm run docker:reset (clean complete environment)"
    print_info "   3. Verify database configuration"
    exit 1
fi
