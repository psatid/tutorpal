ALTER TABLE "classes"
ALTER COLUMN "totalHours" TYPE DECIMAL(10, 2)
USING "totalHours"::DECIMAL(10, 2);
