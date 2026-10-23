import { describe, expect, test } from "bun:test";
import {
	RecurringScheduleModel,
	RecurringScheduleUpdateResultModel,
	ScheduleModel,
	ScheduleTransitionViolation,
} from "./schedule.model";

const createdAt = new Date("2026-06-28T10:00:00.000Z");
const updatedAt = new Date("2026-06-28T10:30:00.000Z");

const prismaSchedule = {
	id: "schedule-1",
	classId: "class-1",
	recurringScheduleId: "recurring-1",
	date: new Date("2026-07-01T00:00:00.000Z"),
	time: 540,
	durationSeconds: 5_400n,
	notes: "Bring workbook",
	noShowNote: null,
	status: "SCHEDULED" as const,
	type: "ONLINE" as const,
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
	type: "ON_SITE" as const,
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
			durationSeconds: 5_400n,
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
		expect(schedule.type).toBe("ONLINE");
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
			noShowNote: null,
			status: "SCHEDULED",
			type: "ONLINE",
			createdAt: "2026-06-28T10:00:00.000Z",
			updatedAt: "2026-06-28T10:30:00.000Z",
			remainingHours: 7.5,
		});
		expect(JSON.stringify(schedule.toScheduleDTO())).toContain(
			'"durationMinutes":90',
		);
	});

	test("plans lifecycle transitions with exact persistence snapshots", () => {
		const scheduled = ScheduleModel.fromSchedulePrisma(prismaSchedule);

		expect(scheduled.durationSeconds).toBe(5_400n);
		expect(scheduled.planCompletion()).toEqual({
			expected: {
				id: "schedule-1",
				classId: "class-1",
				status: "SCHEDULED",
				durationSeconds: 5_400n,
			},
			patch: { status: "COMPLETED" },
			deduction: {
				kind: "upsert",
				classId: "class-1",
				seconds: 5_400n,
			},
		});
		expect(
			scheduled.planNoShow({ deductHours: true, note: "  Absent  " }),
		).toEqual({
			expected: {
				id: "schedule-1",
				classId: "class-1",
				status: "SCHEDULED",
				durationSeconds: 5_400n,
			},
			patch: { status: "NO_SHOW", noShowNote: "Absent" },
			deduction: {
				kind: "upsert",
				classId: "class-1",
				seconds: 5_400n,
			},
		});
		expect(scheduled.planNoShow({ deductHours: false, note: " \t " })).toEqual({
			expected: {
				id: "schedule-1",
				classId: "class-1",
				status: "SCHEDULED",
				durationSeconds: 5_400n,
			},
			patch: { status: "CANCELLED", noShowNote: null },
			deduction: { kind: "none" },
		});

		for (const status of ["COMPLETED", "NO_SHOW"] as const) {
			const restorable = ScheduleModel.fromSchedulePrisma({
				...prismaSchedule,
				status,
			});
			expect(restorable.planRestoration()).toEqual({
				expected: {
					id: "schedule-1",
					classId: "class-1",
					status,
					durationSeconds: 5_400n,
				},
				patch: { status: "CANCELLED" },
				deduction: { kind: "restore", classId: "class-1" },
			});
		}
	});

	test("centralizes capacity and restore eligibility", () => {
		for (const status of ["SCHEDULED", "COMPLETED", "NO_SHOW"] as const) {
			expect(ScheduleModel.isCapacityReservingStatus(status)).toBe(true);
		}
		for (const status of ["CANCELLED"] as const) {
			expect(ScheduleModel.isCapacityReservingStatus(status)).toBe(false);
		}
		expect(ScheduleModel.isRestorableStatus("COMPLETED")).toBe(true);
		expect(ScheduleModel.isRestorableStatus("NO_SHOW")).toBe(true);
		expect(ScheduleModel.isRestorableStatus("SCHEDULED")).toBe(false);
		expect(ScheduleModel.isRestorableStatus("CANCELLED")).toBe(false);
	});

	test("rejects lifecycle transitions outside the allowed matrix", () => {
		for (const status of ["COMPLETED", "NO_SHOW", "CANCELLED"] as const) {
			const schedule = ScheduleModel.fromSchedulePrisma({
				...prismaSchedule,
				status,
			});
			expect(() => schedule.planCompletion()).toThrow(
				ScheduleTransitionViolation,
			);
			expect(() => schedule.planNoShow({ deductHours: true })).toThrow(
				ScheduleTransitionViolation,
			);
		}

		for (const status of ["SCHEDULED", "CANCELLED"] as const) {
			const schedule = ScheduleModel.fromSchedulePrisma({
				...prismaSchedule,
				status,
			});
			expect(() => schedule.planRestoration()).toThrow(
				ScheduleTransitionViolation,
			);
		}
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
			type: "ON_SITE",
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
