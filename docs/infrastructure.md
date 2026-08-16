# TutorPal Cloudflare Infrastructure

This document is the source-of-truth overview for the TutorPal application
running on Cloudflare. The application is split into a static frontend on
Cloudflare Pages and a stateful API/runtime on Cloudflare Workers. PostgreSQL
and the external messaging and email providers remain managed services that
the Worker accesses through their supported integrations.

The current environment documented here is <code>dev</code>:

- Web application: <code>https://dev.app.tutorpal.io</code>
- API: <code>https://dev.api.tutorpal.io</code>
- Cloudflare Pages project: <code>tutorpal-dev</code>
- Cloudflare API Worker: <code>tutorpal-api-dev</code>
- Cloudflare reminder Worker: <code>tutorpal-reminders-dev</code>
- Cloudflare DNS zone: <code>tutorpal.io</code>

The public TutorPal marketing site is a separate TanStack Start SSR Worker.
Production routes the apex domain <code>tutorpal.io</code> to that Worker; it
does not share the authenticated Pages app or its signup behavior.

## Architecture overview

~~~mermaid
flowchart LR
    browser["User browser"]

    subgraph cf["Cloudflare"]
        dns["DNS + TLS<br/>Zone: tutorpal.io"]
        pages["Pages<br/>User Vite/React SPA<br/>dev.app.tutorpal.io"]
        marketingWorker["Worker: tutorpal-marketing<br/>TanStack Start SSR<br/>tutorpal.io"]
        adminPages["Pages<br/>Admin Vite/React SPA<br/>admin origin"]
        apiWorker["Worker: tutorpal-api-dev<br/>Hono API + Better Auth<br/>dev.api.tutorpal.io"]
        reminderWorker["Worker: tutorpal-reminders-dev<br/>Scheduled reminders"]
        cron["Cron Trigger<br/>*/15 * * * * UTC"]
        hyperdrive["Hyperdrive<br/>cache disabled<br/>HYPERDRIVE_CACHE_DISABLED"]
    end

    subgraph external["External services"]
        postgres[("Supabase PostgreSQL")]
        resend["Resend<br/>verification + reset email"]
        line["LINE Login + Messaging API"]
    end

    browser -->|"HTTPS: web app"| dns
    dns -->|"tutorpal.io"| marketingWorker
    dns -->|"dev.app.tutorpal.io"| pages
    dns -->|"ADMIN_FRONTEND_URL"| adminPages
    dns -->|"dev.api.tutorpal.io"| apiWorker
    browser -->|"API + auth requests<br/>credentials included"| apiWorker
    cron -->|"scheduled()"| reminderWorker
    apiWorker -->|"Prisma + Better Auth"| hyperdrive
    reminderWorker -->|"Prisma + delivery claims"| hyperdrive
    hyperdrive -->|"PostgreSQL connection"| postgres
    apiWorker -->|"verification/reset messages"| resend
    apiWorker -->|"OAuth + account-link messages"| line
    reminderWorker -->|"push messages"| line
    line -->|"OAuth callback"| apiWorker
~~~

Cloudflare DNS routes the two public application hostnames. Pages serves only
the compiled SPA and its deep-link fallback. The browser uses the public API
origin compiled into <code>VITE_API_URL</code>; it never connects directly to
PostgreSQL. The API Worker creates the Prisma and Better Auth runtime for each
request, while the reminder Worker creates its own Prisma runtime for scheduled
polling. Both use Hyperdrive for database access.

## Cloudflare resource inventory

