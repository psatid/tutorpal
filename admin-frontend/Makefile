.DEFAULT_GOAL := help

SHELL := /bin/sh

BUN ?= bun
BUNX ?= bunx
ARGS ?=
PAGES_PROJECT ?=
SCRIPT ?=

.PHONY: help dev build preview run deploy

help:
	@printf '%s\n' \
		'TutorPal admin frontend commands' \
		'  make dev                              Start Vite development server' \
		'  make build                            Type-check and build the app' \
		'  make preview                          Preview the built app' \
		'  make run SCRIPT=<name> [ARGS="..."]   Run a package.json script' \
		'  make deploy PAGES_PROJECT=<name>      Build and deploy to Cloudflare Pages'

dev:
	$(BUN) run dev

build:
	$(BUN) run build

preview:
	$(BUN) run preview

run:
	@test -n "$(SCRIPT)" || { echo 'Usage: make run SCRIPT=<package-script> [ARGS="..."]'; exit 2; }
	$(BUN) run "$(SCRIPT)" $(ARGS)

deploy:
	@test -n "$(PAGES_PROJECT)" || { echo 'PAGES_PROJECT is required, for example: make deploy PAGES_PROJECT=tutorpal-admin'; exit 2; }
	$(MAKE) build
	$(BUNX) wrangler pages deploy dist --project-name "$(PAGES_PROJECT)"
