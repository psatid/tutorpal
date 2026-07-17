# Decimal Class Hours (June 26, 2026)

**Overview**: Updated classes to support fractional `totalHours`, allowing tutors to enter decimal hour values such as `1.5` or `12.75` and use them in schedule availability checks.

**Database Changes**:
- Changed `Class.totalHours` from `Int` to `Decimal(10,2)`
- Added migration to cast existing integer values to decimal values without changing totals

**Backend Changes**:
- Updated class and student response schemas to describe `totalHours` as a decimal-capable number
- Updated class creation and update validation to accept fractional hours
- Updated class and student repositories to convert Prisma `Decimal` values into plain `number` DTOs
- Updated remaining-hours calculation helpers to work safely with Prisma `Decimal`

**Frontend Changes**:
- Updated class form validation to accept decimal numbers
- Updated class create/edit hour input to use decimal-friendly number input settings
- Updated class hour badges to format decimal totals and remaining hours without rounding them to whole numbers

**Verification Goal**:
1. Create or edit a class with decimal total hours
2. Create a schedule against that class
3. Confirm remaining hours update correctly with fractional totals

**Files Modified**:
- `backend/prisma/schema.prisma` - Changed `Class.totalHours` to decimal
- `backend/prisma/migrations/20260626000000_allow_decimal_class_hours/migration.sql` - Added migration
- `backend/src/schemas/class.schema.ts` - Removed integer-only validation for class hours
- `backend/src/schemas/student.schema.ts` - Updated student class detail schema for decimal hours
- `backend/src/repositories/class.repository.ts` - Converted Prisma decimals to DTO numbers
- `backend/src/repositories/student.repository.ts` - Converted Prisma decimals to DTO numbers
- `backend/src/repositories/class-hours.ts` - Normalized decimal hour math for remaining hours
- `frontend/src/types/class.ts` - Updated class form validation
- `frontend/src/components/classes/class-drawer.tsx` - Allowed decimal input in total-hours field
- `frontend/src/components/classes/class-card.tsx` - Improved decimal hour display
- `frontend/src/components/classes/class-info-header.tsx` - Improved decimal hour display
- `frontend/src/components/students/student-class-list.tsx` - Improved decimal hour display
- `frontend/src/lib/i18n/locales/en/classes.ts` - Updated decimal placeholder examples
