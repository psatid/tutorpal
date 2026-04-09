#!/bin/bash

# Database Migration Script
#
# Usage:
#   ./scripts/migrate.sh <environment>
#
# Arguments:
#   environment    Target environment (dev, staging, prod)
#
# Examples:
#   ./scripts/migrate.sh dev       # Run migrations on dev database
#   ./scripts/migrate.sh staging   # Run migrations on staging database
#   ./scripts/migrate.sh prod      # Run migrations on production database
#
# This script:
#   - Prompts for DATABASE_URL (never hardcoded for security)
#   - Validates the connection
#   - Runs 'prisma migrate deploy' (production-safe)
#   - Shows migration status

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Show help
show_help() {
    echo "Usage: $0 <environment>"
    echo ""
    echo "Arguments:"
    echo "  environment    Target environment (dev, staging, prod)"
    echo ""
    echo "Examples:"
    echo "  $0 dev       # Run migrations on dev database"
    echo "  $0 staging   # Run migrations on staging database"
    echo "  $0 prod      # Run migrations on production database"
    echo ""
    echo "Note: This script uses 'prisma migrate deploy' which is safe for production."
    echo "      It will NOT create new migrations, only apply pending ones."
    echo ""
    echo "Prerequisites:"
    echo "  - DATABASE_URL must be set or provided"
    echo "  - Run from project root"
}

# Parse arguments
if [[ $# -lt 1 ]] || [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
    show_help
    exit 0
fi

ENVIRONMENT=$1

# Validate environment
VALID_ENVIRONMENTS=("dev" "staging" "prod")
if [[ ! " ${VALID_ENVIRONMENTS[@]} " =~ " ${ENVIRONMENT} " ]]; then
    print_error "Invalid environment: ${ENVIRONMENT}"
    echo "Valid environments: ${VALID_ENVIRONMENTS[*]}"
    exit 1
fi

# Check prerequisites
print_info "Checking prerequisites..."

if ! command -v bun &> /dev/null; then
    print_error "bun is not installed"
    exit 1
fi

if [[ ! -d "backend/prisma" ]]; then
    print_error "Prisma directory not found. Are you in the project root?"
    exit 1
fi

print_success "All prerequisites met"

# Check if DATABASE_URL is already set
if [[ -z "$DATABASE_URL" ]]; then
    echo ""
    print_info "DATABASE_URL is not set."
    
    # Special warning for production
    if [[ "$ENVIRONMENT" == "prod" ]]; then
        echo ""
        print_warning "⚠️  PRODUCTION DATABASE DETECTED ⚠️"
        print_warning "You are about to run migrations on PRODUCTION."
        echo ""
    fi
    
    echo "Please enter the DATABASE_URL for ${ENVIRONMENT}:"
    echo "Format: postgresql://postgres:[password]@[host]:5432/postgres?sslmode=require"
    read -r DATABASE_URL
    
    if [[ -z "$DATABASE_URL" ]]; then
        print_error "DATABASE_URL is required"
        exit 1
    fi
else
    echo ""
    print_info "Using DATABASE_URL from environment"
fi

# Export DATABASE_URL
export DATABASE_URL

# Change to backend directory
cd backend

# Install dependencies if needed
if [[ ! -d "node_modules" ]] && [[ ! -d "node_modules/.prisma" ]]; then
    print_info "Installing dependencies..."
    bun install
    print_success "Dependencies installed"
fi

# Generate Prisma client
print_info "Generating Prisma client..."
bunx prisma generate
print_success "Prisma client generated"

# Special handling for production
if [[ "$ENVIRONMENT" == "prod" ]]; then
    echo ""
    print_warning "⚠️  ABOUT TO RUN MIGRATIONS ON PRODUCTION ⚠️"
    echo ""
    print_info "This will apply pending migrations to your production database."
    print_info "Current migrations:"
    bunx prisma migrate status
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_info "Migration cancelled"
        exit 0
    fi
fi

# Run migrations
echo ""
print_info "Running migrations on ${ENVIRONMENT} database..."
echo "Using: prisma migrate deploy"
echo ""

bunx prisma migrate deploy

# Show final status
echo ""
print_info "Migration status:"
bunx prisma migrate status

# Summary
echo ""
echo "=========================================="
if [[ "$ENVIRONMENT" == "prod" ]]; then
    print_success "🎉 PRODUCTION MIGRATION COMPLETE!"
else
    print_success "Migration complete!"
fi
echo "=========================================="
echo ""
print_info "Database: ${ENVIRONMENT}"
print_info "Migrations applied successfully"
echo ""
