# On-site / Online Schedule Types

**Overview**: Schedules and recurring schedules now carry one required delivery type: `ON_SITE` or `ONLINE`.

## Behavior

- New one-time and recurring schedule forms require an intentional type selection.
- Existing schedules and recurring patterns are backfilled to `ON_SITE`.
- A recurring pattern has one shared type, which is copied to newly generated sessions.
- Editing a recurring pattern only recreates replaceable future sessions. Completed and no-show history remains unchanged.
- Schedule cards, class schedule logs, recurring summaries, and schedule view mode show the type with an icon and text label.

## API and data model

- Prisma adds the `ScheduleType` enum mapped to `schedule_type`.
- `Schedule.type` and `RecurringSchedule.type` are non-null fields with an `ON_SITE` default.
- Schedule creation requires `type`; schedule and recurring updates accept it optionally.
- Omitting `type` from a recurring update preserves the existing pattern type.
- The OpenAPI document and Orval client are regenerated from the updated route schemas.

## UI

- The shared schedule-type field uses native radios for keyboard and screen-reader support.
- Options are labeled `On-site` and `Online` with `MapPin` and `Monitor` icons.
- New forms start without a selected type; edit forms hydrate the stored value.
- The validation message is: `Choose a schedule type.`

## Related files

- `backend/prisma/schema.prisma` and `backend/prisma/migrations/20260806000000_add_schedule_type/migration.sql`
- `backend/src/schemas/schedule.schema.ts`
- `backend/src/repositories/schedule.repository.ts`
- `frontend/src/components/schedules/schedule-type-field.tsx`
- `frontend/src/lib/i18n/locales/en/schedules.ts`
