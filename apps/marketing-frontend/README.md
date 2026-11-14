# TutorPal marketing

The public marketing site is an Astro app in the root Bun workspace. English is served at
`/`; Thai is served at `/th/`. Both routes are prerendered to complete HTML.
A small edge Worker reads the backend's beta mode and removes the inactive
HTML branch before serving either locale; Astro still has no runtime SSR
dependency. In beta, visitors request a demo through the closing form. Outside
beta, ordinary app-opening CTAs return. There is no analytics integration.

## Local development

Requires Bun and Node.js 22.12 or newer (Astro 7). Install from the
repository root, then run app commands from `apps/marketing-frontend`:

```sh
make workspace-install
cd apps/marketing-frontend
bun run dev --port 4321
bun run cf:dev
bun run check
bun run build
bun run preview --port 4321
```

The root Makefile also exposes `marketing-dev`, `marketing-build`,
`marketing-build-dev`, `marketing-check`, `marketing-test`, and
`marketing-run SCRIPT=preview ARGS="--port 4321"`.
`make run SCRIPT=<script> ARGS="..."` works inside this directory.
Build runs Astro's strict type check before generating `dist/`.

`make dev` runs Astro's source development server with hot reload. `make cf-dev`
builds `dist` and starts Wrangler locally with the development Worker config,
which exercises the runtime beta configuration, HTML rewriting, Static Assets,
and 404-page behavior. It does not
deploy the `tutorpal-marketing-dev` Worker or alter Cloudflare resources.

After building, run `bun test tests/static-smoke.test.js` to verify both generated
pages, metadata, links, and demonstration data. The [verification guide](tests/README.md)
also documents the local browser fixtures for script blocking, reduced motion,
responsive layouts, and motion observations.
See the [verification record](VERIFICATION.md) for results and coverage limits.

`bun run deploy` (or `make deploy`) builds and deploys Workers Static Assets
using `wrangler/prod/wrangler.marketing.prod.jsonc` to the
`tutorpal-marketing` Worker at `tutorpal.io`. `bun run deploy:dev` (or
`make deploy-dev`) uses `wrangler/dev/wrangler.marketing.dev.jsonc` to deploy
the distinct `tutorpal-marketing-dev` Worker at `dev.tutorpal.io`. Both configs
serve `dist` and use the static 404-page handler. Deployment is a separate,
explicit action; local development/build never publish. Use `make cf-check
ENV=dev` or `make cf-check ENV=prod` to bundle-check the corresponding config
without publishing.

## Beta access

The API's single `BETA_ENABLED` setting controls the badge, beta navigation,
hero CTA, and closing request form. The marketing Worker reads
`GET /v1/beta/config` through its environment's `API_URL` for each homepage
navigation, without caching the mode. It uses `ASSETS` and `HTMLRewriter` to
remove inactive branches before returning HTML. Other assets retain static
serving. An API failure falls back to beta mode with requests unavailable.
Raw Astro development and static preview use the same safe beta fallback;
use `cf:dev` to exercise runtime mode selection.
Homepage HTML is non-cacheable and has no static ETag/Last-Modified validator;
conditional requests cannot reuse an old mode after the switch changes.
Hashed assets retain their normal caching.

Worker commands run `cf:worker:check` first. It regenerates the ignored
`worker/worker-configuration.d.ts` with the installed Wrangler and type-checks
`worker/index.ts`; no generated platform declarations are committed.

The form requires name and email. Subject, student-count range, and LINE
Official Account usage are optional. Requests are sent to
`POST /v1/beta/requests`; the API validates Turnstile action/hostname and sends
the Discord notification. The team then emails the requester to arrange a demo
and provisions their account through the admin portal. There is no newsletter
checkbox or automatic account creation.

Discord and Turnstile keys are configured later, on the API. Until the public
configuration reports request availability, the form shows an unavailable
message. Success appears only after confirmed Discord delivery. Errors retain
all entered values; each submission attempt resets the single-use Turnstile
widget before another attempt. There is no lead database or retry queue, and
an interrupted response can result in duplicate notifications after retry.

