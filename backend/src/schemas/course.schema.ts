import { resolver } from "hono-openapi";
import { z } from "zod";
import { hasAtMostTwoDecimalPlaces, MAX_CURRENCY_AMOUNT } from "../lib/money";

export const CourseSchema = z.object({
	id: z.string().uuid(),
	tutorId: z.string(),
	name: z.string(),
	defaultTotalHours: z.number(),
	pricingMode: z.enum(["hourly_rate", "fixed_price"]),
	priceAmount: z.number().nullable(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export const CourseDetailSchema = CourseSchema.extend({
	recordedHours: z.number(),
	recordedRevenue: z.number(),
});

const priceAmountSchema = z
	.number()
	.finite()
	.min(0, "Price amount must be greater than or equal to 0")
	.max(
		MAX_CURRENCY_AMOUNT,
		`Price amount must not exceed ${MAX_CURRENCY_AMOUNT.toFixed(2)}`,
	)
	.refine(
		hasAtMostTwoDecimalPlaces,
		"Price amount may have at most two decimal places",
	);

export const CreateCourseSchema = z.object({
	name: z.string().trim().min(1, "Course name is required"),
	defaultTotalHours: z
		.number()
		.positive("Default total hours must be greater than 0"),
	pricingMode: z.enum(["hourly_rate", "fixed_price"]),
	priceAmount: priceAmountSchema.nullable().optional(),
});

export const UpdateCourseSchema = CreateCourseSchema.partial();

export const CourseListQuerySchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(100),
	search: z.string().optional(),
	sortBy: z.enum(["name", "defaultTotalHours", "createdAt"]).default("name"),
	sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const PaginatedCourseListSchema = z.object({
	data: z.array(CourseSchema),
	pagination: z.object({
		total: z.number(),
		page: z.number(),
		limit: z.number(),
		totalPages: z.number(),
		hasNext: z.boolean(),
		hasPrev: z.boolean(),
	}),
});

export const ErrorResponseSchema = z.object({
	errorCode: z.string(),
	message: z.string(),
});

export const CourseSchemaResolver = resolver(CourseSchema);
export const CourseDetailSchemaResolver = resolver(CourseDetailSchema);
export const PaginatedCourseListSchemaResolver = resolver(
	PaginatedCourseListSchema,
);
export const ErrorResponseSchemaResolver = resolver(ErrorResponseSchema);
