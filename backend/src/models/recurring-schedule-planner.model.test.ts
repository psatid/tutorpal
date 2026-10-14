import { describe, expect, test } from "bun:test";
import {
	type RecurringScheduleCandidate,
	type RecurringScheduleExistingSchedule,
	type RecurringScheduleOccurrencePlan,
	RecurringSchedulePlanner,
	RecurringSchedulePlanningError,
	type RecurringScheduleSeriesSnapshot,
} from "./recurring-schedule-planner.model";

function existingSeries(
	overrides: Partial<RecurringScheduleSeriesSnapshot> = {},
): RecurringScheduleSeriesSnapshot {
	return {
		id: "series-old",
		classId: "class-1",
		startDate: "2026-08-10",
		notes: "Existing note",
		type: "ON_SITE",
		scheduleItems: [{ weekday: "MONDAY", time: 540, durationSeconds: 3_600n }],
		...overrides,
	};
}

function candidate(
	overrides: Partial<RecurringScheduleCandidate> = {},
): RecurringScheduleCandidate {
	return {
		id: "candidate-1",
		date: "2026-08-10",
		time: 540,
		durationSeconds: 3_600n,
		status: "SCHEDULED",
		recurringScheduleId: null,
		...overrides,
	};
}

function occurrence(
	overrides: Partial<RecurringScheduleOccurrencePlan> = {},
): RecurringScheduleOccurrencePlan {
	return {
		classId: "class-1",
		date: "2026-08-10",
		time: 540,
		durationSeconds: 3_600n,
		type: "ON_SITE",
		...overrides,
	};
}

function existingSchedule(
	overrides: Partial<RecurringScheduleExistingSchedule> = {},
): RecurringScheduleExistingSchedule {
	return {
		id: "existing-1",
		date: "2026-08-10",
		time: 540,
		durationSeconds: 3_600n,
		status: "SCHEDULED",
		...overrides,
	};
}

function planningError(work: () => void): RecurringSchedulePlanningError {
	let caught: unknown;
	try {
		work();
	} catch (error) {
		caught = error;
	}
	expect(caught).toBeInstanceOf(RecurringSchedulePlanningError);
	return caught as RecurringSchedulePlanningError;
}

describe("RecurringSchedulePlanner creation", () => {
	test("starts inclusively, orders same-day items by time, and exhausts exact seconds", () => {
		const plan = RecurringSchedulePlanner.planCreate({
			classId: "class-1",
			startDate: "2026-08-10",
			type: "ONLINE",
			notes: "",
			scheduleItems: [
				{ weekday: "TUESDAY", time: 480, durationMinutes: 30 },
				{ weekday: "MONDAY", time: 660, durationMinutes: 60 },
				{ weekday: "MONDAY", time: 540, durationMinutes: 60 },
			],
			remainingSeconds: 9_000n,
		});

		expect(plan.series).toEqual({
			classId: "class-1",
			startDate: "2026-08-10",
			notes: null,
			type: "ONLINE",
			scheduleItems: [
				{ weekday: "TUESDAY", time: 480, durationSeconds: 1_800n },
				{ weekday: "MONDAY", time: 660, durationSeconds: 3_600n },
				{ weekday: "MONDAY", time: 540, durationSeconds: 3_600n },
			],
		});
		expect(plan.generatedSchedules).toEqual([
			occurrence({ date: "2026-08-10", time: 540, type: "ONLINE" }),
			occurrence({ date: "2026-08-10", time: 660, type: "ONLINE" }),
			occurrence({
				date: "2026-08-11",
				time: 480,
				durationSeconds: 1_800n,
				type: "ONLINE",
			}),
		]);
	});

	test("stops at the first occurrence that cannot fit instead of skipping it", () => {
		const plan = RecurringSchedulePlanner.planCreate({
			classId: "class-1",
			startDate: "2026-08-10",
			type: "ON_SITE",
			scheduleItems: [
				{ weekday: "MONDAY", time: 540, durationMinutes: 60 },
				{ weekday: "MONDAY", time: 600, durationMinutes: 120 },
				{ weekday: "MONDAY", time: 720, durationMinutes: 30 },
			],
			remainingSeconds: 9_000n,
		});

		expect(plan.generatedSchedules).toEqual([occurrence()]);
	});

	test("returns a typed insufficient-hours failure when no item can be planned", () => {
		const error = planningError(() => {
			RecurringSchedulePlanner.planCreate({
				classId: "class-1",
				startDate: "2026-08-10",
				type: "ON_SITE",
				scheduleItems: [],
				remainingSeconds: 3_600n,
			});
		});

		expect(error.reason).toBe("insufficient_hours");
		expect(error.conflictDates).toEqual([]);
	});
});