| Resource | Current configuration | Responsibility |
| --- | --- | --- |
| DNS zone | <code>tutorpal.io</code> | Authoritative DNS, proxying, and TLS for application hostnames |
| Pages project | <code>tutorpal-dev</code> | Static frontend deployment from <code>frontend/dist</code> |
| Marketing Worker | <code>tutorpal-marketing</code> | TanStack Start SSR marketing application and beta interest endpoint |
| Marketing Worker custom domain | <code>tutorpal.io</code> | Apex public marketing origin attached through a Worker Custom Domain |
| Pages custom domain | <code>dev.app.tutorpal.io</code> | Public web application origin |
| Admin Pages project | Separate Pages project from <code>admin-frontend</code> | Restricted admin portal; its public origin is configured as <code>ADMIN_FRONTEND_URL</code> |
| API Worker | <code>tutorpal-api-dev</code> | Hono API, Better Auth, email, and LINE account linking |
| Reminder Worker | <code>tutorpal-reminders-dev</code> | Scheduled reminder discovery, claiming, and LINE delivery; no public route |
| Worker custom domain | <code>dev.api.tutorpal.io</code> | Public API and authentication origin attached to the API Worker |
| API Worker development URL | <code>tutorpal-api-dev.psatid32.workers.dev</code> | Cloudflare-provided API endpoint for operational testing |
| Hyperdrive binding | <code>HYPERDRIVE_CACHE_DISABLED</code> | Same cache-disabled database connection bound to both Workers |
| Cron Trigger | <code>*/15 * * * *</code> UTC | Invokes the reminder Worker at minutes <code>00</code>, <code>15</code>, <code>30</code>, and <code>45</code> of every hour |

The custom domains are the application origins. The <code>pages.dev</code> and
<code>workers.dev</code> URLs remain useful for deployment checks, but
application configuration should use the custom domains so that browser
origins, cookies, email links, and LINE OAuth callbacks stay stable.

## DNS and domain routing

Cloudflare manages the <code>tutorpal.io</code> zone and the custom domain
associations:

- <code>dev.app.tutorpal.io</code> is attached to the <code>tutorpal-dev</code>
  Pages project. Its Pages deployment target is
  <code>tutorpal-dev.pages.dev</code>.
- <code>dev.api.tutorpal.io</code> is attached to the
  <code>tutorpal-api-dev</code> Worker through a Worker Custom Domain.
- <code>tutorpal.io</code> is attached to the <code>tutorpal-marketing</code>
  Worker through a Worker Custom Domain. Configure the apex as a Worker Custom
  Domain; do not point it at the authenticated Pages application or a
  <code>workers.dev</code> CNAME.

Worker Custom Domains create the required Cloudflare DNS and certificate
configuration. Do not replace the Worker Custom Domain with a regular CNAME to
the <code>workers.dev</code> hostname. See the
[Cloudflare Workers Custom Domains documentation](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).

