# Schedule No-Show Status

**Overview**: Tutors can record a no-show with an explicit choice about deducting class hours, plus an optional note.

## Current behavior (October 11, 2026)

- `PATCH /v1/schedules/:id/no-show` requires `deductHours` and accepts an optional `note`.
- Deducting hours sets the schedule to `NO_SHOW` and records the active hour deduction. The session continues to count against class capacity.
- Choosing not to deduct sets the schedule to `CANCELLED`, releases its reservation, and does not create a deduction.
- The dialog starts with neither choice selected. Its note is stored as `noShowNote`, separately from general schedule notes.
- The same dialog is available from the schedule drawer, Schedule list, Home, and class detail.
- The drawer's view-mode actions are Complete and No Show for scheduled sessions, and Restore for completed or no-show sessions. Delete remains available from the schedule row's overflow menu, not the drawer footer. The action row and editable status are hidden in edit mode.
- When opened from schedule details, the No Show dialog overlays and blocks the drawer beneath it. Closing the dialog returns focus to the No Show action; after a successful update, focus returns to Edit.
- Whole-hour values in user-facing schedule confirmations omit `.0`; fractional hour values retain their precision.
- Complete and Restore remain dedicated lifecycle actions. Generic schedule updates cannot change status.
- Completed and deducted no-show sessions can be restored to `CANCELLED`; the active deduction is marked restored.
- Existing `NO_SHOW` sessions are treated as deducted during the seconds-storage migration.

## Original implementation (June 21, 2026)

The initial release added `NO_SHOW` as a schedule status across Prisma, backend validation, and frontend schedule management. At that time, tutors could mark a session no-show from schedule actions or by editing the schedule; lifecycle status is now changed through dedicated actions.

Original files modified:
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
