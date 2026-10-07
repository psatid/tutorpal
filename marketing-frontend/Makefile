.DEFAULT_GOAL := help

SHELL := /bin/sh

BUN ?= bun
PORT ?= 4321
ARGS ?=
SCRIPT ?=

.PHONY: help install dev check test build build-dev run preview deploy deploy-dev

help:
	@printf '%s\n' \
		'TutorPal marketing site commands' \
		'  make install                          Install dependencies from the lockfile' \
		'  make dev                              Start the Astro development server' \
		'  make check                            Check Astro and TypeScript' \
		'  make test                             Run generated-page smoke tests' \
		'  make build                            Build the production site' \
		'  make build-dev                        Build the site with the same Astro config' \
		'  make preview                          Preview the production build' \
		'  make run SCRIPT=<name> [ARGS="..."]   Run a package.json script' \
		'  make deploy                           Deploy the production Worker'

install:
	$(BUN) install --frozen-lockfile
dev:
	$(BUN) run dev --port $(PORT)
check:
	$(BUN) run check
test: build
	$(BUN) test tests/static-smoke.test.js
build:
	$(BUN) run build
build-dev: build
run:
	@test -n "$(SCRIPT)" || { echo 'Usage: make run SCRIPT=<package-script> [ARGS="..."]'; exit 2; }
	$(BUN) run "$(SCRIPT)" $(ARGS)
preview:
	$(BUN) run preview --port $(PORT)
deploy:
	$(BUN) run deploy

# No dev Worker is configured for the marketing site yet.
deploy-dev:
	@echo 'No dev marketing Worker is configured.'
	@exit 2
