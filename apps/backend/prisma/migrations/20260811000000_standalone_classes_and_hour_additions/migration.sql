-- Preserve every existing class and materialize the display label before the
-- optional course association is removed. Student labels mirror the previous
-- display-name convention: one name, two names joined with " & ", or the
-- first two names followed by a count of the remaining students.
WITH ranked_enrollment_names AS (
    SELECT
        enrollment."classId",
        NULLIF(BTRIM(student."name"), '') AS "studentName",
        ROW_NUMBER() OVER (
            PARTITION BY enrollment."classId"
            ORDER BY enrollment."createdAt" ASC, enrollment."id" ASC
        ) AS "position"
    FROM "class_enrollments" AS enrollment
    INNER JOIN "students" AS student ON student."id" = enrollment."studentId"
    WHERE NULLIF(BTRIM(student."name"), '') IS NOT NULL
),
student_display_names AS (
    SELECT
        "classId",
        CASE COUNT(*)
            WHEN 1 THEN MAX("studentName") FILTER (WHERE "position" = 1)
            WHEN 2 THEN
                MAX("studentName") FILTER (WHERE "position" = 1)
                || ' & '
                || MAX("studentName") FILTER (WHERE "position" = 2)
            ELSE
                MAX("studentName") FILTER (WHERE "position" = 1)
                || ', '
                || MAX("studentName") FILTER (WHERE "position" = 2)
                || ' +'
                || (COUNT(*) - 2)::TEXT
        END AS "displayName"
    FROM ranked_enrollment_names
    GROUP BY "classId"
),
resolved_names AS (
    SELECT
        class."id",
        student_display_names."displayName",
        course."name" AS "courseName"
    FROM "classes" AS class
    LEFT JOIN student_display_names
        ON student_display_names."classId" = class."id"
    LEFT JOIN "courses" AS course ON course."id" = class."courseId"
)
UPDATE "classes" AS class
SET "name" = COALESCE(
    NULLIF(BTRIM(class."name"), ''),
    resolved_names."displayName",
    NULLIF(BTRIM(resolved_names."courseName"), ''),
    'Unnamed class'
)
FROM resolved_names
WHERE resolved_names."id" = class."id";

ALTER TABLE "classes" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "classes" ALTER COLUMN "totalHours" SET DEFAULT 0;

ALTER TABLE "classes" DROP CONSTRAINT "classes_courseId_fkey";
DROP INDEX "classes_courseId_idx";
ALTER TABLE "classes" DROP COLUMN "courseId";

CREATE TYPE "class_hour_addition_source" AS ENUM ('COURSE', 'CUSTOM');

CREATE TABLE "class_hour_additions" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "source" "class_hour_addition_source" NOT NULL,
    "hours" DECIMAL(10,2) NOT NULL,
    "sourceCourseId" TEXT,
    "sourceCourseName" TEXT,
    "requestId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "class_hour_additions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "class_hour_additions_hours_positive_check" CHECK ("hours" > 0),
    CONSTRAINT "class_hour_additions_source_snapshot_check" CHECK (
        ("source" = 'COURSE' AND "sourceCourseId" IS NOT NULL AND "sourceCourseName" IS NOT NULL)
        OR
        ("source" = 'CUSTOM' AND "sourceCourseId" IS NULL AND "sourceCourseName" IS NULL)
    )
);

CREATE UNIQUE INDEX "class_hour_additions_classId_requestId_key"
ON "class_hour_additions"("classId", "requestId");

CREATE INDEX "class_hour_additions_classId_createdAt_id_idx"
ON "class_hour_additions"("classId", "createdAt", "id");

ALTER TABLE "class_hour_additions"
ADD CONSTRAINT "class_hour_additions_classId_fkey"
FOREIGN KEY ("classId") REFERENCES "classes"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
