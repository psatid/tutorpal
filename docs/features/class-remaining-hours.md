# Classes Screen - Remaining Hours Display (April 23, 2026)

**Overview**: Added display of remaining hours in classes screen, showing total hours with remaining hours in a combined badge format.

**Backend Implementation**:
- **Types Layer** (`class.types.ts`):
  - Added `remainingHours?: number` field to `ClassDTO` interface

- **Repository Layer** (`class.repository.ts`):
  - Modified `toDTO()` helper to accept optional `remainingHours` parameter
  - Updated `create()` method: Sets `remainingHours = totalHours` for new classes
  - Updated `findAll()` method: Calculates remaining hours from schedules in `SCHEDULED` or `COMPLETED` status
  - Updated `findById()` method: Calculates remaining hours from active scheduled time
  - Updated `update()` method: Recalculates remaining hours after updates
  - Hour calculation: `remainingHours = totalHours - sum(schedule.durationMinutes for SCHEDULED/COMPLETED schedules)/60`

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
