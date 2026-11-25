# TutorPal Documentation

## Repository commands

The root [Makefile](../Makefile) is the common entrypoint for local development
and operations. Run `make help` to see all targets.

Run `make workspace-install` once from the repository root after a clean
checkout or dependency change. It uses the root `bun.lock` to link
`apps/frontend`, `apps/admin-frontend`, `apps/backend`,
`apps/marketing-frontend`, and `packages/ui` in one Bun workspace.

Common commands include:

```sh
make workspace-install
make dev
make build
make build-dev
make check
make test
make db-setup
make db-migrate-local
make db-migrate-deploy-dev
make deploy-dev APP=backend
make deploy-dev APP=tutor-portal
make deploy-dev APP=admin-portal
make deploy-dev APP=marketing-frontend
# Production (requires provisioned Cloudflare resources and credentials):
make db-migrate-deploy-production
make deploy APP=backend
make deploy APP=tutor-portal PAGES_PROJECT=tutorpal-tutor-portal-prod
make deploy APP=admin-portal PAGES_PROJECT=tutorpal-admin-portal-prod
make deploy APP=marketing-frontend
```

For database changes, `make db-migrate` runs Prisma `migrate dev` to create
and apply migration files during development. It clears an inherited shell
`DATABASE_URL` and explicitly loads the one from the ignored
`apps/backend/.env` file; this precedence applies only to `make db-migrate` and
`bun run db:migrate`. Point that URL at your development database. Prisma may
prompt for a reset if it detects schema drift or conflicting migration history.

To apply existing committed migrations, use `make db-migrate-local`,
`make db-migrate-deploy-dev`, or `make db-migrate-deploy-production`. These all
run Prisma `migrate deploy`; the environment suffix selects the database, not
the Prisma workflow. The local target forces the Compose database at
`127.0.0.1:5444/tutorpal_db` and requires it to be running. `make db-setup`
starts it and applies migrations in one command. See
[Prisma's migration workflows](https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/development-and-production).

Each application also has a local Makefile with targets suited to that app:

- [User frontend Makefile](../apps/frontend/Makefile)
- [Admin frontend Makefile](../apps/admin-frontend/Makefile)
- [Marketing frontend Makefile](../apps/marketing-frontend/Makefile)
- [Backend Makefile](../apps/backend/Makefile)

The two portal production deploy targets run `build-production`, which injects
the public production API and portal origins before Vite builds. To build those
artifacts without uploading, run `make -C apps/frontend build-production` or
`make -C apps/admin-frontend build-production`. Ordinary `build` and development
targets retain their existing environment selection.

- [Frontend Documentation](frontend/README.md)
- [Shared UI Package](frontend/shared-ui.md)
- [Frontend Domain Model Conventions](frontend/domain-models.md)
- [Astro Marketing Site](../apps/marketing-frontend/README.md)
- [Marketing Design Direction](../apps/marketing-frontend/DESIGN.md)
- [Marketing Verification](../apps/marketing-frontend/VERIFICATION.md)
- [Marketing Image Provenance](marketing-assets/README.md)
- [TutorPal Logo](brand/logo.md)
- [Cinematic Homepage Exploration Archive](prototypes/README.md)
- [Authenticated Screen Layout](frontend/screen-layout.md)
- [Backend Documentation](backend/README.md)
- [Cloudflare Infrastructure](infrastructure.md)
- [Admin Portal, Beta Access, and Controlled User Provisioning](features/admin-portal.md)
- [Agent Team Workflow](agent-team-workflow.md)
- [Feature Implementation History](features/README.md)
- [Schedule Date Navigation Research](research/schedule-date-navigation.md)
- [Video Meeting Integration Research](research/video-meeting-integrations.md)
