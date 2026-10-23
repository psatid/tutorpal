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

Run `make ui-check` and `make ui-test` at the repository root for the package,
then `make frontend-build` and `make admin-build` to verify both consumers.
Portal builds use `tsc --noEmit` because the imported package source is outside
each portal's `rootDir`. The generated `dist` directories contain the compiled
package code and styles, so direct-upload Pages deployments need no runtime
workspace files.
