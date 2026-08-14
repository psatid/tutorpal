.DEFAULT_GOAL := help

SHELL := /bin/sh

BUN ?= bun
BUNX ?= bunx
ARGS ?=
ENV ?= dev
SCRIPT ?=

.PHONY: help validate-env dev-only prod-config-ready dev cf-dev cf-reminders-dev build cf-check cf-reminders-check check test run db-generate db-migrate db-migrate-prod db-studio bootstrap-admin migrate deploy reminders-deploy do-deploy

help:
	@printf '%s\n' \
		'TutorPal backend commands' \
		'  make dev                              Start the Bun API server' \
		'  make cf-dev                           Start the API Cloudflare Worker locally' \
		'  make cf-reminders-dev                 Start the reminder Cloudflare Worker locally' \
		'  make build [ENV=dev|prod]              Bundle-check both Cloudflare Workers (default: dev)' \
		'  make check [ENV=dev|prod]              Run Biome and environment bundle checks (default: dev)' \
		'  make test                             Run backend tests' \
		'  make run SCRIPT=<name> [ARGS="..."]   Run a package.json script' \
		'  make migrate ENV=dev                  Run the repository migration script' \
		'  make deploy [ENV=dev|prod]             Deploy the API Cloudflare Worker (default: dev)' \
		'  make reminders-deploy [ENV=dev|prod]   Deploy the reminder Cloudflare Worker (default: dev)' \
		'  make do-deploy ENV=dev                Use the legacy DigitalOcean deploy script'

validate-env:
	@if [ "$(ENV)" != "dev" ] && [ "$(ENV)" != "prod" ]; then \
		echo "Invalid ENV: $(ENV). Expected dev or prod."; \
		exit 2; \
	fi

dev-only: validate-env
	@test "$(ENV)" = "dev" || { echo "This local development target only supports ENV=dev."; exit 2; }

prod-config-ready: validate-env
	@if [ "$(ENV)" = "prod" ] && rg -n 'REPLACE_WITH_PRODUCTION_HYPERDRIVE_ID|\.invalid' wrangler/prod/wrangler.api.prod.jsonc wrangler/prod/wrangler.reminders.prod.jsonc; then \
		echo 'Production deployment is blocked: replace every production Hyperdrive and .invalid placeholder first.'; \
		exit 2; \
	fi

dev: dev-only
	$(BUN) run dev

cf-dev: dev-only
	$(BUN) run cf:dev

cf-reminders-dev: dev-only
	$(BUN) run cf:reminders:dev

build: cf-check cf-reminders-check

cf-check: validate-env
	$(BUN) run cf:check:$(ENV)

cf-reminders-check: validate-env
	$(BUN) run cf:reminders:check:$(ENV)

check: validate-env
	$(BUN) run check:$(ENV)

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

deploy: prod-config-ready
	$(BUN) run cf:deploy:$(ENV)

reminders-deploy: prod-config-ready
	$(BUN) run cf:reminders:deploy:$(ENV)

do-deploy:
	../scripts/deploy.sh "$(ENV)" backend
