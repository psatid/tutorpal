import { resolver } from "hono-openapi";
import { z } from "zod";
import { MAX_CLASS_HOURS } from "../lib/class-hour-addition";
import { hasAtMostTwoDecimalPlaces, MAX_CURRENCY_AMOUNT } from "../lib/money";
import { RecurringScheduleSchema } from "./schedule.schema";

export const StudentInClassSchema = z.object({
	id: z.string(),
	name: z.string(),
	phoneNumber: z.string().nullable(),
	grade: z.number().int(),
});
export const ClassSchema = z.object({
	id: z.string(),
	name: z.string().min(1),
	displayName: z.string(),
	totalHours: z.number(),
	students: z.array(StudentInClassSchema),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
	remainingHours: z.number(),
	recurringSchedule: RecurringScheduleSchema.nullable().optional(),
});

export const ClassDetailSchema = ClassSchema.extend({
	recordedRevenue: z.number(),
});

const studentIdsSchema = z
	.array(z.string())
	.refine((ids) => new Set(ids).size === ids.length, "Students must be unique");

export const CreateClassSchema = z
	.object({
		name: z.string().trim().min(1, "Class name is required"),
		studentIds: studentIdsSchema.optional(),
	})
	.strict();

export const UpdateClassSchema = z
	.object({
		name: z.string().trim().min(1, "Class name is required").optional(),
		studentIds: studentIdsSchema.optional(),
	})
	.strict();

export const ClassListQuerySchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(10),
	search: z.string().optional(),
	sortBy: z.enum(["name", "totalHours", "createdAt"]).default("createdAt"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const PaginatedClassListSchema = z.object({
	data: z.array(ClassSchema),
	pagination: z.object({
		total: z.number(),
		page: z.number(),
		limit: z.number(),
		totalPages: z.number(),
		hasNext: z.boolean(),
		hasPrev: z.boolean(),
	}),
});

const positiveHoursSchema = z
	.number()
	.finite()
	.positive("Hours must be greater than 0")
	.min(0.01, "Hours must be at least 0.01")
	.max(MAX_CLASS_HOURS, `Hours must not exceed ${MAX_CLASS_HOURS.toFixed(2)}`)
	.refine(
		(hours) => hasAtMostTwoDecimalPlaces(hours),
		"Hours may have at most two decimal places",
	);

const revenueAmountSchema = z
	.number()
	.finite()
	.min(0, "Revenue amount must be greater than or equal to 0")
	.max(
		MAX_CURRENCY_AMOUNT,
		`Revenue amount must not exceed ${MAX_CURRENCY_AMOUNT.toFixed(2)}`,
	)
	.refine(
		hasAtMostTwoDecimalPlaces,
		"Revenue amount may have at most two decimal places",
	);

export const CreateClassHourAdditionSchema = z.discriminatedUnion("source", [
	z
		.object({
			source: z.literal("course"),
			courseId: z.string().min(1, "Course is required"),
			revenueAmount: revenueAmountSchema.nullable().optional(),
			requestId: z.string().uuid(),
		})
		.strict(),
	z
		.object({
			source: z.literal("custom"),
			hours: positiveHoursSchema,
			revenueAmount: revenueAmountSchema.nullable().optional(),
			requestId: z.string().uuid(),
		})
		.strict(),
]);

export const ClassHourAdditionSchema = z.object({
	id: z.string(),
	classId: z.string(),
	source: z.enum(["course", "custom"]),
	hours: z.number(),
	revenueAmount: z.number().nullable(),
	sourceCourseId: z.string().nullable(),
	sourceCourseName: z.string().nullable(),
	requestId: z.string().uuid(),
	createdAt: z.string().datetime(),
});

export const ClassHourAdditionResultSchema = z.object({
	addition: ClassHourAdditionSchema,
	totalHours: z.number(),
	remainingHours: z.number(),
});

export const ClassHourAdditionListQuerySchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(20),
});

export const PaginatedClassHourAdditionListSchema = z.object({
	data: z.array(ClassHourAdditionSchema),
	pagination: z.object({
		total: z.number(),
		page: z.number(),
		limit: z.number(),
		totalPages: z.number(),
		hasNext: z.boolean(),
		hasPrev: z.boolean(),
	}),
});

export const ClassSchemaResolver = resolver(ClassSchema);
export const ClassDetailSchemaResolver = resolver(ClassDetailSchema);
export const PaginatedClassListSchemaResolver = resolver(
	PaginatedClassListSchema,
);
export const ClassHourAdditionSchemaResolver = resolver(
	ClassHourAdditionSchema,
);
export const ClassHourAdditionResultSchemaResolver = resolver(
	ClassHourAdditionResultSchema,
);
export const PaginatedClassHourAdditionListSchemaResolver = resolver(
	PaginatedClassHourAdditionListSchema,
);
