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

## Component styling and review

Common components own their visual language. Express visual size and appearance
through shared `size` and `variant` props wherever those differences exist.
Use an existing supported prop when it expresses the intent. A component that
has no visual variation does not need meaningless size or variant options;
native input `size`, for example, is a character-width attribute, not a visual
size API.

Before introducing a caller styling override, flag the need for a decision:
use an existing shared option, adjust the common component's API, or approve a
specific exception. The user decides whether the shared component should change.
Keep positioning and surrounding layout on a caller-owned wrapper where
practical. Do not add ad hoc size or appearance classes to bypass the component
API while that decision is pending.

Frontend reviews must include a **Common-component styling** section covering
every changed call site that passes `className`, `style`, styling slot props
such as `positionerClassName` or `classNames`, or custom styling to variant
helpers such as `buttonVariants`. Inspect computed values and prop spreads as
well as literal classes. Include descendant selectors on wrappers that restyle
common-component internals. Scope includes `@tutorpal/ui`, admin-local UI
primitives and form wrappers, and reusable app compositions such as workspaces
and screen layouts; common-component implementation styles belong to their
owner and must be distinguished from caller overrides.

For each flag, record:

- File and line, component, exact styling, and intended behavior.
- Whether it affects size, appearance, internal descendants, dynamic content,
  or outer placement only. Flag placement-only styling too; classification is
  not approval.
- Existing shared props that could express it, or the missing shared capability.
- The proposed decision and its status: pending, or an explicit user-approved
  exception with a reference to that decision.

Flag redundant defaults, legitimate skeleton geometry, dialog surface
composition, tokenized avatar colors, and accessibility hit-target adjustments
for the same review; none is automatically a defect or an approved exception.
Do not remove styles, invent variants, or waive touch targets just to clear a
flag. Keep pending styling decisions separate from P0–P3 functional defects.
An existing exception applies only to its documented scope. If no custom
styling is present, state that explicitly. A review is incomplete when it omits
this check or silently accepts an override; an unreviewed new override must be
resolved before the implementation gate passes. Existing audit candidates
remain a decision queue rather than authorization for a broad rewrite.
Record accepted API adjustments or scoped exceptions in the relevant design or
convention doc so later reviews can cite the decision; existing code alone is
not evidence of approval.

See the [project styling audit](common-component-styling-audit.md) for the
current inventory and proposed decision groups. This is a manual review rule;
no lint or CI enforcement is installed by this convention.

## Alerts

Use `@tutorpal/ui/alert` for bordered notification boxes in either portal.
`Alert` owns colors, spacing, and the layout of `AlertIcon`, `AlertTitle`,
`AlertDescription`, and `AlertAction`. Choose `variant="default"`, `"warning"`,
or `"destructive"` and `size="default"` or `"compact"`; both props default to
`"default"`. Compact alerts use 12px horizontal and 6px vertical padding.

Place a decorative Hugeicon inside `AlertIcon`, which supplies a bare 20px
footprint and hides it from assistive technology. Text wraps, and actions stay
in the grid beside the content. Title and description are independently
optional. Keep page margins and positioning on an outer wrapper rather than
overriding Alert parts with color, padding, or grid classes. Field-validation
text, full-page error states, and alert dialogs remain separate patterns.

## Data tables

`@tutorpal/ui/data-table` contains the shared TanStack Table v9 surface. The
Table primitive comes from the official shadcn CLI; the data table follows its
recipe, so the package owns only semantic table markup and styling. It renders
a bordered `bg-card` surface, muted headers, divider rows, visible cells when
column visibility is enabled, selected-row state when selection is enabled,
and a localized “No results.” row by default. Header groups keep their native
spans and scopes, while sortable leaf columns receive native `aria-sort`.

Consumers pass a complete native `TableOptions` object to `DataTable`; the
shared component does not wrap, fetch, filter, sort, paginate, or own domain
state. Configure only the native features the screen needs directly from
`@tanstack/react-table`.

```tsx
import {
  rowSortingFeature,
  tableFeatures,
  type ColumnDef,
} from "@tanstack/react-table"
import { DataTable } from "@tutorpal/ui/data-table"

const features = tableFeatures({ rowSortingFeature })

const columns: ColumnDef<typeof features, Student>[] = [/* native columns */]

<DataTable
  ariaLabel="Students"
  config={{
    features,
    columns,
    data: students,
    manualSorting: true,
    state: { sorting },
    onSortingChange: setSorting,
  }}
/>
```

The tutor portal declares `@tanstack/react-table` directly. It is a compatible
peer of the shared package, so any app that configures `DataTable` must also
declare the native Table dependency and resolve to the same runtime. App-owned
toolbars, pagination controls, loading skeletons, and query state remain
outside the shared base. Use `emptyContent` when a screen needs a
domain-specific no-results message.

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
Apply a custom surface layer to `DialogViewport`, which owns the popup's stacking
context. For example, the no-show dialog pairs `alertBackdrop` on its overlay
with `alertSurface` on its viewport; setting the layer only on `DialogPopup`
leaves the dialog beneath the backdrop.

Dialogs and alert dialogs share the defaults in `dialog-motion.ts`: a top-origin
flip, scale, blur, and fade with a 200ms ease-out entrance and 150ms ease-in exit.
Animate UI retains its reduced-motion alternative. Keep the dialog mounted when
closing so its portal can finish the exit; the no-show dialog retains its last
schedule for rendering while its caller clears the active schedule. Submission
requires an open dialog with an active schedule, and reopening resets the form.

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
