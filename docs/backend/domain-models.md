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
- DTOs remain API-facing response shapes. Models are the internal application
  shape.
- DTO date/time serialization should use `DateTime` from
  `backend/src/lib/date-time.ts`.

For student data, use `Student.fromStudentPrisma(...)` when converting
persistence records and `student.toStudentDTO()` or
`studentDetail.toStudentDetailDTO()` when returning API responses.

For class data, use `ClassModel.fromClassPrisma(...)` when converting
persistence records and `classModel.toClassDTO()` when returning API responses.
Classes may be course-linked or custom. Treat `courseId` as immutable, use the
class's hour snapshot for scheduling, and expose `displayName` wherever a class
label is shown.

For course data, use `CourseModel.fromPrisma(...)` when converting persistence
records and `course.toCourseDTO()` when returning API responses. Courses are
tutor-owned reusable defaults; changing a course never mutates existing class
hour snapshots.

For schedule data, use `ScheduleModel.fromSchedulePrisma(...)` when converting
persistence records and `scheduleModel.toScheduleDTO()` when returning API
responses. Recurring schedule responses use `RecurringScheduleModel` and
`RecurringScheduleUpdateResultModel` for recurring schedule serialization.

## Tutor-owned integrations

Tutor-owned credentials belong in a dedicated one-to-one integration model,
not in shared environment variables. Secrets must remain encrypted at rest and
are deliberately excluded from DTOs. Student records may keep an integration
reference when an external recipient identity is provider-specific; a missing
reference represents a stale link that needs reconnecting rather than a usable
recipient.
