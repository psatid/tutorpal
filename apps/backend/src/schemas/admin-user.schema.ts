import { resolver } from "hono-openapi";
import { z } from "zod";

export const AdminUserStatusSchema = z.enum(["active", "deactivated"]);
export const AdminUserListStatusSchema = z.enum([
	"all",
	"active",
	"deactivated",
]);

export const AdminUserSchema = z
	.object({
		id: z.string(),
		name: z.string(),
		email: z.string().email(),
		emailVerified: z.boolean(),
		status: AdminUserStatusSchema,
		createdAt: z.string().datetime(),
		updatedAt: z.string().datetime(),
	})
	.strict();

export const AdminUserListQuerySchema = z
	.object({
		page: z.coerce.number().int().positive().default(1),
		limit: z.coerce.number().int().positive().max(100).default(20),
		search: z.string().trim().max(120).optional(),
		status: AdminUserListStatusSchema.default("all"),
	})
	.strict();

export const CreateAdminUserSchema = z
	.object({
		name: z.string().trim().min(1, "Name is required").max(120),
		email: z.string().trim().max(254).email("Invalid email address"),
		password: z.string().min(8).max(128),
	})
	.strict();

export const UpdateAdminUserSchema = z
	.object({
		name: z.string().trim().min(1, "Name is required").max(120).optional(),
		email: z.string().trim().max(254).email("Invalid email address").optional(),
	})
	.strict()
	.refine((data) => data.name !== undefined || data.email !== undefined, {
		message: "At least one field is required",
	});

export const SetAdminUserPasswordSchema = z
	.object({
		newPassword: z.string().min(8).max(128),
	})
	.strict();

export const AdminUserMutationResponseSchema = z
	.object({
		user: AdminUserSchema,
		verificationSent: z.boolean().nullable(),
	})
	.strict();

export const AdminUserListSchema = z
	.object({
		data: z.array(AdminUserSchema),
		pagination: z.object({
			total: z.number().int().nonnegative(),
			page: z.number().int().positive(),
			limit: z.number().int().positive(),
			totalPages: z.number().int().nonnegative(),
			hasNext: z.boolean(),
			hasPrev: z.boolean(),
		}),
		summaries: z.object({
			all: z.number().int().nonnegative(),
			active: z.number().int().nonnegative(),
			deactivated: z.number().int().nonnegative(),
		}),
	})
	.strict();

export const AdminUserStatusMutationResponseSchema = z
	.object({ user: AdminUserSchema })
	.strict();

export const AdminUserPasswordResponseSchema = z
	.object({ success: z.literal(true), sessionsRevoked: z.literal(true) })
	.strict();

export const AdminUserVerificationResponseSchema = z
	.object({ verificationSent: z.literal(true) })
	.strict();

export const AdminUserSchemaResolver = resolver(AdminUserSchema);
export const AdminUserListSchemaResolver = resolver(AdminUserListSchema);
export const AdminUserMutationResponseSchemaResolver = resolver(
	AdminUserMutationResponseSchema,
);
export const AdminUserStatusMutationResponseSchemaResolver = resolver(
	AdminUserStatusMutationResponseSchema,
);
export const AdminUserPasswordResponseSchemaResolver = resolver(
	AdminUserPasswordResponseSchema,
);
export const AdminUserVerificationResponseSchemaResolver = resolver(
	AdminUserVerificationResponseSchema,
);

export type AdminUserListQuerySchemaType = z.infer<
	typeof AdminUserListQuerySchema
>;
export type CreateAdminUserSchemaType = z.infer<typeof CreateAdminUserSchema>;
export type UpdateAdminUserSchemaType = z.infer<typeof UpdateAdminUserSchema>;
