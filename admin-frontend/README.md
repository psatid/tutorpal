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
make build
make deploy PAGES_PROJECT=<project-name>
```

The deployment target requires the real Cloudflare Pages project name and does
not provide a guessed default.

## Local development

From this directory:

```sh
bun install
bun run dev
```

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

Deploy this directory as its own static Pages project:

- Root directory: `admin-frontend`
- Build command: `bun run build`
- Build output directory: `dist`
- `VITE_API_URL`: the public backend origin
- `VITE_USER_APP_URL`: the public user portal origin

The backend must include this Pages origin in `ADMIN_FRONTEND_URL` so Better
Auth cookies, CORS, and trusted origins work across both portals.