Pages custom-domain configuration is managed in the Pages project. See the
[Cloudflare Pages custom domains documentation](https://developers.cloudflare.com/pages/configuration/custom-domains/).

## Frontend infrastructure

The frontend is a static Vite/React SPA:

- Source directory: <code>frontend</code>
- Build output: <code>frontend/dist</code>
- API origin: build-time <code>VITE_API_URL</code>
- Routing: Pages serves <code>index.html</code> for TanStack Router deep links
- Runtime backend: the Worker at <code>https://dev.api.tutorpal.io</code>
- Deployment model: build locally and upload the generated <code>dist</code>
  directory

The frontend does not use Pages Functions, a Pages <code>_worker.js</code>
entrypoint, or Workers Static Assets. A direct upload deployment can be
performed with:

~~~bash
cd frontend
export VITE_API_URL="https://dev.api.tutorpal.io"
bun run generate:api
bun run build --mode dev
bunx wrangler pages deploy dist --project-name tutorpal-dev
~~~

The API URL is public because it is compiled into the browser bundle. Never
put a secret in a <code>VITE_*</code> variable.

The admin portal is a separate static Pages application from
<code>admin-frontend</code>. Locally it runs on <code>http://localhost:5175</code>
and uses <code>VITE_API_URL</code> plus <code>VITE_USER_APP_URL</code>. Its route
surface contains only the admin login and one protected User management
workspace. The frontend checks for an authenticated <code>admin</code> role for
presentation, while the backend requires the admin session and enforces the
exact <code>role: "user"</code> target scope for every custom management
operation. Admin accounts cannot be listed or changed through the portal.

The workspace supports list/search/status filtering/pagination, create, name or
email updates, password reset, verification resend, and reversible
deactivation/reactivation. Permanent deletion and role management are not
available. Deactivation and password reset revoke existing sessions; changing
an email resets verification and sends a new verification link.

## Marketing Worker and beta interest flow

The public marketing application lives in <code>marketing-frontend</code> and
is a Cloudflare Worker using TanStack Start full-document SSR. Its route surface
is <code>/</code>, <code>/privacy</code>, <code>/robots.txt</code>,
<code>/sitemap.xml</code>, and same-origin <code>POST /api/beta-interest</code>.
Deploy it with <code>make marketing-build</code> followed by
<code>make deploy APP=marketing-frontend</code>.

Set <code>PUBLIC_SITE_URL</code> to the canonical marketing origin. Optional
public variables are <code>PUBLIC_PORTAL_URL</code> and
<code>PUBLIC_TURNSTILE_SITE_KEY</code>; provide them to the Worker build because
they are used by the SSR/client-rendered public UI. Set <code>DISCORD_WEBHOOK_URL</code> and
<code>TURNSTILE_SECRET_KEY</code> as Worker secrets, and bind
<code>BETA_RATE_LIMIT_KV</code> to a dedicated KV namespace. The Worker returns
a clear 502 configuration error and never reports a successful submission when
any required integration is absent.

The beta endpoint validates name, email, subject, consent, and the
Turnstile token; verifies Turnstile server-side; and forwards only the
submitted lead details to the configured Discord webhook. Its KV-backed
windows target five attempts per IP per hour and one successful normalized
email per 24 hours. Cloudflare KV is eventually consistent and does not offer
an atomic read-modify-write transaction, so these windows are best-effort under
concurrency. A strict guarantee requires an explicitly approved coordinator
such as a Durable Object and a corresponding binding/configuration change.
The endpoint does not create product accounts or store leads in TutorPal’s
database. JSON callers receive structured status responses, while native form
posts redirect back to the marketing page with a success or error state.

Both static portals intentionally exclude crawlers with both a
<code>&lt;meta name="robots" content="noindex, nofollow" /&gt;</code> directive and
a <code>robots.txt</code> file containing <code>User-agent: *</code> followed by
<code>Disallow: /</code>. The directives serve different purposes:
<code>robots.txt</code> controls crawler access, while a page-level
<code>noindex</code> tells a crawler that can fetch the page not to index it.
<code>robots.txt</code> can prevent compliant crawlers from fetching previously
known URLs, which also means they may not see the page-level <code>noindex</code>
directive. Neither directive removes prior search results or restricts direct
access to either portal.

Public signup is controlled on the Worker by
<code>PUBLIC_SIGNUP_ENABLED</code>. Keep it <code>false</code> while accounts are
provisioned through the admin portal. The user frontend reads the server-owned
value from <code>/v1/config</code> and fails closed if the configuration cannot
be read. No new environment variable or database migration is needed for
admin user management; it uses the existing Better Auth user fields and
callback configuration.

## Backend infrastructure

The development API Worker configuration is
[backend/wrangler/dev/wrangler.api.dev.jsonc](../backend/wrangler/dev/wrangler.api.dev.jsonc)
and its module entrypoint is
[backend/src/cloudflare-worker.ts](../backend/src/cloudflare-worker.ts). The
development reminder Worker configuration is
[backend/wrangler/dev/wrangler.reminders.dev.jsonc](../backend/wrangler/dev/wrangler.reminders.dev.jsonc)
and its module entrypoint is
[backend/src/cloudflare-reminder-worker.ts](../backend/src/cloudflare-reminder-worker.ts).
Production uses the matching
[API](../backend/wrangler/prod/wrangler.api.prod.jsonc) and
[reminder](../backend/wrangler/prod/wrangler.reminders.prod.jsonc) configs.

The Workers have separate responsibilities:

- <code>tutorpal-api-dev</code> exports <code>fetch</code> and creates the
  request-scoped Prisma, Better Auth, repositories, and Hono application.
  Its <code>triggers.crons</code> list is explicitly empty.
- <code>tutorpal-reminders-dev</code> exports <code>scheduled</code> only and
  polls due class reminders. It has no public API route and receives only the
  shared Hyperdrive binding plus the LINE encryption secret.

Both Workers use the <code>nodejs_compat</code> compatibility flag for Prisma,
<code>pg</code>, <code>Buffer</code>, and Node-compatible cryptography. The
<code>HYPERDRIVE_CACHE_DISABLED</code> binding is required on both deployed
Workers; it is a Hyperdrive binding, not a secret or a regular Worker
variable. The same Hyperdrive resource is bound twice; no second database
configuration is created.

Validate and deploy development from the repository root:

~~~bash
make backend-build ENV=dev
make deploy APP=backend ENV=dev
~~~

The aggregate backend deployment publishes the reminder Worker first and the
API Worker second, removing the old API cron after the new schedule is active.
For independent recovery operations, use
<code>make deploy APP=backend-reminders ENV=dev</code> or run the explicit backend
targets <code>make reminders-deploy</code> and <code>make deploy</code> from
<code>backend</code>. <code>--keep-vars</code> preserves variables and secrets
managed in the Cloudflare dashboard. Keep deployed configuration and dashboard
values consistent; binding names and resource IDs must match both Wrangler
files.

`ENV` defaults to <code>dev</code> for backend Worker checks and deployments.
For production, replace every
<code>REPLACE_WITH_PRODUCTION_HYPERDRIVE_ID</code> and <code>.invalid</code>
placeholder in both production configs, provision the production secrets, then
run <code>make backend-build ENV=prod</code> and
<code>make deploy APP=backend ENV=prod</code>. The backend Makefile blocks a
production deployment while any of those placeholders remain. Direct Wrangler
package scripts remain explicit and must not be used for production until the
placeholders have been replaced. Local Wrangler `.dev.vars` files are resolved
next to the selected config; use the Git-ignored
<code>backend/wrangler/dev/.dev.vars</code> for local development secrets.

## Data and integration flows

### PostgreSQL through Hyperdrive

The API and reminder Workers are the application components that access the
database. Both use Prisma with the connection string supplied by
<code>HYPERDRIVE_CACHE_DISABLED.connectionString</code>. Hyperdrive is
configured with query caching disabled because TutorPal performs authenticated
CRUD, writes, transactions, timestamp-sensitive queries, decimal operations,
and reminder claiming.

### Authentication and email

Better Auth runs inside the API Worker. The Pages origin is allowed by CORS and
browser requests include credentials so session cookies can be used across the
user/admin frontend and API origins. Resend sends verification and
password-reset emails; the links return users to the user Pages frontend.

### LINE integration

The API Worker handles LINE account linking and OAuth callbacks at
<code>/v1/line/callback</code>. The API and reminder Workers send LINE messages
through the Messaging API. Existing encrypted LINE credentials must remain
readable by provisioning the same
<code>LINE_CREDENTIALS_ENCRYPTION_KEY</code> secret on both Workers.

### Reminder scheduling

The Cron Trigger invokes <code>scheduled()</code> on
<code>tutorpal-reminders-dev</code> at minutes <code>00</code>, <code>15</code>,
<code>30</code>, and <code>45</code> every hour in UTC. The reminder service
uses the PostgreSQL claim, lease, retry-key, and delivery-status logic to make
overlapping invocations and transient failures safe. The API Worker has no
Cron trigger after cutover.

## Runtime configuration contract

The current development Worker values in
<code>backend/wrangler/dev/wrangler.api.dev.jsonc</code> use these origins:

| Variable | Current value |
| --- | --- |
| <code>CORS_ORIGIN</code> | <code>https://dev.app.tutorpal.io</code> |
| <code>ADMIN_FRONTEND_URL</code> | <code>https://dev.admin.tutorpal.io</code> |
| <code>FRONTEND_URL</code> | <code>https://dev.app.tutorpal.io</code> |
| <code>BETTER_AUTH_URL</code> | <code>https://dev.api.tutorpal.io</code> |
| <code>EMAIL_VERIFICATION_CALLBACK_URL</code> | <code>https://dev.app.tutorpal.io/verify-email</code> |
| <code>LINE_LINK_REDIRECT_URL</code> | <code>https://dev.api.tutorpal.io/v1/line/callback</code> |
| <code>VITE_API_URL</code> | <code>https://dev.api.tutorpal.io</code> |
| <code>PUBLIC_SIGNUP_ENABLED</code> | <code>false</code> |

The following non-secret Worker settings are also defined for the current
environment:

- <code>ENVIRONMENT=dev</code>
- <code>LOG_LEVEL=debug</code>
- <code>RESEND_FROM_EMAIL=TutorPal &lt;no-reply@tutorpal.io&gt;</code>

Store these values as API Worker secrets and do not commit them:

- <code>BETTER_AUTH_SECRET</code>
- <code>RESEND_API_KEY</code>
- <code>LINE_CREDENTIALS_ENCRYPTION_KEY</code>

The reminder Worker only needs
<code>LINE_CREDENTIALS_ENCRYPTION_KEY</code>; provision the same value on both
Workers.

If a hostname changes, update the frontend build variable, Worker origin
variables, the LINE Developers callback URL, and any email-link configuration
as one change. Authentication and CORS require exact origins.

## Operational checks

Use the following check after a deployment or domain change:

~~~bash
curl -i https://dev.api.tutorpal.io/v1/health
~~~

The health endpoint should return HTTP <code>200</code> with
<code>{"status":"ok"}</code>. Also verify:

- <code>/</code>, <code>/login</code>, and representative TanStack Router deep
  links load from <code>dev.app.tutorpal.io</code>.
- The admin Pages deployment loads <code>/login</code> and the protected User
  management screen, and its origin matches <code>ADMIN_FRONTEND_URL</code>.
- Browser API requests use <code>dev.api.tutorpal.io</code> and include
  credentials.
- With <code>PUBLIC_SIGNUP_ENABLED=false</code>, the user portal hides signup,
  direct signup visits return to login, and the Better Auth signup endpoint
  rejects new accounts. Admin-created users receive verification email links.
- Existing encrypted LINE credentials can be read and the OAuth callback uses
  the custom API domain.
- CRUD, transactions, timestamps, decimals, and reminder claim queries work
  through Hyperdrive.
- Cron runs at the four quarter-hour marks and does not duplicate reminder
  delivery when executions overlap.

For Worker execution logs, use the Worker Observability view or run:

~~~bash
cd backend
bunx wrangler tail tutorpal-api-dev
bunx wrangler tail tutorpal-reminders-dev
~~~

## Related references

- [Development API Worker configuration](../backend/wrangler/dev/wrangler.api.dev.jsonc)
- [Development reminder Worker configuration](../backend/wrangler/dev/wrangler.reminders.dev.jsonc)
- [Production API Worker configuration](../backend/wrangler/prod/wrangler.api.prod.jsonc)
- [Production reminder Worker configuration](../backend/wrangler/prod/wrangler.reminders.prod.jsonc)
- [Cloudflare Workers Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
- [Cloudflare Pages Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)
- [Cloudflare Pages custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Cloudflare Hyperdrive](https://developers.cloudflare.com/hyperdrive/)
- [Cloudflare Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
