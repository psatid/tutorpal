import { describe, expect, it } from "vitest";
import {
	RecurringSchedule,
	RecurringSchedulePattern,
	recurringScheduleWeekdays,
	type RecurringSchedulePatternItem,
} from "@/models/recurring-schedule";
import { Schedule } from "@/models/schedule";

const MINUTES_PER_WEEK = 7 * 24 * 60;

function makeSchedule(
	overrides: Partial<Parameters<typeof Schedule.fromInput>[0]> = {},
) {
	return Schedule.fromInput({
		classId: "class-1",
		className: "Algebra",
		date: "2026-10-12",
		durationMinutes: 60,
		id: "schedule-1",
		status: "SCHEDULED",
		time: 9 * 60,
		type: "ONLINE",
		...overrides,
	});
}

describe("RecurringSchedulePattern", () => {
	it("orders stored intervals consistently for groups, form values, and commands", () => {
		const items: RecurringSchedulePatternItem[] = [
			{ id: "tuesday", weekday: "TUESDAY", time: 9 * 60, durationMinutes: 60 },
			{ id: "monday-late", weekday: "MONDAY", time: 14 * 60, durationMinutes: 30 },
			{ id: "monday-early", weekday: "MONDAY", time: 8 * 60, durationMinutes: 60 },
		];
		const pattern = RecurringSchedulePattern.fromStoredItems(items);

		expect(pattern.getSortedItems().map((item) => item.id)).toEqual([
			"monday-early",
			"monday-late",
			"tuesday",
		]);
		expect(pattern.getOrderedWeekdayGroups()).toEqual([
			{
				weekday: "MONDAY",
				items: [
					{ id: "monday-early", weekday: "MONDAY", time: 8 * 60, durationMinutes: 60 },
					{ id: "monday-late", weekday: "MONDAY", time: 14 * 60, durationMinutes: 30 },
				],
			},
			{
				weekday: "TUESDAY",
				items: [
					{ id: "tuesday", weekday: "TUESDAY", time: 9 * 60, durationMinutes: 60 },
				],
			},
		]);
		expect(pattern.getSortedFormItems()).toEqual([
			{ weekday: "MONDAY", time: "08:00", durationMinutes: 60 },
			{ weekday: "MONDAY", time: "14:00", durationMinutes: 30 },
			{ weekday: "TUESDAY", time: "09:00", durationMinutes: 60 },
		]);
		expect(pattern.toCommandItems()).toEqual([
			{ weekday: "MONDAY", time: 8 * 60, durationMinutes: 60 },
			{ weekday: "MONDAY", time: 14 * 60, durationMinutes: 30 },
			{ weekday: "TUESDAY", time: 9 * 60, durationMinutes: 60 },
		]);
		expect(RecurringSchedulePattern.minutesToTimeString(9 * 60 + 5)).toBe(
			"09:05",
		);
		expect(RecurringSchedulePattern.timeStringToMinutes("14:30")).toBe(
			14 * 60 + 30,
		);
	});

	it("identifies overlapping repeated intervals across weekdays and week boundaries", () => {
		const sameDayOverlap = RecurringSchedulePattern.fromFormItems([
			{ weekday: "MONDAY", time: "09:00", durationMinutes: 60 },
			{ weekday: "MONDAY", time: "09:30", durationMinutes: 60 },
			{ weekday: "MONDAY", time: "10:30", durationMinutes: 60 },
		]);
		const touchingIntervals = RecurringSchedulePattern.fromFormItems([
			{ weekday: "MONDAY", time: "09:00", durationMinutes: 60 },
			{ weekday: "MONDAY", time: "10:00", durationMinutes: 60 },
		]);
		const weekWrapOverlap = RecurringSchedulePattern.fromFormItems([
			{ weekday: "SUNDAY", time: "23:30", durationMinutes: 90 },
			{ weekday: "MONDAY", time: "00:30", durationMinutes: 60 },
		]);
		const weekLongOverlap = RecurringSchedulePattern.fromStoredItems([
			{ weekday: "MONDAY", time: 9 * 60, durationMinutes: MINUTES_PER_WEEK },
			{ weekday: "TUESDAY", time: 9 * 60, durationMinutes: 60 },
		]);
		const longerThanWeek = RecurringSchedulePattern.fromStoredItems([
			{ weekday: "MONDAY", time: 9 * 60, durationMinutes: MINUTES_PER_WEEK + 1 },
		]);

		expect([...sameDayOverlap.getOverlappingItemIndexes()]).toEqual([0, 1]);
		expect(touchingIntervals.hasOverlaps()).toBe(false);
		expect([...weekWrapOverlap.getOverlappingItemIndexes()]).toEqual([0, 1]);
		expect([...weekLongOverlap.getOverlappingItemIndexes()]).toEqual([0, 1]);
		expect([...longerThanWeek.getOverlappingItemIndexes()]).toEqual([0]);
	});

	it("returns pure editor decisions without mutating the form draft", () => {
		const formItems = [
			{ weekday: "MONDAY" as const, time: "14:00", durationMinutes: 30 },
			{ weekday: "MONDAY" as const, time: "08:00", durationMinutes: 60 },
			{ weekday: "TUESDAY" as const, time: "09:00", durationMinutes: 60 },
		];
		const pattern = RecurringSchedulePattern.fromFormItems(formItems);

		expect(pattern.getLatestEndMinute("MONDAY")).toBe(14 * 60 + 30);
		expect(pattern.canAddInterval("MONDAY")).toBe(true);
		expect(pattern.getAddIntervalItem("MONDAY")).toEqual({
			weekday: "MONDAY",
			time: "14:30",
			durationMinutes: 60,
		});
		expect(pattern.getToggleWeekdayDecision("MONDAY")).toEqual({
			kind: "remove",
			indexes: [1, 0],
		});
		expect(pattern.getToggleWeekdayDecision("SUNDAY")).toEqual({
			kind: "append",
			item: { weekday: "SUNDAY", time: "09:00", durationMinutes: 60 },
		});
		expect(pattern.getSelectAllWeekdaysDecision()).toEqual({
			kind: "append",
			items: recurringScheduleWeekdays.slice(2).map((weekday) => ({
				weekday,
				time: "09:00",
				durationMinutes: 60,
			})),
		});
		expect(formItems).toEqual([
			{ weekday: "MONDAY", time: "14:00", durationMinutes: 30 },
			{ weekday: "MONDAY", time: "08:00", durationMinutes: 60 },
			{ weekday: "TUESDAY", time: "09:00", durationMinutes: 60 },
		]);

		const fullDay = RecurringSchedulePattern.fromFormItems([
			{ weekday: "MONDAY", time: "23:00", durationMinutes: 60 },
		]);
		const allDays = RecurringSchedulePattern.fromFormItems(
			recurringScheduleWeekdays.map((weekday) => ({
				weekday,
				time: "09:00",
				durationMinutes: 60,
			})),
		);

		expect(fullDay.getAddIntervalItem("MONDAY")).toBeNull();
		expect(allDays.getSelectAllWeekdaysDecision()).toEqual({ kind: "clear" });
	});
});

