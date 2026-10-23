CREATE TYPE "course_pricing_mode" AS ENUM ('HOURLY_RATE', 'FIXED_PRICE');

ALTER TABLE "courses"
ADD COLUMN "pricingMode" "course_pricing_mode",
ADD COLUMN "priceAmount" DECIMAL(12,2);

UPDATE "courses"
SET "pricingMode" = 'HOURLY_RATE'
WHERE "pricingMode" IS NULL;

ALTER TABLE "courses"
ALTER COLUMN "pricingMode" SET NOT NULL;

ALTER TABLE "courses"
ADD CONSTRAINT "courses_price_amount_nonnegative_check"
CHECK ("priceAmount" >= 0);

ALTER TABLE "class_hour_additions"
ADD COLUMN "revenueAmount" DECIMAL(12,2);

ALTER TABLE "class_hour_additions"
ADD CONSTRAINT "class_hour_additions_revenue_amount_nonnegative_check"
CHECK ("revenueAmount" >= 0);

CREATE INDEX "class_hour_additions_sourceCourseId_idx"
ON "class_hour_additions"("sourceCourseId");
