# Marketing verification

Run from `marketing-frontend/`:

```sh
bun install --frozen-lockfile
bun run check
bun run build
bun test tests/*.test.js
```

The built-output smoke suite uses Bun's HTMLRewriter without extra dependencies.
It verifies both locale pages, exact approved headline and supporting copy,
white theme metadata, app and section links, the twelve English lessons in the
5–11 October calendar, empty Sunday, the separate featured math lesson and
10 → 8 h balance, exact English LINE message, four native student table rows
and their header associations, local assets, sitemap, robots, and custom 404.
It checks the existing logo bytes and that the hero has no bottom note, pause
control, or canvas. Landing routes have exactly one local before-paint guard;
the 404 has none. It also checks the four desktop hero cards, four tablet hero
feature icons, six phone hero feature icons, both calendar labels, the four decorative balance fills, and all six closing SVG tiles
remain hidden from assistive technology and outside the tab order.

The lifecycle suite executes `setupMotion` with small DOM boundary doubles. It
checks the shared entrance origin below the CTA, 80ms stagger, completion state,
offscreen and document-visibility pause/resume, interrupted entrance settlement,
resize settlement, completed-content replay prevention, listener cleanup,
unsupported-observer fallback, and partial setup failure. It does not render
CSS or substitute for browser checks of animation, geometry, focus, reduced
motion, and BFCache restoration. The section lifecycle suite additionally checks
frame-before-calendar-event and workspace-before-bar sequencing, compact calendar
approach behavior, interrupted descendant settlement, cancelled/stale callback
safety, one-shot replay prevention, missing WAAPI, and closing loop cleanup.
The emitted-guard suite controls clock/event boundaries to cover the 2,000ms
unclaimed deadline, exact-boundary claim races, ordinary startup resize preserving
preparation without extending the watchdog, listener cleanup, early interaction,
restored/hash/reduced/unsupported bypass, and permanent release. Section tests cover
pending cleanup, ownership claim after registration, partial registration faults,
missing/expired guard, focus/hash settlement, externally cancelled parents' queued
children, and a passive coalesced scroll sweep when fast jumps deliver no observer
transition. Queued/stale frame cleanup and missing RAF fallback are covered.
The compact calendar has no disclosure state or agenda controller.
Main tests use synthetic pagehide/pageshow and preference events to verify state
reinitialization; these do not prove real browser BFCache eligibility.

The FAQ lifecycle suite covers measured height/fade, multi-open state, rapid
reversal from rendered height, stale completions, resize, native state preservation,
cleanup, and animation API failure. Its DOM doubles model natural-height restoration
on cancellation; actual geometry and keyboard semantics still require browser checks.

For browser checks, start the local fixture server:

```sh
bun tests/browser-fixture.js
# If another local service owns 4323:
TUTORPAL_QA_PORT=4326 bun tests/browser-fixture.js
```

Visit `http://127.0.0.1:4323/?qa=MODE` or `/th/?qa=MODE`, using the configured
port if overridden:

| Mode | Actual test condition |
| --- | --- |
| `nojs` | Response CSP blocks all scripts. Check complete content, native FAQ/menu, and app/locale links. |
| `reduced` | Before the guard and site entry load, `matchMedia` reports reduced motion and equivalent static CSS is applied. This simulates preference handling; it does not verify an OS setting. |
| `reducedToggle` | The test control toggles simulated `matchMedia` change events and corresponding CSS. Verify static final cards when enabled and no repeated entrance for completed cards when disabled. |
| `diagnostic` / `performance` | Observe real CSS loops and WAAPI calls, animation duration/delay/keyframes, reveal phases, FAQ heights/open state, hidden/offscreen/focus status, overflow, and buffered LCP/CLS. Local timings are diagnostic only. |
| `delayedMotion` | Delays the actual bundled entry response by 2,800ms. If Astro inlines the entry, the fixture externalizes its exact bytes to a test-only URL first. Preparation must release at the 2,000ms unclaimed deadline; late entry keeps all targets settled. |
| `failedMotion` | Returns HTTP 503 for the actual bundled entry or the test-only externalized inline module. The guard releases immediately on entry error (or by its two-second deadline), leaving sharp readable content and full bars; native FAQ/menu still work. The module also owns optional menu dismissal, so enhanced Escape/outside-click dismissal is unavailable in this deliberate failure mode. |
| `missingBoot` / `blockedBoot` | Removes only the head guard or gives it an inert script type. The real entry still runs and must never hide readable content. |
| `unsupportedObserver` / `unsupportedAnimation` / `unsupportedFrame` | Removes IntersectionObserver, WAAPI, or RAF scheduling before the guard runs. Reveals stay static; native controls remain available. |
| `zoom200` | Applies `html { zoom: 2 }` and doubles pixel viewport breakpoints in served CSS and `matchMedia`, approximating layout at half the available CSS width/height. This is CSS scaling, not native browser zoom. Device pixel ratio, viewport units, and browser UI behavior are not equivalent. |

