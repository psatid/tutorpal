# TutorPal marketing frontend

TutorPal’s public, server-rendered marketing site. It is a TanStack Start app
deployed as a Cloudflare Worker, separate from the authenticated product and
its signup behavior.

```bash
bun install
cp .env.example .env
bun run dev
```

The public routes are `/`, `/privacy`, `/robots.txt`, and `/sitemap.xml`. The
beta form posts to the same-origin `/api/beta-interest` Worker route.

## Marketing assets and motion

Authentic product previews live in `public/product-previews/`. Capture the
English TutorPal portal from a clean account with no admin email, test-user
names, fixture classes, or personal data. A small fictional capture dataset is
allowed when it is isolated to the screenshots and clearly reflects the real
portal flow. Keep screenshots static and use them for the hero, product tour,
and social preview. Do not replace them with hand-built fake dashboard markup.

The approved capture set includes `home.jpg`, `schedules.jpg`, `courses.jpg`,
and `classes.jpg`. Filter or frame the portal so only the sanitized demo flow
is visible. Never include unrelated workspace records just to make a screen
look fuller.

The home page uses CSS motion and `IntersectionObserver` only. The product tour
becomes a header-safe pinned stage at desktop and mobile while each story row
passes through the reading band. Mobile uses a shorter preview stage above the
current story copy so the app screen stays readable on a narrow viewport. On
desktop and mobile, as each row crosses the reading band, `IntersectionObserver`
selects the next real screenshot. The pin is CSS positioning, not a scroll
hijack, so the page remains normally scrollable.
FAQ answers use a native
disclosure with a CSS height and opacity reveal. English is the server-rendered
default; the header language switcher changes the landing and privacy copy to
Thai, updates the document language, and keeps route anchors and form field
names unchanged. Product screenshots remain English captures from the real
portal. All copy remains available without JavaScript.
Reduced-motion users get the same content without transforms, reveals,
accordion transitions, or screenshot crossfades.

Build the production app with:

```bash
bun run build
bun run test
```

## Deploy to Cloudflare Workers

This project uses the Cloudflare Vite plugin (configured in `vite.config.ts`) and `wrangler.jsonc`.

1. Create a KV namespace and replace `REPLACE_WITH_KV_NAMESPACE_ID` in
   `wrangler.jsonc` with its ID.
2. Set `PUBLIC_SITE_URL` and, if used, `PUBLIC_PORTAL_URL` and
   `PUBLIC_TURNSTILE_SITE_KEY` as public build variables (use `.env` locally
   and provide them to the deployment build). Keep matching non-secret values
   in Worker configuration where the runtime needs them.
3. Set `DISCORD_WEBHOOK_URL` and `TURNSTILE_SECRET_KEY` using `wrangler secret put`.
4. Generate binding types with `bun run cf-typegen`, then deploy with `bun run deploy`.

Without all three integrations (KV, Turnstile secret, and Discord webhook), the
endpoint intentionally returns a clear configuration error rather than a fake
success. Configure the Worker Custom Domain at the apex domain in Cloudflare.

The KV windows are best-effort abuse throttling: Cloudflare KV is eventually
consistent, so concurrent requests can race the five-attempt and 24-hour email
checks. If strict concurrent enforcement is required before production, replace
the KV coordinator with an explicitly approved strongly consistent primitive
such as a Durable Object.
