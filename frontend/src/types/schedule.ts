import { z } from "zod";
import type { TFunction } from "i18next";

export type Weekday =
	| "MONDAY"
	| "TUESDAY"
	| "WEDNESDAY"
	| "THURSDAY"
	| "FRIDAY"
	| "SATURDAY"
	| "SUNDAY";

export type ScheduleType = "ON_SITE" | "ONLINE";

export const scheduleTypeSchema = z.enum(["ON_SITE", "ONLINE"]);

export interface RecurringScheduleSummary {
	id: string;
	startDate: string;
	notes?: string | null;
	type: ScheduleType;
	scheduleItems: Array<{
		id?: string;
		weekday: Weekday;
		time: number;
		durationMinutes: number;
	}>;
}

export interface RecurringScheduleItemInput {
	weekday: Weekday;
	time: string;
	durationMinutes: number;
}

export const WEEKDAY_ORDER: Record<Weekday, number> = {
	MONDAY: 0,
	TUESDAY: 1,
	WEDNESDAY: 2,
	THURSDAY: 3,
	FRIDAY: 4,
	SATURDAY: 5,
	SUNDAY: 6,
};

const MINUTES_PER_DAY = 24 * 60;
const MINUTES_PER_WEEK = 7 * MINUTES_PER_DAY;

function getWeeklyStart(item: RecurringScheduleItemInput) {
	return WEEKDAY_ORDER[item.weekday] * MINUTES_PER_DAY + timeStringToMinutes(item.time);
}

function overlapsOnRepeatingWeek(
	item: RecurringScheduleItemInput,
	otherItem: RecurringScheduleItemInput,
) {
	const start = getWeeklyStart(item);
	const end = start + item.durationMinutes;
	const otherStart = getWeeklyStart(otherItem);
	const otherEnd = otherStart + otherItem.durationMinutes;
	const firstRelevantWeek = Math.floor(
		(start - otherEnd) / MINUTES_PER_WEEK,
	);
	const lastRelevantWeek = Math.ceil(
		(end - otherStart) / MINUTES_PER_WEEK,
	);

	for (let weekOffset = firstRelevantWeek; weekOffset <= lastRelevantWeek; weekOffset += 1) {
		const shiftedOtherStart = otherStart + weekOffset * MINUTES_PER_WEEK;
		const shiftedOtherEnd = otherEnd + weekOffset * MINUTES_PER_WEEK;

		if (start < shiftedOtherEnd && shiftedOtherStart < end) {
			return true;
		}
	}

	return false;
}

export function getOverlappingRecurringScheduleItemIndexes(
	items: readonly RecurringScheduleItemInput[],
) {
	const overlappingIndexes = new Set<number>();

	items.forEach((item, index) => {
		if (
			Number.isFinite(item.durationMinutes) &&
			item.durationMinutes > MINUTES_PER_WEEK
		) {
			overlappingIndexes.add(index);
		}

		items.forEach((otherItem, otherIndex) => {
			if (
				index === otherIndex ||
				!Number.isFinite(item.durationMinutes) ||
				!Number.isFinite(otherItem.durationMinutes)
			) {
				return;
			}

			if (
				item.durationMinutes > MINUTES_PER_WEEK ||
				otherItem.durationMinutes > MINUTES_PER_WEEK
			) {
				overlappingIndexes.add(index);
				overlappingIndexes.add(otherIndex);
				return;
			}

			if (overlapsOnRepeatingWeek(item, otherItem)) {
				overlappingIndexes.add(index);
			}
		});
	});

	return overlappingIndexes;
}

export function sortRecurringScheduleItems<T extends RecurringScheduleItemInput>(
	items: readonly T[],
) {
	return [...items].sort((left, right) => {
		const weekdayDifference =
			WEEKDAY_ORDER[left.weekday] - WEEKDAY_ORDER[right.weekday];
		return (
			weekdayDifference ||
			timeStringToMinutes(left.time) - timeStringToMinutes(right.time)
		);
	});
}

// Schema for the form - uses HH:MM format for time
export function createScheduleSchema(t: TFunction) {
	return z
		.object({
			classId: z.string().min(1, t("schedules:validation.classRequired")),
			date: z.string().min(1, t("schedules:validation.dateRequired")),
			type: scheduleTypeSchema
				.optional()
				.refine(
					(value) => value !== undefined,
					t("schedules:validation.typeRequired"),
				),
			time: z.string().optional(),
			durationMinutes: z
				.number()
				.min(1, t("schedules:validation.durationRequired"))
				.optional(),
			notes: z.string().optional(),
			status: z.enum(["SCHEDULED", "COMPLETED", "NO_SHOW", "CANCELLED"]),
			recurring: z
				.object({
					scheduleItems: z
						.array(
							z.object({
								weekday: z.enum([
									"MONDAY",
									"TUESDAY",
									"WEDNESDAY",
									"THURSDAY",
									"FRIDAY",
									"SATURDAY",
									"SUNDAY",
								]),
								time: z
									.string()
									.regex(
										/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
										t("schedules:validation.invalidTime"),
									),
								durationMinutes: z
									.number()
									.min(1, t("schedules:validation.durationRequired")),
							}),
						)
						.min(1, t("schedules:validation.weekdayRequired")),
				})
				.optional(),
		})
		.superRefine((data, ctx) => {
			if (!data.recurring) {
				if (data.time === undefined || data.time === "") {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						path: ["time"],
						message: t("schedules:validation.timeRequired"),
					});
				}

				if (data.durationMinutes === undefined) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						path: ["durationMinutes"],
						message: t("schedules:validation.durationRequired"),
					});
				}
			}

			if (
				data.recurring &&
				getOverlappingRecurringScheduleItemIndexes(
					data.recurring.scheduleItems,
				).size > 0
			) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["recurring", "scheduleItems"],
					message: t("schedules:validation.overlappingWeekdayTimes"),
				});
			}
		});
}

export type ScheduleFormData = z.infer<ReturnType<typeof createScheduleSchema>>;

// Helper function to convert minutes since midnight to HH:MM format
export function minutesToTimeString(minutes: number): string {
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

// Helper function to convert HH:MM format to minutes since midnight
export function timeStringToMinutes(timeString: string): number {
	const parts = timeString.split(":").map(Number);
	const hours = parts[0] ?? 0;
	const minutes = parts[1] ?? 0;
	return hours * 60 + minutes;
}
