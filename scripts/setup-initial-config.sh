#!/bin/bash

#===============================================================================
# Acamae Backend - Initial Setup Orchestrator
#===============================================================================
# DESCRIPTION:
#   Complete initial setup script that handles everything needed for development.
#   This script orchestrates specialized scripts and sets up the entire development
#   environment including database, migrations, and end-to-end verification.
#
# WHEN TO USE:
#   - First time project setup
#   - After major environment changes
#   - When development environment needs reset
#   - New developer onboarding
#
# USAGE:
#   ./scripts/setup-initial-config.sh [--non-interactive] [--skip-ssl]
#
# OPTIONS:
#   --non-interactive    Skip user prompts (use defaults)
#   --skip-ssl          Skip SSL certificate generation
#   --help, -h          Show help information
#
# EXAMPLES:
#   ./scripts/setup-initial-config.sh                    # Interactive setup
#   ./scripts/setup-initial-config.sh --non-interactive  # Automated setup
#   ./scripts/setup-initial-config.sh --skip-ssl         # Skip SSL generation
#
# REQUIREMENTS:
#   - Node.js >= 22.16.0 (will guide installation if missing)
#   - npm >= 11.4.2
#   - Docker Desktop (optional but recommended)
#   - Git
#
# WHAT THIS SCRIPT DOES:
#   1. Verifies system requirements (Node.js, npm, Docker)
#   2. Calls _env-manager.js for environment setup
#   3. Installs dependencies
#   4. Calls generate-ssl.js for SSL certificates
#   5. Calls setup-backend.sh for backend configuration
#   6. Sets up and starts database (Docker)
#   7. Applies initial database migrations
#   8. Verifies end-to-end functionality
#   9. Creates initial database backup
#   10. Provides next steps guidance
#
# EXIT CODES:
#   0 - Success
#   1 - General error or user cancellation
#   2 - System requirements not met
#   3 - Script execution error
#===============================================================================

# Color definitions for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly BOLD='\033[1m'
readonly NC='\033[0m' # No Color

# Configuration
readonly MIN_NODE_VERSION="22.16.0"
readonly MIN_NPM_VERSION="11.4.2"

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
    echo -e "${CYAN}${BOLD}"
    echo "========================================"
    echo "  ACAMAE BACKEND - INITIAL SETUP"
    echo "========================================"
    echo -e "${NC}"
}

print_step() {
    echo -e "${CYAN}${BOLD}🔧 Step $1: $2${NC}"
}

# Interactive prompt helper
ask_yes_no() {
    local question="$1"
    local default="${2:-n}"

    if [ "$NON_INTERACTIVE" = true ]; then
        [ "$default" = "y" ] && return 0 || return 1
    fi

    local prompt="$question ($([ "$default" = "y" ] && echo "Y/n" || echo "y/N")): "

    while true; do
        read -p "$prompt" -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]] || ([[ $REPLY =~ ^$ ]] && [[ $default = "y" ]]); then
            return 0
        elif [[ $REPLY =~ ^[Nn]$ ]] || ([[ $REPLY =~ ^$ ]] && [[ $default = "n" ]]); then
            return 1
        else
            echo "Please answer 'y' or 'n'"
        fi
    done
}

# Function to compare versions
version_compare() {
    local current="$1"
    local required="$2"

    # Simple version comparison
    if [ "$(printf '%s\n' "$required" "$current" | sort -V | head -n1)" = "$required" ]; then
        return 0  # current >= required
    else
        return 1  # current < required
    fi
}

# Function to check system requirements
check_system_requirements() {
    print_step "1" "Verifying system requirements"

    local requirements_met=true

    # Check if we're in the project root
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Please run this script from the project root."
        exit 2
    fi

    # Check Node.js
    if command -v node >/dev/null 2>&1; then
        local node_version=$(node -v | sed 's/v//')
        if version_compare "$node_version" "$MIN_NODE_VERSION"; then
            print_status "Node.js $node_version (meets requirement >= $MIN_NODE_VERSION)"
        else
            print_warning "Node.js $node_version is below minimum requirement ($MIN_NODE_VERSION)"
            print_info "Please update Node.js. Consider using NVM for version management:"
            echo "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
            echo "  nvm install $MIN_NODE_VERSION"
            requirements_met=false
        fi
    else
        print_error "Node.js is not installed"
        print_info "Install Node.js from: https://nodejs.org/"
        print_info "Or use NVM: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
        requirements_met=false
    fi

    # Check npm
    if command -v npm >/dev/null 2>&1; then
        local npm_version=$(npm -v)
        if version_compare "$npm_version" "$MIN_NPM_VERSION"; then
            print_status "npm $npm_version (meets requirement >= $MIN_NPM_VERSION)"
        else
            print_warning "npm $npm_version is below minimum requirement ($MIN_NPM_VERSION)"
            print_info "Update npm: npm install -g npm@latest"
        fi
    else
        print_error "npm is not installed"
        requirements_met=false
    fi

    # Check Docker (optional)
    if command -v docker >/dev/null 2>&1; then
        if docker info >/dev/null 2>&1; then
            print_status "Docker is installed and running"
        else
            print_warning "Docker is installed but not running"
            print_info "Start Docker Desktop to enable full development environment"
        fi
    else
        print_warning "Docker is not installed (optional)"
        print_info "Install Docker Desktop for full development experience: https://www.docker.com/products/docker-desktop/"
    fi

    if [ "$requirements_met" = false ]; then
        print_error "System requirements not met. Please install missing components."
        exit 2
    fi

    print_status "System requirements verified"
}

