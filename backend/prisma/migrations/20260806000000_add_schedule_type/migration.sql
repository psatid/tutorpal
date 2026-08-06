CREATE TYPE "schedule_type" AS ENUM ('ON_SITE', 'ONLINE');

ALTER TABLE "schedules"
ADD COLUMN "type" "schedule_type" NOT NULL DEFAULT 'ON_SITE';

ALTER TABLE "recurring_schedules"
ADD COLUMN "type" "schedule_type" NOT NULL DEFAULT 'ON_SITE';
