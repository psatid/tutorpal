# Local verification — 6 October 2026

This record tracks the approved light Concept A redesign. The user selected the
airy perimeter hero and removed its bottom note and motion button, while requiring
the existing logo. Changes remain local on `main`; no commit, push, deployment,
backend contract, or authenticated-app change is part of this work.

## Development startup reveal repair — current

The user reported that both section reveals and the hero's shared-origin entrance
were absent on the actual Astro development page at `http://localhost:4321/`.
The preceding built-preview checks did not catch this development startup path.

- Direct browser reproduction: three fresh normal-motion root loads at scroll
  position zero all expired preparation, marked all hero cards done, and left
  zero pending reveals. A diagnostic `data-reveal-reason` exposed **early-resize**.
  An ordinary initial viewport resize was incorrectly treated as an interruption
  before the controller had initialized, permanently choosing static content.
- The fix removes only that preclaim resize bailout. Targets keep their pending
  layout and are measured at the current viewport when controllers initialize.
  Postclaim resize still settles active effects. The original two-second deadline,
  genuine input/focus/hash/scroll/hidden/failure protections and permanent
  no-rehiding fallback remain. `data-reveal-reason` remains a nonvisual diagnostic.
- A regression ran red before the fix:
  `bun test tests/reveal-boot.test.js -t 'ordinary startup viewport resize'`
  expected `preparing`, received `expired`. It now passes. Additional checks
  verify startup resize does not consume targets or extend the deadline, and
  resize after expiry cannot re-hide content. Existing active-resize, cancellation,
  missed-scroll, cleanup, reduced-motion and static-fallback coverage remains.
- `bun run check` and `bun run build` passed: zero diagnostics across 26 files,
  three routes. The independent full suite passed **65 tests, zero failures,
  2,168 assertions across eight files**. `git diff --check` passed.
- Direct fresh English and Thai dev pages now claim ownership with 21 pending
  below-fold reveal/lesson targets, an opacity-zero calendar and zero-scaled bars.
  Thai and three repeated English observations capture active `hero-spread`,
  900ms duration and 0/80/160ms stagger, with intermediate opacity/blur and
  translations toward the shared center. Calendar frame reveal keeps all twelve
  children opacity-zero and unblurred. The workspace frame reveals while its
  below-view bars remain pending; passed bars safely settle through the existing
  scroll sweep. These observations use the actual development server.
- Designer audit passed **18/20**, with no new P0–P3 findings; the existing
  approved color-contrast exception remains. Engineering review passed with no
  actionable findings and independently reran 35 regressions (1,494 assertions).
- Final preservation check confirms `main` and the pre-task staged fingerprint
  are unchanged. Existing staged/unstaged work is preserved. The regular dev page
  is left open at `http://localhost:4321/`, successfully claimed with pending
  future content; entrances finish at opacity one with no residual blur.

Evidence is saved in `/private/tmp/tutorpal-dev-reveal-evidence/browser.json`.
The production delta is bounded to `Layout.astro`, `DESIGN.md` and `README.md`;
styles, animation controllers, content/data, assets and dependencies retain their
pre-fix bytes. Earlier responsive and fallback matrices below remain applicable.
No commit, push or deployment is part of this repair.

## Earlier reveal and mobile refinement

The approved fourth revision replaces late concealment with bounded prepaint
preparation, applies the requested exact blue/orange with white text, tilts phone
hero cards, and shortens the enhanced compact agenda to Monday–Wednesday.

- The synchronous landing-only head guard prepares hero cards, section reveals,
  calendar frame/events, and balance fills before paint. Pending targets retain
  layout at zero opacity with no blur; fills use scaleX(0). Hero copy/actions,
  navigation and native FAQ controls are excluded. The initialized controller
  claims ownership only after observer/listener setup. Unclaimed preparation
  expires permanently after 2,000ms; setup failure and early interaction also
  release sharp final states. Late entry never re-hides content or collapses the
  visible full week. Initial deep links and restored scroll bypass preparation.