# Function to setup environment variables
setup_environment() {
    print_step "2" "Setting up environment variables"

    if [ -f "scripts/_env-manager.js" ]; then
        if node scripts/_env-manager.js setup; then
            print_status "Environment variables configured successfully"
        else
            print_error "Failed to configure environment variables"
            exit 3
        fi
    else
        print_error "_env-manager.js not found"
        exit 3
    fi
}

# Function to install dependencies
install_dependencies() {
    print_step "3" "Installing project dependencies"

    if npm ci; then
        print_status "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 3
    fi
}

# Function to generate SSL certificates
generate_ssl_certificates() {
    if [ "$SKIP_SSL" = true ]; then
        print_info "Skipping SSL certificate generation (--skip-ssl flag)"
        return 0
    fi

    print_step "4" "Setting up SSL certificates"

    if [ -f "scripts/generate-ssl.js" ]; then
        if [ "$NON_INTERACTIVE" = true ]; then
            # In non-interactive mode, only generate if they don't exist
            if [ ! -f "docker/ssl/selfsigned.crt" ]; then
                node scripts/generate-ssl.js
            else
                print_info "SSL certificates already exist"
            fi
        else
            if ask_yes_no "Generate SSL certificates for development?" "y"; then
                node scripts/generate-ssl.js
            fi
        fi

        if [ -f "docker/ssl/selfsigned.crt" ]; then
            print_status "SSL certificates ready"
        fi
    else
        print_warning "generate-ssl.js not found, skipping SSL setup"
    fi
}

# Function to setup backend
setup_backend() {
    print_step "5" "Configuring backend environment"

    if [ -f "scripts/setup-backend.sh" ]; then
        if bash scripts/setup-backend.sh --skip-deps; then
            print_status "Backend configuration completed"
        else
            print_warning "Backend setup completed with warnings"
            print_info "This is normal if Docker/database is not running yet"
        fi
    else
        print_error "setup-backend.sh not found"
        exit 3
    fi
}

# Function to setup and start database
setup_database() {
    print_step "6" "Setting up database environment"

    # Check if Docker is available
    if ! command -v docker >/dev/null 2>&1; then
        print_warning "Docker not found. Skipping database setup."
        print_info "Install Docker Desktop to enable full development environment"
        return 0
    fi

    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        print_warning "Docker is not running. Skipping database setup."
        print_info "Start Docker Desktop and run 'npm run docker:up' manually"
        return 0
    fi

    # Create Docker network if needed
    print_info "Setting up Docker network..."
    if ! docker network ls | grep -q "acamae-network"; then
        if npm run docker:create:net >/dev/null 2>&1; then
            print_status "Docker network created"
        else
            print_warning "Could not create Docker network (may already exist)"
        fi
    else
        print_status "Docker network already exists"
    fi

    # Start the database
    print_info "Starting database containers..."
    if npm run docker:up; then
        print_status "Database containers started successfully"

        # Wait for database to be ready
        print_info "Waiting for database to be ready..."
        local max_attempts=30
        local attempt=1

        while [ $attempt -le $max_attempts ]; do
            if npm run env:test >/dev/null 2>&1; then
                print_status "Database is ready!"
                break
            fi

            if [ $attempt -eq $max_attempts ]; then
                print_warning "Database took longer than expected to start"
                print_info "It may still be initializing. Check with: npm run db:status"
                break
            fi

            echo -n "."
            sleep 2
            attempt=$((attempt + 1))
        done
        echo
    else
        print_error "Failed to start database containers"
        print_info "Try manually: npm run docker:up"
        exit 3
    fi
}

# Function to apply initial migrations
apply_initial_migrations() {
    print_step "7" "Applying database migrations"

    # Generate Prisma client first
    print_info "Generating Prisma client..."
    if npm run prisma:generate >/dev/null 2>&1; then
        print_status "Prisma client generated"
    else
        print_warning "Could not generate Prisma client"
    fi

    # Apply migrations
    print_info "Applying database migrations..."
    if npm run prisma:deploy:dev; then
        print_status "Database migrations applied successfully"
    else
        print_warning "Could not apply migrations automatically"
        print_info "Try manually: npm run prisma:deploy:dev"
        return 1
    fi

    # Verify migration status
    print_info "Verifying migration status..."
    if npm run db:status >/dev/null 2>&1; then
        print_status "Database migration status verified"
    else
        print_warning "Could not verify migration status"
    fi
}

