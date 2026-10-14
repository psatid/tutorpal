import { describe, expect, test } from "bun:test";
import { DateTime } from "../lib/date-time";
import type {
	RecurringScheduleCreatePlan,
	RecurringScheduleSeriesSnapshot,
} from "../models/recurring-schedule-planner.model";
import {
	type RecurringScheduleUpdateResultModel,
	ScheduleModel,
} from "../models/schedule.model";
import {
	type IClassRepository,
	type IScheduleRepository,
	type RecurringScheduleTransaction,
	ScheduleLifecyclePersistenceError,
	type ScheduleLifecycleTransaction,
} from "../types";
import { ScheduleService } from "./schedule.service";

const createdAt = new Date("2026-08-01T00:00:00.000Z");

function schedule(
	status: "SCHEDULED" | "COMPLETED" | "NO_SHOW" | "CANCELLED" = "SCHEDULED",
) {
	return ScheduleModel.fromSchedulePrisma({
		id: "schedule-1",
		classId: "class-1",
		date: new Date("2026-08-10T00:00:00.000Z"),
		time: 540,
		durationSeconds: 1_800n,
		notes: null,
		noShowNote: null,
		status,
		type: "ON_SITE",
		createdAt,
		updatedAt: createdAt,
		class: { name: "Algebra" },
	});
}

function existingSeries(
	overrides: Partial<RecurringScheduleSeriesSnapshot> = {},
): RecurringScheduleSeriesSnapshot {
	return {
		id: "recurring-old",
		classId: "class-1",
		startDate: "2026-08-10",
		notes: "Existing note",
		type: "ON_SITE",
		scheduleItems: [{ weekday: "MONDAY", time: 540, durationSeconds: 3_600n }],
		...overrides,
	};
}

function recurringTransaction(
	overrides: Partial<RecurringScheduleTransaction> = {},
): RecurringScheduleTransaction {
	return {
		loadCreateContext: async () => ({
			classId: "class-1",
			remainingSeconds: 3_600n,
		}),
		loadUpdateContext: async () => ({
			existingSeries: existingSeries(),
			remainingSeconds: 3_600n,
			replaceableSchedules: [],
		}),
		loadExistingSchedules: async () => [],
		applyCreate: async () => schedule(),
		applyUpdate: async () => ({}) as RecurringScheduleUpdateResultModel,
		...overrides,
	};
}

function recurringRepository(transaction: RecurringScheduleTransaction) {
	let transactionCalls = 0;
	const repository = {
		withRecurringScheduleTransaction: async <T>(
			work: (transaction: RecurringScheduleTransaction) => Promise<T>,
		): Promise<T> => {
			transactionCalls += 1;
			return work(transaction);
		},
	} as unknown as IScheduleRepository;

	return { repository, getTransactionCalls: () => transactionCalls };
}

function unexpectedClassRepository(): IClassRepository {
	return {
		findById: async () => {
			throw new Error("Recurring scheduling must use the transaction context");
		},
	} as unknown as IClassRepository;
}

function lifecycleRepository(transaction: ScheduleLifecycleTransaction) {
	return {
		withLifecycleTransaction: <T>(
			work: (transaction: ScheduleLifecycleTransaction) => Promise<T>,
		) => work(transaction),
	} as unknown as IScheduleRepository;
}

describe("ScheduleService ownership", () => {
	test("does not expose a schedule owned by another tutor", async () => {
		const repository = {
			findById: async () => null,
		} as unknown as IScheduleRepository;

		await expect(
			new ScheduleService(repository).getScheduleById("schedule-1", "tutor-2"),
		).rejects.toMatchObject({
			errorCode: "SCHEDULE_NOT_FOUND",
			message: "Schedule not found",
			status: 404,
		});
	});

	test("does not delete a schedule owned by another tutor", async () => {
		let deleted = false;
		const repository = {
			findById: async () => null,
			delete: async () => {
				deleted = true;
			},
		} as unknown as IScheduleRepository;

		await expect(
			new ScheduleService(repository).deleteSchedule("schedule-1", "tutor-2"),
		).rejects.toMatchObject({
			errorCode: "SCHEDULE_NOT_FOUND",
			message: "Schedule not found",
			status: 404,
		});
		expect(deleted).toBe(false);
	});

	test("continues to block a one-time schedule when the class has no remaining hours", async () => {
		let createCalls = 0;
		const repository = {
			getRemainingSeconds: async () => 0n,
			create: async () => {
				createCalls += 1;
				return schedule();
			},
		} as unknown as IScheduleRepository;
		const classRepository = {
			findById: async () => ({}),
		} as unknown as IClassRepository;

		await expect(
			new ScheduleService(repository, classRepository).createSchedule(
				{
					classId: "class-1",
					date: "2026-08-10",
					type: "ON_SITE",
					time: 600,
					durationMinutes: 60,
				},
				"tutor-1",
			),
		).rejects.toMatchObject({
			errorCode: "INSUFFICIENT_HOURS",
			status: 400,
		});
		expect(createCalls).toBe(0);
	});
});

