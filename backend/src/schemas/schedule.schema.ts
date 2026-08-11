import { resolver } from "hono-openapi";
import { z } from "zod";
import { DateTime } from "../lib/date-time";

// Schedule status enum
export const ScheduleStatusSchema = z.enum([
	"SCHEDULED",
	"COMPLETED",
	"NO_SHOW",
	"CANCELLED",
]);

export const ScheduleTypeSchema = z.enum(["ON_SITE", "ONLINE"]);

// Weekday enum
export const WeekdaySchema = z.enum([
	"MONDAY",
	"TUESDAY",
	"WEDNESDAY",
	"THURSDAY",
	"FRIDAY",
	"SATURDAY",
	"SUNDAY",
]);

// Recurring schedule item schema
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const RecurringScheduleItemInputSchema = z.object({
	weekday: WeekdaySchema,
	time: z.number().int().min(0).max(1439), // 0 to 23:59 in minutes
	durationMinutes: z.number().int().min(1),
});

// Recurring pattern schema
const RecurringPatternSchema = z
	.object({
		startDate: z
			.string()
			.regex(DATE_REGEX, "Start date must be in YYYY-MM-DD format"),
		scheduleItems: z
			.array(RecurringScheduleItemInputSchema)
			.min(1, "At least one weekday must be selected"),
	})
	.optional();

export const RecurringScheduleItemSchema = z.object({
	id: z.string(),
	weekday: WeekdaySchema,
	time: z.number().int().min(0).max(1439),
	durationMinutes: z.number().int().min(1),
});

export const RecurringScheduleSchema = z.object({
	id: z.string(),
	classId: z.string(),
	className: z.string(),
	courseName: z.string().nullable(),
	startDate: z.string(),
	notes: z.string().nullable(),
	type: ScheduleTypeSchema,
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
	scheduleItems: z.array(RecurringScheduleItemSchema),
});

// Base schedule schema (matches Prisma model with class name)
export const ScheduleSchema = z.object({
	id: z.string(),
	classId: z.string(),
	className: z.string(),
	courseName: z.string().nullable(),
	recurringScheduleId: z.string().nullable().optional(),
	date: z.string(), // ISO date string (YYYY-MM-DD)
	time: z.number().int().min(0).max(1439), // Minutes since midnight (0-1439)
	durationMinutes: z.number().int().min(1), // At least 1 minute
	notes: z.string().nullable(),
	status: ScheduleStatusSchema,
	type: ScheduleTypeSchema,
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
	remainingHours: z.number().optional(),
});

// Request schemas
export const CreateScheduleSchema = z
	.object({
		classId: z.string().min(1, "Class is required"),
		date: z.string().regex(DATE_REGEX, "Date must be in YYYY-MM-DD format"),
		type: ScheduleTypeSchema,
		time: z
			.number()
			.int()
			.min(0)
			.max(1439, "Time must be between 0 and 1439 minutes")
			.optional(),
		durationMinutes: z
			.number()
			.min(1, "Duration must be at least 1 minute")
			.optional(),
		notes: z.string().optional(),
		recurring: RecurringPatternSchema,
	})
	.superRefine((data, ctx) => {
		if (data.recurring) {
			return;
		}

		if (data.time === undefined) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["time"],
				message: "Time is required",
			});
		}

		if (data.durationMinutes === undefined) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["durationMinutes"],
				message: "Duration must be at least 1 minute",
			});
		}
	});

export const UpdateScheduleSchema = z.object({
	classId: z.string().min(1, "Class is required").optional(),
	date: z
		.string()
		.regex(DATE_REGEX, "Date must be in YYYY-MM-DD format")
		.optional(),
	type: ScheduleTypeSchema.optional(),
	time: z
		.number()
		.int()
		.min(0)
		.max(1439, "Time must be between 0 and 1439 minutes")
		.optional(),
	durationMinutes: z
		.number()
		.int()
		.min(1, "Duration must be at least 1 minute")
		.optional(),
	notes: z.string().optional(),
	status: ScheduleStatusSchema.optional(),
});

