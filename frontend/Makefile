.DEFAULT_GOAL := help

SHELL := /bin/sh

BUN ?= bun
BUNX ?= bunx
ENV ?= dev
ARGS ?=
PAGES_PROJECT ?=
PAGES_PROJECT_DEV := tutorpal-tutor-portal-dev
SCRIPT ?=

.PHONY: help dev generate-api build build-dev check pages-build preview run deploy deploy-dev do-deploy

help:
	@printf '%s\n' \
		'TutorPal user frontend commands' \
		'  make dev                              Start Vite development server' \
		'  make check                            Type-check the app' \
		'  make build                            Type-check and build the app' \
		'  make build-dev                        Type-check and build with dev settings' \
		'  make pages-build                      Generate API client and build for Pages' \
		'  make preview                          Preview the built app' \
		'  make run SCRIPT=<name> [ARGS="..."]   Run a package.json script' \
		'  make deploy PAGES_PROJECT=<prod-name>  Build and deploy to the production Pages project' \
		'  make deploy-dev                       Build and deploy to tutorpal-tutor-portal-dev' \
		'  make do-deploy ENV=dev                Use the legacy DigitalOcean deploy script'

dev:
	$(BUN) run dev

generate-api:
	$(BUN) run generate:api

build:
	$(BUN) run build

build-dev:
	$(MAKE) pages-build ENV=dev

check:
	$(BUNX) tsc --noEmit

pages-build:
	$(BUN) run build --mode "$(ENV)"

preview:
	$(BUN) run preview

run:
	@test -n "$(SCRIPT)" || { echo 'Usage: make run SCRIPT=<package-script> [ARGS="..."]'; exit 2; }
	$(BUN) run "$(SCRIPT)" $(ARGS)

deploy:
	@test -n "$(PAGES_PROJECT)" || { echo 'PAGES_PROJECT is required for a production deployment.'; exit 2; }
	$(MAKE) build
	$(BUNX) wrangler pages deploy dist --project-name "$(PAGES_PROJECT)"

deploy-dev:
	$(MAKE) pages-build ENV=dev
	$(BUNX) wrangler pages deploy dist --project-name "$(PAGES_PROJECT_DEV)"

do-deploy:
	../scripts/deploy.sh "$(ENV)" frontend
