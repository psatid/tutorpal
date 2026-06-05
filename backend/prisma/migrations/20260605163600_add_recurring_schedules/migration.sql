-- CreateEnum
CREATE TYPE "weekday" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateTable
CREATE TABLE "recurring_schedules" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_schedule_items" (
    "id" TEXT NOT NULL,
    "recurringScheduleId" TEXT NOT NULL,
    "weekday" "weekday" NOT NULL,
    "time" INTEGER NOT NULL,

    CONSTRAINT "recurring_schedule_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recurring_schedules_classId_idx" ON "recurring_schedules"("classId");

-- CreateIndex
CREATE INDEX "recurring_schedule_items_recurringScheduleId_idx" ON "recurring_schedule_items"("recurringScheduleId");

-- AddForeignKey
ALTER TABLE "recurring_schedules" ADD CONSTRAINT "recurring_schedules_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_schedule_items" ADD CONSTRAINT "recurring_schedule_items_recurringScheduleId_fkey" FOREIGN KEY ("recurringScheduleId") REFERENCES "recurring_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
