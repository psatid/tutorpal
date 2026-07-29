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
REPOSITORY="backend"
COMPONENTS=("api" "worker")

print_error() { echo -e "${RED}✗ $1${NC}"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }

local_image_for() {
    echo "tutor-pal-backend-$1"
}

remote_tag_for() {
    local component=$1
    local suffix=$2
    echo "${component}-${suffix}"
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
            echo "  tutor-pal/backend:api-git-<sha>, api-latest"
            echo "  tutor-pal/backend:worker-git-<sha>, worker-latest"
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

    remote_image="${REGISTRY}/${REGISTRY_NAMESPACE}/${REPOSITORY}"

    # Push every immutable image first so no alias can point at a release whose
    # paired component has not reached the registry yet.
    for component in "${COMPONENTS[@]}"; do
        local_image=$(local_image_for "$component")
        immutable_tag=$(remote_tag_for "$component" "git-${GIT_SHA}")

        print_info "Tagging ${component} image for registry..."
        docker tag "${local_image}:git-${GIT_SHA}" "${remote_image}:${immutable_tag}"

        print_info "Pushing immutable ${component} image..."
        docker push "${remote_image}:${immutable_tag}"
        print_success "${component} immutable image pushed successfully"
    done

    for component in "${COMPONENTS[@]}"; do
        local_image=$(local_image_for "$component")
        latest_tag=$(remote_tag_for "$component" "latest")

        print_info "Tagging ${component} latest alias for registry..."
        docker tag "${local_image}:latest" "${remote_image}:${latest_tag}"

        print_info "Pushing ${component} latest alias..."
        docker push "${remote_image}:${latest_tag}"
        print_success "${component} latest alias pushed successfully"
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
    local_image=$(local_image_for "$component")
    if [[ "$PUSH_TO_REGISTRY" == true ]]; then
        echo "  ${REGISTRY}/${REGISTRY_NAMESPACE}/${REPOSITORY}:$(remote_tag_for "$component" "git-${GIT_SHA}")"
        echo "  ${REGISTRY}/${REGISTRY_NAMESPACE}/${REPOSITORY}:$(remote_tag_for "$component" "latest")"
    else
        echo "  ${local_image}:git-${GIT_SHA}"
        echo "  ${local_image}:latest"
    fi
done
echo ""
