# Schedule No-Show Status (June 21, 2026)

**Overview**: Added `NO_SHOW` as a schedule status across Prisma, backend validation, and frontend schedule management.

**Behavior**:
- `NO_SHOW` is treated as reserved class time, alongside `SCHEDULED` and `COMPLETED`
- Remaining hours exclude `NO_SHOW` schedules the same way they exclude completed ones
- New schedules are always created in `SCHEDULED` status
- Tutors can mark a scheduled session as no-show from schedule action menus or by editing the schedule after creation
- `NO_SHOW` schedules can have hours restored by moving them to `CANCELLED`

**Files Modified**:
- `backend/prisma/schema.prisma` - Added `NO_SHOW` to `ScheduleStatus`
- `backend/src/schemas/schedule.schema.ts` - Added `NO_SHOW` to API validation
- `backend/src/repositories/class-hours.ts` - Counted `NO_SHOW` as reserved time
- `backend/src/repositories/schedule.repository.ts` - Track no-show reservations with hour deduction records
- `backend/src/services/schedule.service.ts` - Allowed no-show transitions and cancellation restoration
- `frontend/src/components/schedules/schedule-card.tsx` - Added no-show quick action
- `frontend/src/components/classes/schedule-log.tsx` - Added no-show quick action
- `frontend/src/components/schedules/schedule-drawer.tsx` - Added no-show status option
- `frontend/src/screens/schedules-screen.tsx` - Added no-show filter/action flow
- `frontend/src/screens/class-detail-screen.tsx` - Added no-show action flow
- `frontend/src/lib/schedule-utils.ts` - Added no-show badge styling
- `frontend/src/lib/i18n/locales/en/schedules.ts` - Added no-show copy
