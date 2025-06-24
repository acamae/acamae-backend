#!/bin/bash

# Consolidated script for database management
# Combines backup and rollback functionality

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print messages
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

# Function to show help
show_help() {
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Available commands:"
    echo "  backup [--auto]     - Create database backup"
    echo "  rollback <migration> - Rollback a migration"
    echo "  status              - Check database status"
    echo "  help                - Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 backup"
    echo "  $0 backup --auto"
    echo "  $0 rollback 20240101_120000_add_user_phone"
    echo "  $0 status"
}

# Function to load environment variables
load_env() {
    # Determine environment file
    if [ "${NODE_ENV:-development}" = "production" ]; then
        ENV_FILE=".env.production"
    else
        ENV_FILE=".env.development"
    fi

    if [ ! -f "$ENV_FILE" ]; then
        print_error "$ENV_FILE not found"
        exit 1
    fi

    # Load environment variables
    source $ENV_FILE

    # Verify critical variables
    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL is not configured in $ENV_FILE"
        exit 1
    fi

    # Extract components from DATABASE_URL
    DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*@[^:]*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
}

# Function to create backup
create_backup() {
    local auto_mode=$1

    print_info "🗄️ Starting database backup..."

    # Load environment variables
    load_env

    # Configure variables
    DATE=$(date +%Y%m%d_%H%M%S)
    BACKUP_DIR="./backups/${NODE_ENV:-development}"

    # Create backup directory if it doesn't exist
    mkdir -p $BACKUP_DIR

    # Name of the backup file
    BACKUP_FILE="$BACKUP_DIR/backup_${DB_NAME}_${DATE}.sql"

    print_status "Backup configuration:"
    echo "   - Host: $DB_HOST:$DB_PORT"
    echo "   - Database: $DB_NAME"
    echo "   - File: $BACKUP_FILE"

    # Verify connectivity
    print_status "Verifying connectivity..."
    if ! mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS -e "SELECT 1;" > /dev/null 2>&1; then
        print_error "Cannot connect to the database"
        exit 1
    fi

    # Create backup
    print_status "Creating backup..."
    if mysqldump -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS \
        --single-transaction \
        --routines \
        --triggers \
        --events \
        $DB_NAME > $BACKUP_FILE; then

        # Verify that the backup was created correctly
        if [ -s "$BACKUP_FILE" ]; then
            BACKUP_SIZE=$(du -h $BACKUP_FILE | cut -f1)
            print_status "Backup completed successfully"
            echo "   - File: $BACKUP_FILE"
            echo "   - Size: $BACKUP_SIZE"

            # Keep only the last 10 backups
            print_status "Cleaning up old backups..."
            ls -t $BACKUP_DIR/backup_${DB_NAME}_*.sql | tail -n +11 | xargs -r rm

            print_status "Backup ready to use in case of emergency"
        else
            print_error "The backup file is empty"
            rm -f $BACKUP_FILE
            exit 1
        fi
    else
        print_error "Error creating backup"
        exit 1
    fi
}

# Function to perform rollback
rollback_migration() {
    local migration_name=$1

    if [ -z "$migration_name" ]; then
        print_error "Usage: $0 rollback <migration_name>"
        echo "Example: $0 rollback 20240101_120000_add_user_phone"
        exit 1
    fi

    print_warning "⚠️  PRODUCTION ROLLBACK - THIS MAY CAUSE DATA LOSS"
    echo "Migration to revert: $migration_name"
    echo ""

    # User confirmation
    read -p "Are you sure you want to perform rollback? (yes/no): " CONFIRM

    if [ "$CONFIRM" != "yes" ]; then
        print_warning "Rollback cancelled by user"
        exit 0
    fi

    # Load environment variables
    load_env

    # Verify that the migration exists
    MIGRATION_DIR="prisma/migrations/$migration_name"
    if [ ! -d "$MIGRATION_DIR" ]; then
        print_error "Migration not found: $MIGRATION_DIR"
        exit 1
    fi

    print_status "Verifying migration status..."

    # Verify if the migration is applied
    if ! npx prisma migrate status | grep -q "$migration_name.*applied"; then
        print_error "Migration $migration_name is not applied"
        exit 1
    fi

    # Create backup before rollback
    print_status "Creating backup before rollback..."
    create_backup "auto"

    if [ $? -ne 0 ]; then
        print_error "Error creating backup. Rollback cancelled."
        exit 1
    fi

    # Stop application (if running)
    print_status "Stopping application..."
    if docker ps | grep -q "acamae-backend"; then
        docker stop acamae-backend
        print_status "Application stopped"
    else
        print_warning "Application was not running"
    fi

    # Create rollback script
    print_status "Creating rollback script..."

    ROLLBACK_FILE="rollback_${migration_name}.sql"

    # Generate rollback SQL
    npx prisma migrate diff \
        --from-schema-datamodel prisma/schema.prisma \
        --to-migration $migration_name \
        --script > $ROLLBACK_FILE

    if [ ! -s "$ROLLBACK_FILE" ]; then
        print_error "Could not generate rollback script"
        exit 1
    fi

    print_status "Rollback script generated: $ROLLBACK_FILE"

    # Show rollback preview
    print_warning "Rollback preview:"
    echo "========================"
    head -20 $ROLLBACK_FILE
    echo "..."
    echo "========================"

    # Final confirmation
    read -p "Proceed with rollback? (yes/no): " FINAL_CONFIRM

    if [ "$FINAL_CONFIRM" != "yes" ]; then
        print_warning "Rollback cancelled by user"
        rm -f $ROLLBACK_FILE
        exit 0
    fi

    # Apply rollback
    print_status "Applying rollback..."

    # Execute rollback
    if mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME < $ROLLBACK_FILE; then
        print_status "Rollback applied successfully"

        # Mark migration as reverted
        npx prisma migrate resolve --rolled-back $migration_name

        print_status "Migration marked as reverted"
    else
        print_error "Error applying rollback"
        print_warning "Check logs and consider restoring from backup"
        exit 1
    fi

    # Clean up temporary file
    rm -f $ROLLBACK_FILE

    # Restart application
    print_status "Restarting application..."
    docker start acamae-backend

    if [ $? -eq 0 ]; then
        print_status "Application restarted"
    else
        print_warning "Could not restart application automatically"
    fi

    print_status "Rollback completed successfully"
    print_warning "Remember:"
    echo "   - Verify that the application works correctly"
    echo "   - Check logs for issues"
    echo "   - Notify the team about the rollback"
}

# Function to check status
check_status() {
    print_info "🔍 Checking database status..."

    # Load environment variables
    load_env

    print_status "Database configuration:"
    echo "   - Host: $DB_HOST:$DB_PORT"
    echo "   - Database: $DB_NAME"
    echo "   - User: $DB_USER"

    # Verify connectivity
    print_status "Verifying connectivity..."
    if mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS -e "SELECT 1;" > /dev/null 2>&1; then
        print_status "✅ Connection successful"
    else
        print_error "❌ Cannot connect to database"
        exit 1
    fi

    # Check migration status
    print_status "Checking migration status..."
    npx prisma migrate status
}

# Main function
main() {
    local command=$1
    local option=$2

    case $command in
        "backup")
            create_backup $option
            ;;
        "rollback")
            rollback_migration $option
            ;;
        "status")
            check_status
            ;;
        "help"|"--help"|"-h"|"")
            show_help
            ;;
        *)
            print_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
