# Schedule Complete Flow with Class Hour Tracking (April 23, 2026)

**Overview**: Implemented reserved-hour tracking for schedules, with restoration/history support when completed schedules are cancelled.

**Database Changes**:
- Added `ClassHourDeduction` model to track all hour deductions
- Links to Schedule and Class models
- Stores hours deducted, deduction timestamp, and restoration timestamp
- One deduction per schedule (unique constraint)

**Backend Implementation**:
- **Repository Layer** (`schedule.repository.ts`):
  - Added `validateAndReserveHours(classId, hours)` - checks class capacity before schedule creation
  - Added `completeSchedule(id)` - marks schedule as COMPLETED and records completion history
  - Added `restoreHours(id)` - restores hours if schedule is cancelled
  - Added `getRemainingHours(classId)` - calculates available hours
  - Updated all query methods to include `remainingHours` in ScheduleDTO

- **Service Layer** (`schedule.service.ts`):
  - Modified `createSchedule()` to validate hours before creating schedule
  - Added business rules:
    - Can't schedule if class doesn't have enough hours
    - Only SCHEDULED schedules can be completed
    - Completed schedules can be restored by the lifecycle action
  - Added `completeSchedule()`, `restoreHours()`, and `getRemainingHours()` methods
  - Added transaction handling for hour operations

- **Routes Layer** (`schedules.ts`):
  - Added `PATCH /v1/schedules/:id/complete` - Complete schedule and deduct hours
  - Added `PATCH /v1/schedules/:id/restore` - Restore hours for completed schedule
  - Added `GET /v1/schedules/class/:classId/remaining-hours` - Get remaining hours for a class

- **Schemas** (`schedule.schema.ts`):
  - Added `remainingHours` field to `ScheduleSchema` (optional)

**Frontend Implementation**:
- **Mutations** (`use-schedules.ts`):
  - Added `useCompleteSchedule()` - Mutation to complete schedule
  - Added `useRestoreHours()` - Mutation to restore hours

- **Components**:
  - Updated `ScheduleCard` to show remaining hours and action buttons
  - Added complete button (green checkmark) for SCHEDULED schedules
  - Added restore button (rotate arrow) for COMPLETED schedules
  - Added remaining hours display in schedule card

- **Screens** (`schedules-screen.tsx`):
  - Added `handleCompleteSchedule()` with confirmation dialog
  - Added `handleRestoreHours()` with confirmation dialog
  - Shows hours to be deducted/restored in confirmation

- **i18n** (`schedules.ts`):
  - Added translation keys for complete/restore actions
  - Added `remainingHours` translation key

**API Integration**:
- Generated OpenAPI spec with new endpoints
- Regenerated frontend API clients with Orval
- Added type-safe API methods: `patchV1SchedulesByIdComplete`, `patchV1SchedulesByIdRestore`

**Validation Rules**:
- At schedule creation: Compare remaining seconds with `durationMinutes * 60`; the API duration remains whole minutes
- At completion: Ensure schedule status is SCHEDULED
- On Restore: Only completed or no-show schedules are eligible; mark the deduction restored and set the schedule to `CANCELLED`
- Prevent negative hours by counting all `SCHEDULED`, `COMPLETED`, and deducted `NO_SHOW` schedules against class capacity

**Usage Flow**:
1. Create schedule → System validates class has enough unreserved hours and reserves it as `SCHEDULED`; `COMPLETED` and deducted `NO_SHOW` sessions continue counting against capacity
2. Click complete button → Schedule marked COMPLETED without consuming hours a second time
3. If needed, click restore button → Hours released by marking the schedule CANCELLED
4. Completion/restoration history is tracked in `ClassHourDeduction`

**Files Modified**:
- `backend/prisma/schema.prisma` - Added ClassHourDeduction model
- `backend/src/repositories/schedule.repository.ts` - Added hour management methods
- `backend/src/services/schedule.service.ts` - Added validation and business logic
- `backend/src/routes/schedules.ts` - Added new endpoints
- `backend/src/schemas/schedule.schema.ts` - Added remainingHours field
- `backend/src/types/schedule.types.ts` - Added remainingHours to DTO and new repository methods
- `frontend/src/hooks/mutations/use-schedules.ts` - Added complete/restore mutations
- `frontend/src/components/schedules/schedule-card.tsx` - Added action buttons and hours display
- `frontend/src/screens/schedules-screen.tsx` - Added handlers
- `frontend/src/lib/i18n/locales/en/schedules.ts` - Added translations

## Current lifecycle and storage (October 11, 2026)

- Schedule actions are owner-scoped and only allow valid lifecycle transitions. Generic schedule updates reject a `status` field.
- Complete changes `SCHEDULED` to `COMPLETED` and records its deduction. Restore changes `COMPLETED` or deducted `NO_SHOW` to `CANCELLED` and marks the deduction restored.
- No-show requires a deduct/no-deduct choice and can save a separate optional note. Deduct produces `NO_SHOW`; no-deduct produces `CANCELLED` and releases the reservation.
- Course defaults, class totals, additions, deductions, schedule durations, and recurring-item durations are stored as 64-bit integer seconds. API and form values remain in hours or whole minutes; time-of-day values remain minutes.
- The coordinated migration converts existing values and checks that class balances and active deductions still match after conversion. Existing completed and no-show records are treated as deducted.

## Class accounting and exhaustion state (October 12, 2026)

Class list and detail responses include `scheduledHours` and `usedHours` in
addition to the existing `totalHours` and `remainingHours`:

- `scheduledHours` sums concrete schedules in `SCHEDULED` status. Recurring
  templates count only after they materialize into schedule records.
- `usedHours` sums deduction rows whose `restoredAt` is null. Restored
  deductions and deductions deleted with their schedule do not count.
- `remainingHours` continues to represent scheduling capacity by reserving
  `SCHEDULED`, `COMPLETED`, and deducted `NO_SHOW` sessions.

The class repository reads each response's class data and hour aggregates in
one `RepeatableRead` transaction snapshot. Schedule creation remains blocked
when `remainingHours <= 0`. The UI calls hours exhausted only when
`totalHours > 0 && usedHours >= totalHours`; zero-hour classes show **No hours
added yet**, and fully scheduled classes with deductions below the total show
**All hours scheduled**.
