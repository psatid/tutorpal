#!/bin/bash

# Release Script - Promote Docker Images to Environments
#
# Usage:
#   ./scripts/release.sh <environment> [git-sha]
#
# Arguments:
#   environment    Target environment (dev, staging, prod)
#   git-sha        Git commit SHA to promote (optional, defaults to current HEAD)
#
# Examples:
#   ./scripts/release.sh dev                    # Promote current HEAD to dev
#   ./scripts/release.sh dev abc1234            # Promote specific SHA to dev
#   ./scripts/release.sh staging                # Promote current HEAD to staging
#   ./scripts/release.sh prod v1.2.3            # Promote tag/SHA to prod
#
# This script:
#   - Pulls the git-<sha> image from registry
#   - Tags it with the environment name (dev/staging/prod)
#   - Pushes the environment tag
#   - Does NOT deploy - deployment is handled by deploy.sh

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

# Show help
show_help() {
    echo "Usage: $0 <environment> [git-sha]"
    echo ""
    echo "Arguments:"
    echo "  environment    Target environment (dev, staging, prod)"
    echo "  git-sha        Git commit SHA to promote (optional, defaults to current HEAD)"
    echo ""
    echo "Examples:"
    echo "  $0 dev                              # Promote current HEAD to dev"
    echo "  $0 dev abc1234                      # Promote specific SHA to dev"
    echo "  $0 staging                          # Promote current HEAD to staging"
    echo "  $0 prod v1.2.3                      # Promote tag/SHA to prod"
    echo ""
    echo "Environments:"
    echo "  dev       Development environment"
    echo "  staging   Staging environment"
    echo "  prod      Production environment (requires confirmation)"
    echo ""
    echo "Note: This script only promotes images. Use deploy.sh to deploy."
}

# Parse arguments
if [[ $# -lt 1 ]] || [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
    show_help
    exit 0
fi

ENVIRONMENT=$1
GIT_SHA=${2:-""}

# Validate environment
VALID_ENVIRONMENTS=("dev" "staging" "prod")
if [[ ! " ${VALID_ENVIRONMENTS[@]} " =~ " ${ENVIRONMENT} " ]]; then
    print_error "Invalid environment: ${ENVIRONMENT}"
    echo "Valid environments: ${VALID_ENVIRONMENTS[*]}"
    exit 1
fi

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

# Determine git SHA
if [[ -z "$GIT_SHA" ]]; then
    # Use current HEAD
    GIT_SHA=$(git rev-parse --short=7 HEAD)
    print_info "Using current HEAD: ${GIT_SHA}"
else
    # Validate the provided SHA/tag
    print_info "Validating git SHA/tag: ${GIT_SHA}"
    if ! git rev-parse --verify "${GIT_SHA}^{commit}" &> /dev/null; then
        print_error "Invalid git SHA or tag: ${GIT_SHA}"
        exit 1
    fi
    # Get short SHA
    GIT_SHA=$(git rev-parse --short=7 "${GIT_SHA}")
    print_success "Resolved to: ${GIT_SHA}"
fi

# Special handling for production
if [[ "$ENVIRONMENT" == "prod" ]]; then
    echo ""
    print_warning "⚠️  PRODUCTION RELEASE DETECTED ⚠️"
    echo ""
    print_info "You are about to promote image git-${GIT_SHA} to PRODUCTION"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_info "Release cancelled"
        exit 0
    fi
    print_warning "Proceeding with production release..."
fi

# Login to DO Registry
print_info "Logging into DigitalOcean Container Registry..."
doctl registry login
print_success "Logged in successfully"

# Pull the source image
SOURCE_IMAGE="${REGISTRY}/${REPOSITORY}:git-${GIT_SHA}"
echo ""
print_info "Pulling source image..."
echo "  ${SOURCE_IMAGE}"

if ! docker pull ${SOURCE_IMAGE} 2>/dev/null; then
    print_error "Failed to pull image: ${SOURCE_IMAGE}"
    echo ""
    print_info "The image may not exist in the registry."
    print_info "Did you build and push it first?"
    print_info "  ./scripts/build-push.sh --push"
    exit 1
fi

print_success "Image pulled successfully"

# Tag with environment
echo ""
print_info "Tagging image for environment..."
echo "  ${SOURCE_IMAGE}"
echo "  → ${REGISTRY}/${REPOSITORY}:${ENVIRONMENT}"

docker tag ${SOURCE_IMAGE} ${REGISTRY}/${REPOSITORY}:${ENVIRONMENT}
print_success "Image tagged"

# Push the environment tag
echo ""
print_info "Pushing environment tag..."
echo "  ${REGISTRY}/${REPOSITORY}:${ENVIRONMENT}"

docker push ${REGISTRY}/${REPOSITORY}:${ENVIRONMENT}
print_success "Environment tag pushed"

# Summary
echo ""
echo "=========================================="
if [[ "$ENVIRONMENT" == "prod" ]]; then
    print_success "🎉 PRODUCTION RELEASE COMPLETE!"
else
    print_success "Release complete!"
fi
echo "=========================================="
echo ""
print_info "Promoted image:"
echo "  ${SOURCE_IMAGE}"
echo "  → ${REGISTRY}/${REPOSITORY}:${ENVIRONMENT}"
echo ""
print_info "Next step - deploy to ${ENVIRONMENT}:"
echo "  ./scripts/deploy.sh ${ENVIRONMENT}"
echo ""
