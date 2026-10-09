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
and four floating white desktop hero cards. The lesson card has a peach Scheduled
tag. Its weekly calendar has twelve English
lessons and a separate four-student math workspace. IELTS, SAT, and Thai A-Level
data are fictional examples; the copy serves independent tutors across subjects.
The calendar uses one semantic data source for the desktop grid and compact view,
without scroll pinning. Min’s featured SAT Math hero/reminder lesson stays separate
from the English schedule. Below 1200px, floating feature icons replace all four
cards; phones hide the calendar icon. Below 1024px, the calendar shows only
Monday–Wednesday with a matching date label and no disclosure.
The original logo is unchanged; the bottom hero note and
motion button are omitted by the approved direction. Lightweight optional CSS
motion honors reduced motion and suspends floating offscreen or in hidden tabs.
One-shot heading/product reveals sequence calendar frame and event motion. Finite
CSS hero entrances complete without JavaScript. The optional browser controller
prepares only rendered scroll targets wholly below the viewport; a late entry leaves
visible or passed content readable while unseen lower sections can still reveal.
Initial deep links and reduced motion keep scroll content static. Resize settles
active or newly visible effects and reconciles newly rendered lower targets.
An active scroll reveal keeps fading when it leaves the observer trigger band
but remains in the viewport, and settles after it moves fully offscreen.
Decorative balance fills remain visible at all sizes; numeric hours remain
primary. Calendar items and workspace avatars use indigo `#533AFD`, blue
`#17B5F3`, and orange `#F79303`, with white text/initials; every hour fill is indigo.
The requested white-on-blue/orange pairs are documented contrast exceptions
(approximately 2.35:1/2.30:1), not WCAG AA text pairs.
In the authenticated app, student initials and schedule class accents follow
the same indigo/orange/cyan tones. `getNameTone` normalizes names to Unicode NFC,
trims and collapses whitespace, lowercases without a locale, and hashes code
points to keep a name's tone stable across views; an empty name uses indigo.
Student avatars use indigo `#533AFD`, dark orange `#A85800`, or dark cyan
`#08769B` with white initials; class-group count avatars use navy `#273951`
with white text. Day-view schedules show the delivery icon inline beside its
On-site or Online label, without an icon background. Weekly calendar blocks use
darker orange and cyan fills with white labels and icons; historical status
blocks use solid status fills with white content and a leading class-color dot.
Toasts use a theme-aware card with a semantic left rail and filled status icon:
green for success, red for errors, blue for info, and amber for warnings. Loading
and plain confirmation toasts use indigo accents; existing messages and optional
descriptions remain intact.
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
