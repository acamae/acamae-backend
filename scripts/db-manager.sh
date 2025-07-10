#!/bin/bash

#===============================================================================
# Database Management Script
#===============================================================================
# DESCRIPTION:
#   Comprehensive database management tool for backup, rollback, and status
#   operations. Handles both development and production environments safely.
#
# WHEN TO USE:
#   - Before major database migrations
#   - Regular database backups (recommended daily for production)
#   - Rolling back failed migrations
#   - Checking database and migration status
#   - Troubleshooting database connectivity issues
#   - Before and after deployment
#
# USAGE:
#   ./scripts/db-manager.sh <command> [options]
#
# COMMANDS:
#   backup [--auto]         Create database backup
#   rollback <migration>    Rollback a specific migration (DESTRUCTIVE)
#   status                  Check database and migration status
#   help                    Show detailed help information
#
# EXAMPLES:
#   ./scripts/db-manager.sh backup                    # Interactive backup
#   ./scripts/db-manager.sh backup --auto             # Automated backup
#   ./scripts/db-manager.sh rollback 20240101_120000  # Rollback migration
#   ./scripts/db-manager.sh status                    # Check status
#   NODE_ENV=production ./scripts/db-manager.sh backup # Production backup
#
# REQUIREMENTS:
#   - Environment files (.env.development or .env.production)
#   - MySQL client tools (mysql, mysqldump)
#   - Prisma CLI
#   - Docker (if using containerized database)
#   - Sufficient disk space for backups
#
# SAFETY FEATURES:
#   - Automatic backups before rollbacks
#   - User confirmation for destructive operations
#   - Environment validation
#   - Connection testing before operations
#   - Backup retention (keeps last 10 backups)
#
# EXIT CODES:
#   0 - Success
#   1 - General error
#   2 - Environment configuration error
#   3 - Database connection error
#   4 - Backup/restore error
#   5 - Migration error
#===============================================================================

# Color definitions for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly BOLD='\033[1m'
readonly NC='\033[0m' # No Color

# Configuration constants
readonly BACKUP_RETENTION=10
readonly BACKUP_DIR_PREFIX="./backups"
readonly REQUIRED_COMMANDS=("mysql" "mysqldump" "npx")

# Utility functions for output formatting
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
    echo "  DATABASE MANAGEMENT TOOL"
    echo "========================================"
    echo -e "${NC}"
}

# Function to check if required commands are available
check_dependencies() {
    local missing_deps=()

    for cmd in "${REQUIRED_COMMANDS[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            missing_deps+=("$cmd")
        fi
    done

    if [ ${#missing_deps[@]} -gt 0 ]; then
        print_error "Missing required dependencies: ${missing_deps[*]}"
        print_info "Install missing dependencies:"
        for dep in "${missing_deps[@]}"; do
            case $dep in
                mysql|mysqldump)
                    print_info "MySQL client installation:"
                    case "$(uname -s)" in
                        Darwin*)
                            echo "  - macOS: brew install mysql-client"
                            ;;
                        Linux*)
                            echo "  - Ubuntu/Debian: sudo apt-get install mysql-client"
                            echo "  - CentOS/RHEL: sudo yum install mysql"
                            echo "  - Fedora: sudo dnf install mysql"
                            ;;
                        MINGW*|MSYS*|CYGWIN*)
                            echo "  - Windows: Download MySQL from https://dev.mysql.com/downloads/mysql/"
                            echo "  - Or use Chocolatey: choco install mysql"
                            echo "  - Or use winget: winget install Oracle.MySQL"
                            echo "  - Or use Scoop: scoop install mysql"
                            echo "  - Add MySQL bin folder to PATH (e.g., C:\Program Files\MySQL\MySQL Server X.X\bin)"
                            ;;
                        *)
                            echo "  - Linux: apt-get install mysql-client (Ubuntu/Debian) or yum install mysql (CentOS/RHEL)"
                            echo "  - macOS: brew install mysql-client"
                            echo "  - Windows: Download from https://dev.mysql.com/downloads/mysql/"
                            ;;
                    esac
                    ;;
                npx)
                    echo "  - Node.js and npm: https://nodejs.org"
                    ;;
            esac
        done
        exit 1
    fi
}

