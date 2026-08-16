# TutorPal Documentation

## Repository commands

The root [Makefile](../Makefile) is the common entrypoint for local development
and operations. Run `make help` to see all targets. Common commands include:

```sh
make dev
make build
make deploy APP=backend ENV=dev
# After replacing the production Worker config placeholders:
make deploy APP=backend ENV=prod
make deploy APP=frontend PAGES_PROJECT=<project-name>
make deploy APP=admin-frontend PAGES_PROJECT=<project-name>
make deploy APP=marketing-frontend
make migrate ENV=dev
```

Each application also has a local Makefile with the same core targets:

- [User frontend Makefile](../frontend/Makefile)
- [Admin frontend Makefile](../admin-frontend/Makefile)
- [Marketing frontend Makefile](../marketing-frontend/Makefile)
- [Backend Makefile](../backend/Makefile)

- [Frontend Documentation](frontend/README.md)
- [Authenticated Screen Layout](frontend/screen-layout.md)
- [Backend Documentation](backend/README.md)
- [Cloudflare Infrastructure](infrastructure.md)
- [Admin Portal and Controlled User Provisioning](features/admin-portal.md)
- [Agent Team Workflow](agent-team-workflow.md)
- [Feature Implementation History](features/README.md)
