# Common-component styling audit

Snapshot: `main` at `5471848`, plus the working tree inspected on November 29,
2026. This is a decision queue, not a list of confirmed defects or permission
to refactor the project. Every inventory entry is **pending a user decision**;
no styling exception is approved by its inclusion or classification here.

The scan inspected 452 non-test, non-generated TypeScript/JavaScript
source files and resolved imports for 855 common/reusable JSX usages.
It found **288 JSX usages with explicit styling props**: 285 consumer
usages and 3 internal common-component compositions. It also found
**14 custom-styled variant-helper calls** and **5 JSX sites with prop spreads**
that need forwarding review. These are separate inventories, not additive
counts of confirmed violations. Multiple styling props can occur on one usage.

Of the styled JSX usages, 94 use Button and 91 use Skeleton.
No explicit inline `style` prop on a common-component caller was found.
Marketing's common Astro component calls pass domain props rather than custom
styling; its native-element calendar geometry is outside this count.

## Scope and limits

- Included `@tutorpal/ui/*`, admin-local `components/ui/*` through aliases and
  relative imports, and app-local reusable/feature compositions under
  `components/`. Imports are resolved from TypeScript syntax, including aliases.
- Inspected explicit `className`, `style`, `classNames`, `styles`, and named
  styling slot props such as `positionerClassName`, including computed values.
  Custom `buttonVariants` arguments are listed separately.
- Common-component implementations own their CSS. Internal shared-package
  primitive styling, native HTML elements, third-party icon primitives, tests,
  and generated clients are not consumer overrides. Three admin common-layer
  compositions are retained separately for transparency.
- Astro common-component calls were inspected separately. Arbitrary global CSS,
  runtime values passed through spreads, and styles arriving from external
  callers are not exhaustively resolved by this static inventory. Review the
  forwarded props and ancestor selectors when assessing a specific change.
- Source lines are JSX opening/call lines. `†` marks usages in files with
  uncommitted changes at scan time (31 styled usages); these lines can differ
  from the committed source. No existing workspace edits were changed.
- Literal classifications are conservative triage hints. Computed expressions
  are shown in full and can contain known tokenized/state styling; they are not
  automatically unknown. Placement-only entries remain flagged, not approved.

## Decisions to make first

