# Unified Management Workspaces (July 19, 2026)

## Overview

Students, Classes, and Courses now use one responsive management pattern. The shared structure keeps repeated actions predictable while preserving the information tutors need for each entity.

## Navigation

- Desktop displays a collapsible side rail for Home, Students, Courses, Classes, Schedule, and Settings. The collapsed state retains navigation icons and persists across reloads; Courses precede Classes to follow the setup workflow.
- Mobile and tablet retain the compact top bar and five-item bottom navigation.
- List and detail routes activate the same parent navigation item.

## Workspace pattern

Each workspace uses the same page header, count, primary action, search and sorting controls, divider rows, loading skeletons, errors, and empty states. Students show learner and LINE context, Classes show course/custom and hour context, and Courses show reusable hour defaults and linked class counts.

Create and edit forms use the shared responsive drawer: an accessible bottom sheet below `md` and a right-side panel at `md` and above. Course association, enrollment, hour, deletion, and API behavior are unchanged.

## Visual and interaction rules

- Manrope typography and the existing violet semantic palette remain the product identity.
- Violet is reserved for primary actions, active navigation, focus, and selected states.
- Controls use medium radii, clear borders, 44px primary touch targets, visible keyboard focus, and reduced-motion-safe transitions.
- Long names truncate without hiding actions; mobile toolbars stack without horizontal overflow.
- All overlays use the shared responsive drawer: below `md` it is a bottom sheet with a drag handle, while at `md` and above it enters from the right. Forms, selectors, and calendar pickers share focus trapping, close behavior, scroll regions, footer actions, and nested layering.
- Create and edit forms use one primary action in the fixed footer. Read-only drawers use one Edit action; the shared header close control handles dismissal in every state.
- Select menus and Popovers opened in a drawer portal into that drawer. Selects stay modal on mobile and non-modal on desktop so keyboard focus and pointer selection remain reliable; calendar Popovers remain within the drawer's stacking boundary.
