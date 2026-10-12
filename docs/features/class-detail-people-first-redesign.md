# Class Detail People-First Redesign

**Overview:** Class details is now an operational workspace centered on the
people in the class, the remaining-hour balance, and the next action to take.
The redesign preserves the existing class, schedule, hour-addition, drawer,
mutation, and localization behavior.

## Behavior

- The identity header places Edit beside the truncated class title and groups
  enrolled students with the class balance. It shows scheduled and used hours
  separately, and the progress indicator represents used hours against the
  class total. Add hours remains a direct action.
- Upcoming sessions are shown before recurring schedule, recent sessions, and
  hour additions. The nearest three upcoming sessions are previewed first,
  with local Show all upcoming sessions and Show fewer upcoming sessions
  controls when more are available.
- Upcoming sessions use the current client time and refresh that reference
  every 30 seconds so scheduled sessions move between upcoming and recent
  without a full page reload.
- A populated recurring schedule is a static summary with one Edit action; it
  does not expand into duplicate details. Recent sessions remain grouped by
  localized date, show the time range without a repeated duration, and preserve
  the existing session detail and overflow actions.
- The Recent sessions card is hidden when its loaded data has no recent
  sessions. Its loading skeleton remains visible during the initial load.
- Hours & revenue history uses a leading icon treatment without a decorative
  rule beside its heading.
- The schedule details drawer shows Status and its full-width badge on one row.
  Delete stays in the schedule row's overflow menu, not the drawer footer.
- Opening Record no show from the drawer covers and blocks the drawer. Cancel
  returns focus to Record no show; a successful update returns focus to Edit.
- Whole-hour quantities in schedule confirmations omit the decimal, while
  fractional hours remain precise.

## Responsive behavior

- Desktop uses a two-column lower workspace. The recurring schedule and a
  populated Recent sessions card sit beside each other when there is room, and
  stack at narrower widths. An empty Recent sessions card leaves no blank slot.
- The existing application shell remains the source of navigation; the screen
  does not add a second mobile navigation pattern.
- Interactive controls retain a minimum 44px touch target and the layout avoids
  horizontal overflow at narrow widths.

## Reliability and accessibility

- A missing class renders the contextual not-found state with a shared Back to
  classes action. Other class-load failures keep the blocking retry state.
- Schedule failures are owned by the upcoming section. Cached schedules remain
  visible during refresh failures, while a recent-session failure without
  cached data stays quiet and local to that section.
- The used-hours meter exposes its value through progressbar semantics. The
  No Show dialog traps focus and returns it to an appropriate drawer action.
- Dropdown and selection-list hover, focus, and highlighted states use the
  shared accent token for a subdued surface. Checked and selected rows keep a
  separate primary tint, and keyboard focus remains visible.

## Implementation scope

The UI changes cover the class-detail screen and sections, schedule details and
No Show dialog, responsive drawer overlay, and shared dropdown and select
states. They introduce no route or API changes.
