import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

const migrationUrl = new URL(
	"../../prisma/migrations/20260909000000_add_account_provider_identity_unique/migration.sql",
	import.meta.url,
);

describe("account provider identity migration", () => {
	test("locks account writes before the duplicate preflight and unique index", async () => {
		const sql = await readFile(migrationUrl, "utf8");
		const lockPosition = sql.indexOf(
			'LOCK TABLE "account" IN SHARE ROW EXCLUSIVE MODE',
		);
		const duplicateCheckPosition = sql.indexOf('FROM "account"');
		const uniqueIndexPosition = sql.indexOf(
			'CREATE UNIQUE INDEX "account_providerId_accountId_key"',
		);

		expect(lockPosition).toBeGreaterThanOrEqual(0);
		expect(duplicateCheckPosition).toBeGreaterThan(lockPosition);
		expect(uniqueIndexPosition).toBeGreaterThan(duplicateCheckPosition);
		expect(sql).toContain(
			"Cannot add account provider/account uniqueness: duplicate providerId/accountId rows exist",
		);
	});
});