| Group | Evidence | Shared API context and proposed decision |
| --- | --- | --- |
| Button size and touch targets | C123 — [tutor/components/schedules/sessions-to-confirm.tsx:289](../../apps/frontend/src/components/schedules/sessions-to-confirm.tsx#L289) | The compact Alert still has a Button override: `size="sm"` plus `size-11`, padding and warning colors. Shared Button already has 44px `md`/`lg` and icon sizes, while `sm` is 32px. Decide the responsive icon/text and semantic treatment without reducing its 44px target. |
| Custom date-trigger surface | C131 — [tutor/components/schedules/week-date-selector/week-date-selector.tsx:488](../../apps/frontend/src/components/schedules/week-date-selector/week-date-selector.tsx#L488) | A small outline Button is rebuilt with transparent borders/backgrounds and a pseudo-element surface. Decide whether this needs a supported shared presentation instead of a local skin. |
| Authentication control height | C261 — [tutor/screens/login-screen.tsx:191](../../apps/frontend/src/screens/login-screen.tsx#L191) | Repeated 48px buttons and button-styled links span sign-in, signup, password recovery, verification and LINE-link screens. Current shared Button sizes top out at 44px. Choose a shared size or standardize these controls; helper-call inventory includes the links. |
| Responsive admin pagination | C011 — [admin/components/admin-users/admin-user-list.tsx:158](../../apps/admin-frontend/src/components/admin-users/admin-user-list.tsx#L158) | Small buttons use 44px on mobile and 32px on desktop. Decide how the shared size API should express this accessibility behavior. |
| Avatar size and color | C013 — [admin/components/admin-users/admin-user-list.tsx:230](../../apps/admin-frontend/src/components/admin-users/admin-user-list.tsx#L230) | Avatar already exposes `size="lg"` for 40px; other callers restate its 32px default. Fallback colors are tokenized but passed as custom classes. Decide existing-size adoption and ownership of reusable avatar tones. |
| Badge density and wrapping | C101 — [tutor/components/layout/app-sidebar.tsx:306](../../apps/frontend/src/components/layout/app-sidebar.tsx#L306) | Badge exposes semantic variants but no size option. Decide compact counter sizing/typography and wrapping behavior rather than screen-specific height, padding and text classes. |
| Table cell density | C196 — [tutor/screens/classes-screen.tsx:523](../../apps/frontend/src/screens/classes-screen.tsx#L523) † | Three working-tree management tables use descendant selectors to override header/cell padding. Decide a shared compact size or common default; do not silently approve internal selectors. |
| Select and filter states | C156 — [tutor/components/workspaces/workspace-search-controls.tsx:127](../../apps/frontend/src/components/workspaces/workspace-search-controls.tsx#L127) | Computed classes restyle selected state, and SelectItem reaches into child spans for wrapping. Shared outline Button already styles `data-active`; confirm whether existing state support suffices and decide shared wrapping behavior. |
| Input code presentation | C135 — [tutor/components/students/line-link-modal.tsx:68](../../apps/frontend/src/components/students/line-link-modal.tsx#L68) | Input receives `font-mono text-xs cursor-text` without a visual size/variant API. Decide a code/read-only presentation while retaining readable mobile text; HTML input `size` is not a visual alternative. |
| Dialog/drawer compositions | C113 — [tutor/components/schedules/no-show-schedule-dialog.tsx:150](../../apps/frontend/src/components/schedules/no-show-schedule-dialog.tsx#L150) | Overlay layers, surface geometry, title typography and close controls are customized in both portals. DialogPopup is intentionally low-level; decide which compositions should become shared supported presentations before removing their surface classes. |
| Menu width and positioning | C001 — [admin/components/admin-users/admin-user-actions-menu.tsx:59](../../apps/admin-frontend/src/components/admin-users/admin-user-actions-menu.tsx#L59) | Some widths repeat defaults; others override menu width or use `positionerClassName` with z-index values. Compare supported widths and the overlay-layer convention before deciding new props or exceptions. |
| Skeleton geometry and outer layout | All Skeleton and placement rows below | Content-shaped placeholders and `w-full`/margin/flex-placement classes are common. Decide which remain explicitly supported layout uses and which repeated shapes or sizes belong in the common API. Their presence alone does not establish a defect. |

## Inventory summary

| Styling prop classification | Occurrences |
| --- | --- |
| Literal size/appearance (including legitimate geometry and repeated defaults) | 181 |
| Literal outer placement only | 88 |
| Computed/forwarded expression; inspect actual intent | 19 |
| Explicit descendant selectors into component internals | 4 |

## Explicit styling on JSX calls

Every row is pending. Existing `size`/`variant` selections are shown so overrides
can be compared with the shared API. Common-owner styles are separated below.

### Tutor portal

| ID | Source | Component | Existing props | Styling passed | Classification |
| --- | --- | --- | --- | --- | --- |
| C035 | [tutor/components/auth/auth-shell.tsx:83](../../apps/frontend/src/components/auth/auth-shell.tsx#L83) | `Badge` | ``variant="primary"`` | ``className="h-5"`` | appearance/size |
| C036 | [tutor/components/classes/class-card.tsx:58](../../apps/frontend/src/components/classes/class-card.tsx#L58) | `Badge` | ``variant="info"`` | ``className="shrink-0 gap-1"`` | appearance/size |
| C037 | [tutor/components/classes/class-card.tsx:69](../../apps/frontend/src/components/classes/class-card.tsx#L69) | `Badge` | ``variant={ data.balanceState === "exhausted" ? "warning" : "info" }`` | ``className="shrink-0"`` | placement |
| C038 | [tutor/components/classes/class-card.tsx:78](../../apps/frontend/src/components/classes/class-card.tsx#L78) | `AvatarGroup` | Defaults / no such prop supplied | ``className="shrink-0"`` | placement |
| C039 | [tutor/components/classes/class-card.tsx:81](../../apps/frontend/src/components/classes/class-card.tsx#L81) | `AvatarFallback` | Defaults / no such prop supplied | ``className={`${nameToneAvatarClasses[getNameTone(student.getName())]} font-semibold`}`` | computed |
| C040 | [tutor/components/classes/class-drawer.tsx:80](../../apps/frontend/src/components/classes/class-drawer.tsx#L80) | `Button` | Defaults / no such prop supplied | ``className="w-full"`` | placement |
| C041 | [tutor/components/classes/class-drawer.tsx:88](../../apps/frontend/src/components/classes/class-drawer.tsx#L88) | `Button` | Defaults / no such prop supplied | ``className="w-full"`` | placement |
| C042 | [tutor/components/classes/class-hour-additions-drawer.tsx:328](../../apps/frontend/src/components/classes/class-hour-additions-drawer.tsx#L328) | `Button` | Defaults / no such prop supplied | ``className="w-full"`` | placement |
| C043 | [tutor/components/classes/class-hour-additions-drawer.tsx:430](../../apps/frontend/src/components/classes/class-hour-additions-drawer.tsx#L430) | `FieldGroup` | Defaults / no such prop supplied | ``className="gap-5"`` | appearance/size |
| C044 | [tutor/components/classes/class-hour-additions-section.tsx:53](../../apps/frontend/src/components/classes/class-hour-additions-section.tsx#L53) | `Skeleton` | Defaults / no such prop supplied | ``className="h-14 w-full"`` | appearance/size |
| C045 | [tutor/components/classes/class-hour-additions-section.tsx:54](../../apps/frontend/src/components/classes/class-hour-additions-section.tsx#L54) | `Skeleton` | Defaults / no such prop supplied | ``className="h-14 w-full"`` | appearance/size |
| C046 | [tutor/components/classes/class-hour-additions-section.tsx:120](../../apps/frontend/src/components/classes/class-hour-additions-section.tsx#L120) | `Button` | ``variant="ghost"`` | ``className="mt-3 w-full"`` | placement |
| C047 | [tutor/components/classes/class-info-header.tsx:120](../../apps/frontend/src/components/classes/class-info-header.tsx#L120) † | `AvatarFallback` | Defaults / no such prop supplied | ``className={`${nameToneAvatarClasses[getNameTone(student.getName())]} font-semibold`}`` | computed |
| C048 | [tutor/components/classes/class-info-header.tsx:156](../../apps/frontend/src/components/classes/class-info-header.tsx#L156) † | `PopoverContent` | Defaults / no such prop supplied | ``className="max-h-72 overflow-y-auto p-3"`` | appearance/size |
| C049 | [tutor/components/classes/class-info-header.tsx:173](../../apps/frontend/src/components/classes/class-info-header.tsx#L173) † | `AvatarFallback` | Defaults / no such prop supplied | ``className={`${nameToneAvatarClasses[getNameTone(student.getName())]} font-semibold`}`` | computed |
| C050 | [tutor/components/classes/class-info-header.tsx:256](../../apps/frontend/src/components/classes/class-info-header.tsx#L256) † | `Button` | ``variant="outline"`` | ``className="w-full lg:w-auto"`` | placement |
| C051 | [tutor/components/classes/class-info-header.tsx:266](../../apps/frontend/src/components/classes/class-info-header.tsx#L266) † | `Button` | Defaults / no such prop supplied | ``className="w-full lg:w-auto"`` | placement |
| C052 | [tutor/components/classes/class-row.tsx:89](../../apps/frontend/src/components/classes/class-row.tsx#L89) | `Button` | ``variant="ghost"`` | ``className="group h-auto min-h-11 min-w-0 flex-1 justify-start gap-3 rounded-lg px-0 py-0 text-left hover:bg-transparent focus-visible:ring-offset-2"`` | appearance/size |
| C053 | [tutor/components/classes/class-row.tsx:107](../../apps/frontend/src/components/classes/class-row.tsx#L107) | `AvatarGroup` | Defaults / no such prop supplied | ``className="mt-2"`` | placement |
| C054 | [tutor/components/classes/class-row.tsx:110](../../apps/frontend/src/components/classes/class-row.tsx#L110) | `AvatarFallback` | Defaults / no such prop supplied | ``className={`${nameToneAvatarClasses[getNameTone(student.getName())]} font-semibold`}`` | computed |
| C055 | [tutor/components/classes/class-row.tsx:141](../../apps/frontend/src/components/classes/class-row.tsx#L141) | `Button` | ``size="sm" variant="outline"`` | ``className="hidden shrink-0 sm:inline-flex"`` | placement |
| C056 | [tutor/components/classes/class-row.tsx:155](../../apps/frontend/src/components/classes/class-row.tsx#L155) | `Button` | ``size="icon" variant="ghost"`` | ``className="self-start"`` | placement |
| C057 | [tutor/components/classes/class-row.tsx:169](../../apps/frontend/src/components/classes/class-row.tsx#L169) | `DropdownMenuGroup` | Defaults / no such prop supplied | ``className="sm:hidden"`` | placement |
| C058 | [tutor/components/classes/class-row.tsx:177](../../apps/frontend/src/components/classes/class-row.tsx#L177) | `DropdownMenuSeparator` | Defaults / no such prop supplied | ``className="sm:hidden"`` | placement |
| C059 | [tutor/components/classes/create-class-form.tsx:122](../../apps/frontend/src/components/classes/create-class-form.tsx#L122) | `FieldGroup` | Defaults / no such prop supplied | ``className="gap-5"`` | appearance/size |
| C060 | [tutor/components/classes/create-class-form.tsx:178](../../apps/frontend/src/components/classes/create-class-form.tsx#L178) | `AvatarFallback` | Defaults / no such prop supplied | ``className={ student ? nameToneAvatarClasses[getNameTone(name)] : "bg-avatar-neutral text-avatar-neutral-foreground" }`` | computed |
| C061 | [tutor/components/classes/recurring-schedule-drawer.tsx:306](../../apps/frontend/src/components/classes/recurring-schedule-drawer.tsx#L306) | `Button` | Defaults / no such prop supplied | ``className="w-full"`` | placement |
| C062 | [tutor/components/classes/recurring-schedule-drawer.tsx:348](../../apps/frontend/src/components/classes/recurring-schedule-drawer.tsx#L348) | `Button` | ``size="sm" variant="outline"`` | ``className="mt-3"`` | placement |
| C063 | [tutor/components/classes/recurring-schedule-section.tsx:119](../../apps/frontend/src/components/classes/recurring-schedule-section.tsx#L119) | `Button` | ``size="md" variant="outline"`` | ``className="w-full shrink-0 sm:w-auto"`` | placement |
| C064 | [tutor/components/classes/recurring-schedule-section.tsx:154](../../apps/frontend/src/components/classes/recurring-schedule-section.tsx#L154) | `Button` | ``size="icon" variant="ghost"`` | ``className="shrink-0"`` | placement |
| C065 | [tutor/components/classes/recurring-schedule-section.tsx:212](../../apps/frontend/src/components/classes/recurring-schedule-section.tsx#L212) | `Badge` | ``variant="info"`` | ``className="inline-flex max-w-full gap-1 self-start whitespace-normal text-left"`` | appearance/size |
| C066 | [tutor/components/classes/recurring-schedule-section.tsx:232](../../apps/frontend/src/components/classes/recurring-schedule-section.tsx#L232) | `Badge` | ``variant="info"`` | ``className="inline-flex gap-1"`` | appearance/size |
| C067 | [tutor/components/classes/schedule-log.tsx:61](../../apps/frontend/src/components/classes/schedule-log.tsx#L61) | `Skeleton` | Defaults / no such prop supplied | ``className="h-20 w-full rounded-lg"`` | appearance/size |
| C068 | [tutor/components/classes/schedule-log.tsx:62](../../apps/frontend/src/components/classes/schedule-log.tsx#L62) | `Skeleton` | Defaults / no such prop supplied | ``className="h-20 w-full rounded-lg"`` | appearance/size |
| C069 | [tutor/components/classes/schedule-log.tsx:94](../../apps/frontend/src/components/classes/schedule-log.tsx#L94) | `DropdownMenuTrigger` | Defaults / no such prop supplied | ``className="flex size-11 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/35"`` | appearance/size |
| C070 | [tutor/components/classes/schedule-log.tsx:211](../../apps/frontend/src/components/classes/schedule-log.tsx#L211) | `Badge` | ``variant={status?.badgeVariant ?? "info"}`` | ``className="shrink-0 gap-1 whitespace-nowrap"`` | appearance/size |
| C071 | [tutor/components/classes/schedule-log.tsx:370](../../apps/frontend/src/components/classes/schedule-log.tsx#L370) | `Button` | Defaults / no such prop supplied | ``className="mt-3"`` | placement |
| C072 | [tutor/components/classes/schedule-log.tsx:416](../../apps/frontend/src/components/classes/schedule-log.tsx#L416) | `Button` | ``variant="ghost"`` | ``className="mt-3 w-full"`` | placement |
| C073 | [tutor/components/classes/schedule-log.tsx:445](../../apps/frontend/src/components/classes/schedule-log.tsx#L445) | `TabsList` | ``variant="subtle"`` | ``className="max-w-full"`` | placement |
| C074 | [tutor/components/classes/schedule-log.tsx:475](../../apps/frontend/src/components/classes/schedule-log.tsx#L475) | `TabsPanels` | Defaults / no such prop supplied | ``className="mt-4"`` | placement |
| C075 | [tutor/components/classes/schedule-log.tsx:574](../../apps/frontend/src/components/classes/schedule-log.tsx#L574) | `Button` | ``variant="outline"`` | ``className="mt-3"`` | placement |
| C076 | [tutor/components/classes/student-selector-accordion.tsx:221](../../apps/frontend/src/components/classes/student-selector-accordion.tsx#L221) | `Button` | Defaults / no such prop supplied | ``className="w-full"`` | placement |
| C077 | [tutor/components/classes/student-selector-drawer.tsx:90](../../apps/frontend/src/components/classes/student-selector-drawer.tsx#L90) | `Button` | Defaults / no such prop supplied | ``className="w-full"`` | placement |
| C078 | [tutor/components/classes/student-selector-drawer.tsx:138](../../apps/frontend/src/components/classes/student-selector-drawer.tsx#L138) | `Skeleton` | Defaults / no such prop supplied | ``className="h-14 w-full"`` | appearance/size |
| C079 | [tutor/components/classes/student-selector-drawer.tsx:139](../../apps/frontend/src/components/classes/student-selector-drawer.tsx#L139) | `Skeleton` | Defaults / no such prop supplied | ``className="h-14 w-full"`` | appearance/size |
| C080 | [tutor/components/classes/student-selector-drawer.tsx:140](../../apps/frontend/src/components/classes/student-selector-drawer.tsx#L140) | `Skeleton` | Defaults / no such prop supplied | ``className="h-14 w-full"`` | appearance/size |
| C081 | [tutor/components/courses/course-form-drawer.tsx:31](../../apps/frontend/src/components/courses/course-form-drawer.tsx#L31) | `Button` | Defaults / no such prop supplied | ``className="w-full"`` | placement |
| C082 | [tutor/components/courses/course-form.tsx:122](../../apps/frontend/src/components/courses/course-form.tsx#L122) | `FieldSet` | Defaults / no such prop supplied | ``className="gap-3"`` | appearance/size |
| C083 | [tutor/components/dashboard/awaiting-confirmation-carousel.tsx:498](../../apps/frontend/src/components/dashboard/awaiting-confirmation-carousel.tsx#L498) | `Skeleton` | Defaults / no such prop supplied | ``className="h-4 w-28"`` | appearance/size |
| C084 | [tutor/components/dashboard/awaiting-confirmation-carousel.tsx:499](../../apps/frontend/src/components/dashboard/awaiting-confirmation-carousel.tsx#L499) | `Skeleton` | Defaults / no such prop supplied | ``className="mt-4 h-5 w-40 max-w-full"`` | appearance/size |
| C085 | [tutor/components/dashboard/awaiting-confirmation-carousel.tsx:500](../../apps/frontend/src/components/dashboard/awaiting-confirmation-carousel.tsx#L500) | `Skeleton` | Defaults / no such prop supplied | ``className="mt-3 h-4 w-24"`` | appearance/size |
| C086 | [tutor/components/dashboard/awaiting-confirmation-carousel.tsx:502](../../apps/frontend/src/components/dashboard/awaiting-confirmation-carousel.tsx#L502) | `Skeleton` | Defaults / no such prop supplied | ``className="h-11 rounded-full"`` | appearance/size |
| C087 | [tutor/components/dashboard/awaiting-confirmation-carousel.tsx:503](../../apps/frontend/src/components/dashboard/awaiting-confirmation-carousel.tsx#L503) | `Skeleton` | Defaults / no such prop supplied | ``className="h-11 rounded-full"`` | appearance/size |
| C088 | [tutor/components/dashboard/awaiting-confirmation-carousel.tsx:541](../../apps/frontend/src/components/dashboard/awaiting-confirmation-carousel.tsx#L541) | `Button` | ``variant="outline"`` | ``className="mt-4"`` | placement |
| C089 | [tutor/components/dashboard/awaiting-confirmation-carousel.tsx:561](../../apps/frontend/src/components/dashboard/awaiting-confirmation-carousel.tsx#L561) | `Skeleton` | Defaults / no such prop supplied | ``className="h-4 w-28"`` | appearance/size |
| C090 | [tutor/components/dashboard/awaiting-confirmation-carousel.tsx:562](../../apps/frontend/src/components/dashboard/awaiting-confirmation-carousel.tsx#L562) | `Skeleton` | Defaults / no such prop supplied | ``className="mt-4 h-5 w-40 max-w-full"`` | appearance/size |
| C091 | [tutor/components/dashboard/awaiting-confirmation-carousel.tsx:563](../../apps/frontend/src/components/dashboard/awaiting-confirmation-carousel.tsx#L563) | `Skeleton` | Defaults / no such prop supplied | ``className="mt-3 h-4 w-24"`` | appearance/size |
| C092 | [tutor/components/dashboard/awaiting-confirmation-carousel.tsx:565](../../apps/frontend/src/components/dashboard/awaiting-confirmation-carousel.tsx#L565) | `Skeleton` | Defaults / no such prop supplied | ``className="h-11 rounded-full"`` | appearance/size |
| C093 | [tutor/components/dashboard/awaiting-confirmation-carousel.tsx:566](../../apps/frontend/src/components/dashboard/awaiting-confirmation-carousel.tsx#L566) | `Skeleton` | Defaults / no such prop supplied | ``className="h-11 rounded-full"`` | appearance/size |
| C094 | [tutor/components/dashboard/awaiting-confirmation-carousel.tsx:586](../../apps/frontend/src/components/dashboard/awaiting-confirmation-carousel.tsx#L586) | `Button` | ``variant="outline"`` | ``className="mt-4"`` | placement |
| C095 | [tutor/components/integrations/integration-config-layout.tsx:32](../../apps/frontend/src/components/integrations/integration-config-layout.tsx#L32) | `Breadcrumb` | Defaults / no such prop supplied | ``className="mb-6"`` | placement |
| C096 | [tutor/components/layout/app-sidebar.tsx:92](../../apps/frontend/src/components/layout/app-sidebar.tsx#L92) | `Button` | ``size="md" variant="ghost"`` | ``className="ml-auto min-w-11 shrink-0"`` | placement |
| C097 | [tutor/components/layout/app-sidebar.tsx:106](../../apps/frontend/src/components/layout/app-sidebar.tsx#L106) | `DropdownMenuContent` | Defaults / no such prop supplied | ``className="min-w-40"``<br>``positionerClassName="z-[1000]"`` | placement |
| C098 | [tutor/components/layout/app-sidebar.tsx:164](../../apps/frontend/src/components/layout/app-sidebar.tsx#L164) | `Badge` | ``variant="primary"`` | ``className="h-5"`` | appearance/size |
| C099 | [tutor/components/layout/app-sidebar.tsx:219](../../apps/frontend/src/components/layout/app-sidebar.tsx#L219) | `Avatar` | Defaults / no such prop supplied | ``className="jun-sidebarIcon h-8 w-8"`` | appearance/size |
| C100 | [tutor/components/layout/app-sidebar.tsx:224](../../apps/frontend/src/components/layout/app-sidebar.tsx#L224) | `AvatarFallback` | Defaults / no such prop supplied | ``className="bg-primary font-semibold text-primary-foreground"`` | appearance/size |
| C101 | [tutor/components/layout/app-sidebar.tsx:306](../../apps/frontend/src/components/layout/app-sidebar.tsx#L306) | `Badge` | ``variant="primary"`` | ``className="absolute top-1/2 right-0.5 z-10 h-4 min-w-4 -translate-y-1/2 px-1 text-[10px] leading-none md:max-lg:top-0.5 md:max-lg:translate-y-0 md:group-data-[edge-collapsed]/sidebar:top-0.5 md:group-data-[edge-collapsed]/sidebar:translate-y-0"`` | appearance/size |
| C102 | [tutor/components/layout/impersonation-banner.tsx:72](../../apps/frontend/src/components/layout/impersonation-banner.tsx#L72) | `Button` | Defaults / no such prop supplied | ``className="w-full sm:w-auto"`` | placement |
| C103 | [tutor/components/layout/user-settings.tsx:54](../../apps/frontend/src/components/layout/user-settings.tsx#L54) | `DropdownMenuContent` | Defaults / no such prop supplied | ``className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"``<br>``positionerClassName="z-[1000]"`` | appearance/size, placement |
| C104 | [tutor/components/layout/user-settings.tsx:66](../../apps/frontend/src/components/layout/user-settings.tsx#L66) | `Avatar` | Defaults / no such prop supplied | ``className="h-8 w-8"`` | appearance/size |
| C105 | [tutor/components/layout/user-settings.tsx:68](../../apps/frontend/src/components/layout/user-settings.tsx#L68) | `AvatarFallback` | Defaults / no such prop supplied | ``className="bg-primary font-semibold text-primary-foreground"`` | appearance/size |
| C106 | [tutor/components/layout/user-settings.tsx:88](../../apps/frontend/src/components/layout/user-settings.tsx#L88) | `DropdownMenuItem` | Defaults / no such prop supplied | ``className="min-h-11"`` | appearance/size |
| C107 | [tutor/components/layout/user-settings.tsx:96](../../apps/frontend/src/components/layout/user-settings.tsx#L96) | `DropdownMenuItem` | Defaults / no such prop supplied | ``className="min-h-11"`` | appearance/size |
| C108 | [tutor/components/route-fallback.tsx:204](../../apps/frontend/src/components/route-fallback.tsx#L204) | `Button` | Defaults / no such prop supplied | ``className="w-full sm:w-auto"`` | placement |
| C109 | [tutor/components/schedules/grouped-weekday-editor.tsx:140](../../apps/frontend/src/components/schedules/grouped-weekday-editor.tsx#L140) | `Button` | ``size="sm" variant="ghost"`` | ``className="min-h-11"`` | appearance/size |
| C110 | [tutor/components/schedules/grouped-weekday-editor.tsx:184](../../apps/frontend/src/components/schedules/grouped-weekday-editor.tsx#L184) | `Button` | ``size="sm" variant="outline"`` | ``className="min-h-11"`` | appearance/size |
| C111 | [tutor/components/schedules/no-show-schedule-dialog.tsx:144](../../apps/frontend/src/components/schedules/no-show-schedule-dialog.tsx#L144) | `DialogOverlay` | Defaults / no such prop supplied | ``className={cn( overlayLayers.alertBackdrop, )}`` | computed |
| C112 | [tutor/components/schedules/no-show-schedule-dialog.tsx:149](../../apps/frontend/src/components/schedules/no-show-schedule-dialog.tsx#L149) | `DialogViewport` | Defaults / no such prop supplied | ``className={cn("p-0", overlayLayers.alertSurface)}`` | computed |
| C113 | [tutor/components/schedules/no-show-schedule-dialog.tsx:150](../../apps/frontend/src/components/schedules/no-show-schedule-dialog.tsx#L150) | `DialogPopup` | Defaults / no such prop supplied | ``className={cn( "grid max-h-[calc(100dvh-2rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-[calc(100%-2rem)] max-w-lg gap-5 overflow-y-auto overscroll-contain rounded-xl border border-border bg-popover p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-popover-foreground shadow-transient-dialog outline-none sm:p-6 sm:pb-6", )}`` | computed |
| C114 | [tutor/components/schedules/no-show-schedule-dialog.tsx:158](../../apps/frontend/src/components/schedules/no-show-schedule-dialog.tsx#L158) | `DialogHeader` | Defaults / no such prop supplied | ``className="pr-10"`` | appearance/size |
| C115 | [tutor/components/schedules/no-show-schedule-dialog.tsx:165](../../apps/frontend/src/components/schedules/no-show-schedule-dialog.tsx#L165) | `Button` | ``size="icon" variant="ghost"`` | ``className="absolute top-3 right-3"`` | placement |
| C116 | [tutor/components/schedules/no-show-schedule-dialog.tsx:308](../../apps/frontend/src/components/schedules/no-show-schedule-dialog.tsx#L308) | `Button` | Defaults / no such prop supplied | ``className="w-full"`` | placement |
| C117 | [tutor/components/schedules/schedule-card.tsx:113](../../apps/frontend/src/components/schedules/schedule-card.tsx#L113) | `Button` | ``size="icon" variant="ghost"`` | ``className="self-center focus-visible:ring-primary!"`` | appearance/size |
| C118 | [tutor/components/schedules/schedule-drawer.tsx:324](../../apps/frontend/src/components/schedules/schedule-drawer.tsx#L324) | `Button` | ``variant="secondary"`` | ``className="w-full"`` | placement |
| C119 | [tutor/components/schedules/schedule-drawer.tsx:341](../../apps/frontend/src/components/schedules/schedule-drawer.tsx#L341) | `Button` | Defaults / no such prop supplied | ``className="w-full"`` | placement |
| C120 | [tutor/components/schedules/schedule-drawer.tsx:365](../../apps/frontend/src/components/schedules/schedule-drawer.tsx#L365) | `FieldGroup` | Defaults / no such prop supplied | ``className="gap-5"`` | appearance/size |
| C121 | [tutor/components/schedules/schedule-drawer.tsx:390](../../apps/frontend/src/components/schedules/schedule-drawer.tsx#L390) | `Input` | Defaults / no such prop supplied | ``className="cursor-pointer"`` | appearance/size |
| C122 | [tutor/components/schedules/sessions-to-confirm.tsx:260](../../apps/frontend/src/components/schedules/sessions-to-confirm.tsx#L260) | `Alert` | ``size="compact" variant="warning"`` | ``className="mx-3 mt-3 shrink-0 w-[calc(100%-1.5rem)] sm:mx-4 sm:w-[calc(100%-2rem)] lg:mx-6 lg:w-[calc(100%-3rem)]"`` | placement |
| C123 | [tutor/components/schedules/sessions-to-confirm.tsx:289](../../apps/frontend/src/components/schedules/sessions-to-confirm.tsx#L289) | `Button` | ``size="sm" variant="ghost"`` | ``className="size-11 p-0 text-warning-container-foreground hover:bg-warning/10 hover:text-warning-container-foreground focus-visible:ring-warning-container-foreground sm:w-auto sm:px-3"`` | appearance/size |
| C124 | [tutor/components/schedules/sessions-to-confirm.tsx:506](../../apps/frontend/src/components/schedules/sessions-to-confirm.tsx#L506) | `Skeleton` | Defaults / no such prop supplied | ``className="h-4 w-36"`` | appearance/size |
| C125 | [tutor/components/schedules/sessions-to-confirm.tsx:508](../../apps/frontend/src/components/schedules/sessions-to-confirm.tsx#L508) | `Skeleton` | Defaults / no such prop supplied | ``className="h-5 w-2/3"`` | appearance/size |
| C126 | [tutor/components/schedules/sessions-to-confirm.tsx:509](../../apps/frontend/src/components/schedules/sessions-to-confirm.tsx#L509) | `Skeleton` | Defaults / no such prop supplied | ``className="mt-2 h-4 w-28"`` | appearance/size |
| C127 | [tutor/components/schedules/sessions-to-confirm.tsx:511](../../apps/frontend/src/components/schedules/sessions-to-confirm.tsx#L511) | `Skeleton` | Defaults / no such prop supplied | ``className="h-10 rounded-full"`` | appearance/size |
| C128 | [tutor/components/schedules/sessions-to-confirm.tsx:512](../../apps/frontend/src/components/schedules/sessions-to-confirm.tsx#L512) | `Skeleton` | Defaults / no such prop supplied | ``className="h-10 rounded-full"`` | appearance/size |
| C129 | [tutor/components/schedules/sessions-to-confirm.tsx:535](../../apps/frontend/src/components/schedules/sessions-to-confirm.tsx#L535) | `Button` | ``variant="outline"`` | ``className="mt-4"`` | placement |
| C130 | [tutor/components/schedules/week-date-selector/week-date-selector.tsx:420](../../apps/frontend/src/components/schedules/week-date-selector/week-date-selector.tsx#L420) | `WeekdayView` | Defaults / no such prop supplied | ``className="pb-2 pt-1"`` | appearance/size |
| C131 | [tutor/components/schedules/week-date-selector/week-date-selector.tsx:488](../../apps/frontend/src/components/schedules/week-date-selector/week-date-selector.tsx#L488) | `Button` | ``size="sm" variant="outline"`` | ``className="relative isolate h-11 border-transparent bg-transparent hover:bg-transparent aria-expanded:bg-transparent dark:bg-transparent dark:hover:bg-transparent dark:aria-expanded:bg-transparent before:pointer-events-none before:absolute before:inset-x-0 before:inset-y-1.5 before:z-[-1] before:rounded-full before:border before:border-input before:bg-card hover:before:bg-muted aria-expanded:before:bg-muted"`` | appearance/size |
| C132 | [tutor/components/schedules/week-date-selector/week-date-selector.tsx:512](../../apps/frontend/src/components/schedules/week-date-selector/week-date-selector.tsx#L512) | `TabsPanels` | Defaults / no such prop supplied | ``className="mb-2 w-full shrink-0"`` | placement |
| C133 | [tutor/components/schedules/week-date-selector/week-date-selector.tsx:530](../../apps/frontend/src/components/schedules/week-date-selector/week-date-selector.tsx#L530) | `Tabs` | Defaults / no such prop supplied | ``className="gap-0"`` | appearance/size |
| C134 | [tutor/components/students/line-link-modal.tsx:59](../../apps/frontend/src/components/students/line-link-modal.tsx#L59) | `DialogContent` | Defaults / no such prop supplied | ``className="sm:max-w-md"`` | placement |
| C135 | [tutor/components/students/line-link-modal.tsx:68](../../apps/frontend/src/components/students/line-link-modal.tsx#L68) | `Input` | Defaults / no such prop supplied | ``className="font-mono text-xs cursor-text"`` | appearance/size |
| C136 | [tutor/components/students/student-card.tsx:43](../../apps/frontend/src/components/students/student-card.tsx#L43) | `AvatarFallback` | Defaults / no such prop supplied | ``className={`${nameToneAvatarClasses[getNameTone(data.name)]} font-semibold`}`` | computed |
| C137 | [tutor/components/students/student-card.tsx:51](../../apps/frontend/src/components/students/student-card.tsx#L51) | `Badge` | ``variant="info"`` | ``className="shrink-0"`` | placement |
| C138 | [tutor/components/students/student-card.tsx:55](../../apps/frontend/src/components/students/student-card.tsx#L55) | `Badge` | ``variant="success"`` | ``className="shrink-0 gap-1"`` | appearance/size |
| C139 | [tutor/components/students/student-card.tsx:61](../../apps/frontend/src/components/students/student-card.tsx#L61) | `Badge` | ``variant="warning"`` | ``className="shrink-0 gap-1"`` | appearance/size |
| C140 | [tutor/components/students/student-class-list.tsx:79](../../apps/frontend/src/components/students/student-class-list.tsx#L79) | `Badge` | ``variant={ hours.remainingHours !== undefined && hours.remainingHours > 0 ? "success" : "info" }`` | ``className="shrink-0 gap-1"`` | appearance/size |
| C141 | [tutor/components/students/student-drawer.tsx:122](../../apps/frontend/src/components/students/student-drawer.tsx#L122) | `Button` | Defaults / no such prop supplied | ``className="w-full"`` | placement |
| C142 | [tutor/components/students/student-drawer.tsx:130](../../apps/frontend/src/components/students/student-drawer.tsx#L130) | `Button` | Defaults / no such prop supplied | ``className="w-full"`` | placement |
| C143 | [tutor/components/students/student-info-header.tsx:43](../../apps/frontend/src/components/students/student-info-header.tsx#L43) | `AvatarFallback` | Defaults / no such prop supplied | ``className={`${nameToneAvatarClasses[getNameTone(data.name)]} font-semibold`}`` | computed |
| C144 | [tutor/components/students/student-info-header.tsx:70](../../apps/frontend/src/components/students/student-info-header.tsx#L70) | `Badge` | ``variant="info"`` | ``className="gap-1"`` | appearance/size |
| C145 | [tutor/components/students/student-info-header.tsx:77](../../apps/frontend/src/components/students/student-info-header.tsx#L77) | `Badge` | ``variant="success"`` | ``className="gap-1"`` | appearance/size |
| C146 | [tutor/components/students/student-info-header.tsx:83](../../apps/frontend/src/components/students/student-info-header.tsx#L83) | `Badge` | ``variant="warning"`` | ``className="gap-1"`` | appearance/size |
| C147 | [tutor/components/students/student-list.tsx:125](../../apps/frontend/src/components/students/student-list.tsx#L125) † | `Button` | ``size="sm" variant="ghost"`` | ``className="-ml-3"`` | placement |
| C148 | [tutor/components/students/student-list.tsx:165](../../apps/frontend/src/components/students/student-list.tsx#L165) † | `AvatarFallback` | Defaults / no such prop supplied | ``className={`${nameToneAvatarClasses[getNameTone(data.name)]} font-semibold`}`` | computed |
| C149 | [tutor/components/students/student-list.tsx:182](../../apps/frontend/src/components/students/student-list.tsx#L182) † | `Button` | ``size="sm" variant="ghost"`` | ``className="-ml-3"`` | placement |
| C150 | [tutor/components/students/student-list.tsx:258](../../apps/frontend/src/components/students/student-list.tsx#L258) † | `Button` | ``size="sm" variant="ghost"`` | ``className="-ml-3"`` | placement |
| C151 | [tutor/components/students/student-list.tsx:505](../../apps/frontend/src/components/students/student-list.tsx#L505) † | `DataTable` | Defaults / no such prop supplied | ``className="[&_[data-slot=table-cell]]:px-2 [&_[data-slot=table-head]]:px-2"`` | internals |
| C152 | [tutor/components/students/student-row.tsx:58](../../apps/frontend/src/components/students/student-row.tsx#L58) | `AvatarFallback` | Defaults / no such prop supplied | ``className={`${nameToneAvatarClasses[getNameTone(data.name)]} font-semibold`}`` | computed |
| C153 | [tutor/components/workspaces/workspace-fab.tsx:25](../../apps/frontend/src/components/workspaces/workspace-fab.tsx#L25) | `ContentReveal` | Defaults / no such prop supplied | ``className={cn( "fixed right-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-30 size-14 sm:hidden", className, )}`` | computed |
| C154 | [tutor/components/workspaces/workspace-fab.tsx:31](../../apps/frontend/src/components/workspaces/workspace-fab.tsx#L31) | `Button` | Defaults / no such prop supplied | ``className="size-full rounded-full p-0"`` | appearance/size |
| C155 | [tutor/components/workspaces/workspace-search-controls.tsx:99](../../apps/frontend/src/components/workspaces/workspace-search-controls.tsx#L99) | `Button` | ``size="sm" variant="outline"`` | ``className="w-auto max-w-52 shrink-0"`` | placement |
| C156 | [tutor/components/workspaces/workspace-search-controls.tsx:127](../../apps/frontend/src/components/workspaces/workspace-search-controls.tsx#L127) | `Button` | ``variant="outline"`` | ``className={cn( "w-full justify-between text-left whitespace-normal", isSelected && `bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary-foreground border-primary dark:border-primary-foreground`, )}`` | computed |
| C157 | [tutor/components/workspaces/workspace-search-controls.tsx:161](../../apps/frontend/src/components/workspaces/workspace-search-controls.tsx#L161) | `SelectTrigger` | ``size="sm"`` | ``className="w-auto max-w-52 shrink-0"`` | placement |
| C158 | [tutor/components/workspaces/workspace-search-controls.tsx:169](../../apps/frontend/src/components/workspaces/workspace-search-controls.tsx#L169) | `SelectContent` | Defaults / no such prop supplied | ``className="w-auto min-w-(--anchor-width) max-w-[calc(100vw-2rem)]"`` | placement |
| C159 | [tutor/components/workspaces/workspace-search-controls.tsx:172](../../apps/frontend/src/components/workspaces/workspace-search-controls.tsx#L172) | `SelectItem` | Defaults / no such prop supplied | ``className="whitespace-normal [&>span]:whitespace-normal"`` | internals |
| C160 | [tutor/components/workspaces/workspace-state.tsx:17](../../apps/frontend/src/components/workspaces/workspace-state.tsx#L17) † | `Skeleton` | Defaults / no such prop supplied | ``className="size-10 shrink-0 rounded-full"`` | appearance/size |
| C161 | [tutor/components/workspaces/workspace-state.tsx:19](../../apps/frontend/src/components/workspaces/workspace-state.tsx#L19) † | `Skeleton` | Defaults / no such prop supplied | ``className="h-4 w-40 max-w-[60%]"`` | appearance/size |
| C162 | [tutor/components/workspaces/workspace-state.tsx:20](../../apps/frontend/src/components/workspaces/workspace-state.tsx#L20) † | `Skeleton` | Defaults / no such prop supplied | ``className="h-3 w-64 max-w-[80%]"`` | appearance/size |
| C163 | [tutor/components/workspaces/workspace-state.tsx:22](../../apps/frontend/src/components/workspaces/workspace-state.tsx#L22) † | `Skeleton` | Defaults / no such prop supplied | ``className="hidden h-8 w-20 sm:block"`` | appearance/size |
| C164 | [tutor/components/workspaces/workspace-state.tsx:50](../../apps/frontend/src/components/workspaces/workspace-state.tsx#L50) † | `Skeleton` | Defaults / no such prop supplied | ``className="h-3 w-3/5"`` | appearance/size |
| C165 | [tutor/components/workspaces/workspace-state.tsx:60](../../apps/frontend/src/components/workspaces/workspace-state.tsx#L60) † | `Skeleton` | Defaults / no such prop supplied | ``className={columnIndex === 0 ? "h-4 w-4/5" : "h-4 w-3/5"}`` | computed |
| C166 | [tutor/components/workspaces/workspace-state.tsx:90](../../apps/frontend/src/components/workspaces/workspace-state.tsx#L90) † | `Button` | ``variant="outline"`` | ``className="mt-4"`` | placement |
| C167 | [tutor/routes/_layout.tsx:84](../../apps/frontend/src/routes/_layout.tsx#L84) | `ContentReveal` | Defaults / no such prop supplied | ``className="block h-full min-h-0 min-w-0"`` | appearance/size |
| C168 | [tutor/routes/_layout/schedules.tsx:11](../../apps/frontend/src/routes/_layout/schedules.tsx#L11) | `ScreenLayout` | Defaults / no such prop supplied | ``className="h-[calc(100dvh-3rem)] min-h-0"`` | appearance/size |
| C169 | [tutor/screens/account-settings-screen.tsx:37](../../apps/frontend/src/screens/account-settings-screen.tsx#L37) | `Skeleton` | Defaults / no such prop supplied | ``className="h-5 w-36"`` | appearance/size |
| C170 | [tutor/screens/account-settings-screen.tsx:38](../../apps/frontend/src/screens/account-settings-screen.tsx#L38) | `Skeleton` | Defaults / no such prop supplied | ``className="h-4 w-64 max-w-full"`` | appearance/size |
| C171 | [tutor/screens/account-settings-screen.tsx:42](../../apps/frontend/src/screens/account-settings-screen.tsx#L42) | `Skeleton` | Defaults / no such prop supplied | ``className="size-6"`` | appearance/size |
| C172 | [tutor/screens/account-settings-screen.tsx:44](../../apps/frontend/src/screens/account-settings-screen.tsx#L44) | `Skeleton` | Defaults / no such prop supplied | ``className="h-4 w-24"`` | appearance/size |
| C173 | [tutor/screens/account-settings-screen.tsx:45](../../apps/frontend/src/screens/account-settings-screen.tsx#L45) | `Skeleton` | Defaults / no such prop supplied | ``className="h-4 w-56 max-w-full"`` | appearance/size |
| C174 | [tutor/screens/account-settings-screen.tsx:47](../../apps/frontend/src/screens/account-settings-screen.tsx#L47) | `Skeleton` | Defaults / no such prop supplied | ``className="hidden h-9 w-24 sm:block"`` | appearance/size |
| C175 | [tutor/screens/account-settings-screen.tsx:179](../../apps/frontend/src/screens/account-settings-screen.tsx#L179) | `Button` | Defaults / no such prop supplied | ``className="w-full sm:w-auto"`` | placement |
| C176 | [tutor/screens/account-settings-screen.tsx:237](../../apps/frontend/src/screens/account-settings-screen.tsx#L237) | `Button` | Defaults / no such prop supplied | ``className="w-full sm:w-auto"`` | placement |
| C177 | [tutor/screens/class-detail-screen.tsx:266](../../apps/frontend/src/screens/class-detail-screen.tsx#L266) | `Skeleton` | Defaults / no such prop supplied | ``className="size-11 rounded-full"`` | appearance/size |
| C178 | [tutor/screens/class-detail-screen.tsx:267](../../apps/frontend/src/screens/class-detail-screen.tsx#L267) | `Skeleton` | Defaults / no such prop supplied | ``className="h-7 w-2/5 rounded"`` | appearance/size |
| C179 | [tutor/screens/class-detail-screen.tsx:268](../../apps/frontend/src/screens/class-detail-screen.tsx#L268) | `Skeleton` | Defaults / no such prop supplied | ``className="w-9 h-9 rounded-full"`` | appearance/size |
| C180 | [tutor/screens/class-detail-screen.tsx:271](../../apps/frontend/src/screens/class-detail-screen.tsx#L271) | `Skeleton` | Defaults / no such prop supplied | ``className="m-4 h-11 rounded"`` | appearance/size |
| C181 | [tutor/screens/class-detail-screen.tsx:272](../../apps/frontend/src/screens/class-detail-screen.tsx#L272) | `Skeleton` | Defaults / no such prop supplied | ``className="m-4 h-16 rounded"`` | appearance/size |
| C182 | [tutor/screens/class-detail-screen.tsx:273](../../apps/frontend/src/screens/class-detail-screen.tsx#L273) | `Skeleton` | Defaults / no such prop supplied | ``className="m-4 h-11 rounded"`` | appearance/size |
| C183 | [tutor/screens/class-detail-screen.tsx:277](../../apps/frontend/src/screens/class-detail-screen.tsx#L277) | `Skeleton` | Defaults / no such prop supplied | ``className="h-6 w-40"`` | appearance/size |
| C184 | [tutor/screens/class-detail-screen.tsx:278](../../apps/frontend/src/screens/class-detail-screen.tsx#L278) | `Skeleton` | Defaults / no such prop supplied | ``className="mt-2 h-4 w-64"`` | appearance/size |
| C185 | [tutor/screens/class-detail-screen.tsx:280](../../apps/frontend/src/screens/class-detail-screen.tsx#L280) | `Skeleton` | Defaults / no such prop supplied | ``className="h-18 w-full rounded-none"`` | appearance/size |
| C186 | [tutor/screens/class-detail-screen.tsx:281](../../apps/frontend/src/screens/class-detail-screen.tsx#L281) | `Skeleton` | Defaults / no such prop supplied | ``className="h-18 w-full rounded-none"`` | appearance/size |
| C187 | [tutor/screens/class-detail-screen.tsx:285](../../apps/frontend/src/screens/class-detail-screen.tsx#L285) | `Skeleton` | Defaults / no such prop supplied | ``className="h-64 w-full rounded-xl"`` | appearance/size |
| C188 | [tutor/screens/class-detail-screen.tsx:287](../../apps/frontend/src/screens/class-detail-screen.tsx#L287) | `Skeleton` | Defaults / no such prop supplied | ``className="h-48 w-full rounded-xl"`` | appearance/size |
| C189 | [tutor/screens/class-detail-screen.tsx:288](../../apps/frontend/src/screens/class-detail-screen.tsx#L288) | `Skeleton` | Defaults / no such prop supplied | ``className="h-36 w-full rounded-xl"`` | appearance/size |
| C190 | [tutor/screens/class-detail-screen.tsx:299](../../apps/frontend/src/screens/class-detail-screen.tsx#L299) | `Button` | ``variant="ghost"`` | ``className="mt-4"`` | placement |
| C191 | [tutor/screens/class-detail-screen.tsx:324](../../apps/frontend/src/screens/class-detail-screen.tsx#L324) | `Button` | ``variant="outline"`` | ``className="mt-4"`` | placement |
| C192 | [tutor/screens/class-detail-screen.tsx:359](../../apps/frontend/src/screens/class-detail-screen.tsx#L359) | `Button` | ``variant="outline"`` | ``className="w-full sm:w-auto"`` | placement |
| C193 | [tutor/screens/classes-screen.tsx:286](../../apps/frontend/src/screens/classes-screen.tsx#L286) † | `Button` | Defaults / no such prop supplied | ``className="w-full"`` | placement |
| C194 | [tutor/screens/classes-screen.tsx:301](../../apps/frontend/src/screens/classes-screen.tsx#L301) † | `Button` | ``variant="ghost"`` | ``className="h-auto min-h-8 max-w-40 justify-start truncate px-0 font-semibold"`` | appearance/size |
| C195 | [tutor/screens/classes-screen.tsx:338](../../apps/frontend/src/screens/classes-screen.tsx#L338) † | `AvatarFallback` | Defaults / no such prop supplied | ``className={`${nameToneAvatarClasses[getNameTone(student.getName())]} font-semibold`}`` | computed |
| C196 | [tutor/screens/classes-screen.tsx:523](../../apps/frontend/src/screens/classes-screen.tsx#L523) † | `DataTable` | Defaults / no such prop supplied | ``className="[&_[data-slot=table-cell]]:px-2 [&_[data-slot=table-head]]:px-2"`` | internals |
| C197 | [tutor/screens/classes-screen.tsx:591](../../apps/frontend/src/screens/classes-screen.tsx#L591) † | `Button` | ``variant="ghost"`` | ``className="w-full"`` | placement |
| C198 | [tutor/screens/classes-screen.tsx:616](../../apps/frontend/src/screens/classes-screen.tsx#L616) † | `Button` | ``size="icon"`` | ``className="hidden sm:inline-flex sm:w-auto sm:px-3"`` | appearance/size |
| C199 | [tutor/screens/classes-screen.tsx:651](../../apps/frontend/src/screens/classes-screen.tsx#L651) † | `WorkspaceList` | Defaults / no such prop supplied | ``className="pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-0"`` | appearance/size |
| C200 | [tutor/screens/course-detail-screen.tsx:75](../../apps/frontend/src/screens/course-detail-screen.tsx#L75) | `Button` | ``variant="ghost"`` | ``className="mt-4"`` | placement |
| C201 | [tutor/screens/course-detail-screen.tsx:100](../../apps/frontend/src/screens/course-detail-screen.tsx#L100) | `Button` | ``variant="outline"`` | ``className="mt-4"`` | placement |
| C202 | [tutor/screens/course-detail-screen.tsx:182](../../apps/frontend/src/screens/course-detail-screen.tsx#L182) | `Button` | ``variant="outline"`` | ``className="w-full sm:w-auto"`` | placement |
| C203 | [tutor/screens/course-detail-screen.tsx:223](../../apps/frontend/src/screens/course-detail-screen.tsx#L223) | `Skeleton` | Defaults / no such prop supplied | ``className="size-11 rounded-full"`` | appearance/size |
| C204 | [tutor/screens/course-detail-screen.tsx:224](../../apps/frontend/src/screens/course-detail-screen.tsx#L224) | `Skeleton` | Defaults / no such prop supplied | ``className="h-7 w-2/5 rounded"`` | appearance/size |
| C205 | [tutor/screens/course-detail-screen.tsx:225](../../apps/frontend/src/screens/course-detail-screen.tsx#L225) | `Skeleton` | Defaults / no such prop supplied | ``className="size-11 rounded-full"`` | appearance/size |
| C206 | [tutor/screens/course-detail-screen.tsx:228](../../apps/frontend/src/screens/course-detail-screen.tsx#L228) | `Skeleton` | Defaults / no such prop supplied | ``className="h-20 rounded-none bg-card"`` | appearance/size |
| C207 | [tutor/screens/course-detail-screen.tsx:229](../../apps/frontend/src/screens/course-detail-screen.tsx#L229) | `Skeleton` | Defaults / no such prop supplied | ``className="h-20 rounded-none bg-card"`` | appearance/size |
| C208 | [tutor/screens/course-detail-screen.tsx:230](../../apps/frontend/src/screens/course-detail-screen.tsx#L230) | `Skeleton` | Defaults / no such prop supplied | ``className="h-20 rounded-none bg-card"`` | appearance/size |
| C209 | [tutor/screens/courses-screen.tsx:219](../../apps/frontend/src/screens/courses-screen.tsx#L219) † | `Button` | ``size="sm" variant="ghost"`` | ``className="-ml-3"`` | placement |
| C210 | [tutor/screens/courses-screen.tsx:360](../../apps/frontend/src/screens/courses-screen.tsx#L360) † | `DataTable` | Defaults / no such prop supplied | ``className="[&_[data-slot=table-cell]]:px-2 [&_[data-slot=table-head]]:px-2"`` | internals |
| C211 | [tutor/screens/courses-screen.tsx:391](../../apps/frontend/src/screens/courses-screen.tsx#L391) † | `Button` | ``size="icon"`` | ``className="hidden sm:inline-flex sm:w-auto sm:px-3"`` | appearance/size |
| C212 | [tutor/screens/courses-screen.tsx:415](../../apps/frontend/src/screens/courses-screen.tsx#L415) † | `WorkspaceList` | Defaults / no such prop supplied | ``className="pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-0"`` | appearance/size |
| C213 | [tutor/screens/dashboard-screen.tsx:306](../../apps/frontend/src/screens/dashboard-screen.tsx#L306) | `Skeleton` | Defaults / no such prop supplied | ``className="mt-4 h-5 w-48"`` | appearance/size |
| C214 | [tutor/screens/dashboard-screen.tsx:818](../../apps/frontend/src/screens/dashboard-screen.tsx#L818) | `Button` | Defaults / no such prop supplied | ``className="w-full sm:w-auto"`` | placement |
| C215 | [tutor/screens/dashboard-screen.tsx:849](../../apps/frontend/src/screens/dashboard-screen.tsx#L849) | `Button` | Defaults / no such prop supplied | ``className="w-full sm:w-auto"`` | placement |
| C216 | [tutor/screens/dashboard-screen.tsx:882](../../apps/frontend/src/screens/dashboard-screen.tsx#L882) | `Button` | Defaults / no such prop supplied | ``className="w-full sm:w-auto"`` | placement |
| C217 | [tutor/screens/dashboard-screen.tsx:1017](../../apps/frontend/src/screens/dashboard-screen.tsx#L1017) | `Button` | ``size="sm" variant="outline"`` | ``className="min-h-11"`` | appearance/size |
| C218 | [tutor/screens/dashboard-screen.tsx:1038](../../apps/frontend/src/screens/dashboard-screen.tsx#L1038) | `Skeleton` | Defaults / no such prop supplied | ``className="h-5 w-44"`` | appearance/size |
| C219 | [tutor/screens/dashboard-screen.tsx:1039](../../apps/frontend/src/screens/dashboard-screen.tsx#L1039) | `Skeleton` | Defaults / no such prop supplied | ``className="mt-3 h-4 w-64 max-w-full"`` | appearance/size |
| C220 | [tutor/screens/dashboard-screen.tsx:1041](../../apps/frontend/src/screens/dashboard-screen.tsx#L1041) | `Skeleton` | Defaults / no such prop supplied | ``className="h-11 w-full"`` | appearance/size |
| C221 | [tutor/screens/dashboard-screen.tsx:1042](../../apps/frontend/src/screens/dashboard-screen.tsx#L1042) | `Skeleton` | Defaults / no such prop supplied | ``className="h-11 w-full"`` | appearance/size |
| C222 | [tutor/screens/dashboard-screen.tsx:1043](../../apps/frontend/src/screens/dashboard-screen.tsx#L1043) | `Skeleton` | Defaults / no such prop supplied | ``className="h-11 w-full"`` | appearance/size |
| C223 | [tutor/screens/dashboard-screen.tsx:1112](../../apps/frontend/src/screens/dashboard-screen.tsx#L1112) | `Badge` | ``variant={status.badgeVariant}`` | ``className="shrink-0 gap-1"`` | appearance/size |
| C224 | [tutor/screens/dashboard-screen.tsx:1155](../../apps/frontend/src/screens/dashboard-screen.tsx#L1155) | `Skeleton` | Defaults / no such prop supplied | ``className="mt-5 h-9 w-14"`` | appearance/size |
| C225 | [tutor/screens/dashboard-screen.tsx:1159](../../apps/frontend/src/screens/dashboard-screen.tsx#L1159) | `Skeleton` | Defaults / no such prop supplied | ``className="h-5 w-32"`` | appearance/size |
| C226 | [tutor/screens/dashboard-screen.tsx:1160](../../apps/frontend/src/screens/dashboard-screen.tsx#L1160) | `Skeleton` | Defaults / no such prop supplied | ``className="mt-3 h-4 w-44 max-w-full"`` | appearance/size |
| C227 | [tutor/screens/dashboard-screen.tsx:1183](../../apps/frontend/src/screens/dashboard-screen.tsx#L1183) | `Button` | ``variant="outline"`` | ``className="mt-4"`` | placement |
| C228 | [tutor/screens/forgot-password-screen.tsx:96](../../apps/frontend/src/screens/forgot-password-screen.tsx#L96) | `Button` | Defaults / no such prop supplied | ``className="h-12 w-full"`` | appearance/size |
| C229 | [tutor/screens/integrations-screen.tsx:50](../../apps/frontend/src/screens/integrations-screen.tsx#L50) | `Button` | ``variant="outline"`` | ``className="min-h-11 w-full sm:w-auto"`` | appearance/size |
| C230 | [tutor/screens/integrations-screen.tsx:87](../../apps/frontend/src/screens/integrations-screen.tsx#L87) | `Button` | ``variant={connection.data?.configured ? "outline" : "default"}`` | ``className="min-h-11 w-full sm:w-auto"`` | appearance/size |
| C231 | [tutor/screens/integrations-screen.tsx:170](../../apps/frontend/src/screens/integrations-screen.tsx#L170) | `Badge` | ``variant={status === "connected" ? "success" : "neutral"}`` | ``className="gap-1.5"`` | appearance/size |
| C232 | [tutor/screens/integrations-screen.tsx:241](../../apps/frontend/src/screens/integrations-screen.tsx#L241) | `Skeleton` | Defaults / no such prop supplied | ``className="size-8 shrink-0 rounded-sm"`` | appearance/size |
| C233 | [tutor/screens/integrations-screen.tsx:244](../../apps/frontend/src/screens/integrations-screen.tsx#L244) | `Skeleton` | Defaults / no such prop supplied | ``className="h-5 w-24"`` | appearance/size |
| C234 | [tutor/screens/integrations-screen.tsx:245](../../apps/frontend/src/screens/integrations-screen.tsx#L245) | `Skeleton` | Defaults / no such prop supplied | ``className="h-5 w-24"`` | appearance/size |
| C235 | [tutor/screens/integrations-screen.tsx:247](../../apps/frontend/src/screens/integrations-screen.tsx#L247) | `Skeleton` | Defaults / no such prop supplied | ``className="h-4 w-64 max-w-full"`` | appearance/size |
| C236 | [tutor/screens/integrations-screen.tsx:250](../../apps/frontend/src/screens/integrations-screen.tsx#L250) | `Skeleton` | Defaults / no such prop supplied | ``className="h-11 w-full shrink-0 rounded-full sm:w-28"`` | appearance/size |
| C237 | [tutor/screens/line-link-screen.tsx:192](../../apps/frontend/src/screens/line-link-screen.tsx#L192) | `Button` | Defaults / no such prop supplied | ``className="mt-auto h-12 w-full sm:mt-8"`` | appearance/size |
| C238 | [tutor/screens/line-link-screen.tsx:251](../../apps/frontend/src/screens/line-link-screen.tsx#L251) | `Button` | ``variant="outline"`` | ``className="mt-8 h-12 w-full"`` | appearance/size |
| C239 | [tutor/screens/line-settings-screen.tsx:316](../../apps/frontend/src/screens/line-settings-screen.tsx#L316) | `Badge` | ``variant={testRecipientConnected ? "success" : "neutral"}`` | ``className="gap-1.5"`` | appearance/size |
| C240 | [tutor/screens/line-settings-screen.tsx:375](../../apps/frontend/src/screens/line-settings-screen.tsx#L375) | `Button` | Defaults / no such prop supplied | ``className="w-full sm:w-auto"`` | placement |
| C241 | [tutor/screens/line-settings-screen.tsx:388](../../apps/frontend/src/screens/line-settings-screen.tsx#L388) | `Button` | Defaults / no such prop supplied | ``className="w-full sm:w-auto"`` | placement |
| C242 | [tutor/screens/line-settings-screen.tsx:419](../../apps/frontend/src/screens/line-settings-screen.tsx#L419) | `Button` | ``variant="outline"`` | ``className="w-full sm:w-auto"`` | placement |
| C243 | [tutor/screens/line-settings-screen.tsx:575](../../apps/frontend/src/screens/line-settings-screen.tsx#L575) | `Button` | Defaults / no such prop supplied | ``className="w-full sm:w-auto"`` | placement |
| C244 | [tutor/screens/line-settings-screen.tsx:579](../../apps/frontend/src/screens/line-settings-screen.tsx#L579) | `Button` | ``variant="ghost"`` | ``className="w-full sm:w-auto"`` | placement |
| C245 | [tutor/screens/line-settings-screen.tsx:789](../../apps/frontend/src/screens/line-settings-screen.tsx#L789) | `Button` | ``variant="outline"`` | ``className="mt-5 w-full sm:w-auto"`` | placement |
| C246 | [tutor/screens/line-settings-screen.tsx:808](../../apps/frontend/src/screens/line-settings-screen.tsx#L808) | `Skeleton` | Defaults / no such prop supplied | ``className="size-6 shrink-0 rounded-full"`` | appearance/size |
| C247 | [tutor/screens/line-settings-screen.tsx:810](../../apps/frontend/src/screens/line-settings-screen.tsx#L810) | `Skeleton` | Defaults / no such prop supplied | ``className="h-5 w-36"`` | appearance/size |
| C248 | [tutor/screens/line-settings-screen.tsx:811](../../apps/frontend/src/screens/line-settings-screen.tsx#L811) | `Skeleton` | Defaults / no such prop supplied | ``className="mt-2 h-4 w-full max-w-md"`` | appearance/size |
| C249 | [tutor/screens/line-settings-screen.tsx:814](../../apps/frontend/src/screens/line-settings-screen.tsx#L814) | `Skeleton` | Defaults / no such prop supplied | ``className="h-4 w-52"`` | appearance/size |
| C250 | [tutor/screens/line-settings-screen.tsx:815](../../apps/frontend/src/screens/line-settings-screen.tsx#L815) | `Skeleton` | Defaults / no such prop supplied | ``className="h-11 w-full"`` | appearance/size |
| C251 | [tutor/screens/line-settings-screen.tsx:816](../../apps/frontend/src/screens/line-settings-screen.tsx#L816) | `Skeleton` | Defaults / no such prop supplied | ``className="h-4 w-full max-w-md"`` | appearance/size |
| C252 | [tutor/screens/line-settings-screen.tsx:820](../../apps/frontend/src/screens/line-settings-screen.tsx#L820) | `Skeleton` | Defaults / no such prop supplied | ``className="h-4 w-32"`` | appearance/size |
| C253 | [tutor/screens/line-settings-screen.tsx:821](../../apps/frontend/src/screens/line-settings-screen.tsx#L821) | `Skeleton` | Defaults / no such prop supplied | ``className="h-11 w-full"`` | appearance/size |
| C254 | [tutor/screens/line-settings-screen.tsx:824](../../apps/frontend/src/screens/line-settings-screen.tsx#L824) | `Skeleton` | Defaults / no such prop supplied | ``className="h-4 w-36"`` | appearance/size |
| C255 | [tutor/screens/line-settings-screen.tsx:825](../../apps/frontend/src/screens/line-settings-screen.tsx#L825) | `Skeleton` | Defaults / no such prop supplied | ``className="h-11 w-full"`` | appearance/size |
| C256 | [tutor/screens/line-settings-screen.tsx:829](../../apps/frontend/src/screens/line-settings-screen.tsx#L829) | `Skeleton` | Defaults / no such prop supplied | ``className="mt-5 h-11 w-full sm:w-40"`` | appearance/size |
| C257 | [tutor/screens/line-settings-screen.tsx:833](../../apps/frontend/src/screens/line-settings-screen.tsx#L833) | `Skeleton` | Defaults / no such prop supplied | ``className="size-5 shrink-0 rounded-full"`` | appearance/size |
| C258 | [tutor/screens/line-settings-screen.tsx:834](../../apps/frontend/src/screens/line-settings-screen.tsx#L834) | `Skeleton` | Defaults / no such prop supplied | ``className="h-4 w-40"`` | appearance/size |
| C259 | [tutor/screens/line-settings-screen.tsx:837](../../apps/frontend/src/screens/line-settings-screen.tsx#L837) | `Skeleton` | Defaults / no such prop supplied | ``className="size-5 shrink-0 rounded-full"`` | appearance/size |
| C260 | [tutor/screens/line-settings-screen.tsx:838](../../apps/frontend/src/screens/line-settings-screen.tsx#L838) | `Skeleton` | Defaults / no such prop supplied | ``className="h-4 w-36"`` | appearance/size |
| C261 | [tutor/screens/login-screen.tsx:191](../../apps/frontend/src/screens/login-screen.tsx#L191) | `Button` | ``variant="outline"`` | ``className="h-12 flex-1 sm:min-h-12 sm:flex-none sm:w-full"`` | appearance/size |
| C262 | [tutor/screens/login-screen.tsx:208](../../apps/frontend/src/screens/login-screen.tsx#L208) | `Button` | ``variant="outline"`` | ``className="h-12 flex-1 sm:min-h-12 sm:flex-none sm:w-full"`` | appearance/size |
| C263 | [tutor/screens/login-screen.tsx:275](../../apps/frontend/src/screens/login-screen.tsx#L275) | `Button` | Defaults / no such prop supplied | ``className="h-12 w-full"`` | appearance/size |
| C264 | [tutor/screens/reset-password-screen.tsx:150](../../apps/frontend/src/screens/reset-password-screen.tsx#L150) | `Button` | Defaults / no such prop supplied | ``className="h-12 w-full"`` | appearance/size |
| C265 | [tutor/screens/schedules-screen.tsx:409](../../apps/frontend/src/screens/schedules-screen.tsx#L409) | `Tabs` | Defaults / no such prop supplied | ``className="flex min-h-0 flex-1 flex-col gap-0"`` | appearance/size |
| C266 | [tutor/screens/schedules-screen.tsx:424](../../apps/frontend/src/screens/schedules-screen.tsx#L424) | `TabsPanels` | Defaults / no such prop supplied | ``className="flex min-h-0 flex-1 flex-col"`` | appearance/size |
| C267 | [tutor/screens/schedules-screen.tsx:428](../../apps/frontend/src/screens/schedules-screen.tsx#L428) | `TabsPanel` | Defaults / no such prop supplied | ``className="flex min-h-0 flex-1 flex-col"`` | appearance/size |
| C268 | [tutor/screens/schedules-screen.tsx:444](../../apps/frontend/src/screens/schedules-screen.tsx#L444) | `Button` | Defaults / no such prop supplied | ``className="hidden sm:inline-flex"`` | placement |
| C269 | [tutor/screens/schedules-screen.tsx:458](../../apps/frontend/src/screens/schedules-screen.tsx#L458) | `Tabs` | Defaults / no such prop supplied | ``className="flex min-h-0 flex-1 flex-col gap-0"`` | appearance/size |
| C270 | [tutor/screens/schedules-screen.tsx:479](../../apps/frontend/src/screens/schedules-screen.tsx#L479) | `TabsPanels` | Defaults / no such prop supplied | ``className="flex min-h-0 flex-1 flex-col"`` | appearance/size |
| C271 | [tutor/screens/schedules-screen.tsx:484](../../apps/frontend/src/screens/schedules-screen.tsx#L484) | `TabsPanel` | Defaults / no such prop supplied | ``className="flex min-h-0 flex-1 flex-col"`` | appearance/size |
| C272 | [tutor/screens/schedules-screen.tsx:502](../../apps/frontend/src/screens/schedules-screen.tsx#L502) | `TabsPanel` | Defaults / no such prop supplied | ``className="flex min-h-0 flex-1 flex-col"`` | appearance/size |
| C273 | [tutor/screens/signup-screen.tsx:155](../../apps/frontend/src/screens/signup-screen.tsx#L155) | `Button` | ``variant="outline"`` | ``className="h-12 w-full"`` | appearance/size |
| C274 | [tutor/screens/signup-screen.tsx:311](../../apps/frontend/src/screens/signup-screen.tsx#L311) | `Button` | ``variant="outline"`` | ``className="h-12 px-4"`` | appearance/size |
| C275 | [tutor/screens/signup-screen.tsx:327](../../apps/frontend/src/screens/signup-screen.tsx#L327) | `Button` | Defaults / no such prop supplied | ``className="h-12 flex-1"`` | appearance/size |
| C276 | [tutor/screens/student-detail-screen.tsx:51](../../apps/frontend/src/screens/student-detail-screen.tsx#L51) | `Skeleton` | Defaults / no such prop supplied | ``className="w-9 h-9 rounded-full"`` | appearance/size |
| C277 | [tutor/screens/student-detail-screen.tsx:52](../../apps/frontend/src/screens/student-detail-screen.tsx#L52) | `Skeleton` | Defaults / no such prop supplied | ``className="w-10 h-10 rounded-full shrink-0"`` | appearance/size |
| C278 | [tutor/screens/student-detail-screen.tsx:53](../../apps/frontend/src/screens/student-detail-screen.tsx#L53) | `Skeleton` | Defaults / no such prop supplied | ``className="flex-1 h-6 rounded"`` | appearance/size |
| C279 | [tutor/screens/student-detail-screen.tsx:54](../../apps/frontend/src/screens/student-detail-screen.tsx#L54) | `Skeleton` | Defaults / no such prop supplied | ``className="w-9 h-9 rounded-full"`` | appearance/size |
| C280 | [tutor/screens/student-detail-screen.tsx:57](../../apps/frontend/src/screens/student-detail-screen.tsx#L57) | `Skeleton` | Defaults / no such prop supplied | ``className="h-5 w-16 rounded-full"`` | appearance/size |
| C281 | [tutor/screens/student-detail-screen.tsx:58](../../apps/frontend/src/screens/student-detail-screen.tsx#L58) | `Skeleton` | Defaults / no such prop supplied | ``className="h-5 w-28 rounded-full"`` | appearance/size |
| C282 | [tutor/screens/student-detail-screen.tsx:62](../../apps/frontend/src/screens/student-detail-screen.tsx#L62) | `Skeleton` | Defaults / no such prop supplied | ``className="h-3 w-32"`` | appearance/size |
| C283 | [tutor/screens/student-detail-screen.tsx:69](../../apps/frontend/src/screens/student-detail-screen.tsx#L69) | `Skeleton` | Defaults / no such prop supplied | ``className="h-4 w-32"`` | appearance/size |
| C284 | [tutor/screens/student-detail-screen.tsx:71](../../apps/frontend/src/screens/student-detail-screen.tsx#L71) | `Skeleton` | Defaults / no such prop supplied | ``className="h-5 w-20 rounded-full"`` | appearance/size |
| C285 | [tutor/screens/student-screen.tsx:103](../../apps/frontend/src/screens/student-screen.tsx#L103) † | `Button` | Defaults / no such prop supplied | ``className="w-full"`` | placement |
| C286 | [tutor/screens/student-screen.tsx:112](../../apps/frontend/src/screens/student-screen.tsx#L112) † | `Button` | ``size="icon"`` | ``className="hidden sm:inline-flex sm:w-auto sm:px-3"`` | appearance/size |
| C287 | [tutor/screens/student-screen.tsx:144](../../apps/frontend/src/screens/student-screen.tsx#L144) † | `WorkspaceList` | Defaults / no such prop supplied | ``className="pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-0"`` | appearance/size |
| C288 | [tutor/screens/verify-email-screen.tsx:118](../../apps/frontend/src/screens/verify-email-screen.tsx#L118) | `Button` | Defaults / no such prop supplied | ``className="h-12 w-full"`` | appearance/size |
### Admin portal

| ID | Source | Component | Existing props | Styling passed | Classification |
| --- | --- | --- | --- | --- | --- |
| C001 | [admin/components/admin-users/admin-user-actions-menu.tsx:59](../../apps/admin-frontend/src/components/admin-users/admin-user-actions-menu.tsx#L59) | `DropdownMenuContent` | Defaults / no such prop supplied | ``className="min-w-48"`` | placement |
| C002 | [admin/components/admin-users/admin-user-drawer.tsx:63](../../apps/admin-frontend/src/components/admin-users/admin-user-drawer.tsx#L63) | `DrawerPopup` | Defaults / no such prop supplied | ``className="max-h-[min(86dvh,44rem)] md:w-[min(28rem,100vw)]"`` | appearance/size |
| C003 | [admin/components/admin-users/admin-user-drawer.tsx:72](../../apps/admin-frontend/src/components/admin-users/admin-user-drawer.tsx#L72) | `DrawerTitle` | Defaults / no such prop supplied | ``className="text-xl font-normal tracking-[-0.02em] text-foreground md:text-2xl"`` | appearance/size |
| C004 | [admin/components/admin-users/admin-user-drawer.tsx:75](../../apps/admin-frontend/src/components/admin-users/admin-user-drawer.tsx#L75) | `DrawerDescription` | Defaults / no such prop supplied | ``className="mt-1 text-sm leading-6 text-muted-foreground"`` | appearance/size |
| C005 | [admin/components/admin-users/admin-user-drawer.tsx:79](../../apps/admin-frontend/src/components/admin-users/admin-user-drawer.tsx#L79) | `DrawerClose` | Defaults / no such prop supplied | ``className="-m-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"`` | appearance/size |
| C006 | [admin/components/admin-users/admin-user-impersonation-dialog.tsx:55](../../apps/admin-frontend/src/components/admin-users/admin-user-impersonation-dialog.tsx#L55) | `DialogOverlay` | Defaults / no such prop supplied | ``className="z-70"`` | placement |
| C007 | [admin/components/admin-users/admin-user-impersonation-dialog.tsx:56](../../apps/admin-frontend/src/components/admin-users/admin-user-impersonation-dialog.tsx#L56) | `DialogViewport` | Defaults / no such prop supplied | ``className="z-80 p-4 sm:p-6"`` | appearance/size |
| C008 | [admin/components/admin-users/admin-user-impersonation-dialog.tsx:57](../../apps/admin-frontend/src/components/admin-users/admin-user-impersonation-dialog.tsx#L57) | `DialogPopup` | Defaults / no such prop supplied | ``className="w-full max-w-md rounded-xl border border-border bg-popover p-6 text-popover-foreground shadow-transient-dialog outline-none"`` | appearance/size |
| C009 | [admin/components/admin-users/admin-user-impersonation-dialog.tsx:64](../../apps/admin-frontend/src/components/admin-users/admin-user-impersonation-dialog.tsx#L64) | `DialogTitle` | Defaults / no such prop supplied | ``className="mt-5 text-lg font-semibold text-foreground"`` | appearance/size |
| C010 | [admin/components/admin-users/admin-user-impersonation-dialog.tsx:67](../../apps/admin-frontend/src/components/admin-users/admin-user-impersonation-dialog.tsx#L67) | `DialogDescription` | Defaults / no such prop supplied | ``className="mt-2 break-words text-sm leading-6 text-muted-foreground"`` | appearance/size |
| C011 | [admin/components/admin-users/admin-user-list.tsx:158](../../apps/admin-frontend/src/components/admin-users/admin-user-list.tsx#L158) | `Button` | ``size="sm" variant="outline"`` | ``className="h-11 sm:h-8"`` | appearance/size |
| C012 | [admin/components/admin-users/admin-user-list.tsx:174](../../apps/admin-frontend/src/components/admin-users/admin-user-list.tsx#L174) | `Button` | ``size="sm" variant="outline"`` | ``className="h-11 sm:h-8"`` | appearance/size |
| C013 | [admin/components/admin-users/admin-user-list.tsx:230](../../apps/admin-frontend/src/components/admin-users/admin-user-list.tsx#L230) | `Avatar` | Defaults / no such prop supplied | ``className="size-10"`` | appearance/size |
| C014 | [admin/components/admin-users/admin-user-list.tsx:343](../../apps/admin-frontend/src/components/admin-users/admin-user-list.tsx#L343) | `Button` | ``variant="outline"`` | ``className="mt-5"`` | placement |
| C015 | [admin/components/admin-users/admin-user-list.tsx:375](../../apps/admin-frontend/src/components/admin-users/admin-user-list.tsx#L375) | `Button` | ``variant="outline"`` | ``className="mt-5"`` | placement |
| C016 | [admin/components/admin-users/admin-user-list.tsx:379](../../apps/admin-frontend/src/components/admin-users/admin-user-list.tsx#L379) | `Button` | Defaults / no such prop supplied | ``className="mt-5"`` | placement |
| C017 | [admin/components/admin-users/admin-user-status-dialog.tsx:47](../../apps/admin-frontend/src/components/admin-users/admin-user-status-dialog.tsx#L47) | `DialogOverlay` | Defaults / no such prop supplied | ``className="z-70"`` | placement |
| C018 | [admin/components/admin-users/admin-user-status-dialog.tsx:48](../../apps/admin-frontend/src/components/admin-users/admin-user-status-dialog.tsx#L48) | `DialogViewport` | Defaults / no such prop supplied | ``className="z-80 p-4 sm:p-6"`` | appearance/size |
| C019 | [admin/components/admin-users/admin-user-status-dialog.tsx:49](../../apps/admin-frontend/src/components/admin-users/admin-user-status-dialog.tsx#L49) | `DialogPopup` | Defaults / no such prop supplied | ``className="w-full max-w-md rounded-xl border border-border bg-popover p-6 text-popover-foreground shadow-transient-dialog outline-none"`` | appearance/size |
| C020 | [admin/components/admin-users/admin-user-status-dialog.tsx:53](../../apps/admin-frontend/src/components/admin-users/admin-user-status-dialog.tsx#L53) | `DialogTitle` | Defaults / no such prop supplied | ``className="mt-5 text-lg font-semibold text-foreground"`` | appearance/size |
| C021 | [admin/components/admin-users/admin-user-status-dialog.tsx:56](../../apps/admin-frontend/src/components/admin-users/admin-user-status-dialog.tsx#L56) | `DialogDescription` | Defaults / no such prop supplied | ``className="mt-2 text-sm leading-6 text-muted-foreground"`` | appearance/size |
| C022 | [admin/components/layout/app-sidebar.tsx:61](../../apps/admin-frontend/src/components/layout/app-sidebar.tsx#L61) | `Button` | ``size="md" variant="ghost"`` | ``className="ml-auto min-w-11 shrink-0"`` | placement |
| C023 | [admin/components/layout/app-sidebar.tsx:75](../../apps/admin-frontend/src/components/layout/app-sidebar.tsx#L75) | `DropdownMenuContent` | Defaults / no such prop supplied | ``className="min-w-40"``<br>``positionerClassName="z-[1000]"`` | placement |
| C024 | [admin/components/layout/app-sidebar.tsx:157](../../apps/admin-frontend/src/components/layout/app-sidebar.tsx#L157) | `Avatar` | Defaults / no such prop supplied | ``className="jun-sidebarIcon h-8 w-8"`` | appearance/size |
| C025 | [admin/components/layout/user-settings.tsx:31](../../apps/admin-frontend/src/components/layout/user-settings.tsx#L31) | `DropdownMenuContent` | Defaults / no such prop supplied | ``className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"``<br>``positionerClassName="z-[1000]"`` | appearance/size, placement |
| C026 | [admin/components/layout/user-settings.tsx:43](../../apps/admin-frontend/src/components/layout/user-settings.tsx#L43) | `Avatar` | Defaults / no such prop supplied | ``className="h-8 w-8"`` | appearance/size |
| C027 | [admin/components/route-fallback.tsx:203](../../apps/admin-frontend/src/components/route-fallback.tsx#L203) | `Button` | Defaults / no such prop supplied | ``className="w-full sm:w-auto"`` | placement |
| C031 | [admin/routes/_layout.tsx:94](../../apps/admin-frontend/src/routes/_layout.tsx#L94) | `Button` | Defaults / no such prop supplied | ``className="mt-8"`` | placement |
| C032 | [admin/screens/admin-home-screen.tsx:267](../../apps/admin-frontend/src/screens/admin-home-screen.tsx#L267) | `ScreenLayout` | Defaults / no such prop supplied | ``className="min-h-dvh"`` | appearance/size |
| C033 | [admin/screens/admin-home-screen.tsx:285](../../apps/admin-frontend/src/screens/admin-home-screen.tsx#L285) | `Button` | Defaults / no such prop supplied | ``className="w-full sm:w-auto"`` | placement |
| C034 | [admin/screens/admin-login-screen.tsx:83](../../apps/admin-frontend/src/screens/admin-login-screen.tsx#L83) | `Button` | Defaults / no such prop supplied | ``className="h-12 w-full"`` | appearance/size |

### Internal common-component composition

These are styles owned or forwarded by the common layer, not screen-level
overrides. Review their forwarding contract separately.

| ID | Source | Component | Styling passed |
| --- | --- | --- | --- |
| C028 | [admin/components/ui/field.tsx:103](../../apps/admin-frontend/src/components/ui/field.tsx#L103) | `Label` | ``className={cn( "group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50 has-data-checked:border-primary/30 has-data-checked:bg-primary/5 has-[>[data-slot=field]]:rounded-xl has-[>[data-slot=field]]:border *:data-[slot=field]:p-4 dark:has-data-checked:border-primary/20 dark:has-data-checked:bg-primary/10", "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col", className )}`` |
| C029 | [admin/components/ui/form/form-field.tsx:44](../../apps/admin-frontend/src/components/ui/form/form-field.tsx#L44) | `Field` | ``className={cn("w-full", className)}`` |
| C030 | [admin/components/ui/form/input-field.tsx:39](../../apps/admin-frontend/src/components/ui/form/input-field.tsx#L39) | `Input` | ``className={className}`` |

## Variant-helper styling

These calls create shared-component classes for links rather than JSX Button
instances. They need the same styling decision as a component prop override.

| ID | Source | Helper | Custom styling |
| --- | --- | --- | --- |
| H001 | [admin/components/route-fallback.tsx:165](../../apps/admin-frontend/src/components/route-fallback.tsx#L165) | `buttonVariants` | ``composedClassName=cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")`` |
| H002 | [tutor/components/layout/impersonation-banner.tsx:64](../../apps/frontend/src/components/layout/impersonation-banner.tsx#L64) | `buttonVariants` | ``composedClassName=cn( buttonVariants({ variant: "default" }), "w-full sm:w-auto", )`` |
| H003 | [tutor/components/route-fallback.tsx:166](../../apps/frontend/src/components/route-fallback.tsx#L166) | `buttonVariants` | ``composedClassName=cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")`` |
| H004 | [tutor/screens/forgot-password-screen.tsx:55](../../apps/frontend/src/screens/forgot-password-screen.tsx#L55) | `buttonVariants` | ``className="h-12 w-full"`` |
| H005 | [tutor/screens/forgot-password-screen.tsx:110](../../apps/frontend/src/screens/forgot-password-screen.tsx#L110) | `buttonVariants` | ``className="h-auto p-0 font-semibold"`` |
| H006 | [tutor/screens/login-screen.tsx:258](../../apps/frontend/src/screens/login-screen.tsx#L258) | `buttonVariants` | ``className="absolute right-0 top-0 h-auto p-0 text-sm font-semibold"`` |
| H007 | [tutor/screens/login-screen.tsx:291](../../apps/frontend/src/screens/login-screen.tsx#L291) | `buttonVariants` | ``className="h-auto p-0 font-semibold"`` |
| H008 | [tutor/screens/login-screen.tsx:304](../../apps/frontend/src/screens/login-screen.tsx#L304) | `buttonVariants` | ``className="h-auto p-0 font-semibold"`` |
| H009 | [tutor/screens/reset-password-screen.tsx:95](../../apps/frontend/src/screens/reset-password-screen.tsx#L95) | `buttonVariants` | ``className="h-12 w-full"`` |
| H010 | [tutor/screens/reset-password-screen.tsx:105](../../apps/frontend/src/screens/reset-password-screen.tsx#L105) | `buttonVariants` | ``className="h-auto p-0 font-semibold"`` |
| H011 | [tutor/screens/signup-screen.tsx:171](../../apps/frontend/src/screens/signup-screen.tsx#L171) | `buttonVariants` | ``className="h-12 w-full"`` |
| H012 | [tutor/screens/signup-screen.tsx:184](../../apps/frontend/src/screens/signup-screen.tsx#L184) | `buttonVariants` | ``className="h-auto p-0 font-semibold"`` |
| H013 | [tutor/screens/signup-screen.tsx:347](../../apps/frontend/src/screens/signup-screen.tsx#L347) | `buttonVariants` | ``className="h-auto p-0 font-semibold"`` |
| H014 | [tutor/screens/verify-email-screen.tsx:129](../../apps/frontend/src/screens/verify-email-screen.tsx#L129) | `buttonVariants` | ``className="h-12 w-full"`` |

## Prop-spread forwarding review

All detected spread sites are admin common form/field implementations.
`className` and other input props can be forwarded; their runtime values are not
resolved by this scan. The spread itself is not proof of a styling override.

| ID | Source | Component | Forwarded values |
| --- | --- | --- | --- |
| S001 | [admin/components/ui/field.tsx:103](../../apps/admin-frontend/src/components/ui/field.tsx#L103) | `Label` | ``{...props}`` |
| S002 | [admin/components/ui/form/rhf.tsx:62](../../apps/admin-frontend/src/components/ui/form/rhf.tsx#L62) | `InputField` | ``{...rest} {...inputProps}`` |
| S003 | [admin/components/ui/form/rhf.tsx:134](../../apps/admin-frontend/src/components/ui/form/rhf.tsx#L134) | `PasswordField` | ``{...field} {...inputProps}`` |
| S004 | [admin/components/ui/form/input-field.tsx:39](../../apps/admin-frontend/src/components/ui/form/input-field.tsx#L39) | `Input` | ``{...inputProps}`` |
| S005 | [admin/components/ui/form/password-field.tsx:22](../../apps/admin-frontend/src/components/ui/form/password-field.tsx#L22) | `InputField` | ``{...props}`` |

## Review rule and follow-up

Use the [shared UI review checklist](shared-ui.md#component-styling-and-review)
for every frontend change. Record the user decision before implementing a
shared API adjustment or retaining a new caller override. Prioritize repeated
size/appearance differences and descendant selectors; keep accessibility and
content geometry intact. No runtime components were changed by this audit.
