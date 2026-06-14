-- AlterTable
ALTER TABLE "recurring_schedule_items"
ADD COLUMN "durationMinutes" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "recurring_schedules"
DROP COLUMN "durationMinutes";
