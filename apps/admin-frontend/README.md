# TutorPal Admin

TutorPal Admin is the restricted administration portal for managing regular
user accounts. It shares the backend and Better Auth instance with the user
portal, but intentionally exposes only an admin login and one protected User
management workspace at `/`.

## User management scope

Administrators can search and filter regular users, create accounts, edit name
and email, set a new password, resend verification email, and deactivate or
reactivate accounts. Deactivation revokes active sessions and is reversible.
Changing an email resets verification and sends a new verification link.

The portal never exposes admin accounts, role editing, or permanent deletion.
The backend enforces the regular-user-only boundary even when a request is
crafted outside the UI. Public signup remains disabled by default, so regular
user creation belongs in this portal.

## Make targets

From this directory, use `make help` to list available commands. Common
targets are:

```sh
make dev
make generate-api
make check
make build
make build-dev
make build-production
make test
make deploy-dev
make deploy PAGES_PROJECT=tutorpal-admin-portal-prod
```

The development deployment uses the fixed Pages project
`tutorpal-admin-portal-dev`. Production deployments require the production
Pages project name, `tutorpal-admin-portal-prod`.

## Local development

From the repository root, install all apps and the shared UI package,
then start the admin app:

```sh
make workspace-install
make -C apps/admin-frontend dev
```

`bun run dev` and `bun run build` generate the ignored Orval client first, so
a clean checkout does not require `src/api/generated/` to exist. Run
`bun run generate:api` directly when refreshing the client without starting or
building the app. The command reads `../backend/openapi/openapi.json`.

The admin app runs on `http://localhost:5175`. Set `VITE_API_URL` to the
backend origin (normally `http://localhost:5174`) and `VITE_USER_APP_URL` to
the user portal origin (normally `http://localhost:5173`) in `.env`.

The first administrator is provisioned server-side with the backend
`bootstrap-admin` command. After signing in, administrators can manage regular
users from the protected User management screen. New users receive a
verification email; public signup remains disabled by default. The backend's
`EMAIL_VERIFICATION_CALLBACK_URL` controls verification links sent by user
management; `VITE_USER_APP_URL` is used for the admin sign-in callback.

The workspace uses the existing backend configuration and Better Auth fields;
no new environment variables or database migration are required.

## Cloudflare Pages

The development Pages project uses direct upload. From the repository root,
run `make workspace-install`, then `make deploy-dev APP=admin-portal` to build
and upload `apps/admin-frontend/dist`. Production uses
`make deploy APP=admin-portal PAGES_PROJECT=tutorpal-admin-portal-prod`.
To check the production build without uploading, run
`make -C apps/admin-frontend build-production`.
To check the development build without uploading, run `make admin-build-dev`.

`make build-production` and `make deploy` build with
`VITE_API_URL=https://api.tutorpal.io` and
`VITE_USER_APP_URL=https://app.tutorpal.io`. These inline values take
precedence over exported or local `.env` values. The generic `make build`
remains for local/custom configurations. The build generates the API client,
type-checks with `tsc --noEmit`, and compiles the linked `@tutorpal/ui` source
into the static output. The project has no Pages Git build root or build command
to configure.

All `VITE_*` values are compiled into the browser bundle. They must be public
origins and must never contain secrets.

The backend must include this Pages origin in `ADMIN_FRONTEND_URL` so Better
Auth cookies, CORS, and trusted origins work across both portals.
