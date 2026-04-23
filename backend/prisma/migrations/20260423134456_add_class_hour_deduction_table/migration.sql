-- CreateTable
CREATE TABLE "class_hour_deductions" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "hoursDeducted" DOUBLE PRECISION NOT NULL,
    "deductedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "restoredAt" TIMESTAMP(3),

    CONSTRAINT "class_hour_deductions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "class_hour_deductions_scheduleId_key" ON "class_hour_deductions"("scheduleId");

-- CreateIndex
CREATE INDEX "class_hour_deductions_classId_idx" ON "class_hour_deductions"("classId");

-- CreateIndex
CREATE INDEX "class_hour_deductions_scheduleId_idx" ON "class_hour_deductions"("scheduleId");

-- AddForeignKey
ALTER TABLE "class_hour_deductions" ADD CONSTRAINT "class_hour_deductions_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
