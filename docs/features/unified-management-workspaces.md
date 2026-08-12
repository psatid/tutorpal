# Unified Management Workspaces (July 19, 2026)

## Overview

Students, Classes, and Courses now use one responsive management pattern. The shared structure keeps repeated actions predictable while preserving the information tutors need for each entity.

The standalone class and hour-addition flow is described in
[Standalone Classes and Hour Additions](standalone-classes-and-hour-additions.md).

## Navigation

- Jun Layout provides one responsive side rail for Home, Classes, Schedule, Courses, Settings, and Students. Below `md` it is an overlay drawer; from `md` through below `lg` it becomes a 48px icon rail; at `lg` and above it expands to 15rem and can be manually collapsed or expanded. Students is the final item because enrollment is optional when starting a class.
- The mobile bottom navigation has been removed so navigation has a single, consistent home across screen sizes.
- List and detail routes activate the same parent navigation item.
- The shared top bar shows the active screen name from the existing navigation labels, with Settings used for settings routes and their nested pages. Settings is a collapsible group whose first child is LINE connection; `/settings` redirects to `/settings/line` rather than rendering a settings overview.

## Workspace pattern

Each workspace uses the same page header, count, primary action, search and refinement controls, spaced card rows, loading skeletons, errors, and empty states. Students show learner and LINE context, Classes show optional students and their hour balance, and Courses show reusable hour presets.

Students, Courses, and Classes share `useWorkspaceSearchControls` for search state, 300ms debouncing, sort defaults, dirty-state detection, and reset behavior. Classes supplies its route-backed filter reset through the hook's optional callback.

Search refinement uses a shared two-level control pattern: a prominent search field followed by a horizontally scrolling rail of outlined controls. Students, Courses, and Classes expose sorting; Classes searches its name and optional student names without course filters. Search can be cleared without changing other controls, and Reset appears whenever a workspace differs from its default state. The document/content pane owns vertical scrolling; the workspace list has no nested vertical scroll region. At below `md`, controls remain in normal flow and sort/filter choices open in the shared bottom-sheet drawer. At `md` and above, the complete control band stays sticky beneath the app header and choices use anchored Select menus.

Regular authenticated screens provide the page-level gutters through `ScreenLayout`; these workspaces do not add a second horizontal content gutter. Cards retain their own internal padding so row content remains readable inside the card boundary.

Create and edit forms use the shared responsive drawer: an accessible bottom sheet below `md` and a right-side panel at `md` and above. A class requires only a name; student enrollment is optional and hours are added separately through the class hour-addition drawer.

## Visual and interaction rules

- Manrope typography and the existing violet semantic palette remain the product identity. Green and amber are reserved for semantic success and attention states, such as LINE connection status and exhausted class hours.
- Violet is reserved for primary actions, active navigation, focus, and selected states.
- Search, filter, sort, reset, and clear controls reuse the shared Input, Button, and Select visual styles. Workspace-specific styling is limited to layout, responsive behavior, and text wrapping.
- Controls use the shared component radii, clear borders, compact toolbar targets, 44px drawer choices, visible keyboard focus, and reduced-motion-safe transitions.
- Long names truncate without hiding actions; mobile refinement rails scroll horizontally without creating page-level overflow. The page scrollbar remains available as the primary vertical scroll affordance.
- On small screens, persistent create actions use a fixed 56px circular FAB with safe-area-aware spacing; from `sm` upward, Students, Courses, and Classes retain their header actions and Schedule retains its inline add action. Scrollable content reserves space for the mobile FAB, while empty-state instructional actions remain inline.
- All overlays use the shared responsive drawer: below `md` it is a bottom sheet with a drag handle, while at `md` and above it enters from the right. Forms, selectors, and calendar pickers share focus trapping, close behavior, scroll regions, footer actions, and nested layering.
- Create and edit forms use one primary action in the fixed footer. Read-only drawers use one Edit action; the shared header close control handles dismissal in every state.
- Select menus and Popovers opened in a drawer portal into that drawer. Selects stay modal on mobile and non-modal on desktop so keyboard focus and pointer selection remain reliable; calendar Popovers remain within the drawer's stacking boundary.
