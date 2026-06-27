ALTER TABLE "schedules"
ADD COLUMN "recurringScheduleId" TEXT;

CREATE INDEX "schedules_recurringScheduleId_idx" ON "schedules"("recurringScheduleId");

ALTER TABLE "schedules"
ADD CONSTRAINT "schedules_recurringScheduleId_fkey"
FOREIGN KEY ("recurringScheduleId") REFERENCES "recurring_schedules"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