describe("RecurringSchedule", () => {
	it("converts form values into ordered create and update commands", () => {
		const recurring = RecurringSchedule.fromInput({
			id: "recurring-1",
			notes: "Term schedule",
			scheduleItems: [
				{ weekday: "TUESDAY", time: 9 * 60, durationMinutes: 60 },
				{ weekday: "MONDAY", time: 14 * 60, durationMinutes: 30 },
			],
			startDate: "2026-10-05",
			type: "ONLINE",
		});
		const values = {
			effectiveDate: "2026-10-12",
			scheduleItems: [
				{ weekday: "TUESDAY" as const, time: "09:00", durationMinutes: 60 },
				{ weekday: "MONDAY" as const, time: "14:00", durationMinutes: 30 },
			],
			type: "ON_SITE" as const,
		};

		expect(
			RecurringSchedule.getFormDefaults(recurring, "2026-10-21"),
		).toEqual({
			effectiveDate: "2026-10-05",
			scheduleItems: [
				{ weekday: "TUESDAY", time: "09:00", durationMinutes: 60 },
				{ weekday: "MONDAY", time: "14:00", durationMinutes: 30 },
			],
			type: "ONLINE",
		});
		expect(RecurringSchedule.getFormDefaults(null, "2026-10-21")).toEqual({
			effectiveDate: "2026-10-21",
			scheduleItems: [],
			type: undefined,
		});
		expect(RecurringSchedule.toCreateCommand("class-1", values)).toEqual({
			classId: "class-1",
			date: "2026-10-12",
			recurring: {
				startDate: "2026-10-12",
				scheduleItems: [
					{ weekday: "MONDAY", time: 14 * 60, durationMinutes: 30 },
					{ weekday: "TUESDAY", time: 9 * 60, durationMinutes: 60 },
				],
			},
			time: 0,
			type: "ON_SITE",
		});
		expect(recurring.toUpdateCommand(values)).toEqual({
			data: {
				effectiveDate: "2026-10-12",
				scheduleItems: [
					{ weekday: "MONDAY", time: 14 * 60, durationMinutes: 30 },
					{ weekday: "TUESDAY", time: 9 * 60, durationMinutes: 60 },
				],
				type: "ON_SITE",
			},
			id: "recurring-1",
		});
		expect(RecurringSchedule.toCreateCommand("class-1", { ...values, type: undefined })).toBeUndefined();
		expect(recurring.toUpdateCommand({ ...values, type: undefined })).toBeUndefined();
	});

	it("counts matching current and legacy occurrences from the selected effective date", () => {
		const recurring = RecurringSchedule.fromInput({
			id: "recurring-1",
			scheduleItems: [
				{ weekday: "MONDAY", time: 9 * 60, durationMinutes: 60 },
			],
			startDate: "2026-10-05",
			type: "ONLINE",
		});
		const schedules = [
			makeSchedule({
				id: "direct-scheduled",
				recurringScheduleId: "recurring-1",
			}),
			makeSchedule({
				date: "2026-10-19",
				id: "direct-cancelled",
				recurringScheduleId: "recurring-1",
				status: "CANCELLED",
			}),
			makeSchedule({
				date: "2026-10-19",
				id: "direct-completed",
				recurringScheduleId: "recurring-1",
				status: "COMPLETED",
			}),
			makeSchedule({ date: "2026-10-19", id: "legacy-match" }),
			makeSchedule({ date: "2026-09-28", id: "legacy-before-start" }),
			makeSchedule({
				date: "2026-10-19",
				id: "different-recurring-series",
				recurringScheduleId: "recurring-2",
			}),
			makeSchedule({
				date: "2026-10-19",
				id: "legacy-time-mismatch",
				time: 10 * 60,
			}),
		];

		expect(recurring.getAffectedOccurrenceCount(schedules, "2026-10-12")).toBe(3);
	});
});
