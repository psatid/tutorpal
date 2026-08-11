import { describe, expect, test } from "bun:test";
import { prisma } from "../lib/db";
import { ScheduleRepository } from "./schedule.repository";

const createdAt = new Date("2026-08-01T00:00:00.000Z");
const updatedAt = new Date("2026-08-01T00:30:00.000Z");
const classContext = {
	name: "Algebra",
	course: null,
	students: [],
};

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
