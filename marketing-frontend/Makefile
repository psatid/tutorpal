.DEFAULT_GOAL := help

SHELL := /bin/sh

SCRIPT ?=
ARGS ?=

.PHONY: help dev build deploy run test typecheck

help:
	@printf '%s\n' \
		'TutorPal marketing frontend commands' \
		'' \
		'  make dev                    Start the TanStack Start Worker app' \
		'  make build                  Build and type-check the Worker app' \
		'  make test                   Run focused beta interest tests' \
		'  make typecheck              Type-check without building' \
		'  make deploy                 Build and deploy with Wrangler' \
		'  make run SCRIPT=<name>      Run a package script'

dev:
	bun run dev

build:
	bun run build

test:
	bun run test

typecheck:
	bun run typecheck

deploy:
	bun run deploy

run:
	@test -n "$(SCRIPT)" || { echo 'Usage: make run SCRIPT=<package-script> [ARGS="..."]'; exit 2; }
	bun run "$(SCRIPT)" -- $(ARGS)