// Query schema for listing schedules
export const ScheduleListQuerySchema = z
	.object({
		date: z
			.string()
			.regex(DATE_REGEX, "Date must be in YYYY-MM-DD format")
			.optional(),
		startDate: z
			.string()
			.regex(DATE_REGEX, "Start date must be in YYYY-MM-DD format")
			.optional(),
		endDate: z
			.string()
			.regex(DATE_REGEX, "End date must be in YYYY-MM-DD format")
			.optional(),
		search: z.string().optional(),
		classId: z.string().optional(),
	})
	.superRefine((data, ctx) => {
		const hasStartDate = data.startDate !== undefined;
		const hasEndDate = data.endDate !== undefined;
		const hasRange = hasStartDate || hasEndDate;

		if (hasStartDate !== hasEndDate) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: [hasStartDate ? "endDate" : "startDate"],
				message: "startDate and endDate must be provided together",
			});
		}

		if (data.date && hasRange) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["date"],
				message: "date cannot be combined with startDate or endDate",
			});
		}

		if (!data.startDate || !data.endDate) return;

		const startDate = DateTime.fromDateOnlyString(data.startDate);
		const endDate = DateTime.fromDateOnlyString(data.endDate);
		const comparison = startDate.compareAsc(endDate);

		if (Number.isNaN(comparison)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["startDate"],
				message: "startDate and endDate must be valid calendar dates",
			});
			return;
		}

		if (comparison > 0) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["endDate"],
				message: "endDate must be on or after startDate",
			});
		}

		if (startDate.addDays(31).compareAsc(endDate) <= 0) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["endDate"],
				message: "Schedule ranges cannot exceed 31 calendar days",
			});
		}
	});

export const UpdateRecurringScheduleSchema = z.object({
	effectiveDate: z
		.string()
		.regex(DATE_REGEX, "Effective date must be in YYYY-MM-DD format"),
	type: ScheduleTypeSchema.optional(),
	notes: z.string().optional(),
	scheduleItems: z
		.array(RecurringScheduleItemInputSchema)
		.min(1, "At least one weekday must be selected"),
});

export const RecurringScheduleUpdateResultSchema = z.object({
	recurringSchedule: RecurringScheduleSchema,
	effectiveDate: z.string(),
	deletedSchedulesCount: z.number().int().min(0),
	createdSchedulesCount: z.number().int().min(0),
});

// OpenAPI resolvers
export const ScheduleSchemaResolver = resolver(ScheduleSchema);
export const CreateScheduleSchemaResolver = resolver(CreateScheduleSchema);
export const UpdateScheduleSchemaResolver = resolver(UpdateScheduleSchema);
export const ScheduleListSchemaResolver = resolver(z.array(ScheduleSchema));
export const ScheduleListQuerySchemaResolver = resolver(
	ScheduleListQuerySchema,
);
export const RecurringScheduleSchemaResolver = resolver(
	RecurringScheduleSchema,
);
export const UpdateRecurringScheduleSchemaResolver = resolver(
	UpdateRecurringScheduleSchema,
);
export const RecurringScheduleUpdateResultSchemaResolver = resolver(
	RecurringScheduleUpdateResultSchema,
);

// Type exports
export type ScheduleSchemaType = z.infer<typeof ScheduleSchema>;
export type CreateScheduleSchemaType = z.infer<typeof CreateScheduleSchema>;
export type UpdateScheduleSchemaType = z.infer<typeof UpdateScheduleSchema>;
export type ScheduleStatusSchemaType = z.infer<typeof ScheduleStatusSchema>;
export type ScheduleTypeSchemaType = z.infer<typeof ScheduleTypeSchema>;
export type WeekdaySchemaType = z.infer<typeof WeekdaySchema>;
export type RecurringPatternSchemaType = z.infer<typeof RecurringPatternSchema>;
export type ScheduleListQuerySchemaType = z.infer<
	typeof ScheduleListQuerySchema
>;
export type RecurringScheduleSchemaType = z.infer<
	typeof RecurringScheduleSchema
>;
export type UpdateRecurringScheduleSchemaType = z.infer<
	typeof UpdateRecurringScheduleSchema
>;
export type RecurringScheduleUpdateResultSchemaType = z.infer<
	typeof RecurringScheduleUpdateResultSchema
>;
