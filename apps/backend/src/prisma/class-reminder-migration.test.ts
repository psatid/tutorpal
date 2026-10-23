import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

const migrationUrl = new URL(
	"../../prisma/migrations/20260722000000_add_class_reminders/migration.sql",
	import.meta.url,
);

describe("class reminder migration", () => {
	test("does not add UTC timestamp or timezone columns to schedules", async () => {
		const sql = await readFile(migrationUrl, "utf8");

		expect(sql).toContain('CREATE INDEX "schedules_status_date_idx"');
		expect(sql).not.toMatch(/"startsAt"|"timeZone"/i);
	});
});
