# Home Today Hub

**Overview:** The Home screen is a focused, local-time view of the tutor's
sessions for the current day. It uses the existing date-filtered schedules
query and does not introduce a separate dashboard API.

## Behavior

- The header shows the current date, a concise scheduled-session count and
  planned duration, and a link to the full schedule.
- The agenda is a chronological time rail. It includes every session for the
  day, including completed, no-show, and cancelled sessions.
- The count and planned duration include only `SCHEDULED` sessions.
- The first `SCHEDULED` API item is shown as the session to confirm. On smaller
  screens its confirmation controls appear before the rail; on desktop they
  appear in a narrow contextual panel beside it.
- Completing a session uses the existing completion flow; its hours remain
  counted once because the scheduled session already reserved them. Marking a
  session no-show opens a required deduct/no-deduct choice and an optional note.
  A deducted no-show keeps the hours reserved; a no-deduct outcome cancels the
  reservation.

## Confirmation and data updates

Completion retains the schedule confirmation-toast flow. No-show opens the
shared dialog before its mutation is sent. Completion uses
`useCompleteSchedule`; no-show uses `useNoShowSchedule`. The mutation hooks
remain the source of cache invalidation and success/error feedback. Opening a
confirmation disables both outcomes until it is dismissed or the chosen
mutation settles. After a successful outcome, Home immediately removes that
session from its scheduled summary and triage until the date query reports its
non-scheduled status, so its actions remain unavailable while refreshed data
catches up; failed outcomes remain actionable.

## States

The screen keeps a rail-shaped loading state, an in-context retry state for
query failures, and an empty day state that leaves the Open schedule action
available.
