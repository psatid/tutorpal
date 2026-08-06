import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

const migrationUrl = new URL(
	"../../prisma/migrations/20260806000000_add_schedule_type/migration.sql",
	import.meta.url,
);

describe("schedule type migration", () => {
	test("adds a constrained enum and backfills both schedule tables", async () => {
		const sql = await readFile(migrationUrl, "utf8");

		expect(sql).toContain(
			"CREATE TYPE \"schedule_type\" AS ENUM ('ON_SITE', 'ONLINE')",
		);
		expect(sql).toContain(
			'ADD COLUMN "type" "schedule_type" NOT NULL DEFAULT \'ON_SITE\'',
		);
		expect(sql).toContain('ALTER TABLE "schedules"');
		expect(sql).toContain('ALTER TABLE "recurring_schedules"');
	});
});