# Function to display detailed help
show_help() {
    print_header
    echo "USAGE:"
    echo "  $0 <command> [options]"
    echo ""
    echo "COMMANDS:"
    echo "  backup [--auto]     Create database backup"
    echo "                      --auto: Skip user confirmations"
    echo "  rollback <migration> Rollback a migration (DESTRUCTIVE)"
    echo "                      migration: Migration name to rollback"
    echo "  status              Check database and migration status"
    echo "  help                Show this help message"
    echo ""
    echo "EXAMPLES:"
    echo "  $0 backup                           # Interactive backup"
    echo "  $0 backup --auto                    # Automated backup"
    echo "  $0 rollback 20240101_120000         # Rollback specific migration"
    echo "  $0 status                           # Check database status"
    echo "  NODE_ENV=production $0 backup       # Production backup"
    echo ""
    echo "ENVIRONMENT:"
    echo "  NODE_ENV              Environment to use (development|production)"
    echo "  DATABASE_URL          Database connection string"
    echo ""
    echo "BACKUP LOCATION:"
    echo "  Development: ./backups/development/"
    echo "  Production:  ./backups/production/"
    echo ""
    echo "SAFETY NOTES:"
    echo "  - Rollbacks are DESTRUCTIVE and may cause data loss"
    echo "  - Always backup before rollbacks (done automatically)"
    echo "  - Test rollbacks in development first"
    echo "  - Keep multiple backup copies for production"
    echo ""
}

# Function to load and validate environment variables
load_environment() {
    local node_env="${NODE_ENV:-development}"
    local env_file

    # Determine environment file
    if [ "$node_env" = "production" ]; then
        env_file=".env.production"
    else
        env_file=".env.development"
    fi

    print_info "Loading environment: $node_env"
    print_info "Environment file: $env_file"

    # Check if environment file exists
    if [ ! -f "$env_file" ]; then
        print_error "Environment file not found: $env_file"
        print_info "Create the environment file with DATABASE_URL"
        exit 2
    fi

    # Load environment variables
    set -a
    source "$env_file"
    set +a

    # Verify critical variables
    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL is not configured in $env_file"
        print_info "Add DATABASE_URL to your environment file"
        exit 2
    fi

    # Extract database connection components
    if ! extract_db_components; then
        print_error "Failed to parse DATABASE_URL"
        print_info "Ensure DATABASE_URL format: mysql://user:pass@host:port/database"
        exit 2
    fi

    # Export environment for use in functions
    export NODE_ENV="$node_env"
    export ENV_FILE="$env_file"

    print_status "Environment loaded successfully"
}

