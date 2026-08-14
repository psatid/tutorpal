import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

const migrationUrl = new URL(
	"../../prisma/migrations/20260813000000_add_course_revenue_tracking/migration.sql",
	import.meta.url,
);

describe("course revenue tracking migration", () => {
	test("backfills only the required course pricing mode without a database default", async () => {
		const sql = await readFile(migrationUrl, "utf8");

		expect(sql).toContain(
			"CREATE TYPE \"course_pricing_mode\" AS ENUM ('HOURLY_RATE', 'FIXED_PRICE')",
		);
		expect(sql).toContain('ADD COLUMN "pricingMode" "course_pricing_mode"');
		expect(sql).toContain('ADD COLUMN "priceAmount" DECIMAL(12,2)');
		expect(sql).toContain("SET \"pricingMode\" = 'HOURLY_RATE'");
		expect(sql).toContain('ALTER COLUMN "pricingMode" SET NOT NULL');
		expect(sql).toContain(
			'CONSTRAINT "courses_price_amount_nonnegative_check"',
		);
		expect(sql).toContain('CHECK ("priceAmount" >= 0)');
		expect(sql).not.toMatch(/"pricingMode"[^;]*DEFAULT/i);
		expect(sql).not.toContain('ALTER COLUMN "priceAmount" SET NOT NULL');
	});

	test("adds nullable revenue, its non-negative constraint, and the course lookup index without legacy backfill", async () => {
		const sql = await readFile(migrationUrl, "utf8");

		expect(sql).toContain('ADD COLUMN "revenueAmount" DECIMAL(12,2)');
		expect(sql).toContain(
			'CONSTRAINT "class_hour_additions_revenue_amount_nonnegative_check"',
		);
		expect(sql).toContain('CHECK ("revenueAmount" >= 0)');
		expect(sql).toContain(
			'CREATE INDEX "class_hour_additions_sourceCourseId_idx"',
		);
		expect(sql).not.toMatch(/UPDATE "class_hour_additions"/i);
	});
});
