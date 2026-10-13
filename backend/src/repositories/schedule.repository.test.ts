import { describe, expect, test } from "bun:test";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "../lib/db";
import { hoursToSeconds, minutesToSeconds } from "../lib/teaching-time";
import type {
	ScheduleModel,
	ScheduleTransitionPlan,
} from "../models/schedule.model";
import { ScheduleLifecyclePersistenceError } from "../types";
import { ScheduleRepository } from "./schedule.repository";

const createdAt = new Date("2026-08-01T00:00:00.000Z");
const updatedAt = new Date("2026-08-01T00:30:00.000Z");
const classContext = {
	name: "Algebra",
};

type CreatedScheduleData = {
	classId: string;
	recurringScheduleId: string;
	date: Date;
	time: number;
	durationSeconds: bigint;
	notes: string | null;
	status: "SCHEDULED";
	type: "ON_SITE" | "ONLINE";
};

function makeCreatedScheduleRecord(data: CreatedScheduleData, index: number) {
	return {
		id: `generated-${index}`,
		noShowNote: null,
		...data,
		createdAt,
		updatedAt,
		class: classContext,
	};
}

function makeCreateRepositoryFixture(remainingHours: number) {
	let createdScheduleData: CreatedScheduleData[] = [];
	let scheduleFindManyCalls = 0;
	const recurringSchedule = {
		id: "recurring-created",
		classId: "class-1",
		startDate: new Date("2026-08-10T00:00:00.000Z"),
		notes: null,
		type: "ON_SITE" as const,
		createdAt,
		updatedAt,
		class: classContext,
	};
	const transaction = {
		schedule: {
			findMany: async () => {
				scheduleFindManyCalls += 1;
				if (scheduleFindManyCalls === 1) {
					return [];
				}
				return createdScheduleData.map(makeCreatedScheduleRecord);
			},
			createMany: async ({ data }: { data: CreatedScheduleData[] }) => {
				createdScheduleData = data;
				return { count: data.length };
			},
		},
		recurringSchedule: {
			create: async () => recurringSchedule,
		},
		recurringScheduleItem: {
			createMany: async () => ({ count: 0 }),
		},
	};
	const client = {
		class: {
			findMany: async () => [
				{ id: "class-1", totalSeconds: hoursToSeconds(remainingHours) },
			],
		},
		schedule: {
			groupBy: async () => {
				const durationSeconds = createdScheduleData.reduce(
					(total, schedule) => total + schedule.durationSeconds,
					0n,
				);
				return durationSeconds > 0n
					? [{ classId: "class-1", _sum: { durationSeconds } }]
					: [];
			},
		},
		$transaction: async (
			callback: (tx: typeof transaction) => Promise<unknown>,
		) => callback(transaction),
	} as unknown as PrismaClient;

	return {
		repository: new ScheduleRepository(client),
		getCreatedScheduleData: () => createdScheduleData,
	};
}

function makeUpdateRepositoryFixture(remainingHours: number) {
	let createdScheduleData: CreatedScheduleData[] = [];
	let recurringItemData: Array<{
		weekday: "MONDAY";
		time: number;
		durationSeconds: bigint;
	}> = [];
	const existingRecurringSchedule = {
		id: "recurring-existing",
		classId: "class-1",
		startDate: new Date("2026-08-03T00:00:00.000Z"),
		notes: null,
		type: "ON_SITE" as const,
		createdAt,
		updatedAt,
		class: classContext,
		scheduleItems: [
			{
				id: "item-existing",
				weekday: "MONDAY" as const,
				time: 540,
				durationSeconds: 3_600n,
			},
		],
	};
	const newRecurringSchedule = {
		...existingRecurringSchedule,
		id: "recurring-updated",
		startDate: new Date("2026-08-10T00:00:00.000Z"),
	};
	const transaction = {
		schedule: {
			findMany: async () => [],
			deleteMany: async () => ({ count: 0 }),
			createMany: async ({ data }: { data: CreatedScheduleData[] }) => {
				createdScheduleData = data;
				return { count: data.length };
			},
		},
		class: {
			findUnique: async () => ({
				totalSeconds: hoursToSeconds(remainingHours),
				schedules: [],
			}),
		},
		recurringSchedule: {
			create: async () => newRecurringSchedule,
			findUnique: async () => ({
				...newRecurringSchedule,
				scheduleItems: recurringItemData.map((item, index) => ({
					id: `item-${index + 1}`,
					...item,
				})),
			}),
		},
		recurringScheduleItem: {
			createMany: async ({ data }: { data: typeof recurringItemData }) => {
				recurringItemData = data;
				return { count: data.length };
			},
		},
	};
	const client = {
		recurringSchedule: {
			findFirst: async () => existingRecurringSchedule,
		},
		$transaction: async (
			callback: (tx: typeof transaction) => Promise<unknown>,
		) => callback(transaction),
	} as unknown as PrismaClient;

	return {
		repository: new ScheduleRepository(client),
		getCreatedScheduleData: () => createdScheduleData,
	};
}

