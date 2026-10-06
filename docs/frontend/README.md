# Frontend Documentation

- [Error Handling](error-handling.md)
- [Authenticated Screen Layout](screen-layout.md)
- [Form Handling](form-handling.md)
- [React Query API Integration](react-query-api-integration.md)
- [Date-Time Handling](date-time.md)

## Marketing site

The public marketing app is separate from the authenticated frontend. See its
[README](../../marketing-frontend/README.md) and
[design direction](../../marketing-frontend/DESIGN.md). Astro prerenders complete
English HTML at `/` and Thai HTML at `/th/`. The homepage uses a cool-white canvas, navy oversized typography, indigo CTAs,
and three floating white hero cards. Its weekly calendar has twelve English
lessons and a separate four-student math workspace. IELTS, SAT, and Thai A-Level
data are fictional examples; the copy serves independent tutors across subjects.
The calendar uses one semantic data source for the desktop grid and mobile agenda,
without scroll pinning. Min’s featured SAT Math hero/reminder lesson stays separate
from the English schedule. Smaller layouts stack all three hero cards beneath the
copy; phones below 768px use −3°/+2°/−2° tilts and tablets keep them straight.
Below 1024px, successful early initialization shows Monday–Wednesday with a native
disclosure for the remaining four days. Server-rendered HTML contains the full
week, open by default. Compact expansion intent survives breakpoint changes.
The original logo is unchanged; the bottom hero note and
motion button are omitted by the approved direction. Lightweight optional CSS
motion honors reduced motion and suspends floating offscreen or in hidden tabs.
One-shot heading/product reveals sequence calendar frame and event motion. A
landing-only head guard prepares optional targets before paint without blur,
then hands ownership to initialized controllers. An unclaimed two-second deadline
or setup failure permanently restores sharp content and full bars. Late entry,
initial deep links, restored scroll, and early interaction cannot re-hide content.
Ordinary viewport resize before initialization preserves preparation; controllers
measure the current layout, while resize after initialization settles active
effects. The root's `data-reveal-reason` identifies why a static fallback was used.
Decorative balance fills remain visible at all sizes; numeric hours remain
primary. Calendar items and workspace avatars use indigo `#533AFD`, blue
`#17B5F3`, and orange `#F79303`, with white text/initials; every hour fill is indigo.
The requested white-on-blue/orange pairs are documented contrast exceptions
(approximately 2.35:1/2.30:1), not WCAG AA text pairs.
The closing CTA has original filled SVG object tiles with guarded floating
motion. Optional FAQ height/fade animation retains native multi-open details and
reverses interrupted toggles. Disabled JavaScript and enhancement failure retain
complete readable content and filled bars.
The primary CTA opens `https://app.tutorpal.io`; this site does not enable
signup, collect leads, or implement a beta endpoint. Language selection uses
ordinary links, without browser-language redirects or persisted preferences.
See [image provenance](../marketing-assets/README.md) and the
[exploration archive](../prototypes/README.md) for source material.

## Language and typography

The frontend bundles English and Thai UI resources. It uses a device-local
preference only: a saved choice in `localStorage` under `tutorpal-language`
takes precedence over the browser language, and unsupported browser locales
fall back to English. The authenticated top bar is the only explicit language
selector; language is not stored in the API or user profile.

Use the shared `"Inter", "Noto Sans Thai Variable", sans-serif` font stack.
Do not apply a Thai-only document font rule: this fallback order intentionally
keeps Latin text in Inter and renders Thai glyphs with Noto Sans Thai within the
same mixed-script string.