Astro may emit an external entry or inline a small site module in shipped HTML.
Fault modes delay/fail the actual external entry. If the entry is inline, they
replace its tag with a local `/_qa/entry.js` request containing the exact
production module bytes. This enables genuine HTTP delay/failure without editing
production code; it changes request timing and may change parser scheduling.
The original production entry remains untouched in all other modes.

The fixed QA panel adds test-only DOM and script overhead and may affect
performance observations. Use an unmodified page for final layout/performance
judgment. The fixture reads current `dist/` on every request; rebuild then reload
after source changes. Locale links intentionally follow production destinations
without preserving the QA query, so visit explicit fixture URLs for each locale.
The server binds only to `127.0.0.1`. Tests are outside `public/` and `dist/` and
are excluded from Workers deployment.

Every scripted mode exposes JSON in `#qa-status` and `#qa-transitions`.
Status reports each card's entrance name/duration/delay and inner floating
animation name/duration/play state, phase (`static`, `entering`, `ready`),
completion, opacity, and filter. It also reports actual document hidden state,
hero offscreen state, focus within the hero, the app's motion-running flag,
canvas count, and the number of currently transparent reveal/calendar elements
(including intentional active reveals). `reveals` reports each target's phase,
computed styles, and active WAAPI timing; `faqs` reports open state, phase,
measured height, inline styles, and active animation count. `closing` reports loop
state and CSS timing for six tiles. `animationCalls` records up to 120 actual
WAAPI calls with target IDs, keyframes, options, start/end time, and completed or
cancelled outcome. The transition history samples every 50ms and retains up to
160 reveal phase changes. These are observed API calls and computed styles,
not substitutes for application motion.
The delayed entry also delays `DOMContentLoaded`, so use the visible page or
a DOM snapshot before that event to inspect the pre-entry static fallback.
Every scripted mode retains `preEntry` samples in status. Instrumentation runs
before the head guard; a parser MutationObserver plus a 50ms timer samples all
hero, generic reveal, frame, calendar item, and bar targets before main setup.
Samples include boot/root/reason, target phase/done, opacity, filter, transform,
and animation name, showing preparation and deadline release during a delayed
or failed entry. Parser samples may contain only the targets parsed so far.
Status also reports current guard deadline/reason.

Review both locales at 320, 390, 768, 1024, and 1440px, approximate 200% zoom,
and keyboard-only navigation. Check content bounds as well as document overflow.
At 1200px and above, four compact cards stay at the hero perimeter without crossing
the headline or actions. Below 1200px they are hidden and four distinct feature
icons remain on tablets; phones add the pencil and book below the CTAs. Reduced
motion keeps every card and icon static. The same twelve
calendar items form a seven-day desktop week and a Monday–Wednesday compact agenda,
with time, curriculum, level, and student. Check the 5–11/5–7 labels at the 1024px
boundary. Headlines and CTAs stay stationary.

For motion, inspect the 900ms entrance with delays 0, 80, and 160ms, and the
subsequent 14px desktop/10px compact float with distinct 5.5, 6.3, and 7-second durations. Scroll the
hero offscreen, return, resize before entrance completes, move focus to a hero
CTA, hide/show the document, and toggle simulated reduced motion. Offscreen,
hidden, or focused floating must pause; interrupted entrances settle fully.
Reduced motion must remove animation and card angles. A pagehide/pageshow
BFCache round trip should remove/reinitialize optional effects without replaying
completed entrance. Synthetic events can check handlers, but do not prove
browser-specific BFCache eligibility; a real navigation round trip is stronger.

Check generic reveals finish over 850ms from 24px/6px blur, with supporting body
copy delayed 100ms. The 700ms calendar frame must settle before desktop events
start at 800ms with 80ms stagger; below 1024px, visible agenda events reveal individually
on approach. Workspace must settle before 750ms balance fills start with 80ms
stagger. Resize, fast scrolling, or hiding the document during a parent reveal
must settle its descendants instead of launching simultaneous parent/child blur.

Closing tiles float 12px over 6–8s; mobile keeps four tiles with 8px float above
and below copy. Check the maximum motion envelope against copy and CTA bounds,
not only the instantaneous positions. FAQ keyboard Space/Enter must support
multiple open answers and rapid reversible 320ms height/fade transitions. After
completion, resize, reduced motion, or cleanup, answers must have natural height
with no leftover inline height/overflow or animation. No-JS and failed-entry
states must keep native disclosures working.
