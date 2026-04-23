# TutorPal Web Application — Agent guide

This file is for AI agents and LLMs working in this repo. It links to project conventions and docs. Follow these when generating or editing code.

## After every task

**Always check and update docs when a task is done.**

1. **Check** — Did the change add or change behavior that the docs describe (e.g. new routes, new API surface, new conventions)?
2. **Update** — If yes, update the relevant doc under `docs/` (and this file if you add a new doc or link).
3. **Link** — If you added a new convention doc, add it to the [Documentation Hub](docs/README.md) and link it there.

Do this as the last step before considering the task complete.

## Project Docs

See [Documentation Hub](docs/README.md) for all project documentation.

## Recent Feature Implementations

### Schedule Complete Flow with Class Hour Tracking (April 23, 2026)

**Overview**: Implemented automatic hour deduction when schedules are completed, with full tracking and restoration capabilities.

**Database Changes**:
- Added `ClassHourDeduction` model to track all hour deductions
- Links to Schedule and Class models
- Stores hours deducted, deduction timestamp, and restoration timestamp
- One deduction per schedule (unique constraint)

**Backend Implementation**:
- **Repository Layer** (`schedule.repository.ts`):
  - Added `validateAndReserveHours(classId, hours)` - checks and deducts hours at schedule creation
  - Added `completeSchedule(id)` - creates deduction record and marks schedule as COMPLETED
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
- Prevent negative hours (throws error if insufficient hours)

**Usage Flow**:
1. Create schedule → System validates class has enough hours
2. Click complete button → Confirmation shows hours to deduct
3. Hours deducted from class, schedule marked COMPLETED
4. If needed, click restore button → Hours restored, schedule marked CANCELLED
5. All deductions tracked in `ClassHourDeduction` table with timestamps

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

### Classes Screen - Remaining Hours Display (April 23, 2026)

**Overview**: Added display of remaining hours in classes screen, showing total hours with remaining hours in a combined badge format.

**Backend Implementation**:
- **Types Layer** (`class.types.ts`):
  - Added `remainingHours?: number` field to `ClassDTO` interface

- **Repository Layer** (`class.repository.ts`):
  - Modified `toDTO()` helper to accept optional `remainingHours` parameter
  - Updated `create()` method: Sets `remainingHours = totalHours` for new classes
  - Updated `findAll()` method: Queries `ClassHourDeduction` for each class and calculates remaining hours
  - Updated `findById()` method: Queries deductions and calculates remaining hours for single class
  - Updated `update()` method: Recalculates remaining hours after updates
  - Hour calculation: `remainingHours = totalHours - sum(deductions where restoredAt is null)`

- **Schemas Layer** (`class.schema.ts`):
  - Added `remainingHours: z.number().optional()` to `ClassSchema`

**Frontend Implementation**:
- **API Generation**:
  - Regenerated OpenAPI spec from backend
  - Generated new API clients with Orval, updating `GetV1Classes200Item` type

- **Types** (`class.ts`):
  - Added `remainingHours?: number` to `Class` interface

- **Components** (`class-card.tsx`):
  - Updated hours badge to show combined format: "[⏱️ 10h (6.5h remaining)]"
  - Falls back to "[⏱️ 10 hours]" when `remainingHours` is undefined
  - Uses new translation key `hoursWithRemaining` with `total` and `remaining` parameters

- **i18n** (`classes.ts`):
  - Added `hoursWithRemaining: "{{total}}h ({{remaining}}h remaining)"` translation key

**Display Format**:
- **New class (no schedules)**: "[⏱️ 20h (20.0h remaining)]"
- **Class with completed schedules**: "[⏱️ 10h (6.5h remaining)]"
- **Class with all hours used**: "[⏱️ 5h (0.0h remaining)]"
- **Fallback (if undefined)**: "[⏱️ 10 hours]"

**Files Modified**:
- `backend/src/types/class.types.ts` - Added remainingHours to ClassDTO
- `backend/src/repositories/class.repository.ts` - Added hour calculation logic to all methods
- `backend/src/schemas/class.schema.ts` - Added remainingHours to ClassSchema
- `frontend/src/types/class.ts` - Added remainingHours to Class interface
- `frontend/src/components/classes/class-card.tsx` - Updated badge display
- `frontend/src/lib/i18n/locales/en/classes.ts` - Added hoursWithRemaining translation



