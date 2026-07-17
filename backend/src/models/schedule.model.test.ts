import { describe, expect, test } from "bun:test";
import {
	RecurringScheduleModel,
	RecurringScheduleUpdateResultModel,
	ScheduleModel,
} from "./schedule.model";

const createdAt = new Date("2026-06-28T10:00:00.000Z");
const updatedAt = new Date("2026-06-28T10:30:00.000Z");

const prismaSchedule = {
	id: "schedule-1",
	classId: "class-1",
	recurringScheduleId: "recurring-1",
	date: new Date("2026-07-01T00:00:00.000Z"),
	time: 540,
	durationMinutes: 90,
	notes: "Bring workbook",
	status: "SCHEDULED" as const,
	createdAt,
	updatedAt,
	class: {
		name: "Algebra",
	},
};

const prismaRecurringSchedule = {
	id: "recurring-1",
	classId: "class-1",
	startDate: new Date("2026-07-01T00:00:00.000Z"),
	notes: "Weekly practice",
	createdAt,
	updatedAt,
	class: {
		name: "Algebra",
	},
	scheduleItems: [
		{
			id: "item-1",
			weekday: "MONDAY" as const,
			time: 540,
			durationMinutes: 90,
		},
	],
};

describe("ScheduleModel", () => {
	test("converts a Prisma schedule record into a model", () => {
		const schedule = ScheduleModel.fromSchedulePrisma(prismaSchedule, 7.5);

		expect(schedule.id).toBe("schedule-1");
		expect(schedule.classId).toBe("class-1");
		expect(schedule.className).toBe("Algebra");
		expect(schedule.recurringScheduleId).toBe("recurring-1");
		expect(schedule.remainingHours).toBe(7.5);
	});

	test("serializes the existing schedule DTO shape", () => {
		const schedule = ScheduleModel.fromSchedulePrisma(prismaSchedule, 7.5);

		expect(schedule.toScheduleDTO()).toEqual({
			id: "schedule-1",
			classId: "class-1",
			className: "Algebra",
			recurringScheduleId: "recurring-1",
			date: "2026-07-01",
			time: 540,
			durationMinutes: 90,
			notes: "Bring workbook",
			status: "SCHEDULED",
			createdAt: "2026-06-28T10:00:00.000Z",
			updatedAt: "2026-06-28T10:30:00.000Z",
			remainingHours: 7.5,
		});
	});
});

describe("RecurringScheduleModel", () => {
	test("serializes recurring schedule items", () => {
		const recurringSchedule =
			RecurringScheduleModel.fromRecurringSchedulePrisma(
				prismaRecurringSchedule,
			);

		expect(recurringSchedule.toRecurringScheduleDTO()).toEqual({
			id: "recurring-1",
			classId: "class-1",
			className: "Algebra",
			startDate: "2026-07-01",
			notes: "Weekly practice",
			createdAt: "2026-06-28T10:00:00.000Z",
			updatedAt: "2026-06-28T10:30:00.000Z",
			scheduleItems: [
				{
					id: "item-1",
					weekday: "MONDAY",
					time: 540,
					durationMinutes: 90,
				},
			],
		});
	});
});

describe("RecurringScheduleUpdateResultModel", () => {
	test("serializes recurring update result counts and recurring schedule", () => {
		const recurringSchedule =
			RecurringScheduleModel.fromRecurringSchedulePrisma(
				prismaRecurringSchedule,
			);
		const result = new RecurringScheduleUpdateResultModel({
			recurringSchedule,
			effectiveDate: "2026-07-01",
			deletedSchedulesCount: 2,
			createdSchedulesCount: 3,
		});

		expect(result.toRecurringScheduleUpdateResultDTO()).toEqual({
			recurringSchedule: recurringSchedule.toRecurringScheduleDTO(),
			effectiveDate: "2026-07-01",
			deletedSchedulesCount: 2,
			createdSchedulesCount: 3,
		});
	});
});
