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
    - Completed schedules can be restored to SCHEDULED/CANCELLED
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
- At schedule creation: Check if `class.remainingHours >= schedule.durationMinutes/60`
- At completion: Ensure schedule status is SCHEDULED
- At cancellation of completed: Restore hours, update deduction record
- Prevent negative hours by counting all `SCHEDULED` and `COMPLETED` schedules against class capacity

**Usage Flow**:
1. Create schedule → System validates class has enough unreserved hours and reserves them immediately for `SCHEDULED` / `COMPLETED` schedules
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
