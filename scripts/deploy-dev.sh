#!/bin/bash

# Deploy TutorPal Backend to Development Environment
# 
# ⚠️  DEPRECATED: This script is deprecated in favor of the new separated workflow.
# Please use the following scripts instead:
#   - ./scripts/build-push.sh --push  (Build and push images)
#   - ./scripts/release.sh dev        (Promote to dev environment)
#   - ./scripts/deploy.sh dev         (Deploy to App Platform)
#
# Old Usage:
#   ./scripts/deploy-dev.sh           # Build and push only
#   ./scripts/deploy-dev.sh --deploy  # Build, push, and deploy to DO App Platform
#
# This script implements a git-based tagging strategy:
#   - git-<sha>: Immutable tag for the specific commit
#   - dev: Mutable tag pointing to current dev version

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Registry configuration
REGISTRY="registry.digitalocean.com"
REPOSITORY="tutor-pal/backend"
APP_SPEC=".do/dev.app.yaml"

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

# Check prerequisites
print_info "Checking prerequisites..."

if ! command -v git &> /dev/null; then
    print_error "git is not installed"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    print_error "docker is not installed"
    exit 1
fi

if ! command -v doctl &> /dev/null; then
    print_error "doctl is not installed"
    exit 1
fi

print_success "All prerequisites met"

# Deprecation warning
echo ""
print_warning "⚠️  THIS SCRIPT IS DEPRECATED ⚠️"
print_warning "Please use the new separated workflow:"
echo ""
echo "  1. Build & Push:   ./scripts/build-push.sh --push"
echo "  2. Release:        ./scripts/release.sh dev"
echo "  3. Deploy:         ./scripts/deploy.sh dev"
echo ""
read -p "Continue with deprecated script? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Please use the new scripts instead"
    exit 0
fi

# Check for uncommitted changes
print_info "Checking git status..."
if [[ -n $(git status --porcelain) ]]; then
    print_error "Uncommitted changes detected"
    echo ""
    git status --short
    echo ""
    print_warning "Please commit or stash your changes before deploying"
    exit 1
fi
print_success "Working directory is clean"

# Get git SHA (shortened to 7 characters)
GIT_SHA=$(git rev-parse --short=7 HEAD)
print_info "Git commit SHA: ${GIT_SHA}"

# Get current branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
print_info "Current branch: ${BRANCH}"

# Build Docker image
echo ""
print_info "Building Docker image..."
echo "  Tag: git-${GIT_SHA}"

docker build -t tutor-pal-backend:git-${GIT_SHA} ./backend

print_success "Docker image built successfully"

# Tag as dev (promotion without rebuild)
print_info "Tagging image as 'dev'..."
docker tag tutor-pal-backend:git-${GIT_SHA} tutor-pal-backend:dev
print_success "Image tagged as 'dev'"

# Login to DO Registry
echo ""
print_info "Logging into DigitalOcean Container Registry..."
doctl registry login
print_success "Logged in successfully"

# Tag for registry
echo ""
print_info "Tagging images for registry..."
docker tag tutor-pal-backend:git-${GIT_SHA} ${REGISTRY}/${REPOSITORY}:git-${GIT_SHA}
docker tag tutor-pal-backend:dev ${REGISTRY}/${REPOSITORY}:dev
print_success "Images tagged for registry"

# Push to registry
echo ""
print_info "Pushing images to registry..."
echo "  Pushing: git-${GIT_SHA}"
docker push ${REGISTRY}/${REPOSITORY}:git-${GIT_SHA}
echo "  Pushing: dev"
docker push ${REGISTRY}/${REPOSITORY}:dev
print_success "Images pushed successfully"

# Summary
echo ""
echo "=========================================="
print_success "Deployment artifacts ready"
echo "=========================================="
echo ""
print_info "Images in registry:"
echo "  ${REGISTRY}/${REPOSITORY}:git-${GIT_SHA}"
echo "  ${REGISTRY}/${REPOSITORY}:dev"
echo ""

# Deploy if --deploy flag is set
if [[ "$1" == "--deploy" ]]; then
    echo ""
    print_info "Deploying to DigitalOcean App Platform..."
    
    # Check if app exists
    APP_ID=$(doctl apps list --format ID,Name --no-header | grep "tutor-pal-backend-dev" | awk '{print $1}' || true)
    
    if [[ -z "$APP_ID" ]]; then
        print_info "Creating new app..."
        doctl apps create --spec ${APP_SPEC}
        APP_ID=$(doctl apps list --format ID,Name --no-header | grep "tutor-pal-backend-dev" | awk '{print $1}')
    else
        print_info "Updating existing app (ID: ${APP_ID})..."
        doctl apps update ${APP_ID} --spec=${APP_SPEC}
    fi
    
    print_success "Deployment triggered"
    
    # Get app URL
    sleep 2
    APP_URL=$(doctl apps get ${APP_ID} --format DefaultIngress --no-header)
    
    echo ""
    echo "=========================================="
    print_success "Deployment complete!"
    echo "=========================================="
    echo ""
    print_info "App URL: ${APP_URL}"
    print_info "Health check: ${APP_URL}/v1/health"
    print_info "API docs: ${APP_URL}/v1/docs"
    echo ""
    
    # Verify health check
    print_info "Waiting for health check (10s)..."
    sleep 10
    
    if curl -sf ${APP_URL}/v1/health > /dev/null 2>&1; then
        print_success "Health check passed!"
    else
        print_warning "Health check not responding yet (may need more time)"
        print_info "Check manually with: curl ${APP_URL}/v1/health"
    fi
    
else
    echo ""
    print_info "To deploy to DigitalOcean App Platform, run:"
    echo "  $0 --deploy"
    echo ""
    print_info "Or deploy manually:"
    echo "  doctl apps create --spec ${APP_SPEC}"
    echo "    or"
    echo "  doctl apps update \$(doctl apps list --format ID,Name --no-header | grep 'tutor-pal-backend-dev' | awk '{print \$1}') --spec=${APP_SPEC}"
fi

echo ""
