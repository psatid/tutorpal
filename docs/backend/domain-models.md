# Backend Model Conventions

TutorPal keeps the current backend layering by folder: `routes`, `services`,
`repositories`, `schemas`, and `types`. Models live under `backend/src/models`
and provide the internal representation used inside the backend application.

## Flow

- Routes validate requests with Zod schemas and convert models to DTOs before
  returning JSON.
- Services coordinate use cases and apply business rules through model methods.
- Repositories query Prisma and convert Prisma records into models before
  returning data to services.
- Models own deterministic entity rules and calculations. Keep them free of
  Prisma access and application or transport errors; services coordinate model
  decisions with repositories and external workflows.
- DTOs remain API-facing response shapes. Models are the internal application
  shape.
- DTO date/time serialization should use `DateTime` from
  `backend/src/lib/date-time.ts`.

For student data, use `Student.fromStudentPrisma(...)` when converting
persistence records and `student.toStudentDTO()` or
`studentDetail.toStudentDetailDTO()` when returning API responses.

For class data, use `ClassModel.fromClassPrisma(...)` when converting
persistence records and `classModel.toClassDTO()` when returning API responses.
Classes are standalone: require a non-empty `name`, allow zero or more enrolled
students, and start at zero total hours. Use the class name as its display name.

Class hour accounting uses `ClassHourBalance` with exact integer seconds through
the model and converts to numbers only for DTOs. Concrete `SCHEDULED`,
`COMPLETED`, and `NO_SHOW` schedules reserve capacity; `scheduledHours` counts
only `SCHEDULED` schedules. `usedHours` sums unreversed
`ClassHourDeduction` records. Recurring templates do not reserve capacity, and
remaining hours may be negative when historical data exceeds a class total.

Hour changes are immutable `ClassHourAddition` records. Normalize an addition
request before entering the transaction, resolve a course preset only after a
request-id replay check, and snapshot its id, name, and current configured
hours in the ledger. A custom replay matches exact normalized seconds and
revenue; a course replay matches the source course id and revenue, without
consulting mutable course data. `null` revenue and zero revenue remain distinct.
`ClassModel` produces the total-hours cap plan, while the repository applies its
guarded atomic increment and ledger write. `ClassService` coordinates that
narrow transaction and maps domain and persistence failures to application
errors. The ledger never retains a Course relation, so course edits or deletion
cannot change historical additions.

For course data, use `CourseModel.fromPrisma(...)` when converting persistence
records and `course.toCourseDTO()` when returning API responses. Courses are
tutor-owned reusable hour presets; changing or deleting a course never mutates
existing hour-addition snapshots.

For schedule data, use `ScheduleModel.fromSchedulePrisma(...)` when converting
persistence records and `scheduleModel.toScheduleDTO()` when returning API
responses. Recurring schedule responses use `RecurringScheduleModel` and
`RecurringScheduleUpdateResultModel` for recurring schedule serialization.

Schedule lifecycle decisions live on `ScheduleModel`: completion, no-show,
restoration, capacity-reserving status, and no-show note normalization. The
transition methods return a `ScheduleTransitionPlan` with the expected
persistence snapshot, next-state patch, and hour-deduction effect. They preserve
exact duration seconds and do not access Prisma or throw `AppError`.

`ScheduleService` coordinates a lifecycle use case by opening the repository's
schedule-specific transaction, loading the tutor-owned schedule, asking the
model for a plan, and mapping domain or persistence failures to the existing
application errors. `ScheduleRepository` applies the plan with an owner-scoped
compare-and-set, writes the deduction effect, and refreshes the result inside
the same Prisma transaction so a failure rolls back the full transition.

## Tutor-owned integrations

Tutor-owned credentials belong in a dedicated one-to-one integration model,
not in shared environment variables. Secrets must remain encrypted at rest and
are deliberately excluded from DTOs. Student records may keep an integration
reference when an external recipient identity is provider-specific; a missing
reference represents a stale link that needs reconnecting rather than a usable
recipient.
