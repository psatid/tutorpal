LOCK TABLE "account" IN SHARE ROW EXCLUSIVE MODE;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "account"
        GROUP BY "providerId", "accountId"
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Cannot add account provider/account uniqueness: duplicate providerId/accountId rows exist';
    END IF;
END $$;

CREATE UNIQUE INDEX "account_providerId_accountId_key" ON "account"("providerId", "accountId");
