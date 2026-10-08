.DEFAULT_GOAL := help

SHELL := /bin/sh

ENV ?= dev
APP ?=
COMPONENT ?=
SCRIPT ?=
ARGS ?=
GIT_SHA ?=
PAGES_PROJECT ?=

ifneq ($(filter deploy deploy-dev,$(MAKECMDGOALS)),)
ifeq ($(origin ENV),command line)
$(error Select the deployment environment with 'deploy' or 'deploy-dev'; omit ENV=...)
endif
endif

.PHONY: help dev build build-dev check test \
	frontend-dev admin-dev marketing-dev backend-dev \
	frontend-build admin-build marketing-build backend-build \
	frontend-build-dev admin-build-dev marketing-build-dev backend-build-dev \
	frontend-check admin-check marketing-check backend-check admin-test marketing-test backend-test \
	frontend-run admin-run marketing-run backend-run script frontend-deploy frontend-deploy-dev \
	admin-deploy admin-deploy-dev marketing-deploy marketing-deploy-dev backend-deploy backend-deploy-dev \
	backend-reminders-deploy backend-reminders-deploy-dev deploy deploy-dev \
	db-up db-down db-logs db-shell db-setup db-migrate docker-build docker-push release do-deploy

help:
	@printf '%s\n' \
		'TutorPal repository commands' \
		'' \
		'Development:' \
		'  make dev                              Set up local Postgres, then start all apps' \
		'  make frontend-dev                     Start the user frontend' \
		'  make admin-dev                        Start the admin frontend' \
		'  make marketing-dev                    Start the public Astro marketing site' \
		'  make backend-dev                      Start the Bun API server' \
		'' \
		'Build, checks, and tests:' \
		'  make build                            Build production artifacts for all apps' \
		'  make build-dev                        Build dev artifacts for apps with dev config' \
		'  make check                            Run checks across all apps' \
		'  make test                             Run backend, admin, and marketing tests' \
		'  make frontend-run SCRIPT=build        Run a user frontend package script' \
		'  make admin-run SCRIPT=build           Run an admin frontend package script' \
		'  make marketing-run SCRIPT=build       Run a marketing frontend package script' \
		'  make backend-run SCRIPT=check         Run a backend package script' \
		'  make script SCRIPT=<name> [ARGS="..."] Run a repository shell script' \
		'' \
		'Database:' \
		'  make db-setup                         Start local Postgres and apply committed migrations' \
		'  make db-up                           Start local Postgres and wait until healthy' \
		'  make db-down                         Stop local Postgres (keep data)' \
		'  make db-logs                         Follow local Postgres logs' \
		'  make db-shell                        Open psql in the local database' \
		'  make -C backend db-migrate-deploy-dev Apply committed migrations to dev' \
		'  make -C backend db-migrate-deploy-production Apply committed migrations to production' \
		'' \
		'Deployment:' \
		'  make backend-build                     Bundle-check production Workers' \
		'  make backend-build-dev                 Bundle-check dev Workers' \
		'  make deploy APP=backend               Deploy prod reminders first, then prod API' \
		'  make deploy-dev APP=backend           Deploy dev reminders first, then dev API' \
		'  make deploy APP=tutor-portal PAGES_PROJECT=<name>' \
		'                                       Deploy the user portal to its production Pages project' \
		'  make deploy-dev APP=tutor-portal      Deploy to tutorpal-tutor-portal-dev' \
		'  make deploy APP=admin-portal PAGES_PROJECT=<name>' \
		'                                       Deploy the admin portal to its production Pages project' \
		'  make deploy-dev APP=admin-portal      Deploy to tutorpal-admin-portal-dev' \
		'  make deploy APP=backend-reminders     Deploy only the production reminder Worker' \
		'  make deploy-dev APP=backend-reminders Deploy only the dev reminder Worker' \
		'  make deploy APP=marketing-frontend    Deploy the production marketing Worker to tutorpal.io' \
		'  make deploy-dev APP=marketing-frontend Deploy the dev marketing Worker to dev.tutorpal.io' \
		'  make do-deploy COMPONENT=backend      Deploy through the legacy DigitalOcean script' \
		'' \
		'Operations:' \
		'  make docker-build                     Build backend images locally' \
		'  make docker-push                      Build and push backend images' \
		'  make release ENV=dev [GIT_SHA=...]    Promote backend images to an environment'

dev: db-setup
	+$(MAKE) -j4 frontend-dev admin-dev marketing-dev backend-dev

frontend-dev:
	+$(MAKE) -C frontend dev

admin-dev:
	+$(MAKE) -C admin-frontend dev

marketing-dev:
	+$(MAKE) -C marketing-frontend dev

backend-dev:
	+$(MAKE) -C backend dev

build:
	+$(MAKE) -j4 frontend-build admin-build marketing-build backend-build

build-dev:
	+$(MAKE) -j4 frontend-build-dev admin-build-dev marketing-build-dev backend-build-dev

