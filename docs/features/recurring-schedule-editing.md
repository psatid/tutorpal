# Recurring Schedule Editing with Effective Date (June 26, 2026)

**Overview**: Added class-detail recurring schedule management so tutors can revise a recurring pattern from an effective date without touching past schedules.

**Behavior**:
- Class detail now shows a dedicated `Recurring schedule` section with the current weekly pattern and an edit action
- Editing a recurring schedule creates a new recurring-series version starting from the effective date
- Only future generated schedules on or after the effective date are recreated
- Past schedules, including completed and no-show history, remain untouched
- Newly generated occurrences are linked to `recurringScheduleId` so later edits can target the correct series
- Legacy recurring schedules created before this linkage still work through a fallback matcher during edits

**Backend Changes**:
- Added `Schedule.recurringScheduleId` relation to link generated schedules to a recurring series
- Extended class detail responses to include the latest recurring schedule summary with items
- Added `PATCH /v1/schedules/recurring/:id` to recreate future recurring schedules from an effective date
- Added conflict detection for regenerated recurring occurrences against existing active schedules

**Frontend Changes**:
- Added recurring schedule summary card on class detail
- Added recurring schedule drawer for create/edit with effective-date selection and impact preview
- Added confirmation step before recreating future schedules
- Updated generated API clients and schedule models for recurring schedule data

**Verification**:
1. Open a class detail page with a recurring schedule
2. Edit the recurring pattern and choose an effective date
3. Confirm future sessions from that date are recreated while earlier sessions stay unchanged

**Files Modified**:
- `backend/prisma/schema.prisma` - Added recurring schedule linkage on schedules
- `backend/prisma/migrations/20260626093000_link_schedules_to_recurring_series/migration.sql` - Added migration
- `backend/src/types/class.types.ts` - Added recurring schedule summary to class DTOs
- `backend/src/types/schedule.types.ts` - Added recurring schedule update DTOs/results
- `backend/src/schemas/class.schema.ts` - Added recurring schedule to class responses
- `backend/src/schemas/schedule.schema.ts` - Added recurring schedule schemas and update request/response schema
- `backend/src/repositories/class.repository.ts` - Included latest recurring schedule in class detail responses
- `backend/src/repositories/schedule.repository.ts` - Exposed `recurringScheduleId` in schedule DTOs
- `backend/src/services/schedule.service.ts` - Added recurring schedule versioning, conflict checks, and legacy matching fallback
- `backend/src/routes/schedules.ts` - Added recurring schedule update endpoint
- `backend/openapi/openapi.json` - Regenerated OpenAPI spec
- `frontend/src/components/classes/recurring-schedule-section.tsx` - Added class detail recurring summary section
- `frontend/src/components/classes/recurring-schedule-drawer.tsx` - Added effective-date recurring editor flow
- `frontend/src/hooks/mutations/use-schedules.ts` - Added recurring schedule update mutation
- `frontend/src/screens/class-detail-screen.tsx` - Wired recurring schedule section and drawer into class detail
- `frontend/src/types/schedule.ts` - Added recurring schedule summary typing
- `frontend/src/lib/i18n/locales/en/schedules.ts` - Added recurring editing copy
- `frontend/src/api/generated/*` - Regenerated frontend API client/models
