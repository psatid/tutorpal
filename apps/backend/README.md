# TutorPal backend

## Make targets

From this directory, use `make help` to list available commands. Common
targets are:

```sh
make dev
make cf-dev
make cf-reminders-dev
make build
make build-dev
make check ENV=dev
make test
make db-migrate-local
make db-migrate-deploy-dev
make db-migrate-deploy-production
make deploy-dev
make deploy
make reminders-deploy-dev
make reminders-deploy
```

`db-migrate` creates and applies a local Prisma migration using `DATABASE_URL`
from the ignored `apps/backend/.env` file. It clears an inherited shell value
before explicitly loading that file; this precedence applies to the
`make db-migrate` and `bun run db:migrate` commands only. `db-migrate-local`
applies committed migrations to the local Compose database. The
`db-migrate-deploy-*` targets use the matching environment file; keep
`.env.prod` local and untracked. From the repository root,
`make db-setup` starts Postgres and applies local migrations.

The backend `deploy` and `deploy-dev` targets deploy the API Worker to
production and dev. The matching `reminders-deploy` targets deploy the
scheduled reminder Worker. From the repository root,
`make deploy-dev APP=backend` deploys the reminder Worker first and then the API
Worker so the cron cutover has no gap. Production commands require the
production configuration placeholders to be replaced. The `do-deploy` target
is available for the legacy DigitalOcean App Platform path.

## Cloudflare Workers

The backend has two independently deployed Cloudflare Workers:

- `src/cloudflare-worker.ts` / `wrangler/dev/wrangler.api.dev.jsonc` — the
  `tutorpal-api-dev` HTTP API, Better Auth, CORS, email, and LINE
  account-linking Worker. Its cron list is explicitly empty so it no longer
  owns scheduled invocations.
- `src/cloudflare-reminder-worker.ts` /
  `wrangler/dev/wrangler.reminders.dev.jsonc` — the
  `tutorpal-reminders-dev` scheduled-only Worker. Its fifteen-minute Cron polls
  reminders and sends LINE messages.

Both Workers bind the same `HYPERDRIVE_CACHE_DISABLED` resource. The reminder
Worker only needs that database binding and the
`LINE_CREDENTIALS_ENCRYPTION_KEY` secret; it does not receive API origins,
Better Auth, Resend, or frontend configuration. Each Worker creates Prisma per
invocation and defers disconnect through the Worker execution context.

Cron runs may overlap, so delivery safety continues to depend on the existing
PostgreSQL delivery claim, lease fencing, and LINE retry key rather than
Worker-local state.

The Bun and DigitalOcean rollback paths remain:

- `src/index.ts` serves the HTTP API with `bun run dev`.
- `src/worker.ts` starts the existing long-lived reminder interval worker.

### Worker configuration and deployment

The explicit environment configs are:

- `wrangler/dev/wrangler.api.dev.jsonc`
- `wrangler/dev/wrangler.reminders.dev.jsonc`
- `wrangler/prod/wrangler.api.prod.jsonc`
- `wrangler/prod/wrangler.reminders.prod.jsonc`

Each API/reminder pair must reference the same PostgreSQL Hyperdrive
configuration with query caching disabled. Do not add a direct `DATABASE_URL`
variable: the Hyperdrive binding supplies the connection string at runtime.
Wrangler loads `.dev.vars` from the selected config directory, so local Worker
secrets belong in `wrangler/dev/.dev.vars` (ignored by Git).

### Grafana logs and traces

Each Worker config declares its own OpenTelemetry Grafana destinations. The API
configs use `grafana-cloud-logs` and `grafana-cloud-traces`; the reminder configs
use `tutorpal-grafana-logs` and `tutorpal-grafana-traces`. Verify that each named
destination exists in Cloudflare under **Observability → Destinations** before
deploying; destination-list access has not independently confirmed those names.
Configure Logs and Traces destinations with Grafana Cloud OTLP `/v1/logs` and
`/v1/traces` endpoints and its `Authorization` header. Keep those credentials in
Cloudflare, not this repository.

The Workers currently sample 100% of logs and traces and persist them in
Cloudflare as well as exporting them to Grafana, matching Chuayjum. Traces include
the request URL and query attributes, so OAuth callback query values may be
present in telemetry. Avoid putting long-lived secrets in URLs and review access
and retention policies for both Grafana and Cloudflare telemetry.

The API Worker validates its Hyperdrive binding, origins, and secrets before
creating Prisma or Better Auth. The reminder Worker validates its Hyperdrive
binding and encryption secret before creating Prisma. Missing deployment values
fail the invocation instead of falling back to local development defaults.

Set these runtime variables in the selected API config or through the
Cloudflare dashboard with deployment-specific non-secret values:

- `CORS_ORIGIN`
- `ADMIN_FRONTEND_URL`
- `BETTER_AUTH_URL`
- `ENVIRONMENT`
- `LOG_LEVEL`
- `RESEND_FROM_EMAIL`
- `LINE_LINK_REDIRECT_URL`
- `FRONTEND_URL`
- `EMAIL_VERIFICATION_CALLBACK_URL`
- `BETA_ENABLED` (defaults to `true`; keeps public registration closed while accounts are created through the admin portal)
- `MARKETING_ORIGIN` (exact marketing origin for beta requests and Turnstile hostname validation)
- `TURNSTILE_SITE_KEY` (optional public widget key; beta requests stay unavailable until all integration settings exist)
- `GOOGLE_CLIENT_ID` (optional; enables Google sign-in when paired with its secret)
- `LINE_LOGIN_CHANNEL_ID` (optional; enables LINE Login when paired with its secret)

Set each of these as a Worker secret before deployment; never commit their
values or place them in a Wrangler config:

- `BETTER_AUTH_SECRET`
- `RESEND_API_KEY`
- `LINE_CREDENTIALS_ENCRYPTION_KEY`
- `GOOGLE_CLIENT_SECRET` (required only when Google sign-in is enabled)
- `LINE_LOGIN_CHANNEL_SECRET` (required only when LINE Login is enabled)
- `TURNSTILE_SECRET_KEY` (optional until beta request setup)
- `DISCORD_BETA_WEBHOOK_URL` (optional until beta request setup; server-only)

Marketing has non-credentialed CORS access only to `/v1/beta/*`; it is not an
authenticated portal or Better Auth trusted origin. Local `MARKETING_ORIGIN`
defaults to `http://localhost:4321`; override it for `127.0.0.1` or another
port. Keep the Discord and Turnstile secrets on the API Worker.

The production API config has the public site key for the separate `TutorPal
Beta Prod` Turnstile widget, restricted to `tutorpal.io`; `BETA_ENABLED` remains
`true`. API version `eefe199d-5b08-472c-aa39-1fbc95c310fb` reports beta requests
available with the production key; the exact marketing origin receives
non-credentialed CORS. A fictitious invalid token returns
`400 TURNSTILE_VERIFICATION_FAILED` before Discord. One user-approved, clearly
labeled fictitious English request completed marketing → managed Turnstile → API
→ confirmed Discord webhook delivery and showed the success notice. The beta
service creates no account or automatic email. Real replay remains unverified.
The API deployment updates the marketing form configuration; it does not require
a marketing rebuild.

Provision `LINE_CREDENTIALS_ENCRYPTION_KEY` on both deployed Workers. The
reminder config declares it as required, but secret values are still managed
separately by Wrangler or the Cloudflare dashboard.

Use these commands from `backend`:

```sh
bun run cf:dev
bun run cf:reminders:dev
bun run check:dev
bun run cf:check:dev
bun run cf:reminders:check:dev
bun run cf:deploy:dev
bun run cf:reminders:deploy:dev

# Production checks use the prod configs.
bun run check:prod
bun run cf:check:prod
bun run cf:reminders:check:prod
```

`bun run cf:reminders:dev` starts Wrangler's local scheduled Worker; use
Wrangler's scheduled-test route to invoke it locally. Deployment remains an
explicit external operation. The existing `cf:check`, `cf:deploy`, and
reminder aliases continue to target `dev`.

The current production Hyperdrive ID is bound in both configs. Before deploying,
run `bun run check:prod:config`; `make deploy`, `make reminders-deploy`, and the
direct production deployment scripts also reject
`REPLACE_WITH_PRODUCTION_HYPERDRIVE_ID` if a placeholder is reintroduced.
Production dry-run checks do not deploy and do not run the deployment guard.

### Production bootstrap

Production Workers are deployed: API version `13fedb76-8b01-498d-8bfb-0f8689835c51`
is attached to `https://api.tutorpal.io` with no Cron, and reminder version
`54dbc024-256b-4445-b26b-09c84ce2d927` runs every fifteen minutes. Both disable
`workers.dev` and previews, share the cache-disabled TLS Hyperdrive
`tutorpal-prod-postgres` (`a46e2a0ffe424e02b9f2132af7fc821c`), and retain their
required secret scopes. The strict-TLS production Supabase database
`db.gdfdugborezajlptbqrz.supabase.co` has all 21 committed migrations applied.
Grafana export delivery, the first Cron invocation, and end-to-end email, admin,
LINE, social, and authenticated frontend validation remain pending. Future deploys
use `make deploy APP=backend` from the repository root; remote secrets are
preserved. Do not reuse the development Hyperdrive.

Live HTTP smoke checks pass: health and configuration return `200`; signup stays
disabled, Google and LINE login are disabled, and beta requests are available.
The app and admin origins receive credentialed CORS while a hostile origin does
not. Unauthenticated admin access and a nonexistent-user sign-in both return
`401`, exercising the deployed authentication database path. Email, browser
admin sessions, LINE delivery, and the first reminder Cron invocation are not
yet end-to-end verified.