describe("ScheduleRepository recurring schedule types", () => {
	test("propagates type to regenerated sessions and leaves historical statuses outside replacement", async () => {
		const existingRecurringSchedule = {
			id: "recurring-1",
			classId: "class-1",
			startDate: new Date("2026-08-01T00:00:00.000Z"),
			notes: null,
			type: "ON_SITE" as const,
			createdAt,
			updatedAt,
			class: classContext,
			scheduleItems: [
				{
					id: "item-1",
					weekday: "MONDAY" as const,
					time: 600,
					durationSeconds: 3_600n,
				},
			],
		};
		const newRecurringSchedule = {
			...existingRecurringSchedule,
			id: "recurring-2",
			type: "ONLINE" as const,
			startDate: new Date("2026-08-10T00:00:00.000Z"),
		};
		const replacementCandidate = {
			id: "scheduled-1",
			date: new Date("2026-08-10T00:00:00.000Z"),
			time: 600,
			durationSeconds: 3_600n,
			recurringScheduleId: "recurring-1",
		};

		let candidateQuery: unknown;
		let deleteManyIds: string[] = [];
		let createdScheduleData: Array<{ type: string }> = [];
		let scheduleFindManyCalls = 0;

		const transaction = {
			schedule: {
				findMany: async (args: unknown) => {
					scheduleFindManyCalls += 1;
					if (scheduleFindManyCalls === 1) {
						candidateQuery = args;
						return [replacementCandidate];
					}
					return [];
				},
				deleteMany: async (args: { where: { id: { in: string[] } } }) => {
					deleteManyIds = args.where.id.in;
					return { count: deleteManyIds.length };
				},
				createMany: async (args: { data: Array<{ type: string }> }) => {
					createdScheduleData = args.data;
					return { count: createdScheduleData.length };
				},
			},
			class: {
				findUnique: async () => ({ totalSeconds: 36_000n, schedules: [] }),
			},
			recurringSchedule: {
				create: async () => newRecurringSchedule,
				findUnique: async () => ({
					...newRecurringSchedule,
					scheduleItems: newRecurringSchedule.scheduleItems,
				}),
			},
			recurringScheduleItem: {
				createMany: async () => ({ count: 1 }),
			},
		};

		const recurringDelegate = prisma.recurringSchedule as unknown as {
			findFirst: (...args: never[]) => Promise<unknown>;
		};
		const prismaClient = prisma as unknown as {
			$transaction: (
				callback: (tx: typeof transaction) => Promise<unknown>,
			) => Promise<unknown>;
		};
		const originalFindFirst = recurringDelegate.findFirst;
		const originalTransaction = prismaClient.$transaction;

		recurringDelegate.findFirst = async () => existingRecurringSchedule;
		prismaClient.$transaction = async (callback) => callback(transaction);

		try {
			const result = await new ScheduleRepository().updateRecurringSchedule(
				"recurring-1",
				{
					effectiveDate: "2026-08-10",
					type: "ONLINE",
					scheduleItems: [
						{
							weekday: "MONDAY",
							time: 600,
							durationMinutes: 60,
						},
					],
				},
				"tutor-1",
			);

			expect(candidateQuery).toMatchObject({
				where: {
					status: { in: ["SCHEDULED", "CANCELLED"] },
				},
			});
			expect(deleteManyIds).toEqual(["scheduled-1"]);
			expect(createdScheduleData.length).toBeGreaterThan(0);
			expect(createdScheduleData.every((item) => item.type === "ONLINE")).toBe(
				true,
			);
			expect(result.recurringSchedule.toRecurringScheduleDTO().type).toBe(
				"ONLINE",
			);
		} finally {
			recurringDelegate.findFirst = originalFindFirst;
			prismaClient.$transaction = originalTransaction;
		}
	});

	test("uses inclusive date bounds when listing a date range", async () => {
		const schedule = {
			id: "schedule-1",
			classId: "class-1",
			date: new Date("2026-08-16T00:00:00.000Z"),
			time: 600,
			durationSeconds: 3_600n,
			notes: null,
			noShowNote: null,
			status: "SCHEDULED" as const,
			type: "ON_SITE" as const,
			createdAt,
			updatedAt,
			class: classContext,
		};
		let listQuery: unknown;

		const scheduleDelegate = prisma.schedule as unknown as {
			findMany: (args: unknown) => Promise<unknown[]>;
			groupBy: (...args: never[]) => Promise<unknown[]>;
		};
		const classDelegate = prisma.class as unknown as {
			findMany: (...args: never[]) => Promise<unknown[]>;
		};
		const originalFindMany = scheduleDelegate.findMany;
		const originalGroupBy = scheduleDelegate.groupBy;
		const originalClassFindMany = classDelegate.findMany;

		scheduleDelegate.findMany = async (args) => {
			listQuery = args;
			return [schedule];
		};
		scheduleDelegate.groupBy = async () => [
			{ classId: "class-1", _sum: { durationSeconds: 3_600n } },
		];
		classDelegate.findMany = async () => [
			{ id: "class-1", totalSeconds: 36_000n },
		];

		try {
			const schedules = await new ScheduleRepository().findAll("tutor-1", {
				startDate: "2026-08-10",
				endDate: "2026-08-16",
			});

			expect(listQuery).toMatchObject({
				where: {
					date: {
						gte: new Date("2026-08-10T00:00:00.000Z"),
						lte: new Date("2026-08-16T00:00:00.000Z"),
					},
				},
				orderBy: [{ date: "asc" }, { time: "asc" }],
			});
			expect(schedules).toHaveLength(1);
		} finally {
			scheduleDelegate.findMany = originalFindMany;
			scheduleDelegate.groupBy = originalGroupBy;
			classDelegate.findMany = originalClassFindMany;
		}
	});
});

