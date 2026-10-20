import { z } from "zod";
import type { TFunction } from "i18next";
import { RecurringSchedulePattern } from "@/models/recurring-schedule";

export type Weekday =
	| "MONDAY"
	| "TUESDAY"
	| "WEDNESDAY"
	| "THURSDAY"
	| "FRIDAY"
	| "SATURDAY"
	| "SUNDAY";

export type ScheduleType = "ON_SITE" | "ONLINE";

export type ScheduleStatus =
	| "SCHEDULED"
	| "COMPLETED"
	| "NO_SHOW"
	| "CANCELLED";

export const scheduleTypeSchema = z.enum(["ON_SITE", "ONLINE"]);

export interface RecurringScheduleItemInput {
	weekday: Weekday;
	time: string;
	durationMinutes: number;
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
				RecurringSchedulePattern.fromFormItems(
					data.recurring.scheduleItems,
				).hasOverlaps()
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

export function createRecurringScheduleSchema(t: TFunction) {
	return z
		.object({
			effectiveDate: z
				.string()
				.min(1, t("schedules:validation.effectiveDateRequired")),
			type: scheduleTypeSchema
				.optional()
				.refine(
					(value) => value !== undefined,
					t("schedules:validation.typeRequired"),
				),
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
		.superRefine((data, ctx) => {
			if (
				RecurringSchedulePattern.fromFormItems(data.scheduleItems).hasOverlaps()
			) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["scheduleItems"],
					message: t("schedules:validation.overlappingWeekdayTimes"),
				});
			}
		});
}

export type RecurringScheduleFormData = z.infer<
	ReturnType<typeof createRecurringScheduleSchema>
>;

export function getOverlappingRecurringScheduleItemIndexes(
	items: readonly RecurringScheduleItemInput[],
): Set<number> {
	return RecurringSchedulePattern.fromFormItems(items).getOverlappingItemIndexes();
}
