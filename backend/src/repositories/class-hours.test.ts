import { describe, expect, test } from "bun:test";
import type { PrismaClient } from "@prisma/client";
import { getClassHourAccountingMap } from "./class-hours";

type ScheduleAggregateRow = {
	classId: string;
	status: "SCHEDULED" | "COMPLETED" | "NO_SHOW";
	_sum: { durationSeconds: bigint | null };
};

type DeductionAggregateRow = {
	classId: string;
	_sum: { secondsDeducted: bigint | null };
};

function makeClient(
	scheduleRows: ScheduleAggregateRow[],
	deductionRows: DeductionAggregateRow[],
) {
	let scheduleGroupByArgs: unknown;
	let deductionGroupByArgs: unknown;
	let recurringTemplateReads = 0;
	const client = {
		schedule: {
			groupBy: async (args: unknown) => {
				scheduleGroupByArgs = args;
				return scheduleRows;
			},
		},
		classHourDeduction: {
			groupBy: async (args: unknown) => {
				deductionGroupByArgs = args;
				return deductionRows;
			},
		},
		recurringSchedule: {
			findMany: async () => {
				recurringTemplateReads += 1;
				return [];
			},
		},
	} as unknown as PrismaClient;

	return {
		client,
		getScheduleGroupByArgs: () => scheduleGroupByArgs,
		getDeductionGroupByArgs: () => deductionGroupByArgs,
		getRecurringTemplateReads: () => recurringTemplateReads,
	};
}

describe("getClassHourAccountingMap", () => {
	test("separates scheduled and used hours while reserving all active concrete schedules", async () => {
		const fixture = makeClient(
			[
				{
					classId: "class-1",
					status: "SCHEDULED",
					_sum: { durationSeconds: 5_400n },
				},
				{
					classId: "class-1",
					status: "COMPLETED",
					_sum: { durationSeconds: 7_200n },
				},
				{
					classId: "class-1",
					status: "NO_SHOW",
					_sum: { durationSeconds: 1_800n },
				},
				{
					classId: "class-2",
					status: "SCHEDULED",
					_sum: { durationSeconds: 1_800n },
				},
			],
			[
				{
					classId: "class-1",
					_sum: { secondsDeducted: 7_200n },
				},
				{
					classId: "class-2",
					_sum: { secondsDeducted: null },
				},
			],
		);

		const accounting = await getClassHourAccountingMap(fixture.client, [
			{ id: "class-1", totalSeconds: 36_000n },
			{ id: "class-2", totalSeconds: 18_000n },
		]);

		expect(accounting.get("class-1")).toEqual({
			remainingHours: 6,
			scheduledHours: 1.5,
			usedHours: 2,
		});
		expect(accounting.get("class-2")).toEqual({
			remainingHours: 4.5,
			scheduledHours: 0.5,
			usedHours: 0,
		});
		expect(fixture.getScheduleGroupByArgs()).toEqual({
			by: ["classId", "status"],
			where: {
				classId: { in: ["class-1", "class-2"] },
				status: { in: ["SCHEDULED", "COMPLETED", "NO_SHOW"] },
			},
			_sum: { durationSeconds: true },
		});
		expect(fixture.getDeductionGroupByArgs()).toEqual({
			by: ["classId"],
			where: {
				classId: { in: ["class-1", "class-2"] },
				restoredAt: null,
			},
			_sum: { secondsDeducted: true },
		});
	});

	test("does not read recurring templates and reports zeroes when no concrete records exist", async () => {
		const fixture = makeClient([], []);

		const accounting = await getClassHourAccountingMap(fixture.client, [
			{ id: "class-1", totalSeconds: 5_400n },
		]);

		expect(accounting.get("class-1")).toEqual({
			remainingHours: 1.5,
			scheduledHours: 0,
			usedHours: 0,
		});
		expect(fixture.getRecurringTemplateReads()).toBe(0);
	});

	test("returns early for an empty class list", async () => {
		const fixture = makeClient([], []);

		await expect(
			getClassHourAccountingMap(fixture.client, []),
		).resolves.toEqual(new Map());
		expect(fixture.getScheduleGroupByArgs()).toBeUndefined();
		expect(fixture.getDeductionGroupByArgs()).toBeUndefined();
	});
});