The marketing Worker holds no secret. `TURNSTILE_SITE_KEY` is public; the API
keeps `TURNSTILE_SECRET_KEY` and `DISCORD_BETA_WEBHOOK_URL` private. Configure
the exact `MARKETING_ORIGIN` on the API for CORS and hostname validation. See
the [infrastructure guide](../../docs/infrastructure.md#beta-requests-and-full-launch)
for setup and the launch procedure. Turning beta off and redeploying the API
does not require rebuilding marketing.

## Content and behavior

- `src/content.ts` is the typed English/Thai copy source. The dictionaries use
  the same shape. There is no automatic locale detection or redirect.
- `src/components/Landing.astro` contains shared semantic product scenes and page
  sections. Fictional examples use IELTS, SAT, and A-Level; the product copy stays
  relevant to tutoring across subjects.
- Scheduling Min's two-hour SAT Math lesson on Thursday, 8 October, 16:00–18:00
  reserves two of ten hours. This featured math lesson is separate from the
  English-only weekly calendar. The week of 5–11 October contains twelve English
  lessons across IELTS, IELTS Speaking, SAT English, and A-Level English, with
  Sunday empty. Each event shows time, curriculum, level, and student.
- A separate typed four-student math workspace shows Min, Ploy, Kiet, and Fern,
  with SAT Math/A-Level Mathematics courses and distinct levels. Reminder previews are
  upcoming examples, not actual messages, delivery statuses, or read receipts.
- The full LINE example intentionally stays English in both locales, following
  the backend reminder format in `class-reminder.repository.ts`.
- Native details/summary elements provide FAQs and the mobile menu. All content
  and navigation work without JavaScript.

## Enhancement and accessibility

The page uses the approved light Concept A: a centered two-line headline with four
compact product cards balanced at its desktop perimeter: featured lesson, student
count sourced from `studentSummaries`, remaining hours, and LINE reminder. Their
opaque white surfaces have subtle rims, soft shadows, and dark plum `#4F3954`
labels. They render the same way without JavaScript. Below 1200px
the cards are hidden and six
feature icons remain on tablet: lesson calendar, student group, hours, LINE chat,
pencil, and book. Below 768px, the calendar icon is hidden and the group,
hourglass, and LINE icons are centered evenly across the top row; pencil and book
keep their lower positions.
The lesson card has a `#FDF6DA` Scheduled/นัดหมายแล้ว badge with `#CCA77B`
text and icon (about 2.06:1 contrast at 12px). Hero lesson
calendar and hourglass glyphs use neutral gray, the student group uses navy, and
the rounded three-dot LINE chat uses LINE green. Existing avatar, hourglass, and LINE marks retain their vivid accent colors. The yellow-orange pencil and cyan book
occupy a reserved lower band below the upper four at every compact width. The
logo is the refreshed TutorPal icon ([logo guide](../../docs/brand/logo.md)). The hero's bottom note and visible motion
control remain absent.

All primary content is visible in static HTML, including when JavaScript is
disabled or delayed; the compact calendar remains Monday–Wednesday below 1024px.
Finite CSS animations reveal the hero on page load and finish visibly without
JavaScript. The optional browser script prepares only rendered scroll targets
wholly below the viewport when it starts. Content already visible or passed stays
static, while unseen lower sections can still reveal after a delayed script load.
Unsupported animation APIs, initial hash navigation, and reduced motion leave
scroll content static. Hero CTA links remain focusable and clickable, and navigation
and FAQ controls stay immediately available.

After initialization, resize settles active or newly visible reveals and prepares
newly rendered targets that remain below the viewport. Unseen pending targets stay
eligible for their first entrance.

CSS reveals the hero copy and four desktop cards together without an entrance
delay. Cards enter from their nearest edges over 850ms with transient opacity
and blur. Six compact hero icons
reveal from outward offsets over one second; the pencil and book use lower outward
offsets from their reserved compact band. Separate wrappers then float: cards
travel 14px on desktop and icons travel 10px, or 8px on phones. On a normal first
load, `.hero-copy` enters once over 850ms from 24px below with transient
6px blur and no delay. It is excluded from scroll reveals and never replays; after
it settles, copy and CTAs stay stationary. CTA links remain focusable and clickable.
Floating pauses while the hero is offscreen, the document is
hidden, or keyboard focus is inside the hero. The finite CSS entrance completes
without the browser script.
Reduced motion disables motion and card rotation; changing that preference
cleans up active effects. Returning from BFCache restores optional floating
without starting new scroll entrances. There is no GSAP or Three.js dependency.

Section headings and supporting copy reveal once when their top reaches a point
200px above the viewport bottom, over 850ms with 24px travel, transient 6px blur,
and 100ms paired-copy offsets. The calendar frame uses the same trigger and
settles over 700ms before its twelve desktop events enter over 800ms, staggered
90ms up to 450ms. The LINE check list also waits until it reaches that point.
Below 1024px,
the same data becomes a Monday–Wednesday day-grouped agenda;
the toolbar label changes from 5–11 to 5–7 in both locales. There is no compact
disclosure or agenda controller. Parent and child blur are sequenced; child pending
states are opacity-only. Balance fills animate with scaleX over 750ms, staggered 80ms after the
workspace reveal. Their existing decorative widths are available at every size;
numeric hours remain the authoritative information.

Calendar events and matching workspace avatar roles use solid indigo `#533AFD`,
orange `#F79303`, and blue `#17B5F3`, with white labels and initials. White on
orange and blue is an explicitly approved contrast exception at about 2.30:1 and
2.35:1; white on indigo is 6.19:1. Quiet calendar gridlines use `#E8E8E8`.
The preserved light-coral reference token
`--schedule-orange-light` remains `#FC9A7A`. Desktop hero cards use opaque white
surfaces with dark plum `#4F3954` labels; the lesson status badge uses the
requested `#FDF6DA` fill and `#CCA77B` text, with about 2.06:1 contrast at 12px.
Existing vivid icon accents
remain, and workspace avatars keep saturated indigo, blue, and yellow-orange
backgrounds with white initials. The decorative book spine has its own deeper-blue
token. Tutor initials are indigo/white. All remaining-hour fills stay indigo,
independent of tone, without changing their illustrative widths.

The closing section uses five substantial white tiles with filled glyphs:
graduation cap, lightbulb, ruler, folded document, and bookmark. The cap is
neutral gray, the bulb and ruler are yellow, the document is cyan, and the bookmark
is mint. Glyphs occupy about 55–65% of each tile face, with a
dedicated subtle shadow. Desktop and tablet show all five tiles; mobile hides the
bookmark and retains the cap, bulb, ruler, and document with 8px motion. Fixed tilts
and floating cycles remain in the closing section. Hero and closing loops suspend
offscreen, in hidden tabs, and during keyboard focus within their sections. LINE list checks are inline SVGs:
they draw once with a small staggered pulse when first scrolled into view, and stay
static for reduced motion, unsupported setup, hidden documents, or focus/hash navigation.
Scroll animations enhance static HTML only after browser setup; unsupported APIs or
setup faults leave readable content and filled bars. An active scroll reveal
continues through the edge of its trigger band while still visible, then settles
when fully offscreen. Other interrupted reveals settle,
and completed effects do not replay after
preference changes or BFCache restores. Pending targets also release on
bailouts, hidden documents, focus/hash navigation, and cleanup; rendered items
skipped above the viewport settle, while closed native details are not marked
seen. There is no pinned scrolling. For diagnostics, scroll targets expose
`data-motion-phase` (pending/revealing/settled) and persistent
`data-motion-done`. Hero targets use `data-hero-done` to prevent replay after
their entrance or a reduced-motion preference change.

FAQ keeps native, multi-open details behavior with an optional 320ms measured
height/opacity transition. Opening/closing can reverse mid-transition. Closing
keeps the disclosure open until it completes; resize and cleanup settle the
intended state and remove temporary styles. Without JavaScript or animation API
support, disclosures work immediately through their native controls.

Fonts are self-hosted Inter and Noto Sans Thai variable subsets from Fontsource.
The shared font stack keeps Latin text in Inter and Thai glyphs in Noto Sans Thai.
Thai headings have relaxed line height and no negative tracking.

SEO includes per-locale titles/descriptions, self canonicals, reciprocal `en`,
`th`, and `x-default` alternates, `robots.txt`, `sitemap.xml`, a PNG sharing image,
and organization/site structured data. The custom 404 is excluded from indexing.

## Asset provenance

`public/app-icon.png` (512px) and `public/app-icon-small.png` (96px UI/favicon) are
exported from the logo masters in `design/logo/final/`; see the
[logo guide](../../docs/brand/logo.md). `public/favicon.svg` is the small-size cut.
Organization metadata uses the 512px icon.
`public/social.svg` is an original light vector composition with the 96px icon
embedded unmodified, rasterized to `social.png`
using Astro's installed Sharp dependency. Regenerate it with:

```sh
node --input-type=module -e "import sharp from 'sharp'; await sharp('public/social.svg').png().toFile('public/social.png')"
```

Product scenes and the sharing artwork are original HTML/CSS/vector compositions;
no template source or proprietary template assets are included. Fonts retain the
OFL licenses distributed by their npm packages; copies ship in `public/licenses/`.
See [design direction](DESIGN.md).
