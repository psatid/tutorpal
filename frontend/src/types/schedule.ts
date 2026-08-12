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
