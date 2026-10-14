import { describe, expect, test } from "bun:test";
import type { PrismaClient } from "@prisma/client";
import type {
	RecurringScheduleCreatePlan,
	RecurringScheduleUpdatePlan,
} from "../models/recurring-schedule-planner.model";
import type {
	ScheduleModel,
	ScheduleTransitionPlan,
} from "../models/schedule.model";
import { ScheduleLifecyclePersistenceError } from "../types";
import { ScheduleRepository } from "./schedule.repository";

const createdAt = new Date("2026-08-01T00:00:00.000Z");
const updatedAt = new Date("2026-08-01T00:30:00.000Z");
const classContext = { name: "Algebra" };

type ScheduleStatus = "SCHEDULED" | "COMPLETED" | "NO_SHOW" | "CANCELLED";
type ScheduleType = "ON_SITE" | "ONLINE";

type ScheduleRow = {
	id: string;
	classId: string;
	recurringScheduleId: string | null;
	date: Date;
	time: number;
	durationSeconds: bigint;
	notes: string | null;
	noShowNote: null;
	status: ScheduleStatus;
	type: ScheduleType;
	createdAt: Date;
	updatedAt: Date;
	class: typeof classContext;
};

type RecurringItemRow = {
	id: string;
	recurringScheduleId: string;
	weekday: "MONDAY" | "TUESDAY";
	time: number;
	durationSeconds: bigint;
};

type RecurringRow = {
	id: string;
	classId: string;
	startDate: Date;
	notes: string | null;
	type: ScheduleType;
	createdAt: Date;
	updatedAt: Date;
	class: typeof classContext;
	scheduleItems: RecurringItemRow[];
};

type State = {
	recurring: RecurringRow[];
	schedules: ScheduleRow[];
};

type ScheduleFindManyArgs = {
	where?: {
		classId?: string;
		date?: { gte?: Date; in?: Date[] };
		status?: unknown;
	};
	select?: { recurringScheduleId?: boolean; status?: boolean };
	include?: unknown;
	orderBy?: unknown;
};

function cloneState(state: State): State {
	return {
		recurring: state.recurring.map((series) => ({
			...series,
			scheduleItems: series.scheduleItems.map((item) => ({ ...item })),
		})),
		schedules: state.schedules.map((schedule) => ({ ...schedule })),
	};
}

function scheduleRow(overrides: Partial<ScheduleRow> = {}): ScheduleRow {
	return {
		id: "schedule-1",
		classId: "class-1",
		recurringScheduleId: "recurring-old",
		date: new Date("2026-08-10T00:00:00.000Z"),
		time: 540,
		durationSeconds: 3_600n,
		notes: "Existing note",
		noShowNote: null,
		status: "SCHEDULED",
		type: "ON_SITE",
		createdAt,
		updatedAt: createdAt,
		class: classContext,
		...overrides,
	};
}

function createPlan(): RecurringScheduleCreatePlan {
	return {
		series: {
			classId: "class-1",
			startDate: "2026-08-10",
			notes: null,
			type: "ONLINE",
			scheduleItems: [
				{ weekday: "MONDAY", time: 600, durationSeconds: 3_600n },
			],
		},
		generatedSchedules: [
			{
				classId: "class-1",
				date: "2026-08-10",
				time: 600,
				durationSeconds: 3_600n,
				type: "ONLINE",
			},
		],
	};
}

function updatePlan(): RecurringScheduleUpdatePlan {
	return {
		...createPlan(),
		effectiveDate: "2026-08-10",
		replacementScheduleIds: ["replace-scheduled", "replace-cancelled"],
	};
}