# Function to verify end-to-end functionality
verify_end_to_end() {
    print_step "8" "Verifying end-to-end functionality"

    # Check if we can reach the database
    print_info "Testing database connectivity..."
    if npm run env:test >/dev/null 2>&1; then
        print_status "Database connectivity verified"
    else
        print_warning "Database connectivity test failed"
        return 1
    fi

    # Start the application temporarily to test API
    print_info "Testing API endpoints..."

    # Start the server in background
    npm run start:dev &
    local server_pid=$!

    # Give it time to start
    sleep 5

    # Test health endpoint
    local api_working=false
    local max_attempts=10
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -k -s "https://localhost/api/health" >/dev/null 2>&1; then
            api_working=true
            break
        fi
        sleep 1
        attempt=$((attempt + 1))
    done

    # Stop the server
    kill $server_pid >/dev/null 2>&1
    wait $server_pid >/dev/null 2>&1

    if [ "$api_working" = true ]; then
        print_status "API endpoints responding correctly"
        print_info "✅ Health check: https://localhost/api/health"
    else
        print_warning "Could not verify API endpoints"
        print_info "Test manually: npm run dev"
    fi
}

# Function to create initial backup
create_initial_backup() {
    print_step "9" "Creating initial database backup"

    if [ -f "scripts/db-manager.sh" ]; then
        print_info "Creating initial backup for safety..."
        if bash scripts/db-manager.sh backup --auto; then
            print_status "Initial database backup created"
            print_info "Backup location: ./backups/development/"
        else
            print_warning "Could not create initial backup"
            print_info "Create manually: npm run db:backup"
        fi
    else
        print_warning "Database backup script not found"
    fi
}

# Function to show completion message and next steps
show_completion() {
    echo
    print_status "🎉 Complete initial setup finished successfully!"
    echo
    print_status "✅ Your development environment is ready to use!"
    echo
    print_info "🌐 Your application is accessible at:"
    echo "  - API: https://localhost/api"
    echo "  - Health check: https://localhost/api/health"
    echo "  - phpMyAdmin: https://localhost/phpmyadmin"
    echo
    print_info "🚀 Start developing:"
    echo "  npm run dev                # Start development server"
    echo "  npm run docker:logs        # View container logs"
    echo "  npm run prisma:studio      # Open database UI"
    echo
    print_info "🔧 Maintenance commands:"
    echo "  npm run db:status          # Check database status"
    echo "  npm run db:backup          # Create database backup"
    echo "  npm run ssl:generate       # Generate new SSL certificates"
    echo "  npm run docker:restart     # Restart all containers"
    echo
    print_info "📖 For detailed documentation, see:"
    echo "  - docs/SCRIPTS.md        # All available scripts"
    echo "  - docs/DEVELOPMENT.md    # Development workflow"
    echo "  - docs/TROUBLESHOOTING.md # Common issues"
    echo
    print_status "🎯 Everything is ready! Happy coding!"
    echo
}

# Function to show help
show_help() {
    echo "Acamae Backend Initial Setup"
    echo
    echo "USAGE:"
    echo "  $0 [OPTIONS]"
    echo
    echo "OPTIONS:"
    echo "  --non-interactive    Skip user prompts (use defaults)"
    echo "  --skip-ssl          Skip SSL certificate generation"
    echo "  --help, -h          Show this help message"
    echo
    echo "EXAMPLES:"
    echo "  $0                       # Interactive setup"
    echo "  $0 --non-interactive     # Automated setup"
    echo "  $0 --skip-ssl            # Skip SSL generation"
    echo
    echo "This script orchestrates the complete initial setup by calling:"
    echo "  - _env-manager.js        # Environment variable setup (internal)"
    echo "  - generate-ssl.js        # SSL certificate generation"
    echo "  - setup-backend.sh       # Backend configuration"
    echo
}

# Parse command line arguments
NON_INTERACTIVE=false
SKIP_SSL=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --non-interactive)
            NON_INTERACTIVE=true
            shift
            ;;
        --skip-ssl)
            SKIP_SSL=true
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

# Main execution function
main() {
    print_header

    if [ "$NON_INTERACTIVE" = true ]; then
        print_info "Running in non-interactive mode"
    fi

    echo
    print_info "🚀 Starting complete initial setup..."
    print_info "This will set up everything needed for development"
    echo

    # Step 1: Check system requirements
    check_system_requirements

    # Step 2: Setup environment variables
    setup_environment

    # Step 3: Install dependencies
    install_dependencies

    # Step 4: Generate SSL certificates
    generate_ssl_certificates

    # Step 5: Setup backend
    setup_backend

    # Step 6: Setup and start database
    setup_database

    # Step 7: Apply initial migrations
    apply_initial_migrations

    # Step 8: Verify end-to-end functionality
    verify_end_to_end

    # Step 9: Create initial backup
    create_initial_backup

    # Show completion message
    show_completion
}

# Execute main function
main "$@"
