.DEFAULT_GOAL := help

SHELL := /bin/sh

BUN ?= bun
BUNX ?= bunx
ARGS ?=
ENV ?= dev
SCRIPT ?=

.PHONY: help dev cf-dev build cf-check check test run db-generate db-migrate db-migrate-prod db-studio bootstrap-admin migrate deploy do-deploy

help:
	@printf '%s\n' \
		'TutorPal backend commands' \
		'  make dev                              Start the Bun API server' \
		'  make cf-dev                           Start the Cloudflare Worker locally' \
		'  make build                            Bundle-check the Worker' \
		'  make check                            Run Biome checks' \
		'  make test                             Run backend tests' \
		'  make run SCRIPT=<name> [ARGS="..."]   Run a package.json script' \
		'  make migrate ENV=dev                  Run the repository migration script' \
		'  make deploy                           Deploy the Cloudflare Worker' \
		'  make do-deploy ENV=dev                Use the legacy DigitalOcean deploy script'

dev:
	$(BUN) run dev

cf-dev:
	$(BUN) run cf:dev

build: cf-check

cf-check:
	$(BUN) run cf:check

check:
	$(BUN) run check

test:
	$(BUN) test

run:
	@test -n "$(SCRIPT)" || { echo 'Usage: make run SCRIPT=<package-script> [ARGS="..."]'; exit 2; }
	$(BUN) run "$(SCRIPT)" $(ARGS)

db-generate:
	$(BUN) run db:generate

db-migrate:
	$(BUN) run db:migrate

db-migrate-prod:
	$(BUN) run db:migrate:prod

db-studio:
	$(BUN) run db:studio

bootstrap-admin:
	$(BUN) run bootstrap-admin $(ARGS)

migrate:
	../scripts/migrate.sh "$(ENV)"

deploy:
	$(BUNX) wrangler deploy --keep-vars

do-deploy:
	../scripts/deploy.sh "$(ENV)" backend
