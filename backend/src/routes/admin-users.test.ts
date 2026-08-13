import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import {
	createRequireAdmin,
	createRequireAdminOrigin,
} from "../middleware/admin-auth";
import { errorHandler } from "../middleware/error-handler";
import { AdminUserModel } from "../models/admin-user.model";
import type { AppEnv } from "../types/hono-env";
import { createAdminUserRoutes } from "./admin-users";

const adminOrigin = "https://admin.example.com";
const createdAt = new Date("2026-08-12T00:00:00.000Z");
const regularUser = AdminUserModel.fromPrisma({
	id: "user-1",
	name: "Ada Lovelace",
	email: "ada@example.com",
	emailVerified: false,
	banned: false,
	createdAt,
	updatedAt: createdAt,
});

function createApp(role: "admin" | "user" | null = "admin") {
	const calls: Array<{ name: string; value?: unknown }> = [];
	const auth = {
		api: {
			getSession: async () =>
				role
					? { user: { id: "actor-1", role }, session: { id: "session-1" } }
					: null,
		},
	} as never;
	const service = {
		getAllUsers: async (params: unknown) => {
			calls.push({ name: "list", value: params });
			return {
				data: [regularUser],
				pagination: {
					total: 1,
					page: 1,
					limit: 20,
					totalPages: 1,
					hasNext: false,
					hasPrev: false,
				},
				summaries: { all: 1, active: 1, deactivated: 0 },
			};
		},
		createUser: async (data: unknown) => {
			calls.push({ name: "create", value: data });
			return { user: regularUser, verificationSent: true };
		},
		updateUser: async (id: string, data: unknown) => {
			calls.push({ name: "update", value: { id, data } });
			return { user: regularUser, verificationSent: null };
		},
		setPassword: async (id: string, password: string) => {
			calls.push({ name: "password", value: { id, password } });
		},
		deactivateUser: async (id: string) => {
			calls.push({ name: "deactivate", value: id });
			return regularUser;
		},
		reactivateUser: async (id: string) => {
			calls.push({ name: "reactivate", value: id });
			return regularUser;
		},
		resendVerificationEmail: async (id: string) => {
			calls.push({ name: "verification", value: id });
			return true;
		},
		getUserById: async () => regularUser,
	} as never;
	const app = new Hono<AppEnv>();
	app.onError(errorHandler);
	app.route(
		"/v1/admin/users",
		createAdminUserRoutes({
			requireAdmin: createRequireAdmin({ auth }),
			requireAdminOrigin: createRequireAdminOrigin(adminOrigin),
			adminUserService: service,
		}),
	);
	return { app, calls };
}

