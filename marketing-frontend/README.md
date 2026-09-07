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

## Homepage and product proof

The homepage implements the approved hybrid: B's centered, Week-led schedule
hero followed by A's four alternating teaching-day chapters. The white canvas
extends to both viewport edges; decorative hero objects and floating connector
labels are omitted. The primary
**Explore TutorPal** action leads to `#workflow`; the existing beta form remains
at `#beta`. Comparison variants and the local prototype form are archived and
are no longer part of the runtime.

The story follows one sanitized class through its learner and hour balance,
Day/Week planning, Today confirmation, and completed-session history. Scheduling
already reserves class hours, so completion never deducts them again. The
illustrations preserve TutorPal's real labels, status values, and product layout.
The detailed Week view is explicitly captioned as a Fri–Sun crop.

The feature section includes students, classes, hours, schedules, revenue, and
LINE integration. Its composed reminder visual uses the exact backend reminder
message with fictional student details. It is not a screenshot of a real
received message. The current reminder message is English, including on the
Thai page; the surrounding copy is localized. Product panels and the LINE
visual omit visible illustrative, demo, and sample labels. See
[image provenance](../docs/marketing-assets/README.md) for the capture source,
refresh instructions, and original decorative artwork.

Production images are imported optimized WebP assets under
`src/assets/marketing/`, with intrinsic dimensions. The LINE image has a
descriptive alt and an exact message transcript that is visually hidden.
The decorative teaching-object asset remains archived and is not rendered. Existing sanitized portal captures under
`public/product-previews/` remain reference material and include the social
preview asset.

## Motion, language, and accessibility

GSAP ScrollTrigger and `@gsap/react` provide scoped hero entrances, scroll-linked
transition phrases, and product-panel movement. The planning copy briefly pins
beside its panels at widths of at least 1120px. Compact layouts remain static.
Normal scrolling and static
server-rendered content remain available. Reduced motion disables pinning and
scroll effects. Animation contexts revert on language, breakpoint, preference,
and route changes. Editorial headings use Outfit with Noto Sans Thai; product
panels keep their existing typography.

English is the server-rendered default. The language switcher updates marketing
and privacy copy and document language, preserving anchors and form field names.
Small screens use linear product panels and story sections. FAQ answers use
native disclosures. The live `BetaLeadForm` retains validation, loading/errors,
Turnstile, the existing endpoint, privacy notice, and native
`?beta=success|error` handling.

Build and verify with:

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

## Approved exploration

The user selected B's hero with A's remaining sections, then approved
implementation on September 8, 2026. The [prototype archive](../docs/prototypes/README.md)
preserves all three alternatives and the selection rationale. The old
`?variant=` comparison UI is removed; the homepage is now the chosen design.

Implementation remains local until the user requests commits, pushes, or
deployment. Existing deployment prerequisites above still apply.