describe("ScheduleService recurring scheduling", () => {
	test("coordinates recurring creation through the tutor-scoped transaction port", async () => {
		let createContextArgs: [string, string] | undefined;
		let conflictArgs: [string, readonly string[]] | undefined;
		let appliedPlan: RecurringScheduleCreatePlan | undefined;
		const result = schedule();
		const fixture = recurringRepository(
			recurringTransaction({
				loadCreateContext: async (classId, tutorId) => {
					createContextArgs = [classId, tutorId];
					return { classId, remainingSeconds: 3_600n };
				},
				loadExistingSchedules: async (classId, dates) => {
					conflictArgs = [classId, dates];
					return [];
				},
				applyCreate: async (plan) => {
					appliedPlan = plan;
					return result;
				},
			}),
		);

		await expect(
			new ScheduleService(
				fixture.repository,
				unexpectedClassRepository(),
			).createSchedule(
				{
					classId: "class-1",
					date: "2026-08-10",
					type: "ONLINE",
					recurring: {
						startDate: "2026-08-10",
						scheduleItems: [
							{ weekday: "MONDAY", time: 540, durationMinutes: 60 },
						],
					},
				},
				"tutor-1",
			),
		).resolves.toBe(result);

		expect(fixture.getTransactionCalls()).toBe(1);
		expect(createContextArgs).toEqual(["class-1", "tutor-1"]);
		expect(conflictArgs).toEqual(["class-1", ["2026-08-10"]]);
		expect(appliedPlan).toMatchObject({
			series: { classId: "class-1", notes: null, type: "ONLINE" },
			generatedSchedules: [
				{ date: "2026-08-10", time: 540, durationSeconds: 3_600n },
			],
		});
	});

	test("maps missing class ownership to 400 without applying", async () => {
		let applyCalls = 0;
		const fixture = recurringRepository(
			recurringTransaction({
				loadCreateContext: async () => null,
				applyCreate: async () => {
					applyCalls += 1;
					return schedule();
				},
			}),
		);

		await expect(
			new ScheduleService(fixture.repository).createSchedule(
				{
					classId: "foreign-class",
					date: "2026-08-10",
					type: "ON_SITE",
					recurring: {
						startDate: "2026-08-10",
						scheduleItems: [
							{ weekday: "MONDAY", time: 540, durationMinutes: 60 },
						],
					},
				},
				"tutor-2",
			),
		).rejects.toMatchObject({
			errorCode: "CLASS_NOT_FOUND",
			message: "The specified class does not exist",
			status: 400,
		});
		expect(applyCalls).toBe(0);
	});

	test("keeps create insufficient-hours and conflict failures out of transaction application", async () => {
		let conflictReads = 0;
		let insufficientApplyCalls = 0;
		const insufficient = recurringRepository(
			recurringTransaction({
				loadCreateContext: async () => ({
					classId: "class-1",
					remainingSeconds: 0n,
				}),
				loadExistingSchedules: async () => {
					conflictReads += 1;
					return [];
				},
				applyCreate: async () => {
					insufficientApplyCalls += 1;
					return schedule();
				},
			}),
		);
		const createData = {
			classId: "class-1",
			date: "2026-08-10",
			type: "ON_SITE" as const,
			recurring: {
				startDate: "2026-08-10",
				scheduleItems: [
					{ weekday: "MONDAY" as const, time: 540, durationMinutes: 60 },
				],
			},
		};

		await expect(
			new ScheduleService(insufficient.repository).createSchedule(
				createData,
				"tutor-1",
			),
		).rejects.toMatchObject({
			errorCode: "INSUFFICIENT_HOURS",
			message:
				"The class does not have enough remaining hours to create any schedule",
			status: 400,
		});
		expect(conflictReads).toBe(0);
		expect(insufficientApplyCalls).toBe(0);

		let conflictApplyCalls = 0;
		const conflict = recurringRepository(
			recurringTransaction({
				loadExistingSchedules: async () => [
					{
						id: "conflict",
						date: "2026-08-10",
						time: 540,
						durationSeconds: 3_600n,
						status: "SCHEDULED",
					},
				],
				applyCreate: async () => {
					conflictApplyCalls += 1;
					return schedule();
				},
			}),
		);
		await expect(
			new ScheduleService(conflict.repository).createSchedule(
				createData,
				"tutor-1",
			),
		).rejects.toMatchObject({
			errorCode: "RECURRING_CONFLICT",
			message:
				"Recurring schedule conflicts with existing schedules on 2026-08-10",
			status: 400,
		});
		expect(conflictApplyCalls).toBe(0);
	});

	test("maps missing series, past dates, and update insufficient-hours without applying", async () => {
		let missingApplyCalls = 0;
		const missing = recurringRepository(
			recurringTransaction({
				loadUpdateContext: async () => null,
				applyUpdate: async () => {
					missingApplyCalls += 1;
					return {} as RecurringScheduleUpdateResultModel;
				},
			}),
		);
		const today = DateTime.todayDateOnlyString();
		const updateData = {
			effectiveDate: today,
			scheduleItems: [
				{ weekday: "MONDAY" as const, time: 540, durationMinutes: 60 },
			],
		};
		await expect(
			new ScheduleService(missing.repository).updateRecurringSchedule(
				"foreign-series",
				updateData,
				"tutor-2",
			),
		).rejects.toMatchObject({
			errorCode: "RECURRING_SCHEDULE_NOT_FOUND",
			message: "Recurring schedule not found",
			status: 404,
		});
		expect(missingApplyCalls).toBe(0);

		let pastConflictReads = 0;
		let pastApplyCalls = 0;
		const past = recurringRepository(
			recurringTransaction({
				loadExistingSchedules: async () => {
					pastConflictReads += 1;
					return [];
				},
				applyUpdate: async () => {
					pastApplyCalls += 1;
					return {} as RecurringScheduleUpdateResultModel;
				},
			}),
		);
		const yesterday = DateTime.fromDateOnlyString(today)
			.addDays(-1)
			.toDateOnlyString();
		await expect(
			new ScheduleService(past.repository).updateRecurringSchedule(
				"recurring-old",
				{ ...updateData, effectiveDate: yesterday },
				"tutor-1",
			),
		).rejects.toMatchObject({
			errorCode: "INVALID_EFFECTIVE_DATE",
			message: "Effective date must be today or later",
			status: 400,
		});
		expect(pastConflictReads).toBe(0);
		expect(pastApplyCalls).toBe(0);

		let insufficientApplyCalls = 0;
		const insufficient = recurringRepository(
			recurringTransaction({
				loadUpdateContext: async () => ({
					existingSeries: existingSeries(),
					remainingSeconds: 0n,
					replaceableSchedules: [],
				}),
				applyUpdate: async () => {
					insufficientApplyCalls += 1;
					return {} as RecurringScheduleUpdateResultModel;
				},
			}),
		);
		await expect(
			new ScheduleService(insufficient.repository).updateRecurringSchedule(
				"recurring-old",
				updateData,
				"tutor-1",
			),
		).rejects.toMatchObject({
			errorCode: "INSUFFICIENT_HOURS",
			message:
				"The class does not have enough remaining hours to recreate any recurring schedule",
			status: 400,
		});
		expect(insufficientApplyCalls).toBe(0);
	});

	test("maps update conflicts and leaves impossible post-write refresh failures unmodified", async () => {
		let conflictDate: string | undefined;
		const conflict = recurringRepository(
			recurringTransaction({
				loadExistingSchedules: async (_classId, dates) => {
					conflictDate = dates[0];
					return [
						{
							id: "conflict",
							date: dates[0] ?? "",
							time: 540,
							durationSeconds: 3_600n,
							status: "NO_SHOW",
						},
					];
				},
			}),
		);
		const updateData = {
			effectiveDate: DateTime.todayDateOnlyString(),
			scheduleItems: [
				{ weekday: "MONDAY" as const, time: 540, durationMinutes: 60 },
			],
		};
		let conflictError: unknown;
		try {
			await new ScheduleService(conflict.repository).updateRecurringSchedule(
				"recurring-old",
				updateData,
				"tutor-1",
			);
		} catch (error) {
			conflictError = error;
		}
		expect(conflictDate).toBeDefined();
		expect(conflictError).toMatchObject({
			errorCode: "RECURRING_CONFLICT",
			message: `Recurring schedule conflicts with existing schedules on ${conflictDate}`,
			status: 400,
		});

		const refreshFailure = new Error("No schedules were created");
		const failure = recurringRepository(
			recurringTransaction({
				applyCreate: async () => {
					throw refreshFailure;
				},
			}),
		);
		await expect(
			new ScheduleService(failure.repository).createSchedule(
				{
					classId: "class-1",
					date: "2026-08-10",
					type: "ON_SITE",
					recurring: {
						startDate: "2026-08-10",
						scheduleItems: [
							{ weekday: "MONDAY", time: 540, durationMinutes: 60 },
						],
					},
				},
				"tutor-1",
			),
		).rejects.toBe(refreshFailure);
	});
});

