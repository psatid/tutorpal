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
- Cloudflare Worker: <code>tutorpal-dev-api</code>
- Cloudflare DNS zone: <code>tutorpal.io</code>

## Architecture overview

~~~mermaid
flowchart LR
    browser["User browser"]

    subgraph cf["Cloudflare"]
        dns["DNS + TLS<br/>Zone: tutorpal.io"]
        pages["Pages<br/>User Vite/React SPA<br/>dev.app.tutorpal.io"]
        adminPages["Pages<br/>Admin Vite/React SPA<br/>admin origin"]
        worker["Worker: tutorpal-dev-api<br/>Hono API + Better Auth<br/>dev.api.tutorpal.io"]
        cron["Cron Trigger<br/>*/15 * * * * UTC"]
        hyperdrive["Hyperdrive<br/>cache disabled<br/>HYPERDRIVE_CACHE_DISABLED"]
    end

    subgraph external["External services"]
        postgres[("Supabase PostgreSQL")]
        resend["Resend<br/>verification + reset email"]
        line["LINE Login + Messaging API"]
    end

    browser -->|"HTTPS: web app"| dns
    dns -->|"dev.app.tutorpal.io"| pages
    dns -->|"ADMIN_FRONTEND_URL"| adminPages
    dns -->|"dev.api.tutorpal.io"| worker
    browser -->|"API + auth requests<br/>credentials included"| worker
    cron -->|"scheduled()"| worker
    worker -->|"Prisma + Better Auth"| hyperdrive
    hyperdrive -->|"PostgreSQL connection"| postgres
    worker -->|"verification/reset messages"| resend
    worker -->|"OAuth + push messages"| line
    line -->|"OAuth callback"| worker
~~~

Cloudflare DNS routes the two public application hostnames. Pages serves only
the compiled SPA and its deep-link fallback. The browser uses the public API
origin compiled into <code>VITE_API_URL</code>; it never connects directly to
PostgreSQL. The Worker creates the Prisma and Better Auth runtime for each
request, uses Hyperdrive for database access, and handles the scheduled
reminder poll.

## Cloudflare resource inventory

| Resource | Current configuration | Responsibility |
| --- | --- | --- |
| DNS zone | <code>tutorpal.io</code> | Authoritative DNS, proxying, and TLS for application hostnames |
| Pages project | <code>tutorpal-dev</code> | Static frontend deployment from <code>frontend/dist</code> |
| Pages custom domain | <code>dev.app.tutorpal.io</code> | Public web application origin |
| Admin Pages project | Separate Pages project from <code>admin-frontend</code> | Restricted admin portal; its public origin is configured as <code>ADMIN_FRONTEND_URL</code> |
| Worker | <code>tutorpal-dev-api</code> | Hono API, Better Auth, LINE integration, and Cron handler |
| Worker custom domain | <code>dev.api.tutorpal.io</code> | Public API and authentication origin |
| Worker development URL | <code>tutorpal-dev-api.psatid32.workers.dev</code> | Cloudflare-provided Worker endpoint for operational testing |
| Hyperdrive binding | <code>HYPERDRIVE_CACHE_DISABLED</code> | Database connection to the existing Supabase PostgreSQL database with query caching disabled |
| Cron Trigger | <code>*/15 * * * *</code> UTC | Invokes the Worker reminder handler at minutes <code>00</code>, <code>15</code>, <code>30</code>, and <code>45</code> of every hour |

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
  <code>tutorpal-dev-api</code> Worker through a Worker Custom Domain.

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

The Worker configuration is
[backend/wrangler.jsonc](../backend/wrangler.jsonc) and the module entrypoint
is [backend/src/cloudflare-worker.ts](../backend/src/cloudflare-worker.ts).

The Worker exports both handlers:

- <code>fetch</code>: creates the request-scoped Prisma, Better Auth,
  repositories, and Hono application, then serves the API request.
- <code>scheduled</code>: creates the same database runtime and polls due class
  reminders.

The Worker uses the <code>nodejs_compat</code> compatibility flag for Prisma,
<code>pg</code>, <code>Buffer</code>, and Node-compatible cryptography. The
<code>HYPERDRIVE_CACHE_DISABLED</code> binding is required on every deployed
environment; it is a Hyperdrive binding, not a secret or a regular Worker
variable.

Deploy and validate the Worker from the <code>backend</code> directory:

~~~bash
cd backend
bun run cf:check
bunx wrangler deploy --keep-vars
~~~

<code>--keep-vars</code> preserves variables and secrets managed in the
Cloudflare dashboard. Keep the deployed Wrangler configuration and dashboard
values consistent; the binding name and resource IDs must match
<code>backend/wrangler.jsonc</code>.

## Data and integration flows

### PostgreSQL through Hyperdrive

The Worker is the only application component that accesses the database. It
uses Prisma with the connection string supplied by
<code>HYPERDRIVE_CACHE_DISABLED.connectionString</code>. Hyperdrive is
configured with query caching disabled because TutorPal performs authenticated
CRUD, writes, transactions, timestamp-sensitive queries, decimal operations,
and reminder claiming.

### Authentication and email

Better Auth runs inside the Worker. The Pages origin is allowed by CORS and
browser requests include credentials so session cookies can be used across the
user/admin frontend and API origins. Resend sends verification and
password-reset emails; the links return users to the user Pages frontend.

### LINE integration

The Worker handles LINE account linking and OAuth callbacks at
<code>/v1/line/callback</code>, and sends LINE messages through the Messaging
API. Existing encrypted LINE credentials must remain readable by preserving
the configured <code>LINE_CREDENTIALS_ENCRYPTION_KEY</code> secret.

### Reminder scheduling

The Cron Trigger invokes <code>scheduled()</code> at minutes
<code>00</code>, <code>15</code>, <code>30</code>, and <code>45</code> every
hour in UTC. The reminder service uses the PostgreSQL claim, lease, retry-key,
and delivery-status logic to make overlapping invocations and transient
failures safe.

## Runtime configuration contract

The current Worker values in <code>backend/wrangler.jsonc</code> use these
origins:

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

Store these values as Worker secrets and do not commit them:

- <code>BETTER_AUTH_SECRET</code>
- <code>RESEND_API_KEY</code>
- <code>LINE_CREDENTIALS_ENCRYPTION_KEY</code>

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
bunx wrangler tail tutorpal-dev-api
~~~

## Related references

- [Worker configuration](../backend/wrangler.jsonc)
- [Cloudflare Workers Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
- [Cloudflare Pages Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)
- [Cloudflare Pages custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Cloudflare Hyperdrive](https://developers.cloudflare.com/hyperdrive/)
- [Cloudflare Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
