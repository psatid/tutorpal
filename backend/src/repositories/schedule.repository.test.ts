import { describe, expect, test } from "bun:test";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "../lib/db";
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
	durationMinutes: number;
	notes: string | null;
	status: "SCHEDULED";
	type: "ON_SITE" | "ONLINE";
};

function makeCreatedScheduleRecord(data: CreatedScheduleData, index: number) {
	return {
		id: `generated-${index}`,
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
			findMany: async () => [{ id: "class-1", totalHours: remainingHours }],
		},
		schedule: {
			groupBy: async () => {
				const durationMinutes = createdScheduleData.reduce(
					(total, schedule) => total + schedule.durationMinutes,
					0,
				);
				return durationMinutes > 0
					? [{ classId: "class-1", _sum: { durationMinutes } }]
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
		durationMinutes: number;
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
				durationMinutes: 60,
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
			findUnique: async () => ({ totalHours: remainingHours, schedules: [] }),
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
					durationMinutes: 60,
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
			durationMinutes: 60,
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
				findUnique: async () => ({ totalHours: 10, schedules: [] }),
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
			durationMinutes: 60,
			notes: null,
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
			{ classId: "class-1", _sum: { durationMinutes: 60 } },
		];
		classDelegate.findMany = async () => [{ id: "class-1", totalHours: 10 }];

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
				durationMinutes: 60,
				notes: null,
				status: "SCHEDULED",
				type: "ON_SITE",
			},
			{
				classId: "class-1",
				recurringScheduleId: "recurring-created",
				date: new Date("2026-08-10T00:00:00.000Z"),
				time: 660,
				durationMinutes: 60,
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
				.map(({ date, time, durationMinutes }) => ({
					date,
					time,
					durationMinutes,
				})),
		).toEqual([
			{
				date: new Date("2026-08-10T00:00:00.000Z"),
				time: 540,
				durationMinutes: 60,
			},
			{
				date: new Date("2026-08-10T00:00:00.000Z"),
				time: 660,
				durationMinutes: 60,
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
			fixture.getCreatedScheduleData().map(({ time, durationMinutes }) => ({
				time,
				durationMinutes,
			})),
		).toEqual([{ time: 540, durationMinutes: 60 }]);
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
			fixture.getCreatedScheduleData().map(({ time, durationMinutes }) => ({
				time,
				durationMinutes,
			})),
		).toEqual([
			{ time: 540, durationMinutes: 60 },
			{ time: 600, durationMinutes: 45 },
		]);
	});
});