function makeRecurringRepositoryFixture({
	failItemWrite = false,
}: {
	failItemWrite?: boolean;
} = {}) {
	let committed: State = {
		recurring: [
			{
				id: "recurring-old",
				classId: "class-1",
				startDate: new Date("2026-08-10T00:00:00.000Z"),
				notes: "Existing note",
				type: "ON_SITE",
				createdAt,
				updatedAt: createdAt,
				class: classContext,
				scheduleItems: [
					{
						id: "old-item",
						recurringScheduleId: "recurring-old",
						weekday: "MONDAY",
						time: 540,
						durationSeconds: 3_600n,
					},
				],
			},
		],
		schedules: [
			scheduleRow({ id: "replace-scheduled" }),
			scheduleRow({ id: "replace-cancelled", status: "CANCELLED" }),
		],
	};
	let transactionCalls = 0;
	let seriesNumber = 0;
	const classFindFirstQueries: unknown[] = [];
	const recurringFindFirstQueries: unknown[] = [];
	const scheduleFindManyQueries: ScheduleFindManyArgs[] = [];
	const deleteManyQueries: unknown[] = [];
	const writeEvents: string[] = [];
	const conflictRows = [
		scheduleRow({ id: "active", status: "SCHEDULED" }),
		scheduleRow({ id: "completed", status: "COMPLETED" }),
		scheduleRow({ id: "no-show", status: "NO_SHOW" }),
		scheduleRow({ id: "cancelled", status: "CANCELLED" }),
	];
	const replacementCandidates = [
		scheduleRow({ id: "candidate-scheduled" }),
		scheduleRow({ id: "candidate-completed", status: "COMPLETED" }),
		scheduleRow({ id: "candidate-no-show", status: "NO_SHOW" }),
		scheduleRow({ id: "candidate-cancelled", status: "CANCELLED" }),
	];

	function transactionFor(working: State) {
		return {
			class: {
				findFirst: async (args: unknown) => {
					classFindFirstQueries.push(args);
					const where = args as { where: { id: string; tutorId: string } };
					return where.where.id === "class-1" &&
						where.where.tutorId === "tutor-1"
						? { id: "class-1" }
						: null;
				},
				findMany: async () => [{ id: "class-1", totalSeconds: 14_400n }],
			},
			schedule: {
				groupBy: async () => {
					const reservedSeconds = working.schedules.reduce(
						(total, row) =>
							["SCHEDULED", "COMPLETED", "NO_SHOW"].includes(row.status)
								? total + row.durationSeconds
								: total,
						0n,
					);
					return reservedSeconds === 0n
						? []
						: [
								{
									classId: "class-1",
									_sum: { durationSeconds: reservedSeconds },
								},
							];
				},
				findMany: async (args: ScheduleFindManyArgs) => {
					scheduleFindManyQueries.push(args);
					if (args.select?.recurringScheduleId) {
						return replacementCandidates;
					}
					if (args.include) {
						return working.schedules
							.filter((row) =>
								row.recurringScheduleId?.startsWith("recurring-new"),
							)
							.toSorted((left, right) => left.time - right.time);
					}
					if (args.select?.status) {
						return conflictRows;
					}
					return [];
				},
				createMany: async ({
					data,
				}: {
					data: Array<{
						classId: string;
						recurringScheduleId: string;
						date: Date;
						time: number;
						durationSeconds: bigint;
						notes: string | null;
						status: "SCHEDULED";
						type: ScheduleType;
					}>;
				}) => {
					writeEvents.push("schedule.createMany");
					for (const [index, row] of data.entries()) {
						working.schedules.push({
							id: `generated-${working.schedules.length + index + 1}`,
							...row,
							noShowNote: null,
							createdAt,
							updatedAt: createdAt,
							class: classContext,
						});
					}
					return { count: data.length };
				},
				deleteMany: async (args: {
					where: { id: { in: string[] }; classId: string };
				}) => {
					writeEvents.push("schedule.deleteMany");
					deleteManyQueries.push(args);
					const ids = new Set(args.where.id.in);
					working.schedules = working.schedules.filter(
						(row) => !ids.has(row.id),
					);
					return { count: args.where.id.in.length };
				},
			},
			recurringSchedule: {
				findFirst: async (args: unknown) => {
					recurringFindFirstQueries.push(args);
					const where = args as {
						where: { id: string; class: { tutorId: string } };
					};
					if (
						where.where.id !== "recurring-old" ||
						where.where.class.tutorId !== "tutor-1"
					) {
						return null;
					}
					return (
						working.recurring.find((row) => row.id === "recurring-old") ?? null
					);
				},
				create: async ({
					data,
				}: {
					data: {
						classId: string;
						startDate: Date;
						notes: string | null;
						type: ScheduleType;
					};
				}) => {
					writeEvents.push("recurringSchedule.create");
					seriesNumber += 1;
					const id = `recurring-new-${seriesNumber}`;
					working.recurring.push({
						id,
						...data,
						createdAt,
						updatedAt: createdAt,
						class: classContext,
						scheduleItems: [],
					});
					return { id };
				},
				findUnique: async (args: { where: { id: string } }) =>
					working.recurring.find((row) => row.id === args.where.id) ?? null,
			},
			recurringScheduleItem: {
				createMany: async ({
					data,
				}: {
					data: Array<{
						recurringScheduleId: string;
						weekday: "MONDAY" | "TUESDAY";
						time: number;
						durationSeconds: bigint;
					}>;
				}) => {
					writeEvents.push("recurringScheduleItem.createMany");
					if (failItemWrite) {
						throw new Error("item write failed");
					}
					for (const [index, item] of data.entries()) {
						const series = working.recurring.find(
							(row) => row.id === item.recurringScheduleId,
						);
						if (series) {
							series.scheduleItems.push({ id: `item-${index + 1}`, ...item });
						}
					}
					return { count: data.length };
				},
			},
		};
	}

	const client = {
		$transaction: async <T>(
			work: (transaction: never) => Promise<T>,
		): Promise<T> => {
			transactionCalls += 1;
			const working = cloneState(committed);
			const result = await work(transactionFor(working) as never);
			committed = working;
			return result;
		},
	} as unknown as PrismaClient;

	return {
		repository: new ScheduleRepository(client),
		getTransactionCalls: () => transactionCalls,
		getClassFindFirstQueries: () => classFindFirstQueries,
		getRecurringFindFirstQueries: () => recurringFindFirstQueries,
		getScheduleFindManyQueries: () => scheduleFindManyQueries,
		getDeleteManyQueries: () => deleteManyQueries,
		getWriteEvents: () => writeEvents,
		getCommittedState: () => cloneState(committed),
	};
}

