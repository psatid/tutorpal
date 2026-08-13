# TutorPal backend

## Make targets

From this directory, use `make help` to list available commands. Common
targets are:

```sh
make dev
make cf-dev
make check
make test
make deploy
```

The `deploy` target deploys the Cloudflare Worker. The `do-deploy` target is
available for the legacy DigitalOcean App Platform path.

## Cloudflare Worker

`src/cloudflare-worker.ts` is the Cloudflare entrypoint. It creates Prisma and
Better Auth for each HTTP invocation, using the
`HYPERDRIVE_CACHE_DISABLED.connectionString` binding. It defers Prisma
disconnects through the Worker execution context.

The fifteen-minute Cron in `wrangler.jsonc` invokes the same reminder polling
flow as the existing Bun reminder worker. Cron runs may overlap, so delivery
safety continues to depend on the existing PostgreSQL delivery claim, lease
fencing, and LINE retry key rather than Worker-local state.

The Bun and DigitalOcean rollback paths remain:

- `src/index.ts` serves the HTTP API with `bun run dev`.
- `src/worker.ts` starts the existing long-lived reminder interval worker.

### Worker configuration

`wrangler.jsonc` intentionally contains only deploy-safe runtime variables and
placeholder values. Before deployment, replace every `example.com` origin and
the all-zero Hyperdrive ID. The replacement Hyperdrive ID must identify a
PostgreSQL Hyperdrive configuration created with query caching disabled. Do not
add a direct `DATABASE_URL` variable to the Worker: the Hyperdrive binding
supplies the connection string at runtime.

The Worker validates its Hyperdrive binding, origins, and secret values before
creating Prisma or Better Auth. A missing deployment value fails the invocation
instead of falling back to the local development defaults.

Set these runtime variables in `wrangler.jsonc` or through the Cloudflare
dashboard with deployment-specific non-secret values:

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
values or place them in `wrangler.jsonc`:

- `BETTER_AUTH_SECRET`
- `RESEND_API_KEY`
- `LINE_CREDENTIALS_ENCRYPTION_KEY`

Use `bun run cf:check` to bundle-check the Worker and `bun run cf:dev` for
local Worker development. Deployment remains an explicit external operation.

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
