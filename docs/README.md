# TutorPal Documentation

## Repository commands

The root [Makefile](../Makefile) is the common entrypoint for local development
and operations. Run `make help` to see all targets. Common commands include:

```sh
make dev
make build
make build-dev
make check
make test
make db-setup
make -C backend db-migrate-deploy-dev
make deploy-dev APP=backend
make deploy-dev APP=tutor-portal
make deploy-dev APP=admin-portal
make deploy-dev APP=marketing-frontend
# After replacing production Worker placeholders and configuring Pages:
make -C backend db-migrate-deploy-production
make deploy APP=backend
make deploy APP=tutor-portal PAGES_PROJECT=<production-project>
make deploy APP=admin-portal PAGES_PROJECT=<production-project>
make deploy APP=marketing-frontend
```

Each application also has a local Makefile with targets suited to that app:

- [User frontend Makefile](../frontend/Makefile)
- [Admin frontend Makefile](../admin-frontend/Makefile)
- [Marketing frontend Makefile](../marketing-frontend/Makefile)
- [Backend Makefile](../backend/Makefile)

- [Frontend Documentation](frontend/README.md)
- [Astro Marketing Site](../marketing-frontend/README.md)
- [Marketing Design Direction](../marketing-frontend/DESIGN.md)
- [Marketing Verification](../marketing-frontend/VERIFICATION.md)
- [Marketing Image Provenance](marketing-assets/README.md)
- [Cinematic Homepage Exploration Archive](prototypes/README.md)
- [Authenticated Screen Layout](frontend/screen-layout.md)
- [Backend Documentation](backend/README.md)
- [Cloudflare Infrastructure](infrastructure.md)
- [Admin Portal and Controlled User Provisioning](features/admin-portal.md)
- [Agent Team Workflow](agent-team-workflow.md)
- [Feature Implementation History](features/README.md)
