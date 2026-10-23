# Frontend Date-Time Handling

Tutor application date and time handling must go through `DateTime` in
`apps/frontend/src/lib/date-time.ts`. The shared UI package has a private locale-aware
date helper for its calendar and date controls. Both preserve the backend
boundary: date-only values are distinct from timestamps.

## Data shapes

- **Date-only values** (`YYYY-MM-DD`) represent a calendar day, such as a
  schedule date or recurring schedule start date. Keep them as strings in form
  state, query parameters, and API payloads.
- **Timestamps** are ISO 8601 strings from the API, such as `createdAt` and
  `lastVerifiedAt`.
- **Native `Date` values** are only for UI controls that require them, such as
  the date picker and calendar components.

## Use `DateTime`

```ts
import { DateTime } from "@/lib/date-time";

// Calendar date input/output
const selectedDate = DateTime.fromDateOnlyString("2026-07-19");
const apiDate = selectedDate.toDateOnlyString();

// Locale-aware API timestamp display
const label = DateTime.formatDateTime(lastVerifiedAt);

// Locale-aware calendar dates and ranges
const dateLabel = DateTime.formatDate(selectedDate, {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
const rangeLabel = DateTime.formatDateRange(startDate, endDate, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

// Lesson-duration values remain numeric, but use the shared formatter.
const hours = DateTime.formatDurationHours(2.5); // "2.5"

// Date arithmetic and calendar checks
const tomorrow = selectedDate.addDays(1);
const nextWeek = selectedDate.addWeeks(1);
const isToday = selectedDate.isToday();
```

`DateTime.fromDateOnlyString(...)` is required when an API date-only string is
converted into a `Date`. It preserves the intended calendar day in the
browser's local date picker. Use `DateTime.from(...)` for ISO timestamps,
native `Date` values, and existing `DateTime` instances.

## Placement rules

- Tutor application code imports `date-fns` only in
  `apps/frontend/src/lib/date-time.ts` and uses the `DateTime` API. Shared UI
  controls use their private helper in `packages/ui/src/lib/date-time.ts`.
- Models may expose reusable formatted or derived date data through methods.
  Screens and components keep translated labels and local interaction state.
- Format outgoing calendar values with `.toDateOnlyString()` rather than
  `toISOString().slice(...)`.
- Use `DateTime.formatDate(...)`, `DateTime.formatDateTime(...)`, and
  `DateTime.formatDateRange(...)` for user-facing dates. Use `.format(...)`
  only when a date-fns pattern is required for calendar chrome or internal UI
  metadata. Use `.isToday()`, `.isYesterday()`, `.isSameDay(...)`, and
  arithmetic methods instead of native `Date` parsing or manual string
  composition. Use `DateTime.formatDurationHours(...)` for numeric
  hour-duration display.
- Use `.toDate()` only where a third-party UI component requires a native
  `Date`.

## Avoid

- `new Date(apiDateOnlyString)` or `new Date(`${apiDateOnlyString}T00:00:00`)`
  for API date-only values.
- `toISOString().slice(0, 10)` for calendar-date serialization.
- Direct `Intl.DateTimeFormat`, `Date.prototype.toLocaleString`, or ad-hoc
  `date-fns` imports in feature code.
- Mixing a timestamp with a date-only value when comparing or grouping data.

## Active locale convention

`DateTime` follows the active `en` or `th` app language. It supplies the
matching date-fns locale for calendar controls and uses `Intl` for all
user-facing dates and ranges. Thai display always explicitly requests the
Gregorian calendar and Latin digits; for example, August 12, 2026 is rendered
as `วันพุธที่ 12 สิงหาคม 2026`, never as a Buddhist Era year. This affects
display only: storage and API contracts remain ISO `YYYY-MM-DD`, and weeks
continue to start on Monday.

## DateField calendar presentation

`DateField` keeps its desktop calendar popover at its natural height. On mobile,
it opens a nested drawer with a stable six-week calendar grid so month changes
do not alter the calendar height. This drawer opts into live visual-viewport
sizing: its bottom follows browser-chrome changes, and its preferred height
fits the header, full calendar, and bottom padding. The live safe-area viewport
and 44rem cap limit the sheet; on shorter viewports, only the calendar body
scrolls, with contained overscroll. Without `visualViewport`, the same measured
height is capped by `85dvh` minus the safe-area insets. Other
`ResponsiveDrawer` callers keep their default sizing. At the narrowest mobile
widths, the calendar's reduced side inset leaves at least 44px for each
seven-column date target.