describe("ScheduleService lifecycle transitions", () => {
	test("loads the owner-scoped schedule and applies the model plan in one transaction", async () => {
		const current = schedule();
		const result = schedule("NO_SHOW");
		let loadArgs: [string, string] | undefined;
		let applyArgs: unknown;
		const repository = lifecycleRepository({
			loadOwned: async (id, tutorId) => {
				loadArgs = [id, tutorId];
				return current;
			},
			apply: async (tutorId, plan) => {
				applyArgs = [tutorId, plan];
				return result;
			},
		});

		await expect(
			new ScheduleService(repository).markNoShow(
				"schedule-1",
				{ deductHours: true, note: "  Absent  " },
				"tutor-1",
			),
		).resolves.toBe(result);
		expect(loadArgs).toEqual(["schedule-1", "tutor-1"]);
		expect(applyArgs).toEqual([
			"tutor-1",
			{
				expected: {
					id: "schedule-1",
					classId: "class-1",
					status: "SCHEDULED",
					durationSeconds: 1_800n,
				},
				patch: { status: "NO_SHOW", noShowNote: "Absent" },
				deduction: { kind: "upsert", classId: "class-1", seconds: 1_800n },
			},
		]);
	});

	test("maps missing and stale lifecycle transactions to established AppErrors", async () => {
		let applyCalls = 0;
		const missing = lifecycleRepository({
			loadOwned: async () => null,
			apply: async () => {
				applyCalls += 1;
				return schedule();
			},
		});
		await expect(
			new ScheduleService(missing).completeSchedule("schedule-1", "tutor-2"),
		).rejects.toMatchObject({
			errorCode: "SCHEDULE_NOT_FOUND",
			message: "Schedule not found",
			status: 404,
		});
		expect(applyCalls).toBe(0);

		const stale = lifecycleRepository({
			loadOwned: async () => schedule(),
			apply: async () => {
				throw new ScheduleLifecyclePersistenceError(
					"stale",
					"The schedule status changed before this action",
				);
			},
		});
		await expect(
			new ScheduleService(stale).completeSchedule("schedule-1", "tutor-1"),
		).rejects.toMatchObject({
			errorCode: "SCHEDULE_STATUS_CONFLICT",
			message: "The schedule status changed before this action",
			status: 409,
		});
	});

	test("maps invalid transitions and lifecycle persistence failures to established AppErrors", async () => {
		const invalidStatusRepository = lifecycleRepository({
			loadOwned: async () => schedule("COMPLETED"),
			apply: async () => schedule("COMPLETED"),
		});

		await expect(
			new ScheduleService(invalidStatusRepository).completeSchedule(
				"schedule-1",
				"tutor-1",
			),
		).rejects.toMatchObject({
			errorCode: "SCHEDULE_STATUS_CONFLICT",
			message: "Only scheduled schedules can be completed",
			status: 409,
		});

		for (const [error, expected] of [
			[
				new ScheduleLifecyclePersistenceError(
					"not_found",
					"Schedule not found",
				),
				{
					errorCode: "SCHEDULE_NOT_FOUND",
					message: "Schedule not found",
					status: 404,
				},
			],
			[
				new ScheduleLifecyclePersistenceError(
					"stale",
					"The schedule status changed before this action",
				),
				{
					errorCode: "SCHEDULE_STATUS_CONFLICT",
					message: "The schedule status changed before this action",
					status: 409,
				},
			],
			[
				new ScheduleLifecyclePersistenceError(
					"active_deduction_missing",
					"The schedule no longer has an active hour deduction",
				),
				{
					errorCode: "SCHEDULE_STATUS_CONFLICT",
					message: "The schedule no longer has an active hour deduction",
					status: 409,
				},
			],
		] as const) {
			const repository = lifecycleRepository({
				loadOwned: async () => schedule(),
				apply: async () => {
					throw error;
				},
			});

			await expect(
				new ScheduleService(repository).completeSchedule(
					"schedule-1",
					"tutor-1",
				),
			).rejects.toMatchObject(expected);
		}
	});

	test("propagates unexpected lifecycle transaction failures unchanged", async () => {
		const unexpected = new Error("database connection ended");
		const repository = lifecycleRepository({
			loadOwned: async () => schedule(),
			apply: async () => {
				throw unexpected;
			},
		});

		await expect(
			new ScheduleService(repository).completeSchedule("schedule-1", "tutor-1"),
		).rejects.toBe(unexpected);
	});
});
