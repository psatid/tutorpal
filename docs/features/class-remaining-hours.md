# Classes Screen - Remaining Hours Display (April 23, 2026)

**Overview**: Added display of remaining hours in classes screen, showing total hours with remaining hours in a combined badge format.

**Backend Implementation**:
- **Types Layer** (`class.types.ts`):
  - Added `remainingHours?: number` field to `ClassDTO` interface

- **Repository Layer** (`class.repository.ts`):
  - Modified `toDTO()` helper to accept optional `remainingHours` parameter
  - Updated `create()` method: Sets `remainingHours = totalHours` for new classes
  - Updated `findAll()` method: Calculates remaining hours from schedules in `SCHEDULED`, `COMPLETED`, or deducted `NO_SHOW` status
  - Updated `findById()` method: Calculates remaining hours from active scheduled time
  - Updated `update()` method: Recalculates remaining hours after updates
  - Original hour calculation: `remainingHours = totalHours - sum(schedule.durationMinutes for SCHEDULED/COMPLETED schedules)/60`

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

## Current calculation (October 12, 2026)

The persisted values use integer seconds:

```text
remainingSeconds = totalSeconds - sum(durationSeconds for SCHEDULED, COMPLETED, and NO_SHOW)
remainingHours = remainingSeconds / 3600
```

`CANCELLED` sessions do not reserve hours. A no-show with no deduction becomes `CANCELLED`; a deducted no-show remains `NO_SHOW`. The API exposes hour values as numbers.

Class list and detail responses also expose these accounting values as numbers:

```text
scheduledHours = sum(durationSeconds for concrete SCHEDULED schedules) / 3600
usedHours = sum(secondsDeducted for ClassHourDeduction rows where restoredAt is null) / 3600
```

Recurring schedule templates and their items are not included in `scheduledHours`.
Deleting a schedule keeps the existing cascading deletion of its deduction row.
Class list, single-class, and class-detail accounting values are read from one
PostgreSQL `RepeatableRead` transaction snapshot, including both aggregates.

The frontend uses `remainingHours` for scheduling capacity. Its displayed
balance state follows this rule:

```text
No hours added yet: totalHours <= 0
Hours exhausted: totalHours > 0 && usedHours >= totalHours
All hours scheduled: remainingHours <= 0 && usedHours < totalHours
Available: otherwise
```

The one-time and recurring schedule forms keep creation disabled when
`remainingHours <= 0`. Zero availability by itself does not mean the hours are
exhausted; only active deductions reaching the class total does.

## Current frontend presentation

The Classes list `ClassRow` intentionally has its own deduction-based summary:

```text
No hours added yet: totalHours <= 0
Hours left: max(totalHours - usedHours, 0)
```

For display, the balance is rounded to two decimal places before its localized
number and plural form are selected.

It does not use `scheduledHours` or `remainingHours`, so a fully scheduled class
with no deductions shows its full total as hours left. The row does not display
the total or a `Scheduled · Used` line.

Class cards and the class-detail header retain their capacity-oriented
presentation. They show the available and total-hour balance along with the
localized `Scheduled · Used` accounting line; the detail progress bar represents
used hours divided by total hours. Capacity messages in the one-time and
recurring schedule flows name the relevant balance state and offer the existing
Add hours action.

Scheduling capacity continues to use `remainingHours`. When no capacity remains
but used hours are still below the total, the UI presents **All hours scheduled**
with informational styling. It presents **Hours exhausted** with warning styling
only when used hours reach the total.
