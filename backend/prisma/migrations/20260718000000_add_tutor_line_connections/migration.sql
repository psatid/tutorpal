-- Each tutor owns their LINE credentials. Existing student links are intentionally
-- retained without a connection reference so the application can prompt a re-link.
DROP INDEX IF EXISTS "students_lineUserId_key";

ALTER TABLE "students" ADD COLUMN "lineConnectionId" TEXT;

CREATE TABLE "tutor_line_connections" (
  "id" TEXT NOT NULL,
  "tutorId" TEXT NOT NULL,
  "messagingAccessTokenEncrypted" TEXT NOT NULL,
  "loginChannelId" TEXT NOT NULL,
  "loginChannelSecretEncrypted" TEXT NOT NULL,
  "accountName" TEXT NOT NULL,
  "accountBasicId" TEXT,
  "botUserId" TEXT NOT NULL,
  "testRecipientLineUserId" TEXT,
  "lastVerifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "tutor_line_connections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "line_test_recipient_tokens" (
  "id" TEXT NOT NULL,
  "connectionId" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "line_test_recipient_tokens_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "line_link_tokens" ADD COLUMN "connectionId" TEXT;

-- Legacy tokens cannot be completed against a tutor-owned provider.
DELETE FROM "line_link_tokens";
ALTER TABLE "line_link_tokens" ALTER COLUMN "connectionId" SET NOT NULL;

CREATE UNIQUE INDEX "tutor_line_connections_tutorId_key" ON "tutor_line_connections"("tutorId");
CREATE UNIQUE INDEX "line_test_recipient_tokens_token_key" ON "line_test_recipient_tokens"("token");
CREATE INDEX "students_lineConnectionId_idx" ON "students"("lineConnectionId");
CREATE UNIQUE INDEX "students_tutorId_lineUserId_key" ON "students"("tutorId", "lineUserId");
CREATE INDEX "line_link_tokens_connectionId_idx" ON "line_link_tokens"("connectionId");
CREATE INDEX "line_test_recipient_tokens_connectionId_idx" ON "line_test_recipient_tokens"("connectionId");
CREATE INDEX "line_test_recipient_tokens_token_idx" ON "line_test_recipient_tokens"("token");

ALTER TABLE "students" ADD CONSTRAINT "students_lineConnectionId_fkey"
  FOREIGN KEY ("lineConnectionId") REFERENCES "tutor_line_connections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "line_link_tokens" ADD CONSTRAINT "line_link_tokens_connectionId_fkey"
  FOREIGN KEY ("connectionId") REFERENCES "tutor_line_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tutor_line_connections" ADD CONSTRAINT "tutor_line_connections_tutorId_fkey"
  FOREIGN KEY ("tutorId") REFERENCES "tutors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "line_test_recipient_tokens" ADD CONSTRAINT "line_test_recipient_tokens_connectionId_fkey"
  FOREIGN KEY ("connectionId") REFERENCES "tutor_line_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
