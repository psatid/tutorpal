import { describe, expect, test } from "bun:test";
import {
	CreateScheduleSchema,
	ScheduleListQuerySchema,
	UpdateRecurringScheduleSchema,
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
				type: "ON_SITE",
				time: 540,
				durationMinutes: 60,
			}).success,
		).toBe(true);
	});

	test("requires and validates schedule type on creation", () => {
		const validSchedule = {
			classId: "class-1",
			date: "2026-07-01",
			type: "ONLINE",
			time: 540,
			durationMinutes: 60,
		};

		expect(CreateScheduleSchema.safeParse(validSchedule).success).toBe(true);
		expect(
			CreateScheduleSchema.safeParse({
				...validSchedule,
				type: undefined,
			}).success,
		).toBe(false);
		expect(
			CreateScheduleSchema.safeParse({
				...validSchedule,
				type: "HYBRID",
			}).success,
		).toBe(false);
	});

	test("accepts independent date and time updates", () => {
		expect(
			UpdateScheduleSchema.safeParse({
				date: "2026-07-01",
			}).success,
		).toBe(true);
		expect(UpdateScheduleSchema.safeParse({ time: 540 }).success).toBe(true);
		expect(UpdateScheduleSchema.safeParse({ type: "ONLINE" }).success).toBe(
			true,
		);
		expect(UpdateScheduleSchema.safeParse({ type: "HYBRID" }).success).toBe(
			false,
		);
	});

	test("accepts optional recurring type updates", () => {
		const recurringUpdate = {
			effectiveDate: "2026-07-01",
			scheduleItems: [{ weekday: "MONDAY", time: 540, durationMinutes: 60 }],
		};

		expect(
			UpdateRecurringScheduleSchema.safeParse(recurringUpdate).success,
		).toBe(true);
		expect(
			UpdateRecurringScheduleSchema.safeParse({
				...recurringUpdate,
				type: "ON_SITE",
			}).success,
		).toBe(true);
		expect(
			UpdateRecurringScheduleSchema.safeParse({
				...recurringUpdate,
				type: "HYBRID",
			}).success,
		).toBe(false);
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
