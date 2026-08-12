# Frontend Documentation

- [Error Handling](error-handling.md)
- [Authenticated Screen Layout](screen-layout.md)
- [Form Handling](form-handling.md)
- [React Query API Integration](react-query-api-integration.md)
- [Date-Time Handling](date-time.md)

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
