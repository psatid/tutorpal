.DEFAULT_GOAL := help

SHELL := /bin/sh

BUN ?= bun
PORT ?= 4321
ARGS ?=
SCRIPT ?=
ENV ?= dev

.PHONY: help validate-env install dev cf-dev check test build build-dev cf-check run preview deploy deploy-dev

help:
	@printf '%s\n' \
		'TutorPal marketing site commands' \
		'  make install                          Install dependencies from the lockfile' \
		'  make dev                              Start the Astro development server' \
		'  make cf-dev                           Build assets and start the dev Worker locally' \
		'  make check                            Check Astro and TypeScript' \
		'  make test                             Run generated-page smoke tests' \
		'  make build                            Build the production site' \
		'  make build-dev                        Build the site with the same Astro config' \
		'  make cf-check [ENV=dev|prod]           Bundle-check an environment Worker config (default: dev)' \
		'  make preview                          Preview the production build' \
		'  make run SCRIPT=<name> [ARGS="..."]   Run a package.json script' \
		'  make deploy                           Deploy the production Worker to tutorpal.io' \
		'  make deploy-dev                       Deploy the dev Worker to dev.tutorpal.io'

validate-env:
	@if [ "$(ENV)" != "dev" ] && [ "$(ENV)" != "prod" ]; then \
		echo "Invalid ENV: $(ENV). Expected dev or prod."; \
		exit 2; \
	fi

install:
	$(BUN) install --frozen-lockfile
dev:
	$(BUN) run dev --port $(PORT)
cf-dev:
	$(BUN) run cf:dev
check:
	$(BUN) run check
test: build
	$(BUN) test tests/static-smoke.test.js
build:
	$(BUN) run build
build-dev: build
cf-check: validate-env
	$(BUN) run cf:check:$(ENV)
run:
	@test -n "$(SCRIPT)" || { echo 'Usage: make run SCRIPT=<package-script> [ARGS="..."]'; exit 2; }
	$(BUN) run "$(SCRIPT)" $(ARGS)
preview:
	$(BUN) run preview --port $(PORT)
deploy:
	$(BUN) run cf:deploy:prod

deploy-dev:
	$(BUN) run cf:deploy:dev
