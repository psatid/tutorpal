import { resolver } from "hono-openapi";
import { z } from "zod";

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
	totalHours: z.number().int(),
	students: z.array(StudentInClassSchema),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

// Request schemas
export const CreateClassSchema = z.object({
	name: z.string().min(1, "Name is required"),
	totalHours: z.number().int().min(1, "Total hours must be at least 1"),
	studentIds: z.array(z.string()).optional(),
});

export const UpdateClassSchema = z.object({
	name: z.string().min(1, "Name is required").optional(),
	totalHours: z.number().int().min(1, "Total hours must be at least 1").optional(),
	studentIds: z.array(z.string()).optional(),
});

// OpenAPI resolvers
export const StudentInClassSchemaResolver = resolver(StudentInClassSchema);
export const ClassSchemaResolver = resolver(ClassSchema);
export const CreateClassSchemaResolver = resolver(CreateClassSchema);
export const UpdateClassSchemaResolver = resolver(UpdateClassSchema);
export const ClassListSchemaResolver = resolver(z.array(ClassSchema));

// Type exports
export type ClassSchemaType = z.infer<typeof ClassSchema>;
export type CreateClassSchemaType = z.infer<typeof CreateClassSchema>;
export type UpdateClassSchemaType = z.infer<typeof UpdateClassSchema>;
export type StudentInClassSchemaType = z.infer<typeof StudentInClassSchema>;
