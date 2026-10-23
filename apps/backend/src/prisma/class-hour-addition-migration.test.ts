import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

const migrationUrl = new URL(
	"../../prisma/migrations/20260811000000_standalone_classes_and_hour_additions/migration.sql",
	import.meta.url,
);

describe("standalone class and hour-addition migration", () => {
	test("preserves existing class history while materializing required names", async () => {
		const sql = await readFile(migrationUrl, "utf8");

		expect(sql).not.toMatch(/\bTRUNCATE\b/i);
		expect(sql).toContain("student_display_names");
		expect(sql).toContain("'Unnamed class'");
		expect(sql).toContain(
			'ALTER TABLE "classes" ALTER COLUMN "name" SET NOT NULL',
		);
		expect(sql).toContain(
			'ALTER TABLE "classes" ALTER COLUMN "totalHours" SET DEFAULT 0',
		);
		expect(sql).toContain(
			'ALTER TABLE "classes" DROP CONSTRAINT "classes_courseId_fkey"',
		);
		expect(sql).toContain('ALTER TABLE "classes" DROP COLUMN "courseId"');
	});

	test("does not delete or alter existing schedules, enrollments, deductions, or reminders", async () => {
		const sql = await readFile(migrationUrl, "utf8");

		for (const table of [
			"class_enrollments",
			"schedules",
			"recurring_schedules",
			"recurring_schedule_items",
			"class_hour_deductions",
			"class_reminder_deliveries",
		]) {
			expect(sql).not.toMatch(
				new RegExp(`(?:ALTER|DROP) TABLE "${table}"`, "i"),
			);
			expect(sql).not.toMatch(new RegExp(`DELETE FROM "${table}"`, "i"));
			expect(sql).not.toMatch(new RegExp(`TRUNCATE TABLE "${table}"`, "i"));
		}
	});

	test("adds an immutable class-owned ledger with request idempotency and course snapshots", async () => {
		const sql = await readFile(migrationUrl, "utf8");
		const ledgerSql = sql.slice(
			sql.indexOf('CREATE TABLE "class_hour_additions"'),
		);

		expect(sql).toContain(
			"CREATE TYPE \"class_hour_addition_source\" AS ENUM ('COURSE', 'CUSTOM')",
		);
		expect(ledgerSql).toContain('"sourceCourseId" TEXT');
		expect(ledgerSql).toContain('"sourceCourseName" TEXT');
		expect(ledgerSql).toContain('"requestId" UUID NOT NULL');
		expect(ledgerSql).toContain(
			'CONSTRAINT "class_hour_additions_hours_positive_check" CHECK ("hours" > 0)',
		);
		expect(ledgerSql).toContain(
			'CREATE UNIQUE INDEX "class_hour_additions_classId_requestId_key"',
		);
		expect(ledgerSql).toContain(
			'CREATE INDEX "class_hour_additions_classId_createdAt_id_idx"',
		);
		expect(ledgerSql).toContain(
			'FOREIGN KEY ("classId") REFERENCES "classes"("id")',
		);
		expect(ledgerSql).toContain("ON DELETE CASCADE");
		expect(ledgerSql).not.toContain('REFERENCES "courses"');
	});
});
