-- This feature intentionally does not migrate legacy class history.
-- Truncating classes cascades to enrollments, schedules, recurring schedules,
-- recurring items, and hour deductions while preserving tutors and students.
TRUNCATE TABLE "classes" CASCADE;

CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultTotalHours" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "classes" ADD COLUMN "courseId" TEXT;
ALTER TABLE "classes" ALTER COLUMN "name" DROP NOT NULL;

CREATE INDEX "courses_tutorId_idx" ON "courses"("tutorId");
CREATE INDEX "courses_tutorId_name_idx" ON "courses"("tutorId", "name");
CREATE INDEX "classes_courseId_idx" ON "classes"("courseId");

ALTER TABLE "courses"
ADD CONSTRAINT "courses_tutorId_fkey"
FOREIGN KEY ("tutorId") REFERENCES "tutors"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "classes"
ADD CONSTRAINT "classes_courseId_fkey"
FOREIGN KEY ("courseId") REFERENCES "courses"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
