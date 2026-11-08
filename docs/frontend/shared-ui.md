# Shared UI package

`packages/ui` is the private `@tutorpal/ui` Bun workspace package shared by
the tutor and admin portals. The root `package.json` and `bun.lock` cover all four apps
and this package; install from the repository root with
`make workspace-install` or `bun install --frozen-lockfile`. The backend and marketing site use the same workspace install.

The tutor portal imports its former `components/common` controls from package
subpaths, for example `@tutorpal/ui/button` and `@tutorpal/ui/form/rhf`. The
admin portal still owns its local `src/components/ui` controls. Exported paths
are listed in `packages/ui/package.json`; each export points to TypeScript
source that the portal's Vite build compiles directly. Package code must not
import from either portal or rely on a portal's `@/` alias. Keep app-specific
behavior, including the tutor's `DateTime` API, in the app; shared calendar and
date controls use the package's private locale-aware date helper and keep
date-only values as `YYYY-MM-DD`.

Both portals import `@tutorpal/ui/styles.css` once in their entry stylesheet.
It owns fonts, semantic tokens, Tailwind setup, component styles, and Sonner
styles. Its Tailwind `@source` directive registers package components for
production CSS generation. The admin stylesheet overrides `--accent` to its
existing lavender color after that import.

`@tutorpal/ui/locales` exports English and Thai strings used by the shared
controls. Each portal merges them into its existing `common` namespace and
keeps its own i18n instance. Context-bearing libraries such as React,
React Hook Form, and react-i18next must resolve to one instance in each
portal; keep them as compatible peer dependencies when changing the package.

`DateField` accepts optional `calendarModifiers`, `calendarMonth`, and
`onCalendarMonthChange` props for callers that decorate or control the displayed
calendar month. These apply to both the desktop popover and mobile drawer.
The schedules screen supplies the `teachingScheduled` modifier to show a short
theme-colored presence line; `Calendar` adds the localized “Has a lesson” phrase
to that date's accessible label. Default date fields remain undecorated, and
schedule fetching and status eligibility stay in the tutor app.

Shared dialogs, alert dialogs, and drawers are Animate UI wrappers over Base UI.
They keep the portal, focus, dismissal, and layering contract behind the
`@tutorpal/ui` subpath seam; portal code must import those wrappers rather than
Animate UI or Motion directly. `@animate-ui/react` and `motion` are runtime
dependencies of the shared package, while both portals keep `@base-ui/react`
aligned at `^1.9.0`. Animate UI's built-in reduced-motion policy uses opacity in
place of spatial overlay transitions. Keep caller-provided focus targets,
pending-dismissal guards, and `overlayLayers` unchanged when composing a custom
overlay with the exported low-level popup and viewport components.

Shared modal, drawer, sheet, and alert-dialog backdrops use Tailwind's
`backdrop-blur-xs` (4px) in addition to their existing navy tint. The blur
applies only behind the active surface, including nested drawer content and the
jun-layout sidebar backdrop; keep the panel itself sharp and preserve each
primitive's existing animation, layering, focus, and dismissal behavior.

Run `make ui-check` and `make ui-test` at the repository root for the package,
then `make frontend-build` and `make admin-build` to verify both consumers.
Portal builds use `tsc --noEmit` because the imported package source is outside
each portal's `rootDir`. The generated `dist` directories contain the compiled
package code and styles, so direct-upload Pages deployments need no runtime
workspace files.
