-- This coordinated migration changes internal teaching-time storage from hours
-- and minutes to whole seconds. API units remain hours for course/class amounts
-- and minutes for schedule durations.
--
-- Class-hour deductions were historically stored as floating-point hours, so
-- verify that every existing value represents a whole number of seconds before
-- converting it. Active deductions must also still correspond to their
-- completed or no-show schedule.
--
-- Multiplying a valid binary64 hour value by 3600 can be a few units in the
-- last place away from its original whole-second value. Use a two-epsilon
-- relative bound here, then compare rounded seconds to the schedule duration
-- exactly for active deductions below.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM (
            SELECT "hoursDeducted" * 3600 AS "deductedSeconds"
            FROM "class_hour_deductions"
        ) AS deduction
        WHERE ABS(
            deduction."deductedSeconds" - ROUND(deduction."deductedSeconds")
        ) > GREATEST(1::DOUBLE PRECISION, ABS(deduction."deductedSeconds"))
            * 4.440892098500626e-16
    ) THEN
        RAISE EXCEPTION
            'Cannot migrate class-hour deductions: a deduction does not map to whole seconds';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM "class_hour_deductions" AS deduction
        INNER JOIN "schedules" AS schedule ON schedule."id" = deduction."scheduleId"
        WHERE deduction."restoredAt" IS NULL
          AND (
              schedule."status" NOT IN ('COMPLETED', 'NO_SHOW')
              OR deduction."classId" <> schedule."classId"
              OR ROUND(deduction."hoursDeducted" * 3600)::BIGINT
                  <> schedule."durationMinutes"::BIGINT * 60
          )
    ) THEN
        RAISE EXCEPTION
            'Cannot migrate class-hour deductions: active deductions do not match their schedules';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM "schedules" AS schedule
        LEFT JOIN "class_hour_deductions" AS deduction
            ON deduction."scheduleId" = schedule."id"
        WHERE schedule."status" IN ('COMPLETED', 'NO_SHOW')
          AND (
              deduction."scheduleId" IS NULL
              OR deduction."restoredAt" IS NOT NULL
              OR deduction."classId" <> schedule."classId"
              OR ROUND(deduction."hoursDeducted" * 3600)::BIGINT
                  <> schedule."durationMinutes"::BIGINT * 60
          )
    ) THEN
        RAISE EXCEPTION
            'Cannot migrate class-hour deductions: a completed or no-show schedule lacks a matching active deduction';
    END IF;
END $$;

-- Capture every remaining balance before the column conversions. The snapshot
-- is checked after conversion so the maintenance migration cannot silently
-- alter available teaching time.
CREATE TEMP TABLE "_teaching_time_balance_audit" ON COMMIT DROP AS
SELECT
    class_record."id" AS "classId",
    ROUND(class_record."totalHours" * 3600)::BIGINT
        - (COALESCE(SUM(schedule."durationMinutes"::BIGINT), 0)::BIGINT * 60)
        AS "remainingSeconds"
FROM "classes" AS class_record
LEFT JOIN "schedules" AS schedule
    ON schedule."classId" = class_record."id"
    AND schedule."status" IN ('SCHEDULED', 'COMPLETED', 'NO_SHOW')
GROUP BY class_record."id", class_record."totalHours";

ALTER TABLE "courses"
RENAME COLUMN "defaultTotalHours" TO "defaultTotalSeconds";

ALTER TABLE "courses"
ALTER COLUMN "defaultTotalSeconds" TYPE BIGINT
USING ROUND("defaultTotalSeconds" * 3600)::BIGINT;

ALTER TABLE "classes"
ALTER COLUMN "totalHours" DROP DEFAULT;

ALTER TABLE "classes"
RENAME COLUMN "totalHours" TO "totalSeconds";

ALTER TABLE "classes"
ALTER COLUMN "totalSeconds" TYPE BIGINT
USING ROUND("totalSeconds" * 3600)::BIGINT;

ALTER TABLE "classes"
ALTER COLUMN "totalSeconds" SET DEFAULT 0;