- Calendar and corresponding avatars use indigo `#533AFD`, blue `#17B5F3`,
  and orange `#F79303`, with white text/initials throughout. White on blue/orange
  is approximately **2.35:1 / 2.30:1**: explicitly requested contrast exceptions,
  not WCAG AA text pairs. White/indigo remains 6.19:1. All four hour bars remain
  purple at 48/72/36/60%; book-spine coloring is independent.
- Phones below 768px use −3°/+2°/−2° tilts, a maximum 440px product area,
  internal 16px side padding, 12px top/16px bottom padding, 48px separation after
  actions and 36px card gaps. Tablets remain straight. No-JS retains static phone
  tilts; simulated reduced motion removes them.
- Server HTML retains all seven days and twelve lessons in one shared renderer,
  with Thursday–Sunday inside an open native disclosure. Only timely successful
  initialization closes the compact remainder. Space/Enter expand/collapse it;
  localized summary labels and summary focus remain correct. Desktop opens the
  nested four-column remainder; returning to compact preserves user intent. A
  closed no-JS remainder retains a visible desktop recovery summary.
- Chromium reports positive geometry even for descendants of a closed native
  disclosure. Production explicitly excludes those descendants from reveal
  visibility checks, and a regression verifies they remain pending until exposed.
- `bun run check` and `bun run build` passed: 26 Astro files, zero diagnostics,
  three generated routes. `bun test tests/*.test.js` passed **63 tests, zero
  failures, 2,100 assertions across eight files**. `git diff --check` passed.
  The authenticated frontend build also passed with existing unrelated warnings.
- Lifecycle tests cover prepaint states, registration/claim ordering, the exact
  deadline race, permanent release, partial failures, absent/expired guard,
  pending and active settlement, focus/hash/resize/preferences, native agenda
  intent, breakpoint recovery, and simulated BFCache-style reconciliation.
- Engineering review identified two interruption gaps, now covered by controlled
  DOM/scheduling regressions: external parent cancellation must settle its queued
  children, and a below-to-above jump can miss an observer callback. Production
  now settles cancelled-parent descendants without launching effects and uses a
  passive, frame-coalesced scroll sweep for passed targets. Below-fold content
  and closed remainder lessons remain pending; cleanup cancels queued frames and
  rejects stale callbacks. Unavailable frame APIs use the static fallback.
- After those fixes, real browser traces show the calendar frame completing at
  1,066ms before lesson starts at 1,070ms (800ms duration, 0–880ms delays).
  The unchanged workspace sequence previously completed
  at 16,557ms before bars start at 16,561ms (750ms, 0/80/160/240ms delays).
  All settled effects clear blur and remain visible when revisited.
  A repeated native page-end jump leaves zero passed pending targets and all bars
  settled. Both locales also pass the fixture's removed-frame-API fallback with
  no pending targets, reveal calls or runtime errors and the full week open.
- Both locales were inspected at 320, 390, 768, 1024 and 1440px. Computed colors,
  white event text/initials, three compact versus seven desktop days, original
  bar widths, and phone/tablet rotations match. No page overflow or collisions
  with actual headline/copy/button rectangles were found across the complete
  0→−10/−14px hero and 0→−8/−12px closing floating envelopes. Full-width action
  containers were excluded from collision checks because their empty side space
  is intentionally occupied by desktop perimeter cards.
- Both locales received real approximately 2.8-second entry delays. Pre-entry
  samples show opacity zero/no blur/empty bars, followed by sharp visible content
  and full bars at approximately 2.07–2.09 seconds; late entry adds no reveals and
  keeps the full week. Actual HTTP 503 entry failures release immediately. Removed
  or inert guard, removed observer/animation APIs, and CSP-blocked all-script
  experiences also retain sharp content, full bars, native controls and full week.
  Initial hash navigation bypass and native FAQ keyboard opening/closing passed.
