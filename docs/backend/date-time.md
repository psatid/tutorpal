# Backend Date-Time Handling

Backend date and time handling should go through `DateTime` in
`backend/src/lib/date-time.ts`.

## Policies

- Date-only API values use UTC `YYYY-MM-DD`.
- Timestamp API values use ISO UTC strings.
- API date-only input strings should be parsed with
  `DateTime.fromDateOnlyString(...)`.
- DTO serialization should use `DateTime.from(value).toDateOnlyString()` for
  date-only fields and `DateTime.from(value).toISOString()` for timestamps.
- Use `.toDate()` only at boundaries that require native `Date` values, such as
  Prisma queries and writes.

## Helper Usage

- Use `DateTime.from(value)` to normalize `string`, `Date`, or `DateTime`
  inputs into the internal date-time type.
- Use `DateTime.from(value).toDateOnlyString()` for schedule dates and
  recurring start dates returned to clients.
- Use `DateTime.fromDateOnlyString(value).toDate()` for validated `YYYY-MM-DD`
  request values before passing dates to Prisma.
- Use `DateTime.todayDateOnlyString()` when comparing request date-only values
  against today.
- Use `DateTime.now()` for current timestamps.
- Use instance helpers such as `.addDays(...)`, `.addHours(...)`,
  `.isBefore(...)`, `.compareAsc(...)`, and `.getWeekdayIndex()` for backend
  date arithmetic, sorting, comparisons, and weekday logic.

## Avoid

- Avoid `toISOString().split("T")` for date-only serialization.
- Avoid `new Date(apiDateString)` for API date-only input.
- Avoid `Date.now()` in backend app code.
- Avoid manual `setDate`, `getDate`, and `getDay` logic outside `DateTime`.
- Avoid passing native `Date` values between backend layers when a `DateTime`
  instance can carry the behavior instead.
