-- CreateTable
CREATE TABLE "tutors" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tutors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tutors_userId_key" ON "tutors"("userId");

-- Create default tutor for each existing user
INSERT INTO "tutors" ("id", "userId", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, "id", NOW(), NOW() FROM "user";

-- Add tutorId column to students (nullable initially)
ALTER TABLE "students" ADD COLUMN "tutorId" TEXT;

-- Add tutorId column to classes (nullable initially)
ALTER TABLE "classes" ADD COLUMN "tutorId" TEXT;

-- Backfill students with the tutor belonging to their owner
-- Since there's no ownership yet, assign all to the first tutor
UPDATE "students" SET "tutorId" = (SELECT "id" FROM "tutors" LIMIT 1);

-- Backfill classes with the tutor belonging to their owner
UPDATE "classes" SET "tutorId" = (SELECT "id" FROM "tutors" LIMIT 1);

-- Make tutorId non-nullable
ALTER TABLE "students" ALTER COLUMN "tutorId" SET NOT NULL;

-- Make tutorId non-nullable
ALTER TABLE "classes" ALTER COLUMN "tutorId" SET NOT NULL;

-- Add foreign key constraints
ALTER TABLE "students" ADD CONSTRAINT "students_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "tutors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "classes" ADD CONSTRAINT "classes_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "tutors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add foreign key for tutors -> users
ALTER TABLE "tutors" ADD CONSTRAINT "tutors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "students_tutorId_idx" ON "students"("tutorId");

-- CreateIndex
CREATE INDEX "classes_tutorId_idx" ON "classes"("tutorId");