check:
	+$(MAKE) -j4 frontend-check admin-check marketing-check backend-check

test:
	+$(MAKE) -j3 admin-test marketing-test backend-test

frontend-build:
	+$(MAKE) -C frontend build

admin-build:
	+$(MAKE) -C admin-frontend build

marketing-build:
	+$(MAKE) -C marketing-frontend build

backend-build:
	+$(MAKE) -C backend build

frontend-build-dev:
	+$(MAKE) -C frontend build-dev

admin-build-dev:
	+$(MAKE) -C admin-frontend build-dev

marketing-build-dev:
	+$(MAKE) -C marketing-frontend build-dev

backend-build-dev:
	+$(MAKE) -C backend build-dev

frontend-check:
	+$(MAKE) -C frontend check

admin-check:
	+$(MAKE) -C admin-frontend check

marketing-check:
	+$(MAKE) -C marketing-frontend check

backend-check:
	+$(MAKE) -C backend check ENV=dev

admin-test:
	+$(MAKE) -C admin-frontend test

marketing-test:
	+$(MAKE) -C marketing-frontend test

backend-test:
	+$(MAKE) -C backend test

frontend-run:
	+$(MAKE) -C frontend run SCRIPT="$(SCRIPT)" ARGS="$(ARGS)"

admin-run:
	+$(MAKE) -C admin-frontend run SCRIPT="$(SCRIPT)" ARGS="$(ARGS)"

marketing-run:
	+$(MAKE) -C marketing-frontend run SCRIPT="$(SCRIPT)" ARGS="$(ARGS)"

backend-run:
	+$(MAKE) -C backend run SCRIPT="$(SCRIPT)" ARGS="$(ARGS)"

script:
	@test -n "$(SCRIPT)" || { echo 'Usage: make script SCRIPT=<script-name> [ARGS="..."]'; exit 2; }
	./scripts/$(SCRIPT) $(ARGS)

frontend-deploy:
	+$(MAKE) -C frontend deploy PAGES_PROJECT="$(PAGES_PROJECT)"

frontend-deploy-dev:
	+$(MAKE) -C frontend deploy-dev

admin-deploy:
	+$(MAKE) -C admin-frontend deploy PAGES_PROJECT="$(PAGES_PROJECT)"

admin-deploy-dev:
	+$(MAKE) -C admin-frontend deploy-dev

marketing-deploy:
	+$(MAKE) -C marketing-frontend deploy

marketing-deploy-dev:
	+$(MAKE) -C marketing-frontend deploy-dev

backend-deploy:
	+$(MAKE) -C backend reminders-deploy
	+$(MAKE) -C backend deploy

backend-deploy-dev:
	+$(MAKE) -C backend reminders-deploy-dev
	+$(MAKE) -C backend deploy-dev

backend-reminders-deploy:
	+$(MAKE) -C backend reminders-deploy

backend-reminders-deploy-dev:
	+$(MAKE) -C backend reminders-deploy-dev

deploy:
	@test -n "$(APP)" || { echo 'APP must be backend, backend-reminders, tutor-portal, admin-portal, or marketing-frontend.'; exit 2; }
	@case "$(APP)" in \
		backend) $(MAKE) backend-deploy ;; \
		backend-reminders) $(MAKE) backend-reminders-deploy ;; \
		tutor-portal|frontend) $(MAKE) frontend-deploy PAGES_PROJECT="$(PAGES_PROJECT)" ;; \
		admin-portal|admin-frontend) $(MAKE) admin-deploy PAGES_PROJECT="$(PAGES_PROJECT)" ;; \
		marketing-frontend) $(MAKE) marketing-deploy ;; \
		*) echo "APP must be backend, backend-reminders, tutor-portal, admin-portal, or marketing-frontend."; exit 2 ;; \
	esac

deploy-dev:
	@test -n "$(APP)" || { echo 'APP must be backend, backend-reminders, tutor-portal, admin-portal, or marketing-frontend.'; exit 2; }
	@case "$(APP)" in \
		backend) $(MAKE) backend-deploy-dev ;; \
		backend-reminders) $(MAKE) backend-reminders-deploy-dev ;; \
		tutor-portal|frontend) $(MAKE) frontend-deploy-dev ;; \
		admin-portal|admin-frontend) $(MAKE) admin-deploy-dev ;; \
		marketing-frontend) $(MAKE) marketing-deploy-dev ;; \
		*) echo "APP must be backend, backend-reminders, tutor-portal, admin-portal, or marketing-frontend."; exit 2 ;; \
	esac

db-up:
	docker compose up -d --wait postgres

db-down:
	docker compose down

db-logs:
	docker compose logs -f postgres

db-shell:
	docker compose exec postgres psql -U postgres -d tutorpal_db

db-setup: db-up
	+$(MAKE) -C backend db-migrate-local

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
