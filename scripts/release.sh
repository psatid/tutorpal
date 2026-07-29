#!/bin/bash

# Promote the matching API and reminder-worker images to an environment.
#
# Usage:
#   ./scripts/release.sh <environment> [git-sha]

set -eo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

REGISTRY="registry.digitalocean.com"
REGISTRY_NAMESPACE="tutor-pal"
REPOSITORY="backend"
COMPONENTS=("api" "worker")
VERIFY_ATTEMPTS=6
VERIFY_DELAY_SECONDS=2

# Indexed arrays keep this compatible with the system Bash 3 shipped by macOS.
SOURCE_DIGESTS=()
PREVIOUS_TAG_EXISTS=()
PREVIOUS_DIGESTS=()
PREVIOUS_BACKUPS=()
CHANGED_COMPONENTS=()

print_error() { echo -e "${RED}✗ $1${NC}"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }

registry_repository() {
    # Docker image references include the registry namespace, while doctl's
    # registry repository commands expect the bare repository name.
    echo "${REPOSITORY}"
}

tag_for() {
    local component=$1
    local suffix=$2
    echo "${component}-${suffix}"
}

environment_digest_for() {
    local component=$1
    local environment_tag
    local tags

    environment_tag=$(tag_for "$component" "$ENVIRONMENT")

    if ! tags=$(doctl registry repository list-tags "$(registry_repository)" --format Tag,ManifestDigest --no-header); then
        return 1
    fi

    printf '%s\n' "$tags" | awk -v tag="$environment_tag" '$1 == tag { print $NF; exit }'
}

source_digest_for() {
    local component=$1
    local source_repository="${REGISTRY}/${REGISTRY_NAMESPACE}/${REPOSITORY}"
    local source_image="${source_repository}:$(tag_for "$component" "git-${GIT_SHA}")"
    local repo_digests
    local digest_reference

    if ! repo_digests=$(docker image inspect "$source_image" --format '{{range .RepoDigests}}{{println .}}{{end}}'); then
        return 1
    fi

    while IFS= read -r digest_reference; do
        case "$digest_reference" in
            "${source_repository}"@*)
                printf '%s\n' "${digest_reference#*@}"
                return 0
                ;;
        esac
    done <<< "$repo_digests"

    return 1
}

verify_environment_tag() {
    local component=$1
    local expected_digest=$2
    local registry_digest
    local attempt=1

    while [[ $attempt -le $VERIFY_ATTEMPTS ]]; do
        if registry_digest=$(environment_digest_for "$component") && [[ -n "$registry_digest" && "$registry_digest" == "$expected_digest" ]]; then
            print_success "${REPOSITORY}:$(tag_for "$component" "$ENVIRONMENT") verified: ${registry_digest}"
            return 0
        fi

        if [[ $attempt -lt $VERIFY_ATTEMPTS ]]; then
            sleep "$VERIFY_DELAY_SECONDS"
        fi
        attempt=$((attempt + 1))
    done

    print_error "Could not verify ${REPOSITORY}:$(tag_for "$component" "$ENVIRONMENT") at the expected digest"
    print_info "Expected: ${expected_digest}"
    print_info "Last observed: ${registry_digest:-missing}"
    return 1
}

verify_environment_tag_absent() {
    local component=$1
    local registry_digest
    local attempt=1

    while [[ $attempt -le $VERIFY_ATTEMPTS ]]; do
        if registry_digest=$(environment_digest_for "$component") && [[ -z "$registry_digest" ]]; then
            print_success "${REPOSITORY}:$(tag_for "$component" "$ENVIRONMENT") removed"
            return 0
        fi

        if [[ $attempt -lt $VERIFY_ATTEMPTS ]]; then
            sleep "$VERIFY_DELAY_SECONDS"
        fi
        attempt=$((attempt + 1))
    done

    print_error "Could not verify removal of ${REPOSITORY}:$(tag_for "$component" "$ENVIRONMENT")"
    return 1
}

