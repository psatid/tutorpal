import { describe, expect, test } from "bun:test";
import {
	AwaitingConfirmationQuerySchema,
	CreateScheduleSchema,
	NoShowScheduleSchema,
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

	test("rejects fractional one-time schedule durations", () => {
		expect(
			CreateScheduleSchema.safeParse({
				classId: "class-1",
				date: "2026-07-01",
				type: "ON_SITE",
				time: 540,
				durationMinutes: 1.5,
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

	test("rejects status changes through the generic update contract", () => {
		expect(
			UpdateScheduleSchema.safeParse({ status: "COMPLETED" }).success,
		).toBe(false);
	});

	test("requires a no-show deduction choice and trims an optional note", () => {
		expect(NoShowScheduleSchema.safeParse({ note: "Absent" }).success).toBe(
			false,
		);
		expect(
			NoShowScheduleSchema.parse({
				deductHours: false,
				note: "  Student cancelled  ",
			}),
		).toEqual({ deductHours: false, note: "Student cancelled" });
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

	test("accepts repeated weekday items for recurring creation and updates", () => {
		const scheduleItems = [
			{ weekday: "MONDAY", time: 540, durationMinutes: 60 },
			{ weekday: "MONDAY", time: 660, durationMinutes: 60 },
		];

		expect(
			CreateScheduleSchema.safeParse({
				classId: "class-1",
				date: "2026-07-01",
				type: "ON_SITE",
				recurring: {
					startDate: "2026-07-06",
					scheduleItems,
				},
			}).success,
		).toBe(true);
		expect(
			UpdateRecurringScheduleSchema.safeParse({
				effectiveDate: "2026-07-06",
				scheduleItems,
			}).success,
		).toBe(true);
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

	test("defaults and bounds awaiting-confirmation pagination", () => {
		expect(AwaitingConfirmationQuerySchema.parse({})).toEqual({ limit: 10 });
		expect(
			AwaitingConfirmationQuerySchema.parse({
				limit: "50",
				cursor: "v1.Ab-_9.Cd-_9",
			}),
		).toEqual({ limit: 50, cursor: "v1.Ab-_9.Cd-_9" });

		for (const query of [
			{ limit: "0" },
			{ limit: "51" },
			{ limit: "1.5" },
			{ cursor: "" },
			{ cursor: "not+a+cursor" },
			{ cursor: "v1.Ab-_9" },
			{ cursor: "v1..Cd-_9" },
			{ cursor: "v1.Ab-_9.Cd-_9.extra" },
		]) {
			expect(AwaitingConfirmationQuerySchema.safeParse(query).success).toBe(
				false,
			);
		}
	});

	test("accepts an inclusive date range up to 31 calendar days", () => {
		expect(
			ScheduleListQuerySchema.safeParse({
				startDate: "2026-07-01",
				endDate: "2026-07-31",
			}).success,
		).toBe(true);
	});

	test("rejects incomplete, mixed, reversed, and oversized date ranges", () => {
		expect(
			ScheduleListQuerySchema.safeParse({ startDate: "2026-07-01" }).success,
		).toBe(false);
		expect(
			ScheduleListQuerySchema.safeParse({
				date: "2026-07-01",
				startDate: "2026-07-01",
				endDate: "2026-07-07",
			}).success,
		).toBe(false);
		expect(
			ScheduleListQuerySchema.safeParse({
				startDate: "2026-07-08",
				endDate: "2026-07-01",
			}).success,
		).toBe(false);
		expect(
			ScheduleListQuerySchema.safeParse({
				startDate: "2026-07-01",
				endDate: "2026-08-01",
			}).success,
		).toBe(false);
	});
});
