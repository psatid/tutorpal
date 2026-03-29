import { resolver } from "hono-openapi";
import { z } from "zod";

// Base student schema (matches Prisma model)
export const StudentSchema = z.object({
	id: z.string(),
	name: z.string(),
	phoneNumber: z.string().nullable(),
	grade: z.number().int(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
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

// OpenAPI resolvers
export const StudentSchemaResolver = resolver(StudentSchema);
export const CreateStudentSchemaResolver = resolver(CreateStudentSchema);
export const UpdateStudentSchemaResolver = resolver(UpdateStudentSchema);
export const StudentListSchemaResolver = resolver(z.array(StudentSchema));

// Type exports
export type StudentSchemaType = z.infer<typeof StudentSchema>;
export type CreateStudentSchemaType = z.infer<typeof CreateStudentSchema>;
export type UpdateStudentSchemaType = z.infer<typeof UpdateStudentSchema>;
