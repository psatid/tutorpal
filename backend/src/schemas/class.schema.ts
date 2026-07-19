import { resolver } from "hono-openapi";
import { z } from "zod";
import { RecurringScheduleSchema } from "./schedule.schema";

export const StudentInClassSchema = z.object({
	id: z.string(),
	name: z.string(),
	phoneNumber: z.string().nullable(),
	grade: z.number().int(),
});
export const CourseInClassSchema = z.object({
	id: z.string(),
	name: z.string(),
	defaultTotalHours: z.number(),
});

export const ClassSchema = z.object({
	id: z.string(),
	course: CourseInClassSchema.nullable(),
	name: z.string().nullable(),
	displayName: z.string(),
	totalHours: z.number(),
	students: z.array(StudentInClassSchema),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
	remainingHours: z.number().optional(),
	recurringSchedule: RecurringScheduleSchema.nullable().optional(),
});

const studentIdsSchema = z
	.array(z.string())
	.min(1, "Select at least one student")
	.refine((ids) => new Set(ids).size === ids.length, "Students must be unique");

export const CreateClassSchema = z
	.object({
		courseId: z.string().nullable(),
		name: z.string().trim().nullable().optional(),
		totalHours: z
			.number()
			.positive("Total hours must be greater than 0")
			.optional(),
		studentIds: studentIdsSchema,
	})
	.superRefine((value, ctx) => {
		if (value.courseId === null && !value.name?.trim())
			ctx.addIssue({
				code: "custom",
				path: ["name"],
				message: "Class name is required for a custom class",
			});
		if (value.courseId === null && value.totalHours === undefined)
			ctx.addIssue({
				code: "custom",
				path: ["totalHours"],
				message: "Total hours are required for a custom class",
			});
	});

export const UpdateClassSchema = z.object({
	name: z.string().trim().nullable().optional(),
	totalHours: z
		.number()
		.positive("Total hours must be greater than 0")
		.optional(),
	studentIds: studentIdsSchema.optional(),
});

export const ClassListQuerySchema = z
	.object({
		page: z.coerce.number().int().positive().default(1),
		limit: z.coerce.number().int().positive().max(100).default(10),
		search: z.string().optional(),
		courseId: z.string().optional(),
		classType: z.enum(["custom", "course-linked"]).optional(),
		sortBy: z.enum(["name", "totalHours", "createdAt"]).default("createdAt"),
		sortOrder: z.enum(["asc", "desc"]).default("desc"),
	})
	.superRefine((value, ctx) => {
		if (value.courseId && value.classType) {
			ctx.addIssue({
				code: "custom",
				path: ["classType"],
				message: "courseId and classType cannot be combined",
			});
		}
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

export const ClassSchemaResolver = resolver(ClassSchema);
export const PaginatedClassListSchemaResolver = resolver(
	PaginatedClassListSchema,
);