- Approximately 200% zoom passed in both locales using CSS zoom and scaled
  media-query conditions. A fixture defect that also scaled ordinary max-width
  declarations was corrected and regression-tested before accepting these
  results. This is a simulation, not native browser zoom. Reduced motion is also
  simulated; real OS preferences, hidden-tab/BFCache behavior, a full screen-reader
  session and production performance are not verified by this record.
- Designer audit: **PASS, 18/20**, with no new P0–P3 findings. The accepted
  white-on-blue/orange contrast exception accounts for the accessibility score;
  the result is not described as fully WCAG AA conformant.
- Repeated engineering review: **PASS**, with no remaining actionable P0–P3
  findings. Both interruption defects are resolved; the reviewer independently
  reran 27 focused regressions (1,342 assertions). The full independent suite
  remains 63 passing tests and 2,100 assertions.
- Final preservation check: branch remains `main`, the staged diff fingerprint
  matches the pre-task snapshot, and nineteen baseline copy/data/FAQ/routes/
  assets/dependency/config files remain byte-identical. Existing staged and
  unstaged work was preserved; no commits, pushes or deployment were performed.

Current runtime/layout evidence: `/private/tmp/tutorpal-reveal-evidence/browser.json`.
Production screenshots: `tutorpal-playful-mobile-hero.png` and
`tutorpal-three-day-agenda.png` in the task's visualization directory. The source,
test and documentation delta preserves the original logo, copy/example data,
LINE message, destinations, metadata, assets, packages, backend and authenticated
app. No commits, pushes or deployment are part of this revision. The earlier
records below describe their historical palettes and fallback behavior.

## Earlier palette and footer refinement

