CREATE INDEX "schedules_status_date_idx" ON "schedules"("status", "date");

CREATE TYPE "class_reminder_delivery_status" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED');

CREATE TABLE "class_reminder_deliveries" (
  "id" TEXT NOT NULL,
  "scheduleId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "scheduledStartAt" TIMESTAMPTZ(3) NOT NULL,
  "dueAt" TIMESTAMPTZ(3) NOT NULL,
  "status" "class_reminder_delivery_status" NOT NULL DEFAULT 'PENDING',
  "retryKey" TEXT NOT NULL,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMPTZ(3),
  "leaseExpiresAt" TIMESTAMPTZ(3),
  "lineConnectionId" TEXT NOT NULL,
  "recipientLineUserId" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "lastErrorCode" TEXT,
  "providerRequestId" TEXT,
  "sentAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "class_reminder_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "class_reminder_deliveries_retryKey_key" ON "class_reminder_deliveries"("retryKey");
CREATE UNIQUE INDEX "class_reminder_deliveries_scheduleId_studentId_scheduledStartAt_key" ON "class_reminder_deliveries"("scheduleId", "studentId", "scheduledStartAt");
CREATE INDEX "class_reminder_deliveries_status_dueAt_idx" ON "class_reminder_deliveries"("status", "dueAt");
CREATE INDEX "class_reminder_deliveries_status_nextAttemptAt_idx" ON "class_reminder_deliveries"("status", "nextAttemptAt");
CREATE INDEX "class_reminder_deliveries_leaseExpiresAt_idx" ON "class_reminder_deliveries"("leaseExpiresAt");
CREATE INDEX "class_reminder_deliveries_scheduleId_idx" ON "class_reminder_deliveries"("scheduleId");
CREATE INDEX "class_reminder_deliveries_studentId_idx" ON "class_reminder_deliveries"("studentId");

ALTER TABLE "class_reminder_deliveries" ADD CONSTRAINT "class_reminder_deliveries_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "class_reminder_deliveries" ADD CONSTRAINT "class_reminder_deliveries_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
