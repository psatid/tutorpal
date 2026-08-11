# Standalone Classes and Hour Additions — August 11, 2026

## Overview

TutorPal now lets a tutor begin with a class alone. A class has a required name,
may have no enrolled students, and starts with `0` total and remaining hours.
Courses remain reusable hour presets rather than class associations.

## Domain rules

- A class has no Course foreign key or course context in its API responses.
- Creating or editing a class accepts a non-empty name and optional unique
  `studentIds`. Supplying `studentIds: []` removes all enrollments.
- Hours can only be added through an immutable `ClassHourAddition` ledger. An
  addition is either a course preset, resolved from the course's server-current
  default hours, or a custom decimal value from `0.01` with at most two decimal
  places. Each addition and each class total is limited to the `DECIMAL(10,2)`
  maximum of `99,999,999.99`.
- Course additions snapshot the course id, name, and selected hours without a
  Course relation. Renaming or deleting a course never changes the history.
- Addition request IDs are idempotent per class. Replaying the same source and
  payload returns the original addition; reusing it for a different payload
  returns `409 HOUR_ADDITION_REQUEST_CONFLICT`.
- Exceeding the per-addition or class-total decimal limit returns
  `400 HOUR_ADDITION_LIMIT_EXCEEDED`.
- Existing class totals, schedules, enrollments, deductions, recurring
  schedules, and reminders are preserved. The new ledger starts at release and
  deliberately has no opening-balance rows for historical totals.
- Scheduling capacity is unchanged: a class with no remaining hours cannot
  reserve a lesson until hours have been added.
- Courses can be deleted at any time. Course responses no longer include a
  class count.

## API

- `POST /v1/classes` accepts `{ name, studentIds? }` and creates a class with
  zero hours.
- `PUT /v1/classes/:id` accepts optional `{ name, studentIds }`; it no longer
  accepts course or total-hour fields.
- `POST /v1/classes/:id/hour-additions` accepts exactly one body shape:
  `{ source: "course", courseId, requestId }` or
  `{ source: "custom", hours, requestId }`. It returns
  `{ addition, totalHours, remainingHours }` with `200` for both a new request
  and matching retry.
- `GET /v1/classes/:id/hour-additions?page=1&limit=20` returns additions in
  descending `createdAt`, then `id`, order. The default limit is 20 and the
  maximum is 100.

## Migration

The migration first writes a required class name using the previous display
semantics: existing class name, enrolled student label, course name, then
`Unnamed class`. It then removes the class-course foreign key, index, and
column, sets the class-hour default to zero for future rows, and adds the
class-owned ledger. It does not truncate or backfill data.
