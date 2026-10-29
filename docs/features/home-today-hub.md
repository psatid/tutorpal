# Home Today Hub and Sessions to Confirm

**Overview:** The Home screen combines an independent Today agenda with a
server-backed rail for sessions that have ended and still need a result. The
agenda continues to use the existing date-filtered schedules query. The
confirmation rail uses `GET /v1/schedules/awaiting-confirmation` and does not
make end-time eligibility decisions in the browser. That same query also
supplies the Schedules warning banner, its responsive review drawer, and the
Schedules sidebar badge.

## Behavior

- The Today header shows the current date, a concise scheduled-session count,
  and planned duration. The Today agenda header contains the link to the full
  schedule on both mobile and desktop, including when the agenda is loading,
  empty, or showing an error.
- The Today agenda is a chronological time rail. It includes every session for
  the day, including completed, no-show, and cancelled sessions. Its query and
  rendering remain independent from the confirmation rail.
- Getting started is hidden after the class, tracked-hours, and scheduled-session
  setup conditions are all confirmed. Until then, its existing partial-progress,
  loading, and source-error recovery states remain available.
- After the final setup action succeeds, Home announces the result and moves
  focus to Open schedule. A passive refresh moves focus only if it was inside
  Getting started as the completed checklist disappears.
- The count and planned duration include only `SCHEDULED` sessions.
- Sessions to confirm appear oldest first in a full-width horizontal rail above
  the Today agenda. Each compact card shows the localized date, class name, and
  start to end time, with Complete and No show actions. It intentionally omits
  delivery type and duration. Long class names use two visible lines while
  retaining the full name for assistive technology and a hover title.
- The API includes only `SCHEDULED` sessions whose scheduled end time has been
  reached, using `Asia/Bangkok` as the eligibility time zone and an inclusive
  end-time boundary. Its `pagination.total` is the full eligible count before
  cursor filtering. The ordered list uses the scheduled start date and time.
- The displayed date is the session's start date. For a session that crosses
  midnight, the rail and no-show dialog use the true end-date `dateTime`,
  announce the full localized end date, and visibly include its day offset such
  as `(+1 day)`.
- The rail requests ten records at a time. The API's first page snapshots the
  server time; later requests pass its opaque `nextCursor` so that pagination
  remains stable. Reaching the end of the native horizontal scroll rail loads
  the next page when one exists.
- Mouse users can drag noninteractive card content to scroll an overflowing
  rail. Card actions remain clickable; touch, wheel, and keyboard scrolling
  continue to work independently.
- The Home screen does not poll for new ended sessions. They appear when the
  normal query lifecycle refetches, such as on a later Home visit.
- Schedules shows a warning-token banner below the page heading when sessions
  await confirmation. Review opens the responsive drawer: a side panel on
  desktop and a bottom sheet on mobile. The drawer groups sessions by their
  scheduled start date, oldest first, and shows only class, time, duration, and
  Complete and No show actions. Rows neither navigate nor show learner names.
- The Schedules sidebar badge uses the same full `pagination.total` count as
  the banner and drawer, displays `99+` above 99, and exposes the exact count in
  its accessible name. The banner and badge are hidden during initial loading,
  initial query error, and when the count is zero. Cached content remains
  visible during background refresh; later-page failures have an inline retry.
- The shared confirmation query uses the existing query refresh lifecycle and
  mutation invalidation; it does not poll. The drawer remains open after the
  last successful action and shows “All caught up” when no sessions remain.

## Confirmation and data updates

Completion retains the schedule confirmation-toast flow. No-show opens the
shared dialog before its mutation is sent. Completion uses
`useCompleteSchedule`; no-show uses `useNoShowSchedule`. The mutation hooks
remain the source of cache invalidation and success or error feedback.

Opening either action acquires the single confirmation lock, so every card's
actions stay disabled until the toast is dismissed or the selected mutation
settles. A successful outcome immediately removes the session from the
confirmation rail while the relevant queries refresh. The no-show dialog
returns focus to the action that opened it when that control remains available;
after a successful action removes its card, focus moves to the next remaining
Complete action, or to the visibly focused confirmation section heading when no
cards remain.

Cursor pages append without resetting the scrollport. Existing card keys keep
the loaded rail stable while pages append or successful outcomes remove cards.

## Accessibility and states

- The rail is a labeled ordered list inside a keyboard-focusable, labeled
  scroll group. Its screen-reader instruction explains horizontal scrolling and
  Left and Right Arrow, Page Up, Page Down, Home, and End key support. Tab
  order follows chronological cards, then each card's Complete and No show
  actions.
- Complete and No show buttons have contextual accessible labels and use the
  shared 44px button targets.
- The confirmation section has rail-shaped loading skeletons, an in-context
  initial-load retry, an empty state, a loading-more card, and a retry card for
  later-page failures. Existing loaded cards stay visible during a later-page
  failure.
