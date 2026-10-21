# Authenticated Screen Layout

Screens rendered under the `/_layout` route use `ScreenLayout` from
`frontend/src/components/layout/screen-layout.tsx`. The authenticated route
shell owns only navigation, geometry, and its background.

Authenticated route content is wrapped in `ContentReveal`, which shares the
opacity and 4px blur reveal used by Tabs panels. Each pathname change replaces
the current `Outlet` wrapper and reveals the new page over 500 ms; the sidebar
and impersonation banner stay stationary. The wrapper is keyed by pathname,
so search-parameter changes do not replay the page reveal. It fills the
available content height and honors the user's reduced-motion setting. Nested
Tabs panels skip their first reveal to avoid stacking a second entrance
animation, while later tab changes keep the shared transition. Mobile Add
buttons render through a body portal so the page blur does not change their
fixed viewport positioning; they use the same reveal transition. Reuse
`ContentReveal` from
`frontend/src/components/ui/animate-ui/components/base/content-reveal.tsx` for
other components that need the same entrance and exit behavior; wrap keyed
children with `AnimatePresence` when an exit animation is needed.

- Use `ScreenLayout` on authenticated screens. It owns the page background and
  responsive gutters (`p-3 sm:p-4 lg:p-6`); child screens should not add a
  second page-edge padding layer.
- Use `ScreenLayoutEdge` for a horizontal rail that must reach beyond those
  gutters. By default it cancels the gutters at every width; `mobileOnly`
  cancels them below `sm` and keeps the normal content edge above it. The
  wrapper does not own scrolling or add a transform, so the rail keeps its
  own scroll behavior and leading/trailing inset.
- Home uses the mobile edge variant for the populated and loading confirmation
  rails. Schedules uses the default edge variant for its Day and Week date
  rails and the mobile edge variant for the populated Week timeline. Its
  controls, loading/error states, and Day results keep the regular gutters.
- Child workspace shells should use these gutters as their page edge and avoid
  adding a second horizontal padding layer to headers, toolbars, or list
  containers. Component-level padding, such as card content padding, remains
  appropriate.
- Do not apply `ScreenLayout` to authentication routes or standalone callback
  routes outside `/_layout`.
