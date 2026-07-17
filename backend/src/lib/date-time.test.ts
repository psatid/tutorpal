import { describe, expect, test } from "bun:test";
import { DateTime } from "./date-time";

describe("DateTime", () => {
	test("normalizes Date inputs without exposing the original reference", () => {
		const source = new Date("2026-07-01T10:30:00.000Z");
		const dateTime = DateTime.from(source);

		source.setUTCFullYear(2030);

		expect(dateTime.toISOString()).toBe("2026-07-01T10:30:00.000Z");
		expect(dateTime.toDate()).not.toBe(source);
	});

	test("normalizes DateTime inputs", () => {
		const source = DateTime.from("2026-07-01T10:30:00.000Z");

		expect(DateTime.from(source).toISOString()).toBe(
			"2026-07-01T10:30:00.000Z",
		);
	});

	test("parses date-only strings as UTC midnight dates", () => {
		const dateTime = DateTime.from("2026-07-01");

		expect(dateTime.toISOString()).toBe("2026-07-01T00:00:00.000Z");
		expect(dateTime.toDate().toISOString()).toBe("2026-07-01T00:00:00.000Z");
	});

	test("parses API date-only strings through the explicit factory", () => {
		const dateTime = DateTime.fromDateOnlyString("2026-07-01");

		expect(dateTime.toISOString()).toBe("2026-07-01T00:00:00.000Z");
	});

	test("serializes date-only values as UTC YYYY-MM-DD", () => {
		const dateTime = DateTime.from("2026-07-01T23:30:00.000Z");

		expect(dateTime.toDateOnlyString()).toBe("2026-07-01");
	});

	test("serializes timestamps as ISO UTC strings", () => {
		const dateTime = DateTime.from("2026-06-28T10:30:00.000Z");

		expect(dateTime.toISOString()).toBe("2026-06-28T10:30:00.000Z");
	});

	test("adds days and hours without mutating the source DateTime", () => {
		const dateTime = DateTime.from("2026-07-01T00:00:00.000Z");

		expect(dateTime.addDays(2).toISOString()).toBe("2026-07-03T00:00:00.000Z");
		expect(dateTime.addHours(24).toISOString()).toBe(
			"2026-07-02T00:00:00.000Z",
		);
		expect(dateTime.toISOString()).toBe("2026-07-01T00:00:00.000Z");
	});

	test("compares dates and returns JavaScript weekday indexes", () => {
		const monday = DateTime.from("2026-06-29T00:00:00.000Z");
		const tuesday = DateTime.from("2026-06-30T00:00:00.000Z");

		expect(monday.isBefore(tuesday)).toBe(true);
		expect(monday.compareAsc(tuesday)).toBeLessThan(0);
		expect(monday.getWeekdayIndex()).toBe(1);
	});
});
