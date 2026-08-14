# TutorPal backend

## Make targets

From this directory, use `make help` to list available commands. Common
targets are:

```sh
make dev
make cf-dev
make cf-reminders-dev
make check ENV=dev
make test
make deploy ENV=dev
make reminders-deploy ENV=dev
```

The `deploy` target deploys the API Worker, while `reminders-deploy` deploys
the scheduled reminder Worker. From the repository root,
`make deploy APP=backend ENV=dev` deploys the reminder Worker first and then
the API Worker so the cron cutover has no gap. `ENV` defaults to `dev`; use
`ENV=prod` only after replacing the production configuration placeholders. The
`do-deploy` target is available for the legacy DigitalOcean App Platform path.

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
- `PUBLIC_SIGNUP_ENABLED` (`false` keeps account creation in the admin portal)

Set each of these as a Worker secret before deployment; never commit their
values or place them in a Wrangler config:

- `BETTER_AUTH_SECRET`
- `RESEND_API_KEY`
- `LINE_CREDENTIALS_ENCRYPTION_KEY`

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

Before any production deployment, replace every
`REPLACE_WITH_PRODUCTION_HYPERDRIVE_ID` and `.invalid` value in both production
configs and provision the production Worker secrets. `make deploy ENV=prod`
and `make reminders-deploy ENV=prod` refuse to run while either placeholder is
present. The direct `bun run cf:deploy:prod` and
`bun run cf:reminders:deploy:prod` scripts run the same placeholder guard before
Wrangler. Production dry-run checks remain usable with placeholders; they do
not deploy and do not run the deployment guard.

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
`PUBLIC_SIGNUP_ENABLED=false`.
