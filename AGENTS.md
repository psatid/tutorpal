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

**Overview**: Implemented reserved-hour tracking for schedules, with restoration/history support when completed schedules are cancelled.

**Database Changes**:
- Added `ClassHourDeduction` model to track all hour deductions
- Links to Schedule and Class models
- Stores hours deducted, deduction timestamp, and restoration timestamp
- One deduction per schedule (unique constraint)

**Backend Implementation**:
- **Repository Layer** (`schedule.repository.ts`):
  - Added `validateAndReserveHours(classId, hours)` - checks class capacity before schedule creation
  - Added `completeSchedule(id)` - marks schedule as COMPLETED and records completion history
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
- Prevent negative hours by counting all `SCHEDULED` and `COMPLETED` schedules against class capacity

**Usage Flow**:
1. Create schedule → System validates class has enough unreserved hours and reserves them immediately for `SCHEDULED` / `COMPLETED` schedules
2. Click complete button → Schedule marked COMPLETED without consuming hours a second time
3. If needed, click restore button → Hours released by marking the schedule CANCELLED
4. Completion/restoration history is tracked in `ClassHourDeduction`

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

### LINE Account Linking Integration (May 6, 2026)

**Overview**: Implemented LINE account linking for students. Tutors generate a magic link, send it to the student, and the student links their LINE account via OAuth flow.

**Database Changes**:
- Added `lineUserId String? @unique` to `Student` model
- Added `LineLinkToken` model: `id`, `studentId`, `token` (unique), `expiresAt`, `usedAt`
- Token expires in 24 hours, marked as used once linked

**Backend Implementation**:
- **Lib** (`lib/line.ts`):
  - `exchangeCodeForToken(code)` - Exchanges LINE OAuth code for access token
  - `getLineProfile(accessToken)` - Fetches LINE user profile (userId, displayName)
  - `buildLineAuthUrl(state)` - Builds LINE Login authorization URL

- **Repository** (`repositories/line.repository.ts`):
  - `createToken(studentId)` - Generates UUID token with 24h expiry
  - `findValidToken(token)` - Finds non-expired, unused token
  - `markTokenUsed(tokenId)` - Marks token as consumed
  - `linkStudentLineUser(studentId, lineUserId)` - Stores LINE userId on student

- **Service** (`services/line.service.ts`):
  - `generateLinkToken(studentId)` - Validates student exists and not already linked, creates token, returns `{ token, linkUrl, expiresAt }`
  - `getAuthUrl(token)` - Validates token, returns LINE OAuth authorization URL
  - `handleCallback(code, state)` - Exchanges code for LINE profile, links student, marks token used

- **Routes** (`routes/line.ts`):
  - `POST /v1/line/link-token` (auth required) - Generate magic link for a student
  - `GET /v1/line/auth-url?token=xxx` (public) - Get LINE Login URL
  - `GET /v1/line/callback?code=&state=` (public) - OAuth callback, redirects to frontend

- **Environment Variables**:
  - `LINE_LOGIN_CHANNEL_ID` - LINE Login channel ID from LINE Developers Console
  - `LINE_LOGIN_CHANNEL_SECRET` - LINE Login channel secret
  - `LINE_LINK_REDIRECT_URL` - Backend callback URL (default: `http://localhost:3000/v1/line/callback`)
  - `FRONTEND_URL` - Frontend base URL for generating magic links (default: `http://localhost:3001`)

**Frontend Implementation**:
- **Mutation** (`use-generate-line-link.ts`):
  - `useGenerateLineLink()` - Mutation to generate LINE link for a student

- **Screens** (`line-link-screen.tsx`):
  - Public page at `/line-link?token=xxx` - Shows "Connect with LINE" button
  - Handles success/error states from OAuth callback redirect
  - Success: `/line-link?success=true&name=DisplayName`
  - Error: `/line-link?error=link_failed`

- **Route** (`routes/line-link.tsx`):
  - Public TanStack Router route with search param validation

- **Components**:
  - Updated `StudentCard` to show LINE linked badge (green "LINE" badge with checkmark)
  - Added "Link LINE" dropdown menu item for unlinked students
  - Updated `StudentScreen` with `handleLinkLine()` - confirmation dialog, generates link, copies to clipboard

- **i18n** (`students.ts`):
  - Added `line.linkLabel`, `line.linkConfirm`, `line.linkGenerate`, `line.linkCopied`, `line.alreadyLinked`

**Linking Flow**:
1. Tutor clicks "Link LINE" on student card dropdown
2. Confirmation dialog appears
3. Tutor confirms → backend generates magic link token → link copied to clipboard
4. Tutor sends link to student via any channel
5. Student opens link → sees "Connect with LINE" page
6. Student clicks "Connect" → redirected to LINE Login
7. Student authorizes → LINE redirects to backend callback
8. Backend exchanges code for LINE profile, stores `lineUserId` on student
9. Backend redirects to frontend success page
10. Student sees "Linked Successfully!" page

