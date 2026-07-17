# Student Detail Page with Classes (June 14, 2026)

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
