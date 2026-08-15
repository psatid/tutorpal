.DEFAULT_GOAL := help

SHELL := /bin/sh

ENV ?= dev
APP ?=
COMPONENT ?=
SCRIPT ?=
ARGS ?=
GIT_SHA ?=
PAGES_PROJECT ?=

.PHONY: help dev frontend-dev admin-dev backend-dev build frontend-build admin-build backend-build \
	frontend-run admin-run backend-run script frontend-deploy admin-deploy backend-deploy deploy \
	backend-reminders-deploy \
	migrate docker-build docker-push release do-deploy

help:
	@printf '%s\n' \
		'TutorPal repository commands' \
		'' \
		'Development:' \
		'  make dev                              Start backend, user frontend, and admin frontend' \
		'  make frontend-dev                     Start the user frontend' \
		'  make admin-dev                        Start the admin frontend' \
		'  make backend-dev                      Start the Bun API server' \
		'' \
		'Build and scripts:' \
		'  make build                            Build all three application projects' \
		'  make frontend-run SCRIPT=build        Run a user frontend package script' \
		'  make admin-run SCRIPT=build           Run an admin frontend package script' \
		'  make backend-run SCRIPT=check         Run a backend package script' \
		'  make script SCRIPT=migrate.sh ARGS=dev Run a repository script' \
		'' \
		'Deployment:' \
		'  make backend-build ENV=dev             Bundle-check dev Workers (ENV defaults to dev; prod is also supported)' \
		'  make deploy APP=backend ENV=dev        Deploy dev reminders first, then dev API' \
		'  make deploy APP=backend ENV=prod       Deploy prod reminders first, then prod API (after replacing placeholders)' \
		'  make deploy APP=backend-reminders ENV=dev' \
		'                                       Deploy only the environment reminder Worker' \
		'  make deploy APP=frontend PAGES_PROJECT=<name>' \
		'                                       Deploy the user Cloudflare Pages app' \
		'  make deploy APP=admin-frontend PAGES_PROJECT=<name>' \
		'                                       Deploy the admin Cloudflare Pages app' \
		'  make do-deploy COMPONENT=backend      Deploy through the legacy DigitalOcean script' \
		'' \
		'Operations:' \
		'  make migrate ENV=dev                  Run the database migration script' \
		'  make docker-build                     Build backend images locally' \
		'  make docker-push                      Build and push backend images' \
		'  make release ENV=dev [GIT_SHA=...]    Promote backend images to an environment'

dev:
	+$(MAKE) -j3 frontend-dev admin-dev backend-dev

frontend-dev:
	+$(MAKE) -C frontend dev

admin-dev:
	+$(MAKE) -C admin-frontend dev

backend-dev:
	+$(MAKE) -C backend dev

build:
	+$(MAKE) -j3 frontend-build admin-build backend-build

frontend-build:
	+$(MAKE) -C frontend build

admin-build:
	+$(MAKE) -C admin-frontend build

backend-build:
	+$(MAKE) -C backend build ENV="$(ENV)"

frontend-run:
	+$(MAKE) -C frontend run SCRIPT="$(SCRIPT)" ARGS="$(ARGS)"

admin-run:
	+$(MAKE) -C admin-frontend run SCRIPT="$(SCRIPT)" ARGS="$(ARGS)"

backend-run:
	+$(MAKE) -C backend run SCRIPT="$(SCRIPT)" ARGS="$(ARGS)"

script:
	@test -n "$(SCRIPT)" || { echo 'Usage: make script SCRIPT=<script-name> [ARGS="..."]'; exit 2; }
	./scripts/$(SCRIPT) $(ARGS)

frontend-deploy:
	+$(MAKE) -C frontend deploy PAGES_PROJECT="$(PAGES_PROJECT)" ENV="$(ENV)"

frontend-deploy-dev:
	+$(MAKE) -C frontend deploy PAGES_PROJECT=tutor-portal-dev ENV=dev

admin-deploy:
	+$(MAKE) -C admin-frontend deploy PAGES_PROJECT="$(PAGES_PROJECT) ENV="$(ENV)"

admin-deploy-dev:
	+$(MAKE) -C admin-frontend deploy PAGES_PROJECT=admin-portal-dev ENV=dev

backend-deploy:
	+$(MAKE) -C backend reminders-deploy ENV="$(ENV)"
	+$(MAKE) -C backend deploy ENV="$(ENV)"

backend-api-deploy:
	+$(MAKE) -C backend deploy ENV="$(ENV)"

backend-reminders-deploy:
	+$(MAKE) -C backend reminders-deploy ENV="$(ENV)"

deploy:
	@test -n "$(APP)" || { echo 'Usage: make deploy APP=backend|backend-reminders|frontend|admin-frontend [ENV=dev|prod] [PAGES_PROJECT=<name>]'; exit 2; }
	@case "$(APP)" in \
		backend) $(MAKE) backend-deploy ENV="$(ENV)" ;; \
		backend-reminders) $(MAKE) backend-reminders-deploy ENV="$(ENV)" ;; \
		frontend) $(MAKE) frontend-deploy PAGES_PROJECT="$(PAGES_PROJECT)" ENV="$(ENV)" ;; \
		admin-frontend) $(MAKE) admin-deploy PAGES_PROJECT="$(PAGES_PROJECT)" ;; \
		*) echo "Unknown APP: $(APP)"; exit 2 ;; \
	esac

migrate:
	+$(MAKE) -C backend migrate ENV="$(ENV)"

db-migrate:
	+$(MAKE) -C backend db-migrate

################################################################################
# DEPRECATED
# do not use docker targets. Use `make deploy` instead.
# keeping theme for container deployment and release purposes
################################################################################
docker-build:
	./scripts/build-push.sh

docker-push:
	./scripts/build-push.sh --push

release:
	./scripts/release.sh "$(ENV)" $(GIT_SHA)

do-deploy:
	@test -n "$(COMPONENT)" || { echo 'Usage: make do-deploy COMPONENT=backend|frontend ENV=dev'; exit 2; }
	./scripts/deploy.sh "$(ENV)" "$(COMPONENT)"
