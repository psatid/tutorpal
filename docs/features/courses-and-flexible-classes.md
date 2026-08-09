# Courses and Flexible Classes (July 19, 2026)

## Overview

TutorPal now separates reusable course defaults from the classes tutors actually teach. A tutor can create a course once, then create multiple classes from it, or create a standalone custom class when no reusable course applies.

## Domain rules

- A `Course` belongs to one tutor and stores a required name and default total hours. Duplicate course names are allowed.
- A `Class` may reference one course or be custom. The course association is chosen at creation and cannot be changed later.
- Course-linked classes take a snapshot of the course's default hours. Later course edits affect only future classes.
- A course-linked class name is optional. Its `displayName` uses the custom class name when present and otherwise derives a concise name from enrolled students.
- A custom class requires both a name and total hours; its display name is always its class name.
- Every class must contain at least one unique student owned by the tutor. Enrollment changes are transactional.
- Class total hours cannot be reduced below time already reserved by scheduled, completed, or no-show lessons.
- A class can be permanently deleted from the active Classes workspace. Deletion cascades its enrollments, scheduled and past sessions, recurring schedules and items, hour deductions, and reminder deliveries; students and the linked course remain.
- Class deletion is one tutor-scoped database operation. Missing or another tutor's class returns the same `404 CLASS_NOT_FOUND` response to avoid resource enumeration.
- A course with classes cannot be deleted. The database restriction is authoritative, so the API returns `409 COURSE_IN_USE` even when classes are added after the client refreshes its course count.
- Deleting a missing or another tutor's course returns the same `404 COURSE_NOT_FOUND` response to avoid resource enumeration.

The destructive migration deliberately removes existing class, enrollment, schedule, recurring-schedule, and hour-deduction history before adding the new structure. Tutors and students are preserved.

## API

Authenticated course CRUD is available under `/v1/courses`. The list endpoint supports pagination, name search, sorting, and per-course class counts.

`POST /v1/classes` accepts `courseId: string | null` and non-empty `studentIds`:

- With a course, `name` and `totalHours` are optional; hours default from the course.
- Without a course, `name` and `totalHours` are required.

Class updates accept only name, total hours, and students. Class responses include nullable `name`, stable `displayName`, and nullable course context. Schedule, recurring-schedule, and student-detail responses use the class display name and expose course context separately.

`DELETE /v1/classes/:id` returns `204` after deleting a tutor-owned class, or `404 CLASS_NOT_FOUND` when the class is missing or belongs to another tutor.

Class listing supports `courseId` and `classType=custom|course-linked` filtering and searches class names, course names, and enrolled student names. `courseId` and `classType` are mutually exclusive.

## Responsive experience

Courses and classes are separate top-level workspaces. `/courses` manages reusable templates, `/classes` manages active teaching groups, and class detail URLs remain `/classes/$classId`.

- The five-item navigation exposes Home, Students, Courses, Classes, and Schedule directly, placing the reusable course setup before class creation.
- On desktop these destinations appear in a collapsible side rail that retains an icon-only navigation state; mobile and tablet use the five-item bottom navigation.
- Courses presents a searchable, sortable catalog with default hours, class counts, editing, deletion, and links to filtered class results.
- Course deletion revalidates the current class count before showing confirmation. In-use, stale, or unavailable states remain non-destructive and offer either retry or a link to the filtered classes; a concurrent server conflict returns to the same blocked state.
- Classes presents a searchable mixed list with All, Custom, Course-linked, and individual-course filters. Each row offers View details, Edit class, and Delete class actions; deletion uses an explicit cascade warning, pending lock, retryable error state, neutral missing-class reconciliation, and focus restoration.
- Students, Classes, and Courses share the same header, toolbar, divider-list, state, and form-surface patterns.
- Course and class forms use the shared responsive drawer: an accessible bottom sheet below `md` and a right-side panel at `md` and above.
- Custom rows show “Custom class” as their secondary context.
- The create-class flow starts with a course selector containing “Custom class.” Selecting a course pre-fills its hours and makes the class name optional; selecting custom requires both fields.
- Detail, student, and schedule surfaces show the display name first and the course or custom context second.

The workspace includes loading skeletons, empty and search-empty states, validation feedback, deletion conflicts, long-name truncation, keyboard focus states, and reduced-motion-safe transitions.
