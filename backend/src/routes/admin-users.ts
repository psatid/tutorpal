import { Hono, type MiddlewareHandler } from "hono";
import { describeRoute, validator } from "hono-openapi";
import {
	AdminUserListQuerySchema,
	AdminUserListSchemaResolver,
	AdminUserMutationResponseSchemaResolver,
	AdminUserPasswordResponseSchemaResolver,
	AdminUserStatusMutationResponseSchemaResolver,
	AdminUserVerificationResponseSchemaResolver,
	CreateAdminUserSchema,
	SetAdminUserPasswordSchema,
	UpdateAdminUserSchema,
} from "../schemas/admin-user.schema";
import type { AdminUserService } from "../services/admin-user.service";
import type { AppEnv } from "../types/hono-env";

export type AdminUserRouteDependencies = {
	requireAdmin: MiddlewareHandler<AppEnv>;
	requireAdminOrigin: MiddlewareHandler<AppEnv>;
	adminUserService: AdminUserService;
};

export function createAdminUserRoutes({
	requireAdmin,
	requireAdminOrigin,
	adminUserService,
}: AdminUserRouteDependencies) {
	return new Hono<AppEnv>()
		.use(requireAdmin)
		.get(
			"/",
			describeRoute({
				tags: ["admin-users"],
				description: "List regular users for administration",
				responses: {
					200: {
						description: "Paginated regular users",
						content: {
							"application/json": { schema: AdminUserListSchemaResolver },
						},
					},
				},
			}),
			validator("query", AdminUserListQuerySchema),
			async (c) => {
				const users = await adminUserService.getAllUsers(c.req.valid("query"));
				return c.json({
					data: users.data.map((user) => user.toAdminUserDTO()),
					pagination: users.pagination,
					summaries: users.summaries,
				});
			},
		)
		.post(
			"/",
			requireAdminOrigin,
			describeRoute({
				tags: ["admin-users"],
				description: "Create a regular user",
				responses: {
					201: {
						description: "Regular user created",
						content: {
							"application/json": {
								schema: AdminUserMutationResponseSchemaResolver,
							},
						},
					},
				},
			}),
			validator("json", CreateAdminUserSchema),
			async (c) => {
				const result = await adminUserService.createUser(c.req.valid("json"));
				return c.json(
					{
						user: result.user.toAdminUserDTO(),
						verificationSent: result.verificationSent,
					},
					201,
				);
			},
		)
		.patch(
			"/:id",
			requireAdminOrigin,
			describeRoute({
				tags: ["admin-users"],
				description: "Update a regular user",
				responses: {
					200: {
						description: "Regular user updated",
						content: {
							"application/json": {
								schema: AdminUserMutationResponseSchemaResolver,
							},
						},
					},
				},
			}),
			validator("json", UpdateAdminUserSchema),
			async (c) => {
				const result = await adminUserService.updateUser(
					c.req.param("id"),
					c.req.valid("json"),
				);
				return c.json({
					user: result.user.toAdminUserDTO(),
					verificationSent: result.verificationSent,
				});
			},
		)
		.post(
			"/:id/password",
			requireAdminOrigin,
			describeRoute({
				tags: ["admin-users"],
				description: "Set a regular user's password and revoke sessions",
				responses: {
					200: {
						description: "Password set",
						content: {
							"application/json": {
								schema: AdminUserPasswordResponseSchemaResolver,
							},
						},
					},
				},
			}),
			validator("json", SetAdminUserPasswordSchema),
			async (c) => {
				await adminUserService.setPassword(
					c.req.param("id"),
					c.req.valid("json").newPassword,
				);
				return c.json({ success: true, sessionsRevoked: true });
			},
		)
		.post(
			"/:id/deactivate",
			requireAdminOrigin,
			describeRoute({
				tags: ["admin-users"],
				description: "Reversibly deactivate a regular user",
				responses: {
					200: {
						description: "Regular user deactivated",
						content: {
							"application/json": {
								schema: AdminUserStatusMutationResponseSchemaResolver,
							},
						},
					},
				},
			}),
			async (c) => {
				const user = await adminUserService.deactivateUser(c.req.param("id"));
				return c.json({ user: user.toAdminUserDTO() });
			},
		)
		.post(
			"/:id/reactivate",
			requireAdminOrigin,
			describeRoute({
				tags: ["admin-users"],
				description: "Reactivate a regular user",
				responses: {
					200: {
						description: "Regular user reactivated",
						content: {
							"application/json": {
								schema: AdminUserStatusMutationResponseSchemaResolver,
							},
						},
					},
				},
			}),
			async (c) => {
				const user = await adminUserService.reactivateUser(c.req.param("id"));
				return c.json({ user: user.toAdminUserDTO() });
			},
		)
		.post(
			"/:id/verification",
			requireAdminOrigin,
			describeRoute({
				tags: ["admin-users"],
				description: "Resend verification to an unverified regular user",
				responses: {
					200: {
						description: "Verification delivery attempted",
						content: {
							"application/json": {
								schema: AdminUserVerificationResponseSchemaResolver,
							},
						},
					},
				},
			}),
			async (c) => {
				const id = c.req.param("id");
				const verificationSent =
					await adminUserService.resendVerificationEmail(id);
				return c.json({ verificationSent });
			},
		);
}
