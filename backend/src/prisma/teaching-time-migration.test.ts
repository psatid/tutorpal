import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

const migrationUrl = new URL(
	"../../prisma/migrations/20261011000000_store_teaching_time_as_seconds/migration.sql",
	import.meta.url,
);

describe("teaching-time seconds migration", () => {
	test("converts course, class, ledger, deduction, and schedule storage to bigint seconds", async () => {
		const sql = await readFile(migrationUrl, "utf8");

		expect(sql).toContain(
			'RENAME COLUMN "defaultTotalHours" TO "defaultTotalSeconds"',
		);
		expect(sql).toContain('USING ROUND("defaultTotalSeconds" * 3600)::BIGINT');
		expect(sql).toContain('RENAME COLUMN "totalHours" TO "totalSeconds"');
		expect(sql).toContain('USING ROUND("totalSeconds" * 3600)::BIGINT');
		expect(sql).toContain('RENAME COLUMN "hours" TO "secondsAdded"');
		expect(sql).toContain('USING ROUND("secondsAdded" * 3600)::BIGINT');
		expect(sql).toContain('RENAME COLUMN "hoursDeducted" TO "secondsDeducted"');
		expect(sql).toContain('USING ROUND("secondsDeducted" * 3600)::BIGINT');

		for (const table of ["schedules", "recurring_schedule_items"]) {
			expect(sql).toContain(
				`ALTER TABLE "${table}"\nRENAME COLUMN "durationMinutes" TO "durationSeconds"`,
			);
			expect(sql).toContain(
				`ALTER TABLE "${table}"\nALTER COLUMN "durationSeconds" TYPE BIGINT\nUSING "durationSeconds"::BIGINT * 60`,
			);
		}
	});

	test("keeps the migration fail-closed for invalid deductions and changed class balances", async () => {
		const sql = await readFile(migrationUrl, "utf8");

		expect(sql).toContain("a deduction does not map to whole seconds");
		expect(sql).toContain("active deductions do not match their schedules");
		expect(sql).toContain(
			"a completed or no-show schedule lacks a matching active deduction",
		);
		expect(sql).toContain('CREATE TEMP TABLE "_teaching_time_balance_audit"');
		expect(sql).toContain(
			"one or more classes have a negative remaining balance",
		);
		expect(sql).toContain(
			"a class remaining balance changed during conversion",
		);
		expect(sql).not.toMatch(/\bTRUNCATE\b/i);
		expect(sql).not.toMatch(/\bDELETE\s+FROM\b/i);
	});

	test("rounds a large integral legacy deduction despite its floating-point representation", async () => {
		const durationMinutes = 251_658_245;
		const expectedSeconds = 15_099_494_700;
		const legacyHours = expectedSeconds / 3_600;
		const secondsBeforeRounding = legacyHours * 3_600;
		const roundingError = Math.abs(
			secondsBeforeRounding - Math.round(secondsBeforeRounding),
		);
		const scaleAwareTolerance =
			Math.max(1, Math.abs(secondsBeforeRounding)) * Number.EPSILON * 2;
		const sql = await readFile(migrationUrl, "utf8");

		expect(durationMinutes * 60).toBe(expectedSeconds);
		expect(roundingError).toBeGreaterThan(0.000001);
		expect(Math.round(secondsBeforeRounding)).toBe(expectedSeconds);
		expect(roundingError).toBeLessThanOrEqual(scaleAwareTolerance);
		expect(sql).toContain('SELECT "hoursDeducted" * 3600 AS "deductedSeconds"');
		expect(sql).toMatch(
			/ABS\(\s*deduction\."deductedSeconds" - ROUND\(deduction\."deductedSeconds"\)\s*\) > GREATEST\(1::DOUBLE PRECISION, ABS\(deduction\."deductedSeconds"\)\)\s*\* 4\.440892098500626e-16/s,
		);
		expect(sql).toContain(
			'ROUND(deduction."hoursDeducted" * 3600)::BIGINT\n                  <> schedule."durationMinutes"::BIGINT * 60',
		);
		expect(sql).toContain('USING ROUND("secondsDeducted" * 3600)::BIGINT');
	});
});