describe("ScheduleRepository repeated weekday schedules", () => {
	test("creates repeated weekday sessions in chronological order", async () => {
		const fixture = makeCreateRepositoryFixture(2);
		const result = await fixture.repository.createRecurringSchedule({
			classId: "class-1",
			type: "ON_SITE",
			recurring: {
				startDate: "2026-08-10",
				scheduleItems: [
					{ weekday: "MONDAY", time: 660, durationMinutes: 60 },
					{ weekday: "MONDAY", time: 540, durationMinutes: 60 },
				],
			},
		});

		expect(fixture.getCreatedScheduleData()).toEqual([
			{
				classId: "class-1",
				recurringScheduleId: "recurring-created",
				date: new Date("2026-08-10T00:00:00.000Z"),
				time: 540,
				durationSeconds: 3_600n,
				notes: null,
				status: "SCHEDULED",
				type: "ON_SITE",
			},
			{
				classId: "class-1",
				recurringScheduleId: "recurring-created",
				date: new Date("2026-08-10T00:00:00.000Z"),
				time: 660,
				durationSeconds: 3_600n,
				notes: null,
				status: "SCHEDULED",
				type: "ON_SITE",
			},
		]);
		expect(result.toScheduleDTO()).toEqual({
			id: "generated-0",
			classId: "class-1",
			className: "Algebra",
			recurringScheduleId: "recurring-created",
			date: "2026-08-10",
			time: 540,
			durationMinutes: 60,
			notes: null,
			noShowNote: null,
			status: "SCHEDULED",
			type: "ON_SITE",
			createdAt: createdAt.toISOString(),
			updatedAt: updatedAt.toISOString(),
			remainingHours: 0,
		});
	});

	test("regenerates repeated weekday sessions when editing a recurrence", async () => {
		const fixture = makeUpdateRepositoryFixture(2);
		const result = await fixture.repository.updateRecurringSchedule(
			"recurring-existing",
			{
				effectiveDate: "2026-08-10",
				scheduleItems: [
					{ weekday: "MONDAY", time: 660, durationMinutes: 60 },
					{ weekday: "MONDAY", time: 540, durationMinutes: 60 },
				],
			},
			"tutor-1",
		);

		expect(
			fixture
				.getCreatedScheduleData()
				.map(({ date, time, durationSeconds }) => ({
					date,
					time,
					durationSeconds,
				})),
		).toEqual([
			{
				date: new Date("2026-08-10T00:00:00.000Z"),
				time: 540,
				durationSeconds: 3_600n,
			},
			{
				date: new Date("2026-08-10T00:00:00.000Z"),
				time: 660,
				durationSeconds: 3_600n,
			},
		]);
		expect(result.createdSchedulesCount).toBe(2);
	});

	test("stops at the first session that exceeds the remaining class hours", async () => {
		const fixture = makeCreateRepositoryFixture(2.5);
		await fixture.repository.createRecurringSchedule({
			classId: "class-1",
			type: "ON_SITE",
			recurring: {
				startDate: "2026-08-10",
				scheduleItems: [
					{ weekday: "MONDAY", time: 540, durationMinutes: 60 },
					{ weekday: "MONDAY", time: 600, durationMinutes: 120 },
					{ weekday: "MONDAY", time: 720, durationMinutes: 30 },
				],
			},
		});

		expect(
			fixture.getCreatedScheduleData().map(({ time, durationSeconds }) => ({
				time,
				durationSeconds,
			})),
		).toEqual([{ time: 540, durationSeconds: 3_600n }]);
	});

	test("uses exact seconds for an exact recurring balance and a one-hundredth-hour short balance", async () => {
		const exactFixture = makeCreateRepositoryFixture(1.5);
		await exactFixture.repository.createRecurringSchedule({
			classId: "class-1",
			type: "ON_SITE",
			recurring: {
				startDate: "2026-08-10",
				scheduleItems: [
					{ weekday: "MONDAY", time: 540, durationMinutes: 60 },
					{ weekday: "MONDAY", time: 600, durationMinutes: 30 },
				],
			},
		});

		expect(
			exactFixture
				.getCreatedScheduleData()
				.reduce((total, schedule) => total + schedule.durationSeconds, 0n),
		).toBe(5_400n);
		expect(
			exactFixture
				.getCreatedScheduleData()
				.map((schedule) => schedule.durationSeconds),
		).toEqual([minutesToSeconds(60), minutesToSeconds(30)]);

		const shortFixture = makeCreateRepositoryFixture(1.49);
		await shortFixture.repository.createRecurringSchedule({
			classId: "class-1",
			type: "ON_SITE",
			recurring: {
				startDate: "2026-08-10",
				scheduleItems: [
					{ weekday: "MONDAY", time: 540, durationMinutes: 60 },
					{ weekday: "MONDAY", time: 600, durationMinutes: 30 },
				],
			},
		});

		expect(
			shortFixture
				.getCreatedScheduleData()
				.map((schedule) => schedule.durationSeconds),
		).toEqual([minutesToSeconds(60)]);
	});

	test("rejects overlapping generated sessions", async () => {
		const fixture = makeCreateRepositoryFixture(2);

		await expect(
			fixture.repository.createRecurringSchedule({
				classId: "class-1",
				type: "ON_SITE",
				recurring: {
					startDate: "2026-08-10",
					scheduleItems: [
						{ weekday: "MONDAY", time: 540, durationMinutes: 60 },
						{ weekday: "MONDAY", time: 570, durationMinutes: 30 },
					],
				},
			}),
		).rejects.toMatchObject({ errorCode: "RECURRING_CONFLICT", status: 400 });

		expect(fixture.getCreatedScheduleData()).toEqual([]);
	});

	test("accepts sessions whose endpoints touch", async () => {
		const fixture = makeCreateRepositoryFixture(1.75);
		await fixture.repository.createRecurringSchedule({
			classId: "class-1",
			type: "ON_SITE",
			recurring: {
				startDate: "2026-08-10",
				scheduleItems: [
					{ weekday: "MONDAY", time: 540, durationMinutes: 60 },
					{ weekday: "MONDAY", time: 600, durationMinutes: 45 },
				],
			},
		});

		expect(
			fixture.getCreatedScheduleData().map(({ time, durationSeconds }) => ({
				time,
				durationSeconds,
			})),
		).toEqual([
			{ time: 540, durationSeconds: 3_600n },
			{ time: 600, durationSeconds: 2_700n },
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