describe("RecurringSchedulePlanner updates", () => {
	test("replaces only eligible linked or legacy schedules and releases scheduled capacity only", () => {
		const plan = RecurringSchedulePlanner.planUpdate({
			existingSeries: existingSeries(),
			effectiveDate: "2026-08-10",
			scheduleItems: [{ weekday: "MONDAY", time: 600, durationMinutes: 60 }],
			remainingSeconds: 0n,
			replaceableSchedules: [
				candidate({
					id: "linked-scheduled",
					time: 900,
					durationSeconds: 3_601n,
					recurringScheduleId: "series-old",
				}),
				candidate({
					id: "linked-cancelled",
					date: "2026-08-17",
					status: "CANCELLED",
					time: 900,
					durationSeconds: 9_999n,
					recurringScheduleId: "series-old",
				}),
				candidate({ id: "legacy-match", date: "2026-08-17" }),
				candidate({
					id: "another-series",
					date: "2026-08-17",
					recurringScheduleId: "series-other",
				}),
				candidate({
					id: "legacy-wrong-time",
					date: "2026-08-17",
					time: 600,
				}),
				candidate({
					id: "legacy-wrong-duration",
					date: "2026-08-17",
					durationSeconds: 1_800n,
				}),
				candidate({
					id: "completed-history",
					date: "2026-08-17",
					status: "COMPLETED",
					recurringScheduleId: "series-old",
				}),
				candidate({
					id: "no-show-history",
					date: "2026-08-17",
					status: "NO_SHOW",
					recurringScheduleId: "series-old",
				}),
				candidate({
					id: "before-effective",
					date: "2026-08-03",
					recurringScheduleId: "series-old",
				}),
			],
		});

		expect(plan.replacementScheduleIds).toEqual([
			"linked-scheduled",
			"linked-cancelled",
			"legacy-match",
		]);
		expect(plan.generatedSchedules).toEqual([
			occurrence({ time: 600 }),
			occurrence({ date: "2026-08-17", time: 600 }),
		]);
		expect(plan.series).toMatchObject({
			startDate: "2026-08-10",
			notes: "Existing note",
			type: "ON_SITE",
		});
	});

	test("does not match an unlinked legacy schedule before the old series starts", () => {
		const plan = RecurringSchedulePlanner.planUpdate({
			existingSeries: existingSeries({ startDate: "2026-08-10" }),
			effectiveDate: "2026-08-03",
			scheduleItems: [{ weekday: "MONDAY", time: 600, durationMinutes: 60 }],
			remainingSeconds: 3_600n,
			replaceableSchedules: [
				candidate({ id: "legacy-before-series", date: "2026-08-03" }),
			],
		});

		expect(plan.replacementScheduleIds).toEqual([]);
	});

	test("inherits omitted fields and preserves an explicit empty update note", () => {
		const inherited = RecurringSchedulePlanner.planUpdate({
			existingSeries: existingSeries(),
			effectiveDate: "2026-08-10",
			scheduleItems: [{ weekday: "MONDAY", time: 540, durationMinutes: 60 }],
			remainingSeconds: 3_600n,
			replaceableSchedules: [],
		});
		const explicitEmptyNote = RecurringSchedulePlanner.planUpdate({
			existingSeries: existingSeries(),
			effectiveDate: "2026-08-10",
			type: "ONLINE",
			notes: "",
			scheduleItems: [{ weekday: "MONDAY", time: 540, durationMinutes: 60 }],
			remainingSeconds: 3_600n,
			replaceableSchedules: [],
		});

		expect(inherited.series).toMatchObject({
			notes: "Existing note",
			type: "ON_SITE",
		});
		expect(explicitEmptyNote.series).toMatchObject({
			notes: "",
			type: "ONLINE",
		});
	});
});

describe("RecurringSchedulePlanner overlap checks", () => {
	test("reports unique sorted dates for generated and active existing conflicts", () => {
		const error = planningError(() => {
			RecurringSchedulePlanner.assertNoOverlap(
				[
					occurrence({ date: "2026-08-12" }),
					occurrence({ date: "2026-08-10" }),
					occurrence({
						date: "2026-08-10",
						time: 570,
						durationSeconds: 1_800n,
					}),
				],
				[
					existingSchedule({ date: "2026-08-12", status: "COMPLETED" }),
					existingSchedule({
						id: "cancelled",
						date: "2026-08-10",
						status: "CANCELLED",
					}),
				],
			);
		});

		expect(error.reason).toBe("overlap");
		expect(error.conflictDates).toEqual(["2026-08-10", "2026-08-12"]);
	});

	test("ignores cancelled and excluded replacements, while allowing touching endpoints", () => {
		expect(() =>
			RecurringSchedulePlanner.assertNoOverlap(
				[occurrence({ time: 600, durationSeconds: 3_600n })],
				[
					existingSchedule({
						id: "cancelled",
						time: 600,
						status: "CANCELLED",
					}),
					existingSchedule({ id: "replacement", time: 600 }),
					existingSchedule({ id: "touching", time: 540 }),
				],
				["replacement"],
			),
		).not.toThrow();
	});

	test("does not inspect existing-only overlaps and keeps comparison on the same calendar date", () => {
		expect(() =>
			RecurringSchedulePlanner.assertNoOverlap(
				[],
				[
					existingSchedule({ id: "one", time: 540 }),
					existingSchedule({ id: "two", time: 570 }),
				],
			),
		).not.toThrow();
		expect(() =>
			RecurringSchedulePlanner.assertNoOverlap(
				[occurrence({ date: "2026-08-11", time: 0 })],
				[
					existingSchedule({
						date: "2026-08-10",
						time: 1_410,
						durationSeconds: 3_600n,
					}),
				],
			),
		).not.toThrow();
	});
});