**Files Created**:
- `backend/src/lib/line.ts`
- `backend/src/types/line.types.ts`
- `backend/src/schemas/line.schema.ts`
- `backend/src/repositories/line.repository.ts`
- `backend/src/services/line.service.ts`
- `backend/src/routes/line.ts`
- `backend/prisma/migrations/20260505000000_add_line_linking/migration.sql`
- `frontend/src/hooks/mutations/use-generate-line-link.ts`
- `frontend/src/screens/line-link-screen.tsx`
- `frontend/src/routes/line-link.tsx`

**Files Modified**:
- `backend/prisma/schema.prisma` - Added `lineUserId` to Student, added `LineLinkToken` model
- `backend/src/lib/env.ts` - Added LINE env vars
- `backend/src/types/student.types.ts` - Added `lineUserId` to StudentDTO
- `backend/src/types/index.ts` - Added line types export
- `backend/src/repositories/student.repository.ts` - Updated toDTO to include lineUserId
- `backend/src/schemas/student.schema.ts` - Added lineUserId to StudentSchema
- `backend/src/schemas/index.ts` - Added line schema export
- `backend/src/repositories/index.ts` - Added line repository export
- `backend/src/services/index.ts` - Added line service export
- `backend/src/routes/index.ts` - Added LINE routes
- `backend/src/index.ts` - Added LINE tag to OpenAPI docs
- `frontend/src/types/student.ts` - Added lineUserId to Student interface
- `frontend/src/components/students/student-card.tsx` - Added LINE badge and link action
- `frontend/src/components/students/student-drawer.tsx` - Updated type import
- `frontend/src/screens/student-screen.tsx` - Added LINE link handler
- `frontend/src/lib/i18n/locales/en/students.ts` - Added LINE translations

### Student Detail Page with Classes (June 14, 2026)

**Overview**: Migrated from student drawer (bottom sheet with 3-field edit form) to a full student details page showing enrolled classes. Follows the existing `ClassDetailScreen` pattern.

**Backend Changes**:
- **Types** (`student.types.ts`): Added `ClassInStudentDTO` (id, name, totalHours, remainingHours) and `StudentDetailDTO` (extends StudentDTO with classes array)
- **Repository** (`student.repository.ts`): Updated `findById` to include enrolled classes with remaining hours calculation based on `SCHEDULED` / `COMPLETED` schedules
- **Service** (`student.service.ts`): Updated return type to `StudentDetailDTO`
- **Schema** (`student.schema.ts`): Added `ClassInStudentSchema` and `StudentDetailSchema`
- **Routes** (`routes/students.ts`): GET /:id now returns `StudentDetailSchema` with classes

**Frontend Changes**:
- **Types** (`getV1StudentsById200.ts`): Added `classes` array with `GetV1StudentsById200ClassesItem` type
- **Route** (`_layout/students.tsx`): Converted to layout route with Outlet
- **Route** (`_layout/students/index.tsx`): New index route for student list
- **Route** (`_layout/students/$studentId.tsx`): New detail route
- **Screen** (`student-detail-screen.tsx`): New detail screen with header + class list + drawer
- **Component** (`student-info-header.tsx`): Header with avatar, name, grade, phone, LINE badge, edit button
- **Component** (`student-class-list.tsx`): Enrolled classes list with tappable cards (navigates to class detail)
- **Screen** (`student-screen.tsx`): Updated to navigate to detail page instead of opening drawer
- **Hook** (`use-student.ts`): New query hook for fetching student by ID with classes
- **i18n** (`students.ts`): Added `studentDetail.*` translation keys
- **Routes** (`constants/routes.ts`): Added `STUDENT_DETAIL` route

**Flow**:
1. Tap student card in list → navigate to `/students/$studentId`
2. Detail page shows student info header + enrolled classes
3. Tap class card → navigate to `/classes/$classId`
4. Tap edit pencil → opens StudentDrawer in edit mode
5. Back button → navigate to `/students`

**Files Created**:
- `frontend/src/routes/_layout/students/index.tsx`
- `frontend/src/routes/_layout/students/$studentId.tsx`
- `frontend/src/screens/student-detail-screen.tsx`
- `frontend/src/components/students/student-info-header.tsx`
- `frontend/src/components/students/student-class-list.tsx`
- `frontend/src/hooks/queries/use-student.ts`

**Files Modified**:
- `backend/src/types/student.types.ts` - Added ClassInStudentDTO, StudentDetailDTO
- `backend/src/repositories/student.repository.ts` - Updated findById to include classes
- `backend/src/services/student.service.ts` - Updated return type
- `backend/src/schemas/student.schema.ts` - Added ClassInStudentSchema, StudentDetailSchema
- `backend/src/routes/students.ts` - Updated GET /:id response schema
- `frontend/src/api/generated/models/getV1StudentsById200.ts` - Added classes array
- `frontend/src/routes/_layout/students.tsx` - Converted to layout route
- `frontend/src/screens/student-screen.tsx` - Navigate to detail instead of drawer
- `frontend/src/constants/routes.ts` - Added STUDENT_DETAIL
- `frontend/src/lib/i18n/locales/en/students.ts` - Added studentDetail translations

### Schedule No-Show Status (June 21, 2026)

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
