.DEFAULT_GOAL := help

SHELL := /bin/sh

BUN ?= bun
BUNX ?= bunx
ENV ?= dev
ARGS ?=
PAGES_PROJECT ?=
SCRIPT ?=

.PHONY: help dev generate-api build pages-build preview run deploy do-deploy

help:
	@printf '%s\n' \
		'TutorPal user frontend commands' \
		'  make dev                              Start Vite development server' \
		'  make build                            Type-check and build the app' \
		'  make pages-build                      Generate API client and build for Pages' \
		'  make preview                          Preview the built app' \
		'  make run SCRIPT=<name> [ARGS="..."]   Run a package.json script' \
		'  make deploy PAGES_PROJECT=<name>      Build and deploy to Cloudflare Pages' \
		'  make do-deploy ENV=dev                Use the legacy DigitalOcean deploy script'

dev:
	$(BUN) run dev

generate-api:
	$(BUN) run generate:api

build:
	$(BUN) run build

pages-build:
	$(BUN) run build --mode "$(ENV)"

preview:
	$(BUN) run preview

run:
	@test -n "$(SCRIPT)" || { echo 'Usage: make run SCRIPT=<package-script> [ARGS="..."]'; exit 2; }
	$(BUN) run "$(SCRIPT)" $(ARGS)

deploy:
	@test -n "$(PAGES_PROJECT)" || { echo 'PAGES_PROJECT is required, for example: make deploy PAGES_PROJECT=tutorpal-dev'; exit 2; }
	$(MAKE) pages-build
	$(BUNX) wrangler pages deploy dist --project-name "$(PAGES_PROJECT)"

do-deploy:
	../scripts/deploy.sh "$(ENV)" frontend
