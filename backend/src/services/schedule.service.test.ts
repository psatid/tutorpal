import { describe, expect, test } from "bun:test";
import { ScheduleModel } from "../models/schedule.model";
import { classRepository } from "../repositories";
import {
	type IScheduleRepository,
	type RecurringScheduleCreationData,
	ScheduleLifecyclePersistenceError,
	type ScheduleLifecycleTransaction,
} from "../types";
import { ScheduleService } from "./schedule.service";

const lifecycleCreatedAt = new Date("2026-08-01T00:00:00.000Z");

function makeLifecycleSchedule(
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
		createdAt: lifecycleCreatedAt,
		updatedAt: lifecycleCreatedAt,
		class: { name: "Algebra" },
	});
}

function makeLifecycleRepository(transaction: ScheduleLifecycleTransaction) {
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
		).rejects.toMatchObject({ errorCode: "SCHEDULE_NOT_FOUND", status: 404 });
		expect(deleted).toBe(false);
	});

	test("passes the selected type when creating a recurring schedule", async () => {
		const originalFindById = classRepository.findById;
		let receivedData:
			| Parameters<IScheduleRepository["createRecurringSchedule"]>[0]
			| undefined;

		classRepository.findById = async () => ({}) as never;

		try {
			const repository = {
				createRecurringSchedule: async (
					data: RecurringScheduleCreationData,
				) => {
					receivedData = data;
					return {} as ScheduleModel;
				},
			} as unknown as IScheduleRepository;

			await new ScheduleService(repository).createSchedule(
				{
					classId: "class-1",
					date: "2026-08-10",
					type: "ONLINE",
					recurring: {
						startDate: "2026-08-10",
						scheduleItems: [
							{
								weekday: "MONDAY",
								time: 600,
								durationMinutes: 60,
							},
						],
					},
				},
				"tutor-1",
			);

			expect(receivedData?.type).toBe("ONLINE");
		} finally {
			classRepository.findById = originalFindById;
		}
	});

	test("continues to block scheduling until a standalone class has added hours", async () => {
		const originalFindById = classRepository.findById;
		let createCalls = 0;
		classRepository.findById = async () => ({}) as never;

		try {
			const repository = {
				getRemainingSeconds: async () => 0n,
				create: async () => {
					createCalls += 1;
					return {} as ScheduleModel;
				},
			} as unknown as IScheduleRepository;

			await expect(
				new ScheduleService(repository).createSchedule(
					{
						classId: "class-1",
						date: "2026-08-10",
						type: "ON_SITE",
						time: 600,
						durationMinutes: 60,
					},
					"tutor-1",
				),
			).rejects.toMatchObject({ errorCode: "INSUFFICIENT_HOURS", status: 400 });
			expect(createCalls).toBe(0);
		} finally {
			classRepository.findById = originalFindById;
		}
	});
});

describe("ScheduleService lifecycle transitions", () => {
	test("loads the owner-scoped schedule and applies the model plan in one transaction", async () => {
		const schedule = makeLifecycleSchedule();
		const result = makeLifecycleSchedule("NO_SHOW");
		let loadArgs: [string, string] | undefined;
		let applyArgs:
			| [string, ReturnType<ScheduleModel["planNoShow"]>]
			| undefined;
		const repository = makeLifecycleRepository({
			loadOwned: async (id, tutorId) => {
				loadArgs = [id, tutorId];
				return schedule;
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
				deduction: {
					kind: "upsert",
					classId: "class-1",
					seconds: 1_800n,
				},
			},
		]);
	});

	test("maps a missing owner-scoped schedule to not found without applying a plan", async () => {
		let applyCalls = 0;
		const repository = makeLifecycleRepository({
			loadOwned: async () => null,
			apply: async () => {
				applyCalls += 1;
				return makeLifecycleSchedule();
			},
		});

		await expect(
			new ScheduleService(repository).completeSchedule("schedule-1", "tutor-2"),
		).rejects.toMatchObject({
			errorCode: "SCHEDULE_NOT_FOUND",
			message: "Schedule not found",
			status: 404,
		});
		expect(applyCalls).toBe(0);
	});

	test("maps transition and persistence failures to the established AppErrors", async () => {
		const invalidStatusRepository = makeLifecycleRepository({
			loadOwned: async () => makeLifecycleSchedule("COMPLETED"),
			apply: async () => makeLifecycleSchedule("COMPLETED"),
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
			const repository = makeLifecycleRepository({
				loadOwned: async () => makeLifecycleSchedule(),
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

	test("propagates unexpected transaction failures unchanged", async () => {
		const unexpected = new Error("database connection ended");
		const repository = makeLifecycleRepository({
			loadOwned: async () => makeLifecycleSchedule(),
			apply: async () => {
				throw unexpected;
			},
		});

		await expect(
			new ScheduleService(repository).completeSchedule("schedule-1", "tutor-1"),
		).rejects.toBe(unexpected);
	});
});
