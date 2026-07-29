import { describe, expect, test } from "bun:test";
import {
	CreateScheduleSchema,
	ScheduleListQuerySchema,
	UpdateScheduleSchema,
} from "./schedule.schema";

describe("schedule request contracts", () => {
	test("requires date and time for one-time schedules", () => {
		expect(
			CreateScheduleSchema.safeParse({
				classId: "class-1",
				date: "2026-07-01",
				durationMinutes: 60,
			}).success,
		).toBe(false);
		expect(
			CreateScheduleSchema.safeParse({
				classId: "class-1",
				date: "2026-07-01",
				time: 540,
				durationMinutes: 60,
			}).success,
		).toBe(true);
	});

	test("accepts independent date and time updates", () => {
		expect(
			UpdateScheduleSchema.safeParse({
				date: "2026-07-01",
			}).success,
		).toBe(true);
		expect(UpdateScheduleSchema.safeParse({ time: 540 }).success).toBe(true);
	});

	test("rejects dates outside the API date-only contract", () => {
		expect(
			CreateScheduleSchema.safeParse({
				classId: "class-1",
				date: "2026-07-01T02:00:30.000Z",
				time: 540,
				durationMinutes: 60,
			}).success,
		).toBe(false);
	});

	test("accepts a date filter", () => {
		expect(
			ScheduleListQuerySchema.safeParse({
				date: "2026-07-01",
			}).success,
		).toBe(true);
		expect(
			ScheduleListQuerySchema.safeParse({
				date: "invalid",
			}).success,
		).toBe(false);
	});
});
