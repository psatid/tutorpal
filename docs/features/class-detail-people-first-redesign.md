# Class Detail People-First Redesign

**Overview:** Class details is now an operational workspace centered on the
people in the class, the remaining-hour balance, and the next action to take.
The redesign preserves the existing class, schedule, hour-addition, drawer,
mutation, and localization behavior.

## Behavior

- The identity header groups the class title, enrolled students, and remaining
  hours with a progress indicator and a direct Add hours action.
- Upcoming sessions are shown before recurring schedule, recent sessions, and
  hour additions. The nearest three upcoming sessions are previewed first,
  with local Show all upcoming sessions and Show fewer upcoming sessions
  controls when more are available.
- Upcoming sessions use the current client time and refresh that reference
  every 30 seconds so scheduled sessions move between upcoming and recent
  without a full page reload.
- Recent sessions remain grouped by localized date and preserve the existing
  session detail and overflow actions.

## Responsive behavior

- Desktop uses a two-column lower workspace while tablet and mobile collapse to
  one readable flow.
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
- The remaining-hours meter exposes its value through progressbar semantics,
  and the recurring schedule accordion keeps its heading semantics intact.

## Implementation scope

The change is limited to the class-detail screen, its information, schedule,
recurring-schedule, and hour-addition sections, plus English and Thai class
translations. It introduces no route, API, or data-model changes.
