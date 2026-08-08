# Authenticated Screen Layout

Screens rendered under the `/_layout` route use `ScreenLayout` from
`frontend/src/components/layout/screen-layout.tsx`. The authenticated route
shell owns only navigation, geometry, and its background.

- Use the default `ScreenLayout` padding (`p-3 sm:p-4 lg:p-6`) for regular
  authenticated screens.
- Use `padding="none"` only when a screen deliberately owns its local gutters
  and needs a full-bleed region. The schedules screen uses this for its date
  rail while retaining the same gutter tokens around its controls and results.
- Child workspace shells should use these gutters as their page edge and avoid
  adding a second horizontal padding layer to headers, toolbars, or list
  containers. Component-level padding, such as card content padding, remains
  appropriate.
- Do not apply `ScreenLayout` to authentication routes or standalone callback
  routes outside `/_layout`.
