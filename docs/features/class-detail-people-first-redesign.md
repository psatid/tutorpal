# Class Detail People-First Redesign

**Overview:** Class details is now an operational workspace centered on the
people in the class, the remaining-hour balance, and the next action to take.
The redesign preserves the existing class, schedule, hour-addition, drawer,
mutation, and localization behavior.

## Behavior

- The identity header provides a Classes breadcrumb, Edit beside the class
  title, and direct Add hours and Schedule session actions. A white summary
  strip groups student avatars, available hours, and recorded revenue. Opening
  the student count reveals the complete roster.
- The balance shows the available quantity and total, with a segmented bar and
  visible labels for used, scheduled, and available hours. No-hours,
  all-scheduled, and exhausted states retain their distinct labels.
- One Sessions card contains Upcoming and Recent tabs with counts. The nearest
  upcoming session is highlighted with its date, time range, duration, delivery
  type, student count, View action, and session overflow actions. The nearest
  three upcoming sessions are previewed first,
  with local Show all upcoming sessions and Show fewer upcoming sessions
  controls when more are available.
- Upcoming sessions use the current client time and refresh that reference
  every 30 seconds so scheduled sessions move between upcoming and recent
  without a full page reload.
- A populated recurring schedule shows a seven-day strip with localized weekday
  labels and scheduled times, weekday/time/duration rows, start date, delivery
  type, and one Edit action. It does not predict how far the balance will cover
  future lessons because the API does not provide an authoritative cutoff date.
- Recent sessions show localized dates and retain their detail and overflow
  actions. An empty tab explains that there are no recent sessions.
- Hours & revenue history initially shows two additions. View all expands the
  loaded history, Show less restores the preview, and Load more retains the
  existing pagination behavior.
- The schedule details drawer shows Status and its full-width badge on one row.
  Delete stays in the schedule row's overflow menu, not the drawer footer.
- Opening Record no show from the drawer covers and blocks the drawer. Cancel
  returns focus to Record no show; a successful update returns focus to Edit.
- Whole-hour quantities in schedule confirmations omit the decimal, while
  fractional hours remain precise.

## Responsive behavior

- Desktop places Sessions on the left and stacks recurring schedule and hour
  history on the right. The highlighted next session sits inside Sessions.
- Mobile places the summary and two actions above a standalone next-session
  panel, recurring schedule, Sessions, and hour history. The session list does
  not repeat the highlighted next session. Upcoming and Recent share one tab
  state across viewport changes.
- The existing application shell remains the source of navigation; the screen
  does not add a second mobile navigation pattern.
- Interactive controls retain a minimum 44px touch target and the layout avoids
  horizontal overflow at narrow widths.

## Reliability and accessibility

- A missing class renders the contextual not-found state with a shared Back to
  classes action. Other class-load failures keep the blocking retry state.
- Schedule loading and retry states remain local to the session workspace.
  Cached sessions stay visible during refresh failures.
- The segmented balance graphic has an accessible description of total, used,
  scheduled, and available hours. Tabs and roster disclosure support keyboard
  interaction, and the Sessions heading remains a focus target after completion.
  The No Show dialog traps focus and returns it to an appropriate drawer action.
- Dropdown and selection-list hover, focus, and highlighted states use the
  shared accent token for a subdued surface. Checked and selected rows keep a
  separate primary tint, and keyboard focus remains visible.

## Implementation scope

The reference-aligned layout updates the class-detail screen, header, session
workspace, recurring summary, hour history, and English/Thai labels. It retains
the existing schedule details, No Show dialog, drawer, mutation, and shared
control behavior. It introduces no route or API changes.
