#!/bin/bash

#===============================================================================
# Backend Setup Script
#===============================================================================
# DESCRIPTION:
#   Configures the backend environment and applies database migrations.
#   This script ensures all necessary components are ready for development.
#
# WHEN TO USE:
#   - Initial backend setup after project clone
#   - After environment configuration changes
#   - When database schema needs to be updated
#   - Before starting development work
#
# USAGE:
#   ./scripts/setup-backend.sh [--skip-deps]
#
# OPTIONS:
#   --skip-deps    Skip dependency installation (assumes npm install was done)
#
# EXAMPLES:
#   ./scripts/setup-backend.sh                 # Full backend setup
#   ./scripts/setup-backend.sh --skip-deps     # Skip npm install
#
# REQUIREMENTS:
#   - Node.js >= 22.16.0
#   - npm >= 11.4.2
#   - Docker and Docker Compose (for database)
#   - Environment files (.env.development or .env.production)
#
# EXIT CODES:
#   0 - Success
#   1 - General error
#   2 - Environment configuration error
#   3 - Database connection error
#   4 - Migration error
#===============================================================================

# Color definitions for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

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

print_header() {
    echo -e "${BLUE}"
    echo "========================================"
    echo "  ACAMAE BACKEND SETUP"
    echo "========================================"
    echo -e "${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Node.js version
check_node_version() {
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js >= 22.16.0"
        exit 1
    fi

    local node_version=$(node --version | sed 's/v//')
    local required_version="22.16.0"

    print_info "Node.js version: $node_version"
    print_info "Required version: >= $required_version"

    # Simple version comparison (works for semantic versions)
    if [[ "$node_version" < "$required_version" ]]; then
        print_error "Node.js version $node_version is below required $required_version"
        print_info "Please update Node.js or run: scripts/setup-initial-config.sh"
        exit 1
    fi

    print_status "Node.js version check passed"
}

# Function to check npm version
check_npm_version() {
    if ! command_exists npm; then
        print_error "npm is not installed"
        exit 1
    fi

    local npm_version=$(npm --version)
    print_info "npm version: $npm_version"
    print_status "npm is available"
}

# Function to verify project structure
verify_project_structure() {
    print_info "Verifying project structure..."

if [ ! -f "package.json" ]; then
    print_error "package.json not found. Run this script from the project root."
    exit 1
fi

    if [ ! -f "prisma/schema.prisma" ]; then
        print_error "Prisma schema not found. Invalid project structure."
        exit 1
    fi

    if [ ! -f "scripts/_env-manager.js" ]; then
        print_error "Environment manager script not found."
        exit 1
    fi

    print_status "Project structure verified"
}

# Function to install dependencies
install_dependencies() {
    local skip_deps=$1

    if [ "$skip_deps" = true ]; then
        print_info "Skipping dependency installation (--skip-deps flag)"
        return 0
    fi

    print_info "Installing dependencies..."

    if npm ci; then
        print_status "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
}

# Function to setup environment variables
setup_environment() {
    print_info "Setting up environment variables..."

    # Use the existing _env-manager.js script
    if node scripts/_env-manager.js setup; then
        print_status "Environment variables configured successfully"
    else
        print_error "Failed to configure environment variables"
        print_info "Make sure you have .env.development or .env.production file"
        exit 2
    fi
}

# Function to generate Prisma client
generate_prisma_client() {
    print_info "Generating Prisma client..."

    if npm run prisma:generate; then
    print_status "Prisma client generated successfully"
else
        print_error "Failed to generate Prisma client"
    exit 1
fi
}

# Function to check database connectivity
check_database_connection() {
    print_info "Checking database connectivity..."

    if npm run prisma:status >/dev/null 2>&1; then
        print_status "Database connection established"
    else
        print_warning "Database connection failed"
        print_info "Make sure Docker is running and database is accessible"
        print_info "Try running: npm run docker:up"
        return 1
    fi
}

# Function to apply database migrations
apply_migrations() {
    print_info "Applying database migrations..."

    # First check if we can connect to the database
    if ! check_database_connection; then
        print_error "Cannot connect to database. Skipping migrations."
        print_info "Start the database and run: npm run prisma:migrate"
        exit 3
    fi

if npm run prisma:deploy; then
        print_status "Database migrations applied successfully"
    else
        print_warning "Failed to apply migrations"
        print_info "Available options:"
        print_info "  1. Run: npm run prisma:migrate -- --name initial"
        print_info "  2. Run: npm run docker:reset (clean environment)"
        print_info "  3. Check database configuration"
        exit 4
    fi
}

# Function to verify setup
verify_setup() {
    print_info "Verifying backend setup..."

    # Check if Prisma client was generated
    if [ -d "node_modules/.prisma" ] || [ -d "node_modules/@prisma/client" ]; then
        print_status "Prisma client verified"
else
        print_warning "Prisma client may not be properly generated"
    fi

    # Check environment setup
    if node scripts/_env-manager.js test >/dev/null 2>&1; then
        print_status "Environment configuration verified"
    else
        print_warning "Environment configuration issues detected"
    fi

    print_status "Backend setup verification completed"
}

# Function to show next steps
show_next_steps() {
    echo
    print_info "🎉 Backend setup completed successfully!"
    echo
    print_info "Next steps:"
    echo "  📦 Start development server: npm run start:dev"
    echo "  🐳 Start with Docker: npm run docker:up"
    echo "  🔍 Open Prisma Studio: npm run prisma:studio"
    echo "  🧪 Run tests: npm test"
    echo "  📊 Check database status: npm run db:status"
    echo
    print_info "Useful commands:"
    echo "  npm run lint              # Run code linting"
    echo "  npm run format            # Format code"
    echo "  npm run prisma:migrate    # Create new migration"
    echo "  npm run db:backup         # Backup database"
    echo
}

# Function to show help
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Configure the backend environment and apply database migrations."
    echo
    echo "OPTIONS:"
    echo "  --skip-deps    Skip dependency installation"
    echo "  --help, -h     Show this help message"
    echo
    echo "EXAMPLES:"
    echo "  $0                 # Full backend setup"
    echo "  $0 --skip-deps     # Skip npm install"
    echo
}

# Parse command line arguments
skip_deps=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-deps)
            skip_deps=true
            shift
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
    exit 1
            ;;
    esac
done

# Main execution
main() {
    print_header

    # Step 1: Verify environment
    print_info "Step 1/7: Verifying environment..."
    check_node_version
    check_npm_version
    verify_project_structure

    # Step 2: Install dependencies
    print_info "Step 2/7: Managing dependencies..."
    install_dependencies "$skip_deps"

    # Step 3: Setup environment variables
    print_info "Step 3/7: Configuring environment..."
    setup_environment

    # Step 4: Generate Prisma client
    print_info "Step 4/7: Generating Prisma client..."
    generate_prisma_client

    # Step 5: Check database connection
    print_info "Step 5/7: Checking database..."
    if ! check_database_connection; then
        print_warning "Database not available. Setup completed but migrations skipped."
        show_next_steps
        exit 0
    fi

    # Step 6: Apply migrations
    print_info "Step 6/7: Applying migrations..."
    apply_migrations

    # Step 7: Verify setup
    print_info "Step 7/7: Verifying setup..."
    verify_setup

    # Show completion message
    show_next_steps
}

# Run main function
main "$@"