describe("ScheduleRepository recurring transaction adapter", () => {
	test("loads tutor-scoped context and supplies status-bearing conflict rows to the planner", async () => {
		const fixture = makeRecurringRepositoryFixture();

		await fixture.repository.withRecurringScheduleTransaction(async (tx) => {
			expect(await tx.loadCreateContext("class-1", "tutor-1")).toEqual({
				classId: "class-1",
				remainingSeconds: 10_800n,
			});
			expect(await tx.loadCreateContext("class-1", "tutor-2")).toBeNull();

			const update = await tx.loadUpdateContext(
				"recurring-old",
				"tutor-1",
				"2026-08-10",
			);
			expect(update?.existingSeries).toMatchObject({
				id: "recurring-old",
				classId: "class-1",
				startDate: "2026-08-10",
			});
			expect(update?.replaceableSchedules).toEqual([
				expect.objectContaining({
					id: "candidate-scheduled",
					status: "SCHEDULED",
					date: "2026-08-10",
				}),
				expect.objectContaining({
					id: "candidate-completed",
					status: "COMPLETED",
				}),
				expect.objectContaining({
					id: "candidate-no-show",
					status: "NO_SHOW",
				}),
				expect.objectContaining({
					id: "candidate-cancelled",
					status: "CANCELLED",
				}),
			]);
			expect(
				await tx.loadUpdateContext("recurring-old", "tutor-2", "2026-08-10"),
			).toBeNull();

			const conflicts = await tx.loadExistingSchedules("class-1", [
				"2026-08-10",
				"2026-08-10",
			]);
			expect(conflicts.map((row) => row.status)).toEqual([
				"SCHEDULED",
				"COMPLETED",
				"NO_SHOW",
				"CANCELLED",
			]);
		});

		expect(fixture.getClassFindFirstQueries()).toEqual([
			expect.objectContaining({ where: { id: "class-1", tutorId: "tutor-1" } }),
			expect.objectContaining({ where: { id: "class-1", tutorId: "tutor-2" } }),
		]);
		expect(fixture.getRecurringFindFirstQueries()).toEqual([
			expect.objectContaining({
				where: { id: "recurring-old", class: { tutorId: "tutor-1" } },
			}),
			expect.objectContaining({
				where: { id: "recurring-old", class: { tutorId: "tutor-2" } },
			}),
		]);

		const candidateQuery = fixture
			.getScheduleFindManyQueries()
			.find((query) => query.select?.recurringScheduleId);
		expect(candidateQuery).toMatchObject({
			where: {
				classId: "class-1",
				date: { gte: new Date("2026-08-10T00:00:00.000Z") },
			},
			select: {
				id: true,
				date: true,
				time: true,
				durationSeconds: true,
				status: true,
				recurringScheduleId: true,
			},
		});
		expect(candidateQuery?.where?.status).toBeUndefined();
		const conflictQuery = fixture
			.getScheduleFindManyQueries()
			.find(
				(query) => query.select?.status && !query.select.recurringScheduleId,
			);
		expect(conflictQuery).toMatchObject({
			where: {
				classId: "class-1",
				date: { in: [new Date("2026-08-10T00:00:00.000Z")] },
			},
			select: { id: true, status: true },
		});
		expect(conflictQuery?.where?.status).toBeUndefined();
	});

	test("persists a create plan in one transaction and refreshes the first generated schedule", async () => {
		const fixture = makeRecurringRepositoryFixture();
		const result = await fixture.repository.withRecurringScheduleTransaction(
			async (tx) => tx.applyCreate(createPlan()),
		);

		expect(fixture.getTransactionCalls()).toBe(1);
		expect(fixture.getWriteEvents()).toEqual([
			"recurringSchedule.create",
			"recurringScheduleItem.createMany",
			"schedule.createMany",
		]);
		const state = fixture.getCommittedState();
		expect(state.recurring).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ id: "recurring-old" }),
				expect.objectContaining({
					id: "recurring-new-1",
					notes: null,
					type: "ONLINE",
				}),
			]),
		);
		expect(
			state.schedules.find(
				(row) => row.recurringScheduleId === "recurring-new-1",
			),
		).toMatchObject({
			date: new Date("2026-08-10T00:00:00.000Z"),
			time: 600,
			durationSeconds: 3_600n,
		});
		expect(result.toScheduleDTO()).toMatchObject({
			classId: "class-1",
			className: "Algebra",
			recurringScheduleId: "recurring-new-1",
			date: "2026-08-10",
			time: 600,
			type: "ONLINE",
			remainingHours: 2,
		});
		expect(
			fixture
				.getScheduleFindManyQueries()
				.find((query) => Boolean(query.include)),
		).toMatchObject({
			where: {
				classId: "class-1",
				date: { in: [new Date("2026-08-10T00:00:00.000Z")] },
			},
			orderBy: [{ date: "asc" }, { time: "asc" }],
		});
	});

	test("deletes exactly the planned replacements, preserves history, and returns compatible update counts", async () => {
		const fixture = makeRecurringRepositoryFixture();
		const result = await fixture.repository.withRecurringScheduleTransaction(
			async (tx) => tx.applyUpdate(updatePlan()),
		);

		expect(fixture.getTransactionCalls()).toBe(1);
		expect(fixture.getDeleteManyQueries()).toEqual([
			{
				where: {
					id: { in: ["replace-scheduled", "replace-cancelled"] },
					classId: "class-1",
				},
			},
		]);
		expect(
			fixture.getCommittedState().schedules.map((row) => row.id),
		).not.toContain("replace-scheduled");
		expect(
			fixture.getCommittedState().schedules.map((row) => row.id),
		).not.toContain("replace-cancelled");
		expect(fixture.getCommittedState().recurring.map((row) => row.id)).toEqual([
			"recurring-old",
			"recurring-new-1",
		]);
		expect(fixture.getWriteEvents()).toEqual([
			"schedule.deleteMany",
			"recurringSchedule.create",
			"recurringScheduleItem.createMany",
			"schedule.createMany",
		]);
		expect(result.toRecurringScheduleUpdateResultDTO()).toMatchObject({
			effectiveDate: "2026-08-10",
			deletedSchedulesCount: 2,
			createdSchedulesCount: 1,
			recurringSchedule: {
				id: "recurring-new-1",
				classId: "class-1",
				className: "Algebra",
				startDate: "2026-08-10",
				notes: null,
				type: "ONLINE",
			},
		});
	});

	test("rolls back the series write when a later item write fails", async () => {
		const fixture = makeRecurringRepositoryFixture({ failItemWrite: true });

		await expect(
			fixture.repository.withRecurringScheduleTransaction(async (tx) =>
				tx.applyCreate(createPlan()),
			),
		).rejects.toThrow("item write failed");

		expect(fixture.getTransactionCalls()).toBe(1);
		expect(fixture.getCommittedState().recurring.map((row) => row.id)).toEqual([
			"recurring-old",
		]);
		expect(fixture.getCommittedState().schedules.map((row) => row.id)).toEqual([
			"replace-scheduled",
			"replace-cancelled",
		]);
	});
});