1. Configure the ignored `apps/backend/.env.prod` with `DATABASE_URL` set to
   the production direct or session-mode PostgreSQL URI on port 5432 (use
   session mode when the local machine cannot reach the Direct endpoint over
   IPv6). For strict TLS, reference the ignored local Supabase CA file
   `.env.prod.ca.crt`; do not commit certificate paths or credential values.
   Run committed migrations before either Worker:

   ```sh
   cd apps/backend
   bun run db:migrate:deploy:production
   ```

2. The distinct cache-disabled TLS Hyperdrive `tutorpal-prod-postgres` uses the
   Supabase Direct origin `db.gdfdugborezajlptbqrz.supabase.co:5432`, not a
   pooled origin; Hyperdrive owns Worker connection pooling. See Cloudflare's
   [Supabase Hyperdrive guidance](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/supabase/).
   Its ID `a46e2a0ffe424e02b9f2132af7fc821c` is bound in both production configs;
   confirm `bun run check:prod:config` passes before deployment.
3. All required secrets are already remote: the API Worker has
   `RESEND_API_KEY`, `BETTER_AUTH_SECRET`, and
   `LINE_CREDENTIALS_ENCRYPTION_KEY`; the reminder Worker has only the shared
   encryption key. Preserve that encryption key once tenant credentials are
   encrypted, because regenerating it makes stored LINE credentials unreadable.
   From the repository root, run the active deployment path:

   ```sh
   make backend-build && make deploy APP=backend
   ```

   Regular deployment preserves the remote secrets and deploys the reminder
   Worker before the API Worker.

Optional Resend rotation, not deployment setup: from `apps/backend`, run the
following command and paste the key only into Wrangler's hidden prompt. It
immediately releases the current Worker version.

```sh
bunx wrangler secret put RESEND_API_KEY --config wrangler/prod/wrangler.api.prod.jsonc
```

Keep `BETA_ENABLED=true`. Google and LINE Login remain disabled until complete
production credential pairs are supplied; do not add only one side of an OAuth
credential pair.

## Local account provisioning

Public signup is disabled by default. Provision the first administrator from
the backend directory with:

```sh
bun run bootstrap-admin --email admin@example.com --name "TutorPal Admin"
```

Pass the password through `BOOTSTRAP_ADMIN_PASSWORD` when you do not want it
in shell history. The command uses Better Auth's admin creation path, refuses
to overwrite an existing email, and sends a verification email after creation.

The admin frontend runs on `http://localhost:5175` and the user frontend runs
on `http://localhost:5173` by default. Both portals share this backend and
database; only the admin portal can create regular users while
`BETA_ENABLED=true`.

## Tutor social login

Google and LINE Login are optional backend integrations. In beta, only existing,
admin-provisioned tutors can sign in. Turning `BETA_ENABLED` off opens email,
Google, and LINE registration. New social sessions then require verified email;
Google's verified-email claim counts, while LINE users may need to follow a
verification email before signing in again. Existing sessions continue. Set
the complete provider pairs in the selected Worker environment; a missing pair
disables that provider and an incomplete
pair fails configuration validation. Provider secrets belong in Wrangler
secrets or the Git-ignored local `.dev.vars` file, never in the frontend.

The auth-scoped Prisma adapter creates each User with its Tutor relation
atomically. Social User/Tutor/Account creation also uses the adapter's
transaction support, so a failed account creation can be retried without
leaving a user stranded without a Tutor. Existing non-tutor users are not
automatically repaired or granted access. No migration is required.

Register these exact provider callback URLs, using the deployed
`BETTER_AUTH_URL` as the API origin:

- Google: `<BETTER_AUTH_URL>/api/auth/callback/google`
- Google Account enrollment: `<BETTER_AUTH_URL>/v1/auth/social-accounts/google/callback`
- LINE linked-account sign-in: `<BETTER_AUTH_URL>/api/auth/callback/line`
- LINE Account enrollment: `<BETTER_AUTH_URL>/v1/auth/social-accounts/line/callback`

The user portal exposes social actions only when the server's `/v1/config`
response enables them. Account settings uses controlled Google and LINE enrollment
endpoints. Google enrollment starts at authenticated
`POST /v1/auth/social-accounts/google/authorization` and completes at the public,
state-authorized callback above. It requires Google's verified email to match
the initiating active tutor, blocks impersonation, and stores only the provider
identity, preserving password sign-in and the current session. Keep both Google
callback URLs registered. The native `/api/auth/link-social` endpoint remains
disabled. See [social login](../../docs/features/social-login.md) for safeguards.
`/integrations/line` is the canonical LINE Messaging API integration
screen; `/settings/line` redirects there for compatibility. Run
`make db-migrate-deploy-production` before first production enablement so the
provider identity uniqueness migration has been applied.
