# Course and Class Revenue Tracking (August 13, 2026)

## Overview

Tutors can record revenue when adding hours to a class. A course stores either
an hourly rate or a fixed package price, which is used as an editable default
for future additions. The submitted amount is stored on the hour-addition
ledger, so later course-price changes do not change historical revenue.

## Domain rules

- Course pricing uses `pricingMode: hourly_rate | fixed_price` and a nullable
  `priceAmount` for legacy courses.
- Course price is optional. When provided, it must be a non-negative THB amount
  with at most two decimal places; a blank price is stored as `null`.
- Course additions default to hourly price multiplied by the course's default
  hours, or to the fixed package price. Tutors can override the default before
  saving.
- Revenue is optional for course and custom additions. When provided, it must
  be a non-negative THB amount with at most two decimal places; a blank amount
  is stored as `null`.
- `revenueAmount: null` is preserved for legacy additions and excluded from
  revenue totals. A recorded `0` remains distinct from `null`.
- Class and course detail totals are tutor-scoped sums of the immutable ledger.
  Course detail also reports recorded hours, including legacy additions.

## API

- Course list/create/update DTOs expose `pricingMode` and `priceAmount`.
- `GET /v1/courses/:id` exposes `recordedHours` and `recordedRevenue`.
- `GET /v1/classes/:id` exposes `recordedRevenue`.
- Class hour-addition create requests may omit `revenueAmount`; history and
  responses expose the nullable stored value.
- Revenue participates in hour-addition idempotency matching and conflict
  checks.

## Responsive experience

- Courses remain in the existing workspace, with course names linking to the
  new `/courses/$courseId` detail route.
- Course detail shows pricing, default hours, recorded hours, and revenue made.
- Class detail shows recorded revenue in the existing balance panel and revenue
  beside each immutable hour-addition history row.
- The existing responsive drawer remains a bottom sheet on narrow screens and
  a side drawer on larger screens. No dashboard UI, dashboard API, charts, or
  revenue aggregation was added in this release.

## Verification

- Prisma schema validation and TypeScript checks pass.
- Focused backend revenue tests pass, including migration, validation,
  aggregates, legacy nulls, idempotency conflicts, and tutor ownership.
- Frontend `tsc && vite build` passes.
- A live database migration and browser interaction pass were not run in this
  change; the additive migration must be applied through the normal deployment
  workflow.