type TransitionStatus = "SCHEDULED" | "COMPLETED" | "NO_SHOW" | "CANCELLED";

type TransitionScheduleRecord = {
	id: string;
	classId: string;
	recurringScheduleId: null;
	date: Date;
	time: number;
	durationSeconds: bigint;
	notes: string | null;
	noShowNote: string | null;
	status: TransitionStatus;
	type: "ON_SITE";
	createdAt: Date;
	updatedAt: Date;
	class: typeof classContext;
};

function makeTransitionRepositoryFixture({
	status = "SCHEDULED" as TransitionStatus,
	ownerId = "tutor-1",
	transitionCount = 1,
	deductionUpdateCount = 1,
	concurrentScheduleChange,
}: {
	status?: TransitionStatus;
	ownerId?: string;
	transitionCount?: number;
	deductionUpdateCount?: number;
	concurrentScheduleChange?: Partial<
		Pick<TransitionScheduleRecord, "classId" | "durationSeconds" | "status">
	>;
} = {}) {
	let schedule: TransitionScheduleRecord = {
		id: "schedule-1",
		classId: "class-1",
		recurringScheduleId: null,
		date: new Date("2026-08-10T00:00:00.000Z"),
		time: 540,
		durationSeconds: 1_800n,
		notes: null,
		noShowNote: null,
		status,
		type: "ON_SITE",
		createdAt,
		updatedAt,
		class: classContext,
	};
	const transitionCalls: unknown[] = [];
	const deductionUpserts: unknown[] = [];
	const deductionUpdates: unknown[] = [];
	let transactionClassReads = 0;
	let transactionScheduleReads = 0;
	let pendingConcurrentScheduleChange = concurrentScheduleChange;

	const transaction = {
		class: {
			findMany: async () => {
				transactionClassReads += 1;
				return [{ id: "class-1", totalSeconds: 3_600n }];
			},
		},
		schedule: {
			findFirst: async ({
				where,
			}: {
				where: { id: string; class: { tutorId: string } };
			}) => {
				if (where.id !== schedule.id || where.class.tutorId !== ownerId) {
					return null;
				}

				const snapshot = { ...schedule };
				if (pendingConcurrentScheduleChange) {
					schedule = { ...schedule, ...pendingConcurrentScheduleChange };
					pendingConcurrentScheduleChange = undefined;
				}
				return snapshot;
			},
			updateMany: async ({
				where,
				data,
			}: {
				where: {
					id: string;
					classId: string;
					durationSeconds: bigint;
					status: TransitionStatus;
					class: { tutorId: string };
				};
				data: { status: TransitionStatus; noShowNote?: string | null };
			}) => {
				transitionCalls.push({ where, data });
				if (
					transitionCount !== 1 ||
					where.id !== schedule.id ||
					where.classId !== schedule.classId ||
					where.durationSeconds !== schedule.durationSeconds ||
					where.class.tutorId !== ownerId ||
					where.status !== schedule.status
				) {
					return { count: 0 };
				}
				schedule = { ...schedule, ...data };
				return { count: 1 };
			},
			groupBy: async () => {
				transactionScheduleReads += 1;
				return ["SCHEDULED", "COMPLETED", "NO_SHOW"].includes(schedule.status)
					? [
							{
								classId: "class-1",
								_sum: { durationSeconds: schedule.durationSeconds },
							},
						]
					: [];
			},
		},
		classHourDeduction: {
			upsert: async (args: unknown) => {
				deductionUpserts.push(args);
				return {};
			},
			updateMany: async (args: unknown) => {
				deductionUpdates.push(args);
				return { count: deductionUpdateCount };
			},
		},
	};
	const client = {
		$transaction: async <T>(
			callback: (tx: typeof transaction) => Promise<T>,
		): Promise<T> => {
			const before = { ...schedule };
			try {
				return await callback(transaction);
			} catch (error) {
				schedule = before;
				throw error;
			}
		},
	} as unknown as PrismaClient;

	return {
		repository: new ScheduleRepository(client),
		getSchedule: () => schedule,
		getTransactionHourReadCounts: () => ({
			classes: transactionClassReads,
			schedules: transactionScheduleReads,
		}),
		transitionCalls,
		deductionUpserts,
		deductionUpdates,
	};
}

