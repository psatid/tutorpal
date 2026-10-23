-- AlterTable
ALTER TABLE "students" ADD COLUMN "lineUserId" TEXT;

-- CreateTable
CREATE TABLE "line_link_tokens" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "line_link_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "students_lineUserId_key" ON "students"("lineUserId");

-- CreateIndex
CREATE UNIQUE INDEX "line_link_tokens_token_key" ON "line_link_tokens"("token");

-- CreateIndex
CREATE INDEX "line_link_tokens_token_idx" ON "line_link_tokens"("token");

-- CreateIndex
CREATE INDEX "line_link_tokens_studentId_idx" ON "line_link_tokens"("studentId");

-- AddForeignKey
ALTER TABLE "line_link_tokens" ADD CONSTRAINT "line_link_tokens_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
