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
make -C apps/backend db-migrate-deploy-dev
make deploy-dev APP=backend
make deploy-dev APP=tutor-portal
make deploy-dev APP=admin-portal
make deploy-dev APP=marketing-frontend
# After replacing production Worker placeholders and identifying Pages projects:
make -C apps/backend db-migrate-deploy-production
make deploy APP=backend
make deploy APP=tutor-portal PAGES_PROJECT=<production-project>
make deploy APP=admin-portal PAGES_PROJECT=<production-project>
make deploy APP=marketing-frontend
```

Each application also has a local Makefile with targets suited to that app:

- [User frontend Makefile](../apps/frontend/Makefile)
- [Admin frontend Makefile](../apps/admin-frontend/Makefile)
- [Marketing frontend Makefile](../apps/marketing-frontend/Makefile)
- [Backend Makefile](../apps/backend/Makefile)

- [Frontend Documentation](frontend/README.md)
- [Shared UI Package](frontend/shared-ui.md)
- [Frontend Domain Model Conventions](frontend/domain-models.md)
- [Astro Marketing Site](../apps/marketing-frontend/README.md)
- [Marketing Design Direction](../apps/marketing-frontend/DESIGN.md)
- [Marketing Verification](../apps/marketing-frontend/VERIFICATION.md)
- [Marketing Image Provenance](marketing-assets/README.md)
- [Cinematic Homepage Exploration Archive](prototypes/README.md)
- [Authenticated Screen Layout](frontend/screen-layout.md)
- [Backend Documentation](backend/README.md)
- [Cloudflare Infrastructure](infrastructure.md)
- [Admin Portal and Controlled User Provisioning](features/admin-portal.md)
- [Agent Team Workflow](agent-team-workflow.md)
- [Feature Implementation History](features/README.md)
- [Schedule Date Navigation Research](research/schedule-date-navigation.md)
- [Video Meeting Integration Research](research/video-meeting-integrations.md)
