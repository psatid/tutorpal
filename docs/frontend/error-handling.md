# Frontend Error Handling

TutorPal uses TanStack Router boundaries for failures that prevent a route from
rendering and for URLs that do not match the route tree.

## Global route errors

The router's `defaultErrorComponent` renders the shared fallback in
`frontend/src/components/route-fallback.tsx`. It provides:

- Friendly copy without exposing exception messages or stack traces
- Development-only console logging for the caught error
- A retry action that calls `router.invalidate()` so route data is loaded again
- A dashboard link for recovery when retrying does not help

The fallback is full viewport and intentionally does not use the authenticated
sidebar or layout. The heading receives focus when the boundary appears.

The authenticated `/_layout` route also sets the same `RouteError` as its
nearest `errorComponent`. Keep this boundary whenever changing the protected
route hierarchy so authenticated-route failures replace the application shell
with the shared full-viewport fallback. The router default remains in place
for public routes and routes without a closer boundary.

The shared fallback renders at the document level. While active, it marks the
app root `aria-hidden` and applies the native `inert` attribute, preventing the
underlying application from being exposed to assistive technology and, in
browsers that support `inert`, from receiving interaction or keyboard focus.
It also uses a document-level focus guard: Tab and Shift+Tab cycle through the
fallback actions, and any focus that lands outside the fallback returns to its
first action. This keeps keyboard focus isolated even when native `inert` is
not supported. The fallback restores any pre-existing values for both
attributes and removes the focus listeners when it unmounts.

## Unknown URLs

The root route owns `notFoundComponent`, and the router uses `notFoundMode:
"root"`. This keeps unmatched public and authenticated URLs on the same
global 404 surface. Do not add the deprecated `NotFoundRoute` API.

## Resource-specific states

Student and class detail screens may continue to show their own contextual
not-found states because those states include entity-specific recovery context.
If a future route loader throws TanStack Router's `notFound()`, it will use the
global root fallback unless a more specific boundary is deliberately added.
