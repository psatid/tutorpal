#!/bin/bash

# Build and optionally push the TutorPal API and reminder-worker images.
#
# Usage:
#   ./scripts/build-push.sh           # Build both images locally
#   ./scripts/build-push.sh --push    # Build and push both images

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

REGISTRY="registry.digitalocean.com"
REGISTRY_NAMESPACE="tutor-pal"
COMPONENTS=("api" "worker")

print_error() { echo -e "${RED}✗ $1${NC}"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }

repository_for() {
    echo "backend-$1"
}

local_image_for() {
    echo "tutor-pal-backend-$1"
}

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
            echo "Builds API and worker images from the same git SHA."
            echo ""
            echo "Options:"
            echo "  --push    Push both images to DigitalOcean Container Registry"
            echo "  --help    Show this help message"
            echo ""
            echo "Images:"
            echo "  tutor-pal/backend-api:git-<sha>, latest"
            echo "  tutor-pal/backend-worker:git-<sha>, latest"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

print_info "Checking prerequisites..."
for command in git docker; do
    if ! command -v "$command" &> /dev/null; then
        print_error "$command is not installed"
        exit 1
    fi
done
print_success "All prerequisites met"

print_info "Checking git status..."
if [[ -n $(git status --porcelain) ]]; then
    print_warning "Uncommitted changes detected"
    echo ""
    git status --short
    echo ""
    print_warning "Both images will include the current working tree"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Build cancelled"
        exit 0
    fi
else
    print_success "Working directory is clean"
fi

GIT_SHA=$(git rev-parse --short=7 HEAD)
BRANCH=$(git rev-parse --abbrev-ref HEAD)
print_info "Git commit SHA: ${GIT_SHA}"
print_info "Current branch: ${BRANCH}"

for component in "${COMPONENTS[@]}"; do
    local_image=$(local_image_for "$component")
    echo ""
    print_info "Building ${component} image..."
    docker buildx build --platform linux/amd64 \
        --build-arg "APP_COMPONENT=${component}" \
        -t "${local_image}:git-${GIT_SHA}" \
        ./backend --load
    docker tag "${local_image}:git-${GIT_SHA}" "${local_image}:latest"
    print_success "${component} image built successfully"
done

if [[ "$PUSH_TO_REGISTRY" == true ]]; then
    if ! command -v doctl &> /dev/null; then
        print_error "doctl is not installed (required for pushing to registry)"
        exit 1
    fi

    print_info "Logging into DigitalOcean Container Registry..."
    doctl registry login
    print_success "Logged in successfully"

    for component in "${COMPONENTS[@]}"; do
        repository=$(repository_for "$component")
        local_image=$(local_image_for "$component")
        remote_image="${REGISTRY}/${REGISTRY_NAMESPACE}/${repository}"

        print_info "Tagging ${component} image for registry..."
        docker tag "${local_image}:git-${GIT_SHA}" "${remote_image}:git-${GIT_SHA}"
        docker tag "${local_image}:latest" "${remote_image}:latest"

        print_info "Pushing ${component} image..."
        docker push "${remote_image}:git-${GIT_SHA}"
        docker push "${remote_image}:latest"
        print_success "${component} image pushed successfully"
    done
fi

echo ""
echo "=========================================="
if [[ "$PUSH_TO_REGISTRY" == true ]]; then
    print_success "Build and push complete!"
else
    print_success "Build complete!"
fi
echo "=========================================="
echo ""
for component in "${COMPONENTS[@]}"; do
    repository=$(repository_for "$component")
    local_image=$(local_image_for "$component")
    if [[ "$PUSH_TO_REGISTRY" == true ]]; then
        echo "  ${REGISTRY}/${REGISTRY_NAMESPACE}/${repository}:git-${GIT_SHA}"
        echo "  ${REGISTRY}/${REGISTRY_NAMESPACE}/${repository}:latest"
    else
        echo "  ${local_image}:git-${GIT_SHA}"
        echo "  ${local_image}:latest"
    fi
done
echo ""
