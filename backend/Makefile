.DEFAULT_GOAL := help

SHELL := /bin/sh

BUN ?= bun
BUNX ?= bunx
ARGS ?=
ENV ?= dev
SCRIPT ?=

.PHONY: help validate-env dev-only prod-config-ready dev cf-dev cf-reminders-dev build build-dev cf-check cf-reminders-check check test run db-generate db-migrate db-migrate-prod db-migrate-deploy db-migrate-deploy-dev db-migrate-deploy-production db-migrate-local db-studio bootstrap-admin deploy deploy-dev reminders-deploy reminders-deploy-dev do-deploy

help:
	@printf '%s\n' \
		'TutorPal backend commands' \
		'  make dev                              Start the Bun API server' \
		'  make cf-dev                           Start the API Cloudflare Worker locally' \
		'  make cf-reminders-dev                 Start the reminder Cloudflare Worker locally' \
		'  make build                            Bundle-check both production Cloudflare Workers' \
		'  make build-dev                         Bundle-check both dev Cloudflare Workers' \
		'  make check [ENV=dev|prod]              Run Biome and environment bundle checks (default: dev)' \
		'  make test                             Run backend tests' \
		'  make run SCRIPT=<name> [ARGS="..."]   Run a package.json script' \
		'  make db-migrate-local                  Apply committed migrations to local Compose Postgres' \
		'  make db-migrate                        Create/apply a local Prisma migration' \
		'  make db-migrate-deploy-dev             Apply committed migrations from .env.dev' \
		'  make db-migrate-deploy-production      Apply committed migrations from .env.production' \
		'  make deploy                            Deploy the production API Worker' \
		'  make deploy-dev                        Deploy the dev API Worker' \
		'  make reminders-deploy                  Deploy the production reminder Worker' \
		'  make reminders-deploy-dev              Deploy the dev reminder Worker' \
		'  make do-deploy ENV=dev                Use the legacy DigitalOcean deploy script'

validate-env:
	@if [ "$(ENV)" != "dev" ] && [ "$(ENV)" != "prod" ]; then \
		echo "Invalid ENV: $(ENV). Expected dev or prod."; \
		exit 2; \
	fi

dev-only: validate-env
	@test "$(ENV)" = "dev" || { echo "This local development target only supports ENV=dev."; exit 2; }

prod-config-ready:
	@if rg -n 'REPLACE_WITH_PRODUCTION_HYPERDRIVE_ID|\.invalid' wrangler/prod/wrangler.api.prod.jsonc wrangler/prod/wrangler.reminders.prod.jsonc; then \
		echo 'Production deployment is blocked: replace every production Hyperdrive and .invalid placeholder first.'; \
		exit 2; \
	fi

dev: dev-only
	$(BUN) run dev

cf-dev: dev-only
	$(BUN) run cf:dev

cf-reminders-dev: dev-only
	$(BUN) run cf:reminders:dev

build:
	$(MAKE) cf-check ENV=prod
	$(MAKE) cf-reminders-check ENV=prod

build-dev:
	$(MAKE) cf-check ENV=dev
	$(MAKE) cf-reminders-check ENV=dev

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

db-migrate-deploy:
	$(BUN) run db:migrate:deploy

db-migrate-deploy-dev:
	$(BUN) run db:migrate:deploy:dev

db-migrate-deploy-production:
	$(BUN) run db:migrate:deploy:production

# Always target the local Compose database, even when an env file points elsewhere.
db-migrate-local:
	DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5444/tutorpal_db $(BUN) run db:migrate:deploy

db-studio:
	$(BUN) run db:studio

bootstrap-admin:
	$(BUN) run bootstrap-admin $(ARGS)

deploy: prod-config-ready
	$(BUN) run cf:deploy:prod

deploy-dev:
	$(BUN) run cf:deploy:dev

reminders-deploy: prod-config-ready
	$(BUN) run cf:reminders:deploy:prod

reminders-deploy-dev:
	$(BUN) run cf:reminders:deploy:dev

do-deploy:
	../scripts/deploy.sh "$(ENV)" backend
