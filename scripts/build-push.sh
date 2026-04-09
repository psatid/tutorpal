#!/bin/bash

# Build and Push Docker Image for TutorPal Backend
#
# Usage:
#   ./scripts/build-push.sh           # Build only (default)
#   ./scripts/build-push.sh --push    # Build and push to registry
#
# This script:
#   - Builds Docker image with git-<sha> tag (immutable)
#   - Tags as 'latest' for local reference
#   - Pushes to registry only with --push flag
#
# The image is tagged with the short git SHA for traceability.
# Environment-specific tags (dev/staging/prod) are handled by release.sh

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

# Parse arguments
PUSH_TO_REGISTRY=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --push)
            PUSH_TO_REGISTRY=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [--push]"
            echo ""
            echo "Options:"
            echo "  --push    Push images to registry after building"
            echo "  --help    Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0              # Build only"
            echo "  $0 --push       # Build and push"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

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

print_success "All prerequisites met"

# Check for uncommitted changes
print_info "Checking git status..."
if [[ -n $(git status --porcelain) ]]; then
    print_warning "Uncommitted changes detected"
    echo ""
    git status --short
    echo ""
    print_warning "Building with uncommitted changes (image will include these changes)"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Build cancelled"
        exit 0
    fi
else
    print_success "Working directory is clean"
fi

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
echo "  Tag: latest"

docker build -t tutor-pal-backend:git-${GIT_SHA} ./backend
docker tag tutor-pal-backend:git-${GIT_SHA} tutor-pal-backend:latest

print_success "Docker image built successfully"

# Push to registry if requested
if [[ "$PUSH_TO_REGISTRY" == true ]]; then
    # Check for doctl
    if ! command -v doctl &> /dev/null; then
        print_error "doctl is not installed (required for pushing to registry)"
        exit 1
    fi

    # Login to DO Registry
    echo ""
    print_info "Logging into DigitalOcean Container Registry..."
    doctl registry login
    print_success "Logged in successfully"

    # Tag for registry
    echo ""
    print_info "Tagging images for registry..."
    docker tag tutor-pal-backend:git-${GIT_SHA} ${REGISTRY}/${REPOSITORY}:git-${GIT_SHA}
    docker tag tutor-pal-backend:latest ${REGISTRY}/${REPOSITORY}:latest
    print_success "Images tagged for registry"

    # Push to registry
    echo ""
    print_info "Pushing images to registry..."
    echo "  Pushing: git-${GIT_SHA}"
    docker push ${REGISTRY}/${REPOSITORY}:git-${GIT_SHA}
    echo "  Pushing: latest"
    docker push ${REGISTRY}/${REPOSITORY}:latest
    print_success "Images pushed successfully"

    # Summary
    echo ""
    echo "=========================================="
    print_success "Build and push complete!"
    echo "=========================================="
    echo ""
    print_info "Images in registry:"
    echo "  ${REGISTRY}/${REPOSITORY}:git-${GIT_SHA}"
    echo "  ${REGISTRY}/${REPOSITORY}:latest"
    echo ""
else
    # Summary (local build only)
    echo ""
    echo "=========================================="
    print_success "Build complete!"
    echo "=========================================="
    echo ""
    print_info "Local images:"
    echo "  tutor-pal-backend:git-${GIT_SHA}"
    echo "  tutor-pal-backend:latest"
    echo ""
    print_info "To push to registry, run:"
    echo "  $0 --push"
fi

echo ""