async function applyTransition(
	repository: ScheduleRepository,
	tutorId: string,
	decide: (schedule: ScheduleModel) => ScheduleTransitionPlan,
) {
	return repository.withLifecycleTransaction(async (transaction) => {
		const schedule = await transaction.loadOwned("schedule-1", tutorId);
		if (!schedule) {
			throw new Error("Expected the transition fixture to load a schedule");
		}
		return transaction.apply(tutorId, decide(schedule));
	});
}

describe("ScheduleRepository lifecycle transaction adapter", () => {
	test("uses an owner-scoped exact-seconds CAS and refreshes remaining hours on the transaction client", async () => {
		const fixture = makeTransitionRepositoryFixture();

		const result = await applyTransition(
			fixture.repository,
			"tutor-1",
			(schedule) => schedule.planCompletion(),
		);

		expect(fixture.getSchedule().status).toBe("COMPLETED");
		expect(fixture.transitionCalls).toEqual([
			{
				where: {
					id: "schedule-1",
					classId: "class-1",
					durationSeconds: 1_800n,
					status: "SCHEDULED",
					class: { tutorId: "tutor-1" },
				},
				data: { status: "COMPLETED" },
			},
		]);
		expect(fixture.deductionUpserts).toEqual([
			{
				where: { scheduleId: "schedule-1" },
				update: {
					classId: "class-1",
					secondsDeducted: 1_800n,
					restoredAt: null,
				},
				create: {
					scheduleId: "schedule-1",
					classId: "class-1",
					secondsDeducted: 1_800n,
				},
			},
		]);
		expect(result.toScheduleDTO().remainingHours).toBe(0.5);
		expect(fixture.getTransactionHourReadCounts()).toEqual({
			classes: 1,
			schedules: 1,
		});
	});

	test("upserts charged no-shows and leaves no-deduction cancellation without a deduction", async () => {
		const charged = makeTransitionRepositoryFixture();
		await applyTransition(charged.repository, "tutor-1", (schedule) =>
			schedule.planNoShow({ deductHours: true, note: "  Absent  " }),
		);

		expect(charged.getSchedule()).toMatchObject({
			status: "NO_SHOW",
			noShowNote: "Absent",
		});
		expect(charged.deductionUpserts).toHaveLength(1);

		const cancelled = makeTransitionRepositoryFixture();
		const cancelledResult = await applyTransition(
			cancelled.repository,
			"tutor-1",
			(schedule) =>
				schedule.planNoShow({
					deductHours: false,
					note: "Student cancelled",
				}),
		);

		expect(cancelled.getSchedule()).toMatchObject({
			status: "CANCELLED",
			noShowNote: "Student cancelled",
		});
		expect(cancelled.deductionUpserts).toEqual([]);
		expect(cancelledResult.toScheduleDTO().remainingHours).toBe(1);
	});

	test("restores exactly one active deduction and then refreshes the restored balance", async () => {
		const fixture = makeTransitionRepositoryFixture({ status: "COMPLETED" });

		const result = await applyTransition(
			fixture.repository,
			"tutor-1",
			(schedule) => schedule.planRestoration(),
		);

		expect(fixture.getSchedule().status).toBe("CANCELLED");
		expect(fixture.deductionUpdates).toEqual([
			{
				where: {
					scheduleId: "schedule-1",
					classId: "class-1",
					restoredAt: null,
				},
				data: { restoredAt: expect.any(Date) },
			},
		]);
		expect(result.toScheduleDTO().remainingHours).toBe(1);
	});

	test("checks ownership both while loading and in the compare-and-set write", async () => {
		const fixture = makeTransitionRepositoryFixture();

		await fixture.repository.withLifecycleTransaction(async (transaction) => {
			expect(await transaction.loadOwned("schedule-1", "tutor-2")).toBeNull();
			const schedule = await transaction.loadOwned("schedule-1", "tutor-1");
			if (!schedule) {
				throw new Error("Expected schedule to load for its owner");
			}

			await expect(
				transaction.apply("tutor-2", schedule.planCompletion()),
			).rejects.toMatchObject({ reason: "not_found" });
		});

		expect(fixture.transitionCalls).toEqual([
			expect.objectContaining({
				where: expect.objectContaining({ class: { tutorId: "tutor-2" } }),
			}),
		]);
		expect(fixture.deductionUpserts).toEqual([]);
		expect(fixture.getSchedule().status).toBe("SCHEDULED");
	});

	test("prevents deductions when the schedule snapshot loses its class or duration CAS", async () => {
		for (const concurrentScheduleChange of [
			{ classId: "class-2" },
			{ durationSeconds: 3_600n },
		]) {
			const fixture = makeTransitionRepositoryFixture({
				concurrentScheduleChange,
			});

			await expect(
				applyTransition(fixture.repository, "tutor-1", (schedule) =>
					schedule.planNoShow({ deductHours: true }),
				),
			).rejects.toBeInstanceOf(ScheduleLifecyclePersistenceError);
			expect(fixture.transitionCalls).toEqual([
				expect.objectContaining({
					where: expect.objectContaining({
						classId: "class-1",
						durationSeconds: 1_800n,
					}),
				}),
			]);
			expect(fixture.deductionUpserts).toEqual([]);
			expect(fixture.getSchedule().status).toBe("SCHEDULED");
		}
	});

	test("reports a stale status CAS without deducting or committing the transition", async () => {
		const fixture = makeTransitionRepositoryFixture({
			concurrentScheduleChange: { status: "COMPLETED" },
		});

		await expect(
			applyTransition(fixture.repository, "tutor-1", (schedule) =>
				schedule.planNoShow({ deductHours: true }),
			),
		).rejects.toMatchObject({
			reason: "stale",
			message: "The schedule status changed before this action",
		});
		expect(fixture.transitionCalls).toEqual([
			expect.objectContaining({
				where: expect.objectContaining({ status: "SCHEDULED" }),
			}),
		]);
		expect(fixture.deductionUpserts).toEqual([]);
		expect(fixture.getSchedule()).toMatchObject({
			status: "SCHEDULED",
			noShowNote: null,
		});
	});

	test("rolls back the status change when the active deduction is missing", async () => {
		const fixture = makeTransitionRepositoryFixture({
			status: "COMPLETED",
			deductionUpdateCount: 0,
		});

		await expect(
			applyTransition(fixture.repository, "tutor-1", (schedule) =>
				schedule.planRestoration(),
			),
		).rejects.toMatchObject({ reason: "active_deduction_missing" });
		expect(fixture.getSchedule().status).toBe("COMPLETED");
		expect(fixture.deductionUpdates).toHaveLength(1);
		expect(fixture.getTransactionHourReadCounts()).toEqual({
			classes: 0,
			schedules: 0,
		});
	});
});
