import { resolver } from "hono-openapi";
import { z } from "zod";

export const CourseSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	defaultTotalHours: z.number(),
	classCount: z.number().int().nonnegative(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export const CreateCourseSchema = z.object({
	name: z.string().trim().min(1, "Course name is required"),
	defaultTotalHours: z
		.number()
		.positive("Default total hours must be greater than 0"),
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

export const CourseSchemaResolver = resolver(CourseSchema);
export const PaginatedCourseListSchemaResolver = resolver(
	PaginatedCourseListSchema,
);
