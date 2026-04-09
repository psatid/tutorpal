#!/bin/bash

# Deploy Script - Deploy to DigitalOcean App Platform
#
# Usage:
#   ./scripts/deploy.sh <environment>
#
# Arguments:
#   environment    Target environment (dev, staging, prod)
#
# Examples:
#   ./scripts/deploy.sh dev        # Deploy to dev
#   ./scripts/deploy.sh staging    # Deploy to staging
#   ./scripts/deploy.sh prod       # Deploy to production
#
# This script:
#   - Checks for app spec file (.do/<environment>.app.yaml)
#   - Creates or updates DO App Platform app
#   - Waits for deployment and health check
#   - Shows app URL and status

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
    echo "  $0 dev       # Deploy to dev"
    echo "  $0 staging   # Deploy to staging"
    echo "  $0 prod      # Deploy to production"
    echo ""
    echo "Prerequisites:"
    echo "  - Image must be released to the environment first (see release.sh)"
    echo "  - App spec must exist at .do/<environment>.app.yaml"
    echo ""
    echo "Deployment Workflow:"
    echo "  1. Build:    ./scripts/build-push.sh --push"
    echo "  2. Release:  ./scripts/release.sh <env> [sha]"
    echo "  3. Deploy:   ./scripts/deploy.sh <env>  ← You are here"
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

# Determine app spec path
APP_SPEC=".do/${ENVIRONMENT}.app.yaml"

# Check if app spec exists
if [[ ! -f "$APP_SPEC" ]]; then
    print_error "App spec file not found: ${APP_SPEC}"
    echo ""
    print_info "Please create the app spec file for ${ENVIRONMENT} environment."
    print_info "Example: .do/dev.app.yaml"
    echo ""
    print_info "You can create one based on the dev spec:"
    echo "  cp .do/dev.app.yaml ${APP_SPEC}"
    echo ""
    print_info "Then update the following in ${APP_SPEC}:"
    echo "  - name: (app name for ${ENVIRONMENT})"
    echo "  - services[0].image.tag: ${ENVIRONMENT}"
    echo "  - Environment variables as needed"
    exit 1
fi

print_success "Found app spec: ${APP_SPEC}"

# Check prerequisites
print_info "Checking prerequisites..."

if ! command -v doctl &> /dev/null; then
    print_error "doctl is not installed"
    exit 1
fi

if ! command -v curl &> /dev/null; then
    print_error "curl is not installed"
    exit 1
fi

print_success "All prerequisites met"

# Special handling for production
if [[ "$ENVIRONMENT" == "prod" ]]; then
    echo ""
    print_warning "⚠️  PRODUCTION DEPLOYMENT DETECTED ⚠️"
    echo ""
    print_info "You are about to deploy to PRODUCTION"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_info "Deployment cancelled"
        exit 0
    fi
    print_warning "Proceeding with production deployment..."
fi

# Get app name from spec
APP_NAME=$(grep "^name:" "${APP_SPEC}" | awk '{print $2}')
if [[ -z "$APP_NAME" ]]; then
    print_error "Could not parse app name from ${APP_SPEC}"
    exit 1
fi
print_info "App name: ${APP_NAME}"

# Check if app exists
echo ""
print_info "Checking for existing app..."
APP_ID=$(doctl apps list --format ID,Name --no-header | grep "${APP_NAME}" | awk '{print $1}' || true)

if [[ -z "$APP_ID" ]]; then
    print_info "App does not exist. Creating new app..."
    doctl apps create --spec ${APP_SPEC}
    
    # Get the new app ID
    sleep 2
    APP_ID=$(doctl apps list --format ID,Name --no-header | grep "${APP_NAME}" | awk '{print $1}')
    print_success "App created (ID: ${APP_ID})"
else
    print_info "Updating existing app (ID: ${APP_ID})..."
    doctl apps update ${APP_ID} --spec=${APP_SPEC}
    print_success "Update triggered"
fi

# Get app URL
echo ""
print_info "Waiting for app information..."
sleep 3
APP_URL=$(doctl apps get ${APP_ID} --format DefaultIngress --no-header)

if [[ -z "$APP_URL" ]]; then
    print_warning "Could not retrieve app URL immediately"
    APP_URL="(will be available shortly)"
fi

# Summary
echo ""
echo "=========================================="
if [[ "$ENVIRONMENT" == "prod" ]]; then
    print_success "🚀 PRODUCTION DEPLOYMENT TRIGGERED!"
else
    print_success "Deployment triggered!"
fi
echo "=========================================="
echo ""
print_info "App Name: ${APP_NAME}"
print_info "App ID: ${APP_ID}"
print_info "App URL: ${APP_URL}"
print_info "Health Check: ${APP_URL}/v1/health"
print_info "API Docs: ${APP_URL}/v1/docs"
echo ""

# Wait for deployment
echo ""
print_info "Waiting for deployment to complete (this may take 2-5 minutes)..."
echo "  You can monitor progress with:"
echo "    doctl apps get ${APP_ID}"
echo "    doctl apps logs ${APP_ID}"
echo ""

# Poll for deployment completion
MAX_ATTEMPTS=30
ATTEMPT=0
DEPLOYMENT_COMPLETE=false

while [[ $ATTEMPT -lt $MAX_ATTEMPTS ]]; do
    ATTEMPT=$((ATTEMPT + 1))
    
    # Get deployment status
    DEPLOYMENT_STATUS=$(doctl apps list-deployments ${APP_ID} --format Phase --no-header | head -1 || echo "UNKNOWN")
    
    case "$DEPLOYMENT_STATUS" in
        "ACTIVE")
            DEPLOYMENT_COMPLETE=true
            break
            ;;
        "FAILED"|"ERROR")
            print_error "Deployment ${DEPLOYMENT_STATUS}"
            print_info "Check logs with: doctl apps logs ${APP_ID}"
            exit 1
            ;;
        *)
            echo -n "."
            sleep 10
            ;;
    esac
done

echo ""

if [[ "$DEPLOYMENT_COMPLETE" == true ]]; then
    print_success "Deployment complete!"
    
    # Health check
    echo ""
    print_info "Performing health check..."
    sleep 5
    
    if curl -sf "${APP_URL}/v1/health" > /dev/null 2>&1; then
        print_success "Health check passed!"
    else
        print_warning "Health check not responding yet (may need more time)"
        print_info "Check manually with: curl ${APP_URL}/v1/health"
    fi
else
    print_warning "Deployment is still in progress"
    print_info "Check status with: doctl apps get ${APP_ID}"
fi

echo ""