The latest browser comments replace mint/coral product accents with the supplied
cyan/golden-orange reference, request white workspace avatar initials and uniform
purple hour fills, and refine the closing artwork toward the live
[ChronoTask footer](https://chronotasks.vercel.app/).

- Calendar roles: indigo `#533AFD` / white, orange `#FF980B` / navy `#0D253D`,
  cyan `#0FA7DB` / navy. Navy contrast is 7.23:1 on orange and 5.61:1 on cyan;
  white would produce only 2.15:1 and 2.77:1, so navy is retained there.
- Workspace avatar roles use deeper same-hue orange `#A66100` and cyan `#06779F`
  with white initials (4.85:1 and 5.06:1); indigo/white remains 6.19:1. Toolbar
  and sidebar tutor initials use indigo/white too. All four remaining-hour fills
  use indigo, preserving 48/72/36/60% widths and numeric balances.
- Six original filled SVG objects replace thin multicolor drawings. Neutral
  calendar/student/chat, navy clock, orange pencil, and cyan book sit on the
  existing white tiles with a dedicated diffuse shadow. Tile dimensions,
  positions, counts, rotations, motion layers, and guards are unchanged.
- `bun run check`, `bun run build`, and the existing smoke/lifecycle suite pass:
  eighteen files, zero diagnostics, three routes, 37 tests and 950 assertions.
  No new test framework or implementation-mirroring style tests were added.
- Real computed-style and geometry observations on the unmodified page pass in
  English/Thai at 320, 390, 768, 1024, and 1440px. All workspace initials are
  white; all bars are indigo; exact role colors match. No horizontal overflow,
  escaping product content, or collisions between closing text/actions and the
  full floating envelopes were found. Mobile has four tiles; larger layouts six.
- Desktop calendar/workspace/footer and Thai mobile workspace/footer screenshots were
  inspected. Current evidence: `/private/tmp/tutorpal-accent-evidence/`.
- Designer audit: **PASS**, 19/20, with no P0–P3 findings. Final engineering
  review: **PASS**, with no actionable findings.
- Final baseline comparison limits changes to the intended CSS, six closing SVG
  interiors, and relevant documentation. The staged diff remains byte-for-byte
  unchanged on `main`; no commits, pushes, or deployment were performed.

This revision changes only CSS, closing SVG interiors, and documentation. Copy,
lesson/student data, logo and social assets, routes, packages, and all animation
scripts retain their baseline bytes. The preceding motion/FAQ/fallback browser
matrix was not rerun for this visual-only change; the unchanged controllers were
covered by the regression suite. Native zoom, OS reduced motion, real hidden-tab
and BFCache behavior, full assistive-technology coverage, and production performance
remain subject to the earlier documented limits.

## Earlier motion and playful accents revision

The subsequent approved revision adds one-shot heading/product reveals, sequenced
calendar entrance, decorative balance-fill animation at all sizes, stronger hero
floating, saturated calendar/avatar tones, original closing icon tiles, and
reversible FAQ motion. The light Concept A layout, logo, copy, links, factual
examples, removed note/button, assets, metadata, and app/backend contracts remain.

- `bun run check` and `bun run build` passed after implementation and test updates:
  zero Astro diagnostics across eighteen files and three generated routes.
- Static HTML stays sharp and visible; bar widths remain 48/72/36/60%, with
  `aria-hidden` decorative fills and authoritative numeric hours.
- Source implements interrupted-animation settlement, disposal-safe queued
  callbacks, one-shot completion preservation, and reduced-motion/visibility/
  resize/BFCache handling. Unsupported enhancement APIs keep native content.
- Independent tester: **PASS**, with 37 passing tests, zero failures, and 950
  assertions. New coverage includes calendar/workspace sequencing, queued-child
  settlement, disposal and stale callbacks, one-shot completion, closing loops,
  and reversible FAQ height/state/resize/API-failure behavior.
- Browser: both languages at 320, 390, 768, 1024, and 1440px have no horizontal
  overflow, escaping product content, or hero/closing text and CTA collisions
  across calculated full floating extents. All four hour bars remain visible;
  mobile shows four closing tiles, tablet/desktop six.
- Runtime traces confirm the 700ms calendar frame finishes before its 800ms
  lesson cascade, with delays 0–880ms in 80ms increments. Mobile initially
  reveals nearby lessons with no cascade delay, then reveals later groups on
  approach. The 850ms workspace reveal finishes before 750ms bar fills with
  delays 0/80/160/240ms.
- Keyboard FAQ tests confirm rapid reversals, multiple open answers, and `open`
  retained until closing finishes. Thai resizing and preference changes settle
  to the intended state without temporary height/overflow styles or clipped
  text. Native disclosures work when the entry script is blocked or fails.
  Focusing the closing CTA pauses all six decorative loops.
- Both locales retain sharp content, filled bars, and no loops with blocked
  scripts, simulated reduced motion, or a real HTTP 503 entry failure. A delayed
  external entry took approximately 2.8 seconds, retaining 55–56 pre-entry
  samples with all hero cards fully visible, unblurred, and stationary.
- Saturated text contrast is 6.19:1 for white on indigo, 6.41:1 for navy on coral,
  8.38:1 for navy on mint, and 10.94:1 for navy on decorative yellow.
- Designer audit: **PASS**, 18/20, with no P0/P1/P2 design defects. One optional
  P3 maintenance observation remains: shared accent literals could become
  named tokens; current values and contrast match the approved palette.
- Final engineering review: **PASS**, with no actionable P0–P3 findings. The
  reviewer checked the full motion/accent delta against the preserved baseline,
  lifecycle tests, browser evidence, and documentation.
- Final preservation check confirms the staged diff is byte-for-byte unchanged,
  the branch remains `main`, and baseline copy/data/routes/assets/dependencies
  are unchanged. No commits, pushes, or deployment were performed.

Current browser evidence is in `/private/tmp/tutorpal-motion-evidence/`, including
unmodified-page desktop/mobile screenshots and responsive, timing, FAQ, and
fallback JSON. Approximately 200% zoom uses documented CSS scaling and adjusted
pixel queries; reduced motion uses simulated preferences. Enlarged settled
layouts pass in both languages, but these do not verify native browser zoom or
OS preferences. Hidden/offscreen/cancellation behavior has lifecycle coverage;
real hidden-tab/BFCache behavior, a full screen-reader session, and production
performance benchmarks remain unverified. Earlier results below describe only
the preceding light redesign.

## Earlier light redesign — implementation checks


- `bun run check` and `bun run build` passed after the light source implementation
  and updated tests: zero Astro diagnostics across fourteen files and three
  generated routes.
  Removing the legacy WebGL code also removed its large-chunk warning.
- English and Thai share semantic page markup with complete static content.
  The hero note, pause control, light canvas, filament, and preparation boot are
  absent. Original icon files remain unchanged.
- The same twelve English lessons and four math students remain in `lessons.ts`.
  Min’s separate SAT Math lesson is Thursday, 8 October, 16:00–18:00, with 2 hours
  reserved from a 10-hour balance to leave 8 hours. Its reminder is at 15:00.
  The exact backend-shaped English message remains in both locales.
- Theme color, per-locale titles, sharing-image alt text, custom 404 styling, and
  native SVG/PNG sharing artwork match the light direction. Canonicals, locale
  alternates, app destinations, and organization metadata retain their contracts.
- Optional hero motion uses CSS and a small script. Static/no-JavaScript content
  is immediately visible. Reduced motion, offscreen/hidden suspension, resize
  completion, preference changes, and BFCache lifecycle have explicit safeguards.

## Earlier light redesign — independent gates

- Frontend tester: **PASS**, with 22 passing smoke/lifecycle tests, no failures,
  and 644 assertions. Coverage includes links, metadata, exact lesson and LINE
  data, original logo bytes, static content, entrance origins and staggering,
  interrupted entrances, offscreen/hidden suspension, resizing, cleanup, and
  unsupported or failed initialization.
- Browser: English and Thai at 320, 390, 768, 1024, and 1440px had no horizontal
  overflow or settled card/copy/action collisions. Desktop week/mobile agenda,
  student workspace, Thai typography, original logo, and all lower sections were
  inspected. Both locales' enlarged layouts remained readable without overflow.
- Interaction: native FAQ works with all scripts blocked. Mobile navigation
  opens and closes; enhanced Escape dismissal returns focus to its summary.
  Hero keyboard focus and scrolling the hero entirely offscreen pause floating.
  The hero note and visible motion control are absent in both locales.
- Motion: the browser reports 900ms entrances staggered 0/80/160ms and floats
  lasting 6.6/7.4/8 seconds. Reduced-motion changes settle cards sharply, then
  resume floating without replaying completed entrances. Script-disabled and
  real HTTP 503 entry-failure cases show all three cards immediately at opacity
  1 with no blur or animation. A 2.8-second delayed entry retained 55 pre-entry
  samples per locale with all three cards fully visible and static.
- Contrast: muted text is 4.69:1 on the soft background, white primary-button
  text is 6.19:1 on indigo, and navy text exceeds 14:1 on both canvases.
- Designer audit: **PASS**, Impeccable health score 18/20, with no P0/P1/P2
  findings. Concept A, original logo, and both requested removals are confirmed.
  One optional P3 maintenance observation remains: navigation and CTA hover use
  the same literal indigo value instead of a shared hover token; this has no
  current contrast or usability defect.
- Final engineering review: **PASS**, with no actionable P0–P3 findings. The
  reviewer compared the complete task delta against the pre-task snapshot,
  confirmed unchanged routes/assets/data/contracts, and reviewed motion cleanup,
  test adequacy, dependency removal, and documentation accuracy.

Browser evidence is saved locally in `/private/tmp/tutorpal-light-evidence/`,
including desktop/mobile screenshots, responsive measurements, and fault-case
observations. Fixture-only reduced-motion preference simulation and CSS scaling
approximate 200% zoom; actual OS settings and native browser zoom were not tested.
CSS scaling differs from native zoom during entrance geometry, so enlarged
collision checks describe settled layouts. Hidden-document behavior is covered
by lifecycle tests; real hidden-tab behavior and a BFCache navigation round trip
remain unverified. A complete screen-reader session was not performed.

See the [test guide](tests/README.md) for commands and local fixture details.
