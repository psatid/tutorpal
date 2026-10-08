# TutorPal marketing

The public marketing site is a standalone Astro application. English is served at
`/`; Thai is served at `/th/`. Both routes are prerendered to complete HTML. There
is no API connection, account creation form, analytics, or runtime SSR dependency.
All app CTAs open `https://app.tutorpal.io`.

## Local development

Requires Bun and Node.js 22.12 or newer (Astro 7). From this directory:

```sh
bun install --frozen-lockfile
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
which exercises the Workers Static Assets and 404-page behavior. It does not
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
existing logo is reused unchanged. The hero's bottom note and visible motion
control remain absent.

All primary content is visible in static HTML, including when JavaScript is
disabled; the compact calendar remains Monday–Wednesday below 1024px. A
landing-only inline head guard prepares optional targets before paint using zero
opacity (no pending blur or layout removal) and scaleX(0) for decorative fills.
The entry must claim this preparation within two seconds after registering its
observers and release handlers. A missed deadline or setup fault permanently
releases sharp content and filled bars; late code never hides it again. Initial
hash/restored-scroll navigation, early interaction, unsupported animation APIs,
and reduced motion take the static path. Hero content is present in static HTML; its
CTA links remain focusable and clickable. Navigation and FAQ controls stay immediately
available.

Ordinary startup viewport resize does not expire preparation. Before an entrance
starts, controllers measure the current viewport during initialization; after
initialization, existing resize handlers settle active effects and reconcile
rendered targets. Resizing never extends or resets the two-second deadline.

The small bundled script reveals the hero copy over 850ms, then starts visible
card entrances from their nearest edges at 900, 960, 1020, and 1080ms. The first
card starts 50ms after the copy finishes, and subsequent cards start 60ms apart;
each entrance lasts 850ms with transient opacity and blur. Six compact hero icons
reveal from outward offsets over one second; the pencil and book use lower outward
offsets from their reserved compact band. Separate wrappers then float: cards
travel 14px on desktop and icons travel 10px, or 8px on phones. On a normal first
load with prepared motion
and a visible hero, `.hero-copy` enters once over 850ms from 24px below with transient
6px blur and no delay. It is excluded from scroll reveals and never replays; after
it settles, copy and CTAs stay stationary. CTA links remain focusable and clickable.
Floating pauses while the hero is offscreen, the document is
hidden, or keyboard focus is inside the hero. Leaving view during an entrance
finishes it immediately.
Reduced motion disables motion and card rotation; changing that preference
cleans up active effects. Returning from BFCache restores optional floating
without repeating completed entrances. The preparation guard is bounded and
independent of floating/FAQ enhancements;
there is no GSAP or Three.js dependency.

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
Animations enhance static HTML with the bounded preparation contract;
unsupported APIs or setup faults leave readable content and filled bars. Interrupted reveals settle and completed effects do not replay after
preference changes or BFCache restores. Pending targets also release on
bailouts, hidden documents, focus/hash navigation, and cleanup; rendered items
skipped above the viewport settle, while closed native details are not marked
seen. There is no pinned scrolling. For diagnostics, `window.tutorpalRevealBoot`
and the root `data-reveal-boot` expose preparing/claimed/expired state. The root
`data-reveal-reason` reports expiration and clears on preparation or claim. Targets
expose `data-motion-phase` (pending/revealing/settled) and persistent
`data-motion-done`.

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

`public/app-icon.png` is copied from the existing authenticated frontend identity.
`public/app-icon-small.png` is its 96px-wide UI/favicon derivative (6,878 bytes),
generated with Sharp `resize({width:96,withoutEnlargement:true})` and
`png({compressionLevel:9,palette:true})`. Organization metadata retains the original.
`public/social.svg` is an original light vector composition with the existing logo
embedded unmodified, rasterized to `social.png`
using Astro's installed Sharp dependency. Regenerate it with:

```sh
node --input-type=module -e "import sharp from 'sharp'; await sharp('public/social.svg').png().toFile('public/social.png')"
```

Product scenes and the sharing artwork are original HTML/CSS/vector compositions;
no template source or proprietary template assets are included. Fonts retain the
OFL licenses distributed by their npm packages; copies ship in `public/licenses/`.
See [design direction](DESIGN.md).