describe("admin user routes", () => {
	test("serializes the API-facing regular-user model with UTC timestamps", () => {
		expect(regularUser.toAdminUserDTO()).toEqual({
			id: "user-1",
			name: "Ada Lovelace",
			email: "ada@example.com",
			emailVerified: false,
			status: "active",
			createdAt: "2026-08-12T00:00:00.000Z",
			updatedAt: "2026-08-12T00:00:00.000Z",
		});
	});

	test("returns 401 for unauthenticated requests and 403 for non-admin sessions", async () => {
		const unauthenticated = createApp(null);
		const unauthenticatedResponse = await unauthenticated.app.request(
			"https://api.example/v1/admin/users",
		);
		expect(unauthenticatedResponse.status).toBe(401);
		expect(await unauthenticatedResponse.json()).toEqual({
			errorCode: "UNAUTHORIZED",
			message: "Authentication required",
		});

		const regular = createApp("user");
		const regularResponse = await regular.app.request(
			"https://api.example/v1/admin/users",
		);
		expect(regularResponse.status).toBe(403);
		expect(await regularResponse.json()).toEqual({
			errorCode: "ADMIN_REQUIRED",
			message: "Administrator access required",
		});
	});

	test("allows an admin to list regular users without an Origin header", async () => {
		const { app, calls } = createApp();
		const response = await app.request(
			"https://api.example/v1/admin/users?status=active",
			{ headers: { Authorization: "Bearer session" } },
		);

		expect(response.status).toBe(200);
		expect(calls).toEqual([
			{
				name: "list",
				value: { page: 1, limit: 20, status: "active" },
			},
		]);
		expect(await response.json()).toEqual({
			data: [regularUser.toAdminUserDTO()],
			pagination: {
				total: 1,
				page: 1,
				limit: 20,
				totalPages: 1,
				hasNext: false,
				hasPrev: false,
			},
			summaries: { all: 1, active: 1, deactivated: 0 },
		});
	});

	test("passes normalized list filters and rejects invalid pagination and status", async () => {
		const { app, calls } = createApp();
		const response = await app.request(
			"https://api.example/v1/admin/users?page=2&limit=5&search=%20Ada%20&status=deactivated",
		);

		expect(response.status).toBe(200);
		expect(calls).toEqual([
			{
				name: "list",
				value: { page: 2, limit: 5, search: "Ada", status: "deactivated" },
			},
		]);

		const invalidPage = await app.request(
			"https://api.example/v1/admin/users?page=0",
		);
		expect(invalidPage.status).toBe(400);

		const invalidStatus = await app.request(
			"https://api.example/v1/admin/users?status=disabled",
		);
		expect(invalidStatus.status).toBe(400);
	});

	test("rejects regular sessions and state changes without the configured admin Origin", async () => {
		const regular = createApp("user");
		const regularResponse = await regular.app.request(
			"https://api.example/v1/admin/users",
		);
		expect(regularResponse.status).toBe(403);

		const admin = createApp();
		const originResponse = await admin.app.request(
			"https://api.example/v1/admin/users",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: "Ada Lovelace",
					email: "ada@example.com",
					password: "password1",
				}),
			},
		);
		expect(originResponse.status).toBe(403);
		expect(admin.calls).toEqual([]);
	});

	test("serves every state-changing route only from the configured admin origin", async () => {
		const { app, calls } = createApp();
		const requests = [
			app.request("https://api.example/v1/admin/users/user-1", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: "Grace Hopper" }),
			}),
			app.request("https://api.example/v1/admin/users/user-1/password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ newPassword: "password1" }),
			}),
			app.request("https://api.example/v1/admin/users/user-1/deactivate", {
				method: "POST",
			}),
			app.request("https://api.example/v1/admin/users/user-1/reactivate", {
				method: "POST",
			}),
			app.request("https://api.example/v1/admin/users/user-1/verification", {
				method: "POST",
			}),
		];

		for (const response of await Promise.all(requests)) {
			expect(response.status).toBe(403);
			expect(await response.json()).toEqual({
				errorCode: "ADMIN_ORIGIN_REQUIRED",
				message: "Invalid request origin",
			});
		}
		expect(calls).toEqual([]);
	});

	test("handles create, update, password, lifecycle, and resend operations", async () => {
		const { app, calls } = createApp();
		const headers = {
			"Content-Type": "application/json",
			Origin: adminOrigin,
		};

		const create = await app.request("https://api.example/v1/admin/users", {
			method: "POST",
			headers,
			body: JSON.stringify({
				name: "  Ada Lovelace  ",
				email: "ADA@EXAMPLE.COM",
				password: "password1",
			}),
		});
		expect(create.status).toBe(201);
		expect(await create.json()).toEqual({
			user: regularUser.toAdminUserDTO(),
			verificationSent: true,
		});

		const update = await app.request(
			"https://api.example/v1/admin/users/user-1",
			{
				method: "PATCH",
				headers,
				body: JSON.stringify({ name: "  Grace Hopper  " }),
			},
		);
		expect(update.status).toBe(200);
		expect(await update.json()).toEqual({
			user: regularUser.toAdminUserDTO(),
			verificationSent: null,
		});

		const password = await app.request(
			"https://api.example/v1/admin/users/user-1/password",
			{
				method: "POST",
				headers,
				body: JSON.stringify({ newPassword: "password1" }),
			},
		);
		expect(password.status).toBe(200);
		expect(await password.json()).toEqual({
			success: true,
			sessionsRevoked: true,
		});

		for (const path of ["deactivate", "reactivate", "verification"]) {
			const response = await app.request(
				`https://api.example/v1/admin/users/user-1/${path}`,
				{ method: "POST", headers: { Origin: adminOrigin } },
			);
			expect(response.status).toBe(200);
		}

		expect(calls).toEqual([
			{
				name: "create",
				value: {
					name: "Ada Lovelace",
					email: "ADA@EXAMPLE.COM",
					password: "password1",
				},
			},
			{
				name: "update",
				value: { id: "user-1", data: { name: "Grace Hopper" } },
			},
			{ name: "password", value: { id: "user-1", password: "password1" } },
			{ name: "deactivate", value: "user-1" },
			{ name: "reactivate", value: "user-1" },
			{ name: "verification", value: "user-1" },
		]);
	});

	test("validates strict create input before invoking the service", async () => {
		const { app, calls } = createApp();
		const response = await app.request("https://api.example/v1/admin/users", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Origin: adminOrigin,
			},
			body: JSON.stringify({
				name: "Ada Lovelace",
				email: "ada@example.com",
				password: "password1",
				role: "admin",
			}),
		});

		expect(response.status).toBe(400);
		expect(calls).toEqual([]);

		const invalidPassword = await app.request(
			"https://api.example/v1/admin/users",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Origin: adminOrigin,
				},
				body: JSON.stringify({
					name: "Ada Lovelace",
					email: "ada@example.com",
					password: "short",
				}),
			},
		);
		expect(invalidPassword.status).toBe(400);

		const emptyUpdate = await app.request(
			"https://api.example/v1/admin/users/user-1",
			{
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Origin: adminOrigin,
				},
				body: JSON.stringify({}),
			},
		);
		expect(emptyUpdate.status).toBe(400);
		expect(calls).toEqual([]);
	});
});
