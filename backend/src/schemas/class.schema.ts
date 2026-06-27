import { resolver } from "hono-openapi";
import { z } from "zod";
import { RecurringScheduleSchema } from "./schedule.schema";

// Student in class schema
export const StudentInClassSchema = z.object({
	id: z.string(),
	name: z.string(),
	phoneNumber: z.string().nullable(),
	grade: z.number().int(),
});

// Base class schema (matches Prisma model with relations)
export const ClassSchema = z.object({
	id: z.string(),
	name: z.string(),
	totalHours: z.number(),
	students: z.array(StudentInClassSchema),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
	remainingHours: z.number().optional(),
	recurringSchedule: RecurringScheduleSchema.nullable().optional(),
});

// Request schemas
export const CreateClassSchema = z.object({
	name: z.string().min(1, "Name is required"),
	totalHours: z.number().min(1, "Total hours must be at least 1"),
	studentIds: z.array(z.string()).optional(),
});

export const UpdateClassSchema = z.object({
	name: z.string().min(1, "Name is required").optional(),
	totalHours: z.number().min(1, "Total hours must be at least 1").optional(),
	studentIds: z.array(z.string()).optional(),
});

// Query schemas for pagination and search
export const ClassListQuerySchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(10),
	search: z.string().optional(),
	sortBy: z.enum(["name", "totalHours", "createdAt"]).default("createdAt"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Paginated response schema
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

// OpenAPI resolvers
export const StudentInClassSchemaResolver = resolver(StudentInClassSchema);
export const ClassSchemaResolver = resolver(ClassSchema);
export const CreateClassSchemaResolver = resolver(CreateClassSchema);
export const UpdateClassSchemaResolver = resolver(UpdateClassSchema);
export const ClassListQuerySchemaResolver = resolver(ClassListQuerySchema);
export const PaginatedClassListSchemaResolver = resolver(
	PaginatedClassListSchema,
);
export const ClassListSchemaResolver = resolver(z.array(ClassSchema));

// Type exports
export type ClassSchemaType = z.infer<typeof ClassSchema>;
export type CreateClassSchemaType = z.infer<typeof CreateClassSchema>;
export type UpdateClassSchemaType = z.infer<typeof UpdateClassSchema>;
export type StudentInClassSchemaType = z.infer<typeof StudentInClassSchema>;