# Function to extract database connection components from DATABASE_URL
extract_db_components() {
    if [[ ! "$DATABASE_URL" =~ ^mysql://([^:]+):([^@]+)@([^:]+):([0-9]+)/([^?]+) ]]; then
        return 1
    fi

    export DB_USER="${BASH_REMATCH[1]}"
    export DB_PASS="${BASH_REMATCH[2]}"
    export DB_HOST="${BASH_REMATCH[3]}"
    export DB_PORT="${BASH_REMATCH[4]}"
    export DB_NAME="${BASH_REMATCH[5]}"

    return 0
}

# Function to create MySQL configuration file for secure authentication
create_mysql_config() {
    local config_file
    config_file=$(mktemp)

    # Create temporary MySQL configuration file
    cat > "$config_file" << EOF
[client]
host=$DB_HOST
port=$DB_PORT
user=$DB_USER
password=$DB_PASS
EOF

    # Secure the configuration file
    chmod 600 "$config_file"

    # Export config file path for use in other functions
    export MYSQL_CONFIG_FILE="$config_file"
}

# Function to cleanup MySQL configuration file
cleanup_mysql_config() {
    if [ -n "$MYSQL_CONFIG_FILE" ] && [ -f "$MYSQL_CONFIG_FILE" ]; then
        rm -f "$MYSQL_CONFIG_FILE"
        unset MYSQL_CONFIG_FILE
    fi
}

# Function to test database connectivity
test_database_connection() {
    print_info "Testing database connectivity..."

    # Create secure MySQL config file
    create_mysql_config

    if mysql --defaults-extra-file="$MYSQL_CONFIG_FILE" -e "SELECT 1;" > /dev/null 2>&1; then
        print_status "Database connection successful"
        cleanup_mysql_config
        return 0
    else
        print_error "Cannot connect to database"
        print_info "Connection details:"
        echo "  - Host: $DB_HOST:$DB_PORT"
        echo "  - Database: $DB_NAME"
        echo "  - User: $DB_USER"
        print_info "Check if database server is running and credentials are correct"
        cleanup_mysql_config
        return 1
    fi
}

# Function to create database backup
create_backup() {
    local auto_mode=false

    # Parse arguments
    if [ "$1" = "--auto" ]; then
        auto_mode=true
    fi

    print_header
    print_info "🗄️ Starting database backup..."

    # Load environment and verify connection
    load_environment

    if ! test_database_connection; then
        exit 3
    fi

    # Setup backup configuration
    local date_stamp=$(date +%Y%m%d_%H%M%S)
    local backup_dir="$BACKUP_DIR_PREFIX/${NODE_ENV}"
    local backup_file="$backup_dir/backup_${DB_NAME}_${date_stamp}.sql"

    # Create backup directory
    mkdir -p "$backup_dir"

    print_info "Backup configuration:"
    echo "  - Environment: $NODE_ENV"
    echo "  - Database: $DB_NAME"
    echo "  - Host: $DB_HOST:$DB_PORT"
    echo "  - File: $backup_file"

    # User confirmation for interactive mode
    if [ "$auto_mode" = false ]; then
        echo ""
        read -p "Proceed with backup? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_warning "Backup cancelled by user"
            exit 0
        fi
    fi

    # Create backup
    print_status "Creating backup..."

    # Create secure MySQL config file for backup
    create_mysql_config

    # Ensure cleanup on exit
    trap 'cleanup_mysql_config' EXIT

    if mysqldump --defaults-extra-file="$MYSQL_CONFIG_FILE" \
        --single-transaction \
        --routines \
        --triggers \
        --events \
        --add-drop-table \
        --create-options \
        "$DB_NAME" > "$backup_file"; then

        # Verify backup was created successfully
        if [ -s "$backup_file" ]; then
            local backup_size=$(du -h "$backup_file" | cut -f1)
            print_status "Backup completed successfully"
            echo "  - File: $backup_file"
            echo "  - Size: $backup_size"
            echo "  - Timestamp: $(date)"

            # Cleanup old backups
            cleanup_old_backups "$backup_dir"

            print_status "✅ Backup ready for emergency use"
        else
            print_error "Backup file is empty or corrupted"
            rm -f "$backup_file"
            cleanup_mysql_config
            exit 4
        fi
    else
        print_error "Failed to create backup"
        rm -f "$backup_file"
        cleanup_mysql_config
        exit 4
    fi

    # Cleanup configuration file
    cleanup_mysql_config
}

# Function to cleanup old backups
cleanup_old_backups() {
    local backup_dir="$1"

    print_info "Cleaning up old backups (keeping last $BACKUP_RETENTION)..."

    # Count current backups
    local backup_count=$(find "$backup_dir" -name "backup_${DB_NAME}_*.sql" | wc -l)

    if [ "$backup_count" -gt "$BACKUP_RETENTION" ]; then
        local to_remove=$((backup_count - BACKUP_RETENTION))
        find "$backup_dir" -name "backup_${DB_NAME}_*.sql" -type f | sort | head -n "$to_remove" | xargs rm -f
        print_info "Removed $to_remove old backup(s)"
    else
        print_info "No cleanup needed ($backup_count/$BACKUP_RETENTION backups)"
    fi
}

# Function to perform migration rollback
rollback_migration() {
    local migration_name="$1"

    if [ -z "$migration_name" ]; then
        print_error "Migration name is required"
        echo "Usage: $0 rollback <migration_name>"
        echo "Example: $0 rollback 20240101_120000_add_user_phone"
        echo ""
        echo "Use '$0 status' to see available migrations"
        exit 1
    fi

    print_header
    print_warning "⚠️  DESTRUCTIVE OPERATION - MIGRATION ROLLBACK"
    print_warning "This operation may cause DATA LOSS"
    echo ""
    echo "Migration to rollback: $migration_name"
    echo "Environment: ${NODE_ENV:-development}"
    echo ""

    # Load environment
    load_environment

    # Verify migration exists and is applied
    local migration_dir="prisma/migrations/$migration_name"
    if [ ! -d "$migration_dir" ]; then
        print_error "Migration directory not found: $migration_dir"
        print_info "Available migrations:"
        ls -1 prisma/migrations/ 2>/dev/null || echo "  No migrations found"
        exit 5
    fi

    print_status "Verifying migration status..."
    if ! npx prisma migrate status | grep -q "$migration_name.*applied"; then
        print_error "Migration '$migration_name' is not currently applied"
        print_info "Use '$0 status' to check migration status"
        exit 5
    fi

    # User confirmation
    echo ""
    print_warning "CONFIRM ROLLBACK:"
    echo "  - Migration: $migration_name"
    echo "  - Environment: $NODE_ENV"
    echo "  - Database: $DB_NAME"
    echo ""
    read -p "Type 'ROLLBACK' to confirm: " confirmation

    if [ "$confirmation" != "ROLLBACK" ]; then
        print_warning "Rollback cancelled - confirmation not matched"
        exit 0
    fi

    # Create automatic backup before rollback
    print_status "Creating automatic backup before rollback..."
    create_backup --auto

    if [ $? -ne 0 ]; then
        print_error "Failed to create backup - rollback cancelled for safety"
        exit 4
    fi

    # TODO: Implement actual rollback logic here
    # This would require Prisma rollback functionality or custom SQL generation
    print_warning "Migration rollback functionality is not yet implemented"
    print_info "Manual rollback required:"
    print_info "1. Review migration SQL in: $migration_dir"
    print_info "2. Create reverse SQL manually"
    print_info "3. Apply reverse SQL with: mysql --defaults-extra-file=<config_file> $DB_NAME < reverse.sql"
    print_info "4. Mark migration as rolled back: npx prisma migrate resolve --rolled-back $migration_name"

    exit 5
}

# Function to check database and migration status
check_status() {
    print_header
    print_info "🔍 Checking database status..."

    # Load environment
    load_environment

    print_status "Environment configuration:"
    echo "  - Environment: $NODE_ENV"
    echo "  - Host: $DB_HOST:$DB_PORT"
    echo "  - Database: $DB_NAME"
    echo "  - User: $DB_USER"

    # Test connectivity
    echo ""
    if test_database_connection; then
        print_status "✅ Database connectivity verified"
    else
        print_error "❌ Database connection failed"
        exit 3
    fi

    # Check migration status
    echo ""
    print_status "Migration status:"
    if npx prisma migrate status; then
        print_status "Migration status check completed"
    else
        print_warning "Failed to get migration status"
        print_info "Possible issues:"
        echo "  - Database not initialized"
        echo "  - Prisma schema out of sync"
        echo "  - Missing migrations table"
    fi

    # Show recent backups
    echo ""
    print_info "Recent backups:"
    local backup_dir="$BACKUP_DIR_PREFIX/${NODE_ENV}"
    if [ -d "$backup_dir" ]; then
        local backup_files=$(find "$backup_dir" -name "backup_${DB_NAME}_*.sql" -type f | sort -r | head -5)
        if [ -n "$backup_files" ]; then
            echo "$backup_files" | while read -r file; do
                local size=$(du -h "$file" | cut -f1)
                local date=$(basename "$file" | sed 's/backup_.*_\([0-9_]*\).sql/\1/' | sed 's/_/ /')
                echo "  - $(basename "$file") (${size}) - ${date}"
            done
        else
            echo "  No backups found"
        fi
    else
        echo "  No backup directory found"
    fi
}

# Main execution function
main() {
    local command="$1"
    local option="$2"

    # Check dependencies first
    check_dependencies

    case "$command" in
        "backup")
            create_backup "$option"
            ;;
        "rollback")
            rollback_migration "$option"
            ;;
        "status")
            check_status
            ;;
        "help"|"--help"|"-h"|"")
            show_help
            ;;
        *)
            print_error "Unknown command: $command"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Execute main function with all arguments
main "$@"