rollback_promotions() {
    local index
    local component
    local environment_image
    local rollback_failed=0

    print_warning "Release failed; rolling back changed environment tags..."
    for ((index = 0; index < ${#COMPONENTS[@]}; index++)); do
        [[ "${CHANGED_COMPONENTS[$index]}" == "true" ]] || continue

        component=${COMPONENTS[$index]}
        environment_image="${REGISTRY}/${REGISTRY_NAMESPACE}/${REPOSITORY}:$(tag_for "$component" "$ENVIRONMENT")"

        if [[ "${PREVIOUS_TAG_EXISTS[$index]}" == "true" ]]; then
            print_info "Restoring ${component} ${ENVIRONMENT} tag..."
            if ! docker tag "${PREVIOUS_BACKUPS[$index]}" "$environment_image" || \
                ! docker push "$environment_image" || \
                ! verify_environment_tag "$component" "${PREVIOUS_DIGESTS[$index]}"; then
                print_error "Failed to restore ${component} ${ENVIRONMENT} tag"
                rollback_failed=1
            fi
        else
            print_info "Removing newly-created ${component} ${ENVIRONMENT} tag..."
            if ! doctl registry repository delete-tag "$(registry_repository)" "$(tag_for "$component" "$ENVIRONMENT")" --force && \
                ! verify_environment_tag_absent "$component"; then
                print_error "Failed to remove newly-created ${component} ${ENVIRONMENT} tag"
                rollback_failed=1
            elif ! verify_environment_tag_absent "$component"; then
                print_error "Failed to verify removal of ${component} ${ENVIRONMENT} tag"
                rollback_failed=1
            fi
        fi
    done

    if [[ $rollback_failed -ne 0 ]]; then
        print_error "One or more rollback operations failed; inspect both registry tags before deploying"
        return 1
    fi

    print_success "Rollback completed"
}

fail_release() {
    print_error "$1"
    if ! rollback_promotions; then
        print_error "Release failed and rollback was incomplete"
    fi
    exit 1
}

show_help() {
    echo "Usage: $0 <environment> [git-sha]"
    echo ""
    echo "Promotes API and worker tags in tutor-pal/backend with the same git SHA."
    echo ""
    echo "Arguments:"
    echo "  environment    Target environment (dev, staging, prod)"
    echo "  git-sha        Git commit SHA to promote (defaults to current HEAD)"
    echo ""
    echo "Examples:"
    echo "  $0 dev"
    echo "  $0 staging abc1234"
    echo "  $0 prod v1.2.3"
    echo ""
    echo "Production releases require confirmation. Source images are preflighted,"
    echo "and a failed paired promotion restores the prior environment tags."
}

if [[ $# -lt 1 ]] || [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
    show_help
    exit 0
fi

ENVIRONMENT=$1
GIT_SHA=${2:-""}
VALID_ENVIRONMENTS=("dev" "staging" "prod")
if [[ ! " ${VALID_ENVIRONMENTS[*]} " =~ " ${ENVIRONMENT} " ]]; then
    print_error "Invalid environment: ${ENVIRONMENT}"
    echo "Valid environments: ${VALID_ENVIRONMENTS[*]}"
    exit 1
fi

print_info "Checking prerequisites..."
for command in git docker doctl; do
    if ! command -v "$command" &> /dev/null; then
        print_error "$command is not installed"
        exit 1
    fi
done
print_success "All prerequisites met"

if [[ -z "$GIT_SHA" ]]; then
    GIT_SHA=$(git rev-parse --short=7 HEAD)
    print_info "Using current HEAD: ${GIT_SHA}"
else
    print_info "Validating git SHA/tag: ${GIT_SHA}"
    if ! git rev-parse --verify "${GIT_SHA}^{commit}" &> /dev/null; then
        print_error "Invalid git SHA or tag: ${GIT_SHA}"
        exit 1
    fi
    GIT_SHA=$(git rev-parse --short=7 "${GIT_SHA}")
    print_success "Resolved to: ${GIT_SHA}"
fi

if [[ "$ENVIRONMENT" == "prod" ]]; then
    echo ""
    print_warning "⚠️  PRODUCTION RELEASE DETECTED ⚠️"
    print_info "You are about to promote API and worker images git-${GIT_SHA} to PRODUCTION"
    read -p "Are you sure you want to continue? (yes/no): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_info "Release cancelled"
        exit 0
    fi
fi

print_info "Logging into DigitalOcean Container Registry..."
doctl registry login
print_success "Logged in successfully"

# Preflight every immutable source image before changing any environment tag.
for ((index = 0; index < ${#COMPONENTS[@]}; index++)); do
    component=${COMPONENTS[$index]}
    source_image="${REGISTRY}/${REGISTRY_NAMESPACE}/${REPOSITORY}:$(tag_for "$component" "git-${GIT_SHA}")"
    print_info "Preflighting ${component} source image..."
    if ! docker pull "$source_image"; then
        print_error "Failed to pull image: ${source_image}"
        print_info "Build and push both images first: ./scripts/build-push.sh --push"
        exit 1
    fi

    if ! SOURCE_DIGESTS[$index]=$(source_digest_for "$component") || [[ -z "${SOURCE_DIGESTS[$index]}" ]]; then
        print_error "Could not determine an immutable digest for ${source_image}"
        exit 1
    fi
    print_success "${component} source image is available"
done

# Snapshot and pull every previous environment tag before any promotion. The
# local backup tag preserves it when the environment tag is overwritten below.
for ((index = 0; index < ${#COMPONENTS[@]}; index++)); do
    component=${COMPONENTS[$index]}
    environment_image="${REGISTRY}/${REGISTRY_NAMESPACE}/${REPOSITORY}:$(tag_for "$component" "$ENVIRONMENT")"
    CHANGED_COMPONENTS[$index]=false

    if ! PREVIOUS_DIGESTS[$index]=$(environment_digest_for "$component"); then
        print_error "Could not read the current ${component} ${ENVIRONMENT} tag"
        exit 1
    fi

    if [[ -n "${PREVIOUS_DIGESTS[$index]}" ]]; then
        PREVIOUS_TAG_EXISTS[$index]=true
        PREVIOUS_BACKUPS[$index]="tutor-pal-release-backup-${component}:${ENVIRONMENT}-${GIT_SHA}-${$}"
        print_info "Snapshotting current ${component} ${ENVIRONMENT} tag..."
        if ! docker pull "$environment_image" || \
            ! docker tag "$environment_image" "${PREVIOUS_BACKUPS[$index]}"; then
            print_error "Could not snapshot current ${component} ${ENVIRONMENT} tag"
            exit 1
        fi
    else
        PREVIOUS_TAG_EXISTS[$index]=false
        PREVIOUS_BACKUPS[$index]=""
        print_info "No existing ${component} ${ENVIRONMENT} tag to snapshot"
    fi
done

# Only promote after all source and previous environment tags are available.
for ((index = 0; index < ${#COMPONENTS[@]}; index++)); do
    component=${COMPONENTS[$index]}
    source_image="${REGISTRY}/${REGISTRY_NAMESPACE}/${REPOSITORY}:$(tag_for "$component" "git-${GIT_SHA}")"
    environment_image="${REGISTRY}/${REGISTRY_NAMESPACE}/${REPOSITORY}:$(tag_for "$component" "$ENVIRONMENT")"
    print_info "Promoting ${component} image to ${ENVIRONMENT}..."
    if ! docker tag "$source_image" "$environment_image"; then
        fail_release "Failed to tag ${component} image for ${ENVIRONMENT}"
    fi
    CHANGED_COMPONENTS[$index]=true
    if ! docker push "$environment_image"; then
        fail_release "Failed to push ${component} ${ENVIRONMENT} tag"
    fi
    print_success "${component} environment tag pushed"
done

for ((index = 0; index < ${#COMPONENTS[@]}; index++)); do
    component=${COMPONENTS[$index]}
    if ! verify_environment_tag "$component" "${SOURCE_DIGESTS[$index]}"; then
        fail_release "${component} ${ENVIRONMENT} tag did not reach the expected digest"
    fi
done

echo ""
echo "=========================================="
if [[ "$ENVIRONMENT" == "prod" ]]; then
    print_success "🎉 PRODUCTION RELEASE COMPLETE!"
else
    print_success "Release complete!"
fi
echo "=========================================="
echo ""
for component in "${COMPONENTS[@]}"; do
    echo "  ${REGISTRY}/${REGISTRY_NAMESPACE}/${REPOSITORY}:$(tag_for "$component" "git-${GIT_SHA}")"
    echo "  → ${REGISTRY}/${REGISTRY_NAMESPACE}/${REPOSITORY}:$(tag_for "$component" "$ENVIRONMENT")"
done
echo ""
print_info "Next step: ./scripts/deploy.sh ${ENVIRONMENT}"
echo ""
