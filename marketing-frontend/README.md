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
bun run check
bun run build
bun run preview --port 4321
```

The root Makefile also exposes `marketing-dev`, `marketing-build`, and
`marketing-run SCRIPT=preview ARGS="--port 4321"`.
`make run SCRIPT=<script> ARGS="..."` works inside this directory.
Build runs Astro's strict type check before generating `dist/`.

After building, run `bun test tests/static-smoke.test.js` to verify both generated
pages, metadata, links, and demonstration data. The [verification guide](tests/README.md)
also documents the local browser fixtures for script blocking, reduced motion,
responsive layouts, and motion observations.
See the [verification record](VERIFICATION.md) for results and coverage limits.

`bun run deploy` builds and deploys Workers Static Assets using `wrangler.jsonc`
to the `tutorpal-marketing` Worker. Deployment is a separate, explicit action;
local development/build never publish. Keep the production custom domain mapped
to that Worker through the Cloudflare account configuration.

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

The page uses the approved light Concept A: a centered two-line headline and
three white product cards around its lower perimeter. Smaller viewports move the
cards below the copy; below 1024px all three stack. Tablets retain straight
cards, while phones below 768px use gentle −3°/+2°/−2° fixed tilts with 36px
spacing and protected inner gutters. The existing
logo is reused unchanged. The hero's bottom note and visible motion control were
removed at the user's request.

All content is visible in static HTML, including when JavaScript is disabled. A
landing-only inline head guard prepares optional targets before paint using zero
opacity (no pending blur or layout removal) and scaleX(0) for decorative fills.
The entry must claim this preparation within two seconds after registering its
observers and release handlers. A missed deadline or setup fault permanently
releases sharp content and filled bars; late code never hides it again. Initial
hash/restored-scroll navigation, early interaction, unsupported animation APIs,
and reduced motion take the static path. Hero copy, CTAs, navigation, and FAQ
controls are always available.

Ordinary startup viewport resize does not expire preparation. Before an entrance
starts, controllers measure the current viewport during initialization; after
initialization, existing resize handlers settle active effects and reconcile
rendered targets. Resizing never extends or resets the two-second deadline.

The small bundled script adds a 900ms center-out card entrance, staggered by 80ms,
with transient opacity and blur. Separate wrappers then float over distinct
5.5–7-second cycles, traveling 14px on desktop and 10px below 1024px. Hero copy
and CTAs never move. Floating pauses while the hero is offscreen, the document is hidden, or keyboard focus is inside the hero. Leaving
view during an entrance finishes it immediately so cards remain readable.
Reduced motion disables motion and card rotation; changing that preference
cleans up active effects. Returning from BFCache restores optional floating
without repeating completed entrances. The preparation guard is bounded and
independent of floating/FAQ enhancements; there is no canvas, WebGL, GSAP, or
Three.js dependency.

Section headings and supporting copy reveal once on approach over 850ms with
24px travel, transient 6px blur, and 100ms paired-copy offsets. The calendar frame
settles over 700ms before its twelve desktop events enter over 800ms, staggered
80ms. Below 1024px, the same data becomes a chronological day-grouped agenda whose
events enter on approach after the frame settles. Parent and child blur are
sequenced; child pending states are opacity-only. The compact agenda initially
shows Monday–Wednesday only after successful on-time initialization. A native
Thursday–Sunday disclosure supplies bilingual “Show all 7 days” / “Show only 3
days” labels, preserves all twelve lessons, and remembers actual compact user
intent across desktop transitions. Desktop opens all seven columns. SSR, reduced
motion, failed/late entry, and no-JavaScript paths start with the full week; if a
no-JavaScript disclosure was closed, its summary remains available on desktop.
Expanding unseen lessons lets them reveal on approach; collapsing settles active
contained animations without scrolling the page. Balance fills animate with scaleX over 750ms, staggered 80ms after the
workspace reveal. Their existing decorative widths are available at every size;
numeric hours remain the authoritative information.

Calendar tones and workspace avatars use indigo `#533AFD`, bright blue
`#17B5F3`, and orange `#F79303`, all with white text/initials. The user explicitly
approved the approximately 2.35:1 blue and 2.30:1 orange white-text contrast
exception; preserve the requested exact palette. The decorative book spine has
its own deeper-blue token. Tutor initials are indigo/white. All remaining-hour fills stay indigo,
independent of tone, without changing their illustrative widths.

The closing section has six substantial white tiles containing original, mostly
filled SVG product symbols: calendar, clock, pencil, book, student, and chat.
Their neutral gray, navy, golden-orange, and cyan symbols occupy about 55–65% of
the tile face, with a dedicated subtle shadow. Fixed tilts and 12px floating
cycles remain; tablet reserves top/bottom space, and mobile retains four
tiles with 8px motion. Hero and closing loops suspend offscreen, in hidden tabs,
and during keyboard focus within their sections. Animations enhance static HTML with the bounded preparation contract;
unsupported APIs or setup faults leave readable content and filled bars. Interrupted reveals settle and completed effects do not replay after
preference changes or BFCache restores. Pending targets also release on
bailouts, hidden documents, focus/hash navigation, and cleanup; rendered items
skipped above the viewport settle, while closed native details are not marked
seen. There is no pinned scrolling. For diagnostics, `window.tutorpalRevealBoot`
and the root `data-reveal-boot` expose preparing/claimed/expired state. The root
`data-reveal-reason` reports expiration and clears on preparation or claim. Targets
expose `data-motion-phase` (pending/revealing/settled) and persistent
`data-motion-done`; the week disclosure exposes `data-agenda-phase` and
`data-compact-expanded`.

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
