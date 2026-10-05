# Frontend Documentation

- [Error Handling](error-handling.md)
- [Authenticated Screen Layout](screen-layout.md)
- [Form Handling](form-handling.md)
- [React Query API Integration](react-query-api-integration.md)
- [Date-Time Handling](date-time.md)

## Marketing site

The public marketing app is separate from the authenticated frontend. See its
[README](../../marketing-frontend/README.md),
[product story](../../marketing-frontend/PRODUCT.md), and
[design direction](../../marketing-frontend/DESIGN.md). The Relay-inspired
homepage combines a pale ice canvas, semantic SAT product scenes, violet
WebGL filaments, and scroll-driven product framing. Presence, Change, Closure,
and Readiness lead into a contracting wordmark, signup, and native FAQ.
One bounded sticky hero works across desktop and phones, with shorter holds on
small screens. Motion is enabled without a visible toggle; a short intro gives
way to event-driven rendering with zero idle frames. Reduced motion, disabled JavaScript, and rendering failures
retain a complete static presentation. English/Thai support, the privacy route,
and the beta endpoint remain; the homepage beta form and its anchors are removed.
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
