# Frontend Date-Time Handling

Frontend date and time handling must go through `DateTime` in
`frontend/src/lib/date-time.ts`. The utility is built on `date-fns` and mirrors
the backend boundary: date-only values are distinct from timestamps.

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

// API timestamp display
const label = DateTime.from(lastVerifiedAt).format("PPp");

// Lesson-duration values remain numeric, but use the shared formatter.
const hours = DateTime.formatDurationHours(2.5); // "2.5"

// Date arithmetic and calendar checks
const nextWeek = selectedDate.addWeeks(1);
const isToday = selectedDate.isToday();
```

`DateTime.fromDateOnlyString(...)` is required when an API date-only string is
converted into a `Date`. It preserves the intended calendar day in the
browser's local date picker. Use `DateTime.from(...)` for ISO timestamps,
native `Date` values, and existing `DateTime` instances.

## Placement rules

- Import `date-fns` only in `src/lib/date-time.ts`; application code uses the
  `DateTime` API.
- Models may expose reusable formatted or derived date data through methods.
  Screens and components keep translated labels and local interaction state.
- Format outgoing calendar values with `.toDateOnlyString()` rather than
  `toISOString().slice(...)`.
- Use `.format(...)`, `.isToday()`, `.isYesterday()`, `.isSameDay(...)`, and
  arithmetic methods instead of native `Date` parsing, `getDay`, or manual
  string manipulation. Use `DateTime.formatDurationHours(...)` for numeric
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
