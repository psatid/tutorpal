# TutorPal frontend

The tutor and admin portals share the private `@tutorpal/ui` Bun workspace
package. From a clean checkout, install all apps and that package at the
repository root with `make workspace-install` (or
`bun install --frozen-lockfile`) before running commands in this directory.

## Make targets

From this directory, use `make help` to list available commands. Common
targets are:

```sh
make dev
make check
make build
make build-dev
make pages-build
make deploy-dev
make deploy PAGES_PROJECT=<production-project>
```

The development deployment uses the fixed Pages project
`tutorpal-tutor-portal-dev`. Production deployments require the production
Pages project name.

## Cloudflare Pages

Deploy this application as a static Cloudflare Pages site. It does not use
Pages Functions, a Worker runtime, `_worker.js`, or Workers Static Assets.

The current development Pages project uses direct upload. From the repository
root, run `make workspace-install`, then
`make deploy-dev APP=tutor-portal` to build and upload `apps/frontend/dist`.
Production uses `make deploy APP=tutor-portal PAGES_PROJECT=<production-project>`.
To check the build without uploading, run `make frontend-build-dev`.

Set `VITE_API_URL=<BACKEND_API_ORIGIN>` and
`VITE_ADMIN_APP_URL=<ADMIN_PORTAL_ORIGIN>` in the build environment. The Vite
build generates the ignored API client, type-checks with `tsc --noEmit`, and
compiles the linked UI package source into the static output. This project has
no Pages Git build root or build command to configure.

`VITE_API_URL` and `VITE_ADMIN_APP_URL` are compiled into the browser bundle.
They must be public origins and must never contain secrets. The admin origin is
used for impersonation stop/recovery navigation. The `.env.example` file
provides the local placeholder with the same build-time contract.

## Tutor social login

Google and LINE buttons are controlled by the backend's `/v1/config` response;
the frontend does not contain provider credentials. The login screen keeps
email/password as the primary path and shows only the providers explicitly
enabled by the server.

Existing tutors can review linked sign-in methods at `/settings/account`.
Connect LINE there after signing in with password or Google. Messaging
integrations live at `/integrations`; `/integrations/line` manages a tutor's
LINE Official Account Messaging API credentials and remains separate from LINE
sign-in. `/settings/line` redirects to the canonical integration route and
preserves recognized test-recipient callback results.

Provider callback registration, Worker environment variables, and the database
identity migration are documented in
[`../../docs/features/social-login.md`](../../docs/features/social-login.md).

Cloudflare Pages supplies SPA fallback behavior when the output has no
top-level `404.html`, which is the intended Vite output for this application.
It serves `index.html` for unmatched deep links such as `/students/123`; do not
add a catch-all `_redirects` rule, because Pages applies those rules before
static asset responses.

No Pages Wrangler configuration is committed. The Makefile supplies the
development project name to `wrangler pages deploy`; production requires an
explicit `PAGES_PROJECT`.

The legacy DigitalOcean deployment needs a repository-root workspace install
before its portal build. Any external build configuration that installs from
`apps/frontend` alone must be updated to install from the repository root.

## Roll back to DigitalOcean

Keep Cloudflare Pages isolated on its `pages.dev` deployment URL while a custom
domain is migrated. If the production or custom domain needs to be rolled back:

1. Confirm that the existing DigitalOcean static site and its externally
   managed app configuration are healthy. This repository does not contain a
   `.do/frontend-dev.app.yaml` spec; if its build configuration is reused, it
   must install this workspace from the repository root.
2. At the DNS provider, point the affected production or custom-domain records
   back to that existing DigitalOcean static site. Use its already-configured
   DNS target; this repository does not define a replacement target.
3. Verify the restored domain serves the DigitalOcean site at `/` and a client
   route before considering the rollback complete.
4. Leave the Pages deployment in place, without attaching the restored domain,
   so it remains isolated at
   `https://<CLOUDFLARE_PAGES_PROJECT>.pages.dev` for later inspection or a
   subsequent migration attempt.