ALTER TABLE "class_hour_additions"
RENAME COLUMN "hours" TO "secondsAdded";

ALTER TABLE "class_hour_additions"
ALTER COLUMN "secondsAdded" TYPE BIGINT
USING ROUND("secondsAdded" * 3600)::BIGINT;

ALTER TABLE "class_hour_additions"
RENAME CONSTRAINT "class_hour_additions_hours_positive_check"
TO "class_hour_additions_seconds_added_positive_check";

ALTER TABLE "schedules"
RENAME COLUMN "durationMinutes" TO "durationSeconds";

ALTER TABLE "schedules"
ALTER COLUMN "durationSeconds" TYPE BIGINT
USING "durationSeconds"::BIGINT * 60;

ALTER TABLE "schedules"
ADD COLUMN "noShowNote" TEXT;

ALTER TABLE "class_hour_deductions"
RENAME COLUMN "hoursDeducted" TO "secondsDeducted";

ALTER TABLE "class_hour_deductions"
ALTER COLUMN "secondsDeducted" TYPE BIGINT
USING ROUND("secondsDeducted" * 3600)::BIGINT;

ALTER TABLE "recurring_schedule_items"
RENAME COLUMN "durationMinutes" TO "durationSeconds";

ALTER TABLE "recurring_schedule_items"
ALTER COLUMN "durationSeconds" TYPE BIGINT
USING "durationSeconds"::BIGINT * 60;

-- Recheck deduction integrity and capacity after conversion. A failure keeps
-- the transaction from leaving a partially converted database.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "class_hour_deductions" AS deduction
        INNER JOIN "schedules" AS schedule ON schedule."id" = deduction."scheduleId"
        WHERE deduction."restoredAt" IS NULL
          AND (
              schedule."status" NOT IN ('COMPLETED', 'NO_SHOW')
              OR deduction."classId" <> schedule."classId"
              OR deduction."secondsDeducted" <> schedule."durationSeconds"
          )
    ) THEN
        RAISE EXCEPTION
            'Teaching-time migration audit failed: active deductions do not match their schedules';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM "schedules" AS schedule
        LEFT JOIN "class_hour_deductions" AS deduction
            ON deduction."scheduleId" = schedule."id"
        WHERE schedule."status" IN ('COMPLETED', 'NO_SHOW')
          AND (
              deduction."scheduleId" IS NULL
              OR deduction."restoredAt" IS NOT NULL
              OR deduction."classId" <> schedule."classId"
              OR deduction."secondsDeducted" <> schedule."durationSeconds"
          )
    ) THEN
        RAISE EXCEPTION
            'Teaching-time migration audit failed: a completed or no-show schedule lacks a matching active deduction';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM "classes" AS class_record
        LEFT JOIN "schedules" AS schedule
            ON schedule."classId" = class_record."id"
            AND schedule."status" IN ('SCHEDULED', 'COMPLETED', 'NO_SHOW')
        GROUP BY class_record."id", class_record."totalSeconds"
        HAVING class_record."totalSeconds" - COALESCE(SUM(schedule."durationSeconds"), 0) < 0
    ) THEN
        RAISE EXCEPTION
            'Teaching-time migration audit failed: one or more classes have a negative remaining balance';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM "_teaching_time_balance_audit" AS before_conversion
        INNER JOIN "classes" AS class_record
            ON class_record."id" = before_conversion."classId"
        LEFT JOIN "schedules" AS schedule
            ON schedule."classId" = class_record."id"
            AND schedule."status" IN ('SCHEDULED', 'COMPLETED', 'NO_SHOW')
        GROUP BY
            before_conversion."classId",
            before_conversion."remainingSeconds",
            class_record."totalSeconds"
        HAVING before_conversion."remainingSeconds"
            <> class_record."totalSeconds" - COALESCE(SUM(schedule."durationSeconds"), 0)
    ) THEN
        RAISE EXCEPTION
            'Teaching-time migration audit failed: a class remaining balance changed during conversion';
    END IF;
END $$;
