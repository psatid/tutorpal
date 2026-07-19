import { resolver } from "hono-openapi";
import { z } from "zod";

// Class in student schema (for detail view)
export const ClassInStudentSchema = z.object({
	id: z.string(),
	name: z.string().nullable(),
	displayName: z.string(),
	course: z.object({ id: z.string(), name: z.string() }).nullable(),
	totalHours: z.number(),
	remainingHours: z.number().optional(),
});

// Base student schema (matches Prisma model)
export const StudentSchema = z.object({
	id: z.string(),
	name: z.string(),
	phoneNumber: z.string().nullable(),
	grade: z.number().int(),
	lineUserId: z.string().nullable(),
	lineConnectionId: z.string().uuid().nullable(),
	lineLinkStatus: z.enum(["linked", "needs_relink", "not_linked"]),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

// Student detail schema (includes classes)
export const StudentDetailSchema = StudentSchema.extend({
	classes: z.array(ClassInStudentSchema),
});

// Request schemas
export const CreateStudentSchema = z.object({
	name: z.string().min(1, "Name is required"),
	phoneNumber: z.string().optional(),
	grade: z.number().int(),
});

export const UpdateStudentSchema = z.object({
	name: z.string().min(1, "Name is required").optional(),
	phoneNumber: z.string().optional(),
	grade: z.number().int().optional(),
});

// Query schemas for pagination and search
export const StudentListQuerySchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(10),
	search: z.string().optional(),
	sortBy: z
		.enum(["name", "phoneNumber", "grade", "createdAt"])
		.default("createdAt"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Paginated response schema
export const PaginatedStudentListSchema = z.object({
	data: z.array(StudentSchema),
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
export const StudentSchemaResolver = resolver(StudentSchema);
export const StudentDetailSchemaResolver = resolver(StudentDetailSchema);
export const CreateStudentSchemaResolver = resolver(CreateStudentSchema);
export const UpdateStudentSchemaResolver = resolver(UpdateStudentSchema);
export const StudentListQuerySchemaResolver = resolver(StudentListQuerySchema);
export const PaginatedStudentListSchemaResolver = resolver(
	PaginatedStudentListSchema,
);

// Type exports
export type StudentSchemaType = z.infer<typeof StudentSchema>;
export type StudentDetailSchemaType = z.infer<typeof StudentDetailSchema>;
export type CreateStudentSchemaType = z.infer<typeof CreateStudentSchema>;
export type UpdateStudentSchemaType = z.infer<typeof UpdateStudentSchema>;
