#!/bin/bash

# No-network regression coverage for the release script's doctl repository
# arguments. Run with: ./scripts/release.test.sh

set -euo pipefail

PROJECT_ROOT=$(cd "$(dirname "$0")/.." && pwd)
TEST_DIR=$(mktemp -d "${TMPDIR:-/tmp}/tutorpal-release-test.XXXXXX")
BIN_DIR="${TEST_DIR}/bin"
DOCTL_ARGS="${TEST_DIR}/doctl-args"

cleanup() {
    rm -f "${BIN_DIR}/docker" "${BIN_DIR}/doctl" "${BIN_DIR}/git" "${DOCTL_ARGS}" "${TEST_DIR}/rollback-doctl-args"
    rmdir "${BIN_DIR}" "${TEST_DIR}"
}
trap cleanup EXIT

mkdir "$BIN_DIR"

create_stub() {
    local path=$1
    local content=$2

    printf '%s\n' "$content" > "$path"
    chmod +x "$path"
}

create_stub "${BIN_DIR}/git" '#!/bin/bash
if [[ "$1" == "rev-parse" && "$2" == "--short=7" ]]; then
    echo af47bba
fi'

create_stub "${BIN_DIR}/docker" '#!/bin/bash
case "$1" in
    image)
        case "$3" in
            *:api-git-*) echo "registry.digitalocean.com/tutor-pal/backend@sha256:source-api" ;;
            *:worker-git-*) echo "registry.digitalocean.com/tutor-pal/backend@sha256:source-worker" ;;
        esac
        ;;
    push)
        if [[ "${DOCKER_FAIL_WORKER_PUSH:-}" == "true" && "$2" == *:worker-dev ]]; then
            exit 1
        fi
        ;;
esac'

create_stub "${BIN_DIR}/doctl" '#!/bin/bash
printf "%s\n" "$*" >> "$DOCTL_ARGS"
case "$1 $2 $3" in
    "registry repository list-tags")
        if [[ "${DOCKER_FAIL_WORKER_PUSH:-}" != "true" ]]; then
            printf "api-dev sha256:source-api\nworker-dev sha256:source-worker\n"
        fi
        ;;
esac'

PATH="${BIN_DIR}:$PATH" DOCTL_ARGS="$DOCTL_ARGS" "$PROJECT_ROOT/scripts/release.sh" dev af47bba > /dev/null

expected='registry repository list-tags backend --format Tag,ManifestDigest --no-header'
count=$(grep -Fxc "$expected" "$DOCTL_ARGS" || true)
if [[ $count -lt 2 ]]; then
    echo "Expected doctl to read bare repository 'backend'; captured:" >&2
    cat "$DOCTL_ARGS" >&2
    exit 1
fi

if grep -Fq 'tutor-pal/backend' "$DOCTL_ARGS"; then
    echo "doctl must not receive a namespaced repository path" >&2
    cat "$DOCTL_ARGS" >&2
    exit 1
fi

rollback_args="${TEST_DIR}/rollback-doctl-args"
if PATH="${BIN_DIR}:$PATH" DOCTL_ARGS="$rollback_args" DOCKER_FAIL_WORKER_PUSH=true \
    "$PROJECT_ROOT/scripts/release.sh" dev af47bba > /dev/null 2>&1; then
    echo "Expected simulated worker promotion to fail" >&2
    exit 1
fi

delete_expected='registry repository delete-tag backend api-dev --force'
if ! grep -Fqx "$delete_expected" "$rollback_args"; then
    echo "Expected doctl to delete the bare 'backend' repository tag; captured:" >&2
    cat "$rollback_args" >&2
    exit 1
fi

if grep -Fq 'tutor-pal/backend' "$rollback_args"; then
    echo "doctl must not receive a namespaced repository path during rollback" >&2
    cat "$rollback_args" >&2
    exit 1
fi

echo "✓ release script uses bare 'backend' for doctl registry repository commands"
