import { describe, expect, test } from "bun:test";
import { Prisma } from "@prisma/client";
import type { Auth } from "../lib/auth-factory";
import { AdminUserModel } from "../models/admin-user.model";
import { AdminUserService } from "./admin-user.service";

function user(
	overrides: Partial<Parameters<typeof AdminUserModel.fromPrisma>[0]> = {},
) {
	return AdminUserModel.fromPrisma({
		id: "user-1",
		name: "Ada Lovelace",
		email: "ada@example.com",
		emailVerified: false,
		banned: false,
		createdAt: new Date("2026-08-12T00:00:00.000Z"),
		updatedAt: new Date("2026-08-12T00:00:00.000Z"),
		...overrides,
	});
}

function createRepository(overrides = {}) {
	return {
		findAll: async () => ({
			data: [],
			pagination: {
				total: 0,
				page: 1,
				limit: 20,
				totalPages: 0,
				hasNext: false,
				hasPrev: false,
			},
			summaries: { all: 0, active: 0, deactivated: 0 },
		}),
		findById: async () => user(),
		isEmailInUse: async () => false,
		update: async (_id: string, data: { name?: string; email?: string }) =>
			user({ ...data, emailVerified: data.email ? false : undefined }),
		setPassword: async () => {},
		deactivate: async () => user({ banned: true }),
		reactivate: async () => user({ banned: false }),
		revokeSessions: async () => {},
		...overrides,
	};
}

function createAuth(overrides = {}) {
	return {
		api: {
			createUser: async () => ({ user: { id: "user-1" } }),
			sendVerificationEmail: async () => ({ status: true }),
			...overrides,
		},
	} as unknown as Auth;
}

function knownRequestError(code: "P2002" | "P2022") {
	return new Prisma.PrismaClientKnownRequestError("Database request failed", {
		code,
		clientVersion: Prisma.prismaVersion.client,
		meta: { target: ["email"] },
	});
}

describe("AdminUserService", () => {
	test("maps a concurrent unique email create failure to a conflict", async () => {
		const uniqueError = knownRequestError("P2002");
		const service = new AdminUserService(
			createRepository(),
			createAuth({
				createUser: async () => {
					throw uniqueError;
				},
			}),
			{ emailVerificationCallbackUrl: "https://app.example/verify-email" },
		);

		await expect(
			service.createUser({
				name: "Ada Lovelace",
				email: "ada@example.com",
				password: "password1",
			}),
		).rejects.toEqual(
			expect.objectContaining({
				errorCode: "USER_EMAIL_EXISTS",
				message: "Email is already in use",
				status: 409,
			}),
		);
	});

	test("rejects a duplicate normalized email before creating a Better Auth user", async () => {
		let createCalled = false;
		const service = new AdminUserService(
			createRepository({ isEmailInUse: async () => true }),
			createAuth({
				createUser: async () => {
					createCalled = true;
					return { user: { id: "user-1" } };
				},
			}),
			{ emailVerificationCallbackUrl: "https://app.example/verify-email" },
		);

		await expect(
			service.createUser({
				name: "Ada Lovelace",
				email: " ADA@EXAMPLE.COM ",
				password: "password1",
			}),
		).rejects.toEqual(
			expect.objectContaining({
				errorCode: "USER_EMAIL_EXISTS",
				status: 409,
			}),
		);
		expect(createCalled).toBe(false);
	});

	test("maps a concurrent unique email update failure to a conflict", async () => {
		const uniqueError = knownRequestError("P2002");
		const service = new AdminUserService(
			createRepository({
				update: async () => {
					throw uniqueError;
				},
			}),
			createAuth(),
			{ emailVerificationCallbackUrl: "https://app.example/verify-email" },
		);

		await expect(
			service.updateUser("user-1", { email: "grace@example.com" }),
		).rejects.toEqual(
			expect.objectContaining({
				errorCode: "USER_EMAIL_EXISTS",
				message: "Email is already in use",
				status: 409,
			}),
		);
	});

	test("rethrows unrelated database failures from create and update", async () => {
		const createError = knownRequestError("P2022");
		const createService = new AdminUserService(
			createRepository(),
			createAuth({
				createUser: async () => {
					throw createError;
				},
			}),
			{ emailVerificationCallbackUrl: "https://app.example/verify-email" },
		);
		await expect(
			createService.createUser({
				name: "Ada Lovelace",
				email: "ada@example.com",
				password: "password1",
			}),
		).rejects.toBe(createError);

		const updateError = knownRequestError("P2022");
		const updateService = new AdminUserService(
			createRepository({
				update: async () => {
					throw updateError;
				},
			}),
			createAuth(),
			{ emailVerificationCallbackUrl: "https://app.example/verify-email" },
		);
		await expect(
			updateService.updateUser("user-1", { email: "grace@example.com" }),
		).rejects.toBe(updateError);
	});

	test("creates a regular user with a normalized email when verification delivery fails", async () => {
		const createBodies: unknown[] = [];
		const verificationBodies: unknown[] = [];
		const service = new AdminUserService(
			createRepository(),
			createAuth({
				createUser: async ({ body }: { body: unknown }) => {
					createBodies.push(body);
					return { user: { id: "user-1" } };
				},
				sendVerificationEmail: async ({ body }: { body: unknown }) => {
					verificationBodies.push(body);
					throw new Error("email provider unavailable");
				},
			}),
			{ emailVerificationCallbackUrl: "https://app.example/verify-email" },
		);

		const result = await service.createUser({
			name: "Ada Lovelace",
			email: " ADA@EXAMPLE.COM ",
			password: "password1",
		});

		expect(createBodies).toEqual([
			{
				email: "ada@example.com",
				name: "Ada Lovelace",
				password: "password1",
				role: "user",
			},
		]);
		expect(verificationBodies).toEqual([
			{
				email: "ada@example.com",
				callbackURL: "https://app.example/verify-email",
			},
		]);
		expect(result.verificationSent).toBe(false);
	});

	test("resets verification, revokes sessions, and reports delivery result on email change", async () => {
		const updates: unknown[] = [];
		const revoked: string[] = [];
		const verificationBodies: unknown[] = [];
		const service = new AdminUserService(
			createRepository({
				update: async (id: string, data: unknown) => {
					updates.push({ id, data });
					return user({ email: "grace@example.com", emailVerified: false });
				},
				revokeSessions: async (id: string) => {
					revoked.push(id);
				},
			}),
			createAuth({
				sendVerificationEmail: async ({ body }: { body: unknown }) => {
					verificationBodies.push(body);
					return { status: true };
				},
			}),
			{ emailVerificationCallbackUrl: "https://app.example/verify-email" },
		);

		const result = await service.updateUser("user-1", {
			email: " GRACE@EXAMPLE.COM ",
		});

		expect(updates).toEqual([
			{ id: "user-1", data: { email: "grace@example.com" } },
		]);
		expect(revoked).toEqual(["user-1"]);
		expect(verificationBodies).toEqual([
			{
				email: "grace@example.com",
				callbackURL: "https://app.example/verify-email",
			},
		]);
		expect(result.verificationSent).toBe(true);
	});

	test("updates a name without revoking sessions or re-sending verification", async () => {
		const revoked: string[] = [];
		let verificationCalled = false;
		const service = new AdminUserService(
			createRepository({
				revokeSessions: async (id: string) => {
					revoked.push(id);
				},
			}),
			createAuth({
				sendVerificationEmail: async () => {
					verificationCalled = true;
					return { status: true };
				},
			}),
			{ emailVerificationCallbackUrl: "https://app.example/verify-email" },
		);

		const result = await service.updateUser("user-1", { name: "Grace Hopper" });

		expect(result.verificationSent).toBeNull();
		expect(revoked).toEqual([]);
		expect(verificationCalled).toBe(false);
	});

	test("does not mutate an admin or other non-regular target", async () => {
		let updateCalled = false;
		const service = new AdminUserService(
			createRepository({
				findById: async () => null,
				update: async () => {
					updateCalled = true;
					return user();
				},
			}),
			createAuth(),
			{ emailVerificationCallbackUrl: "https://app.example/verify-email" },
		);

		await expect(
			service.updateUser("admin-1", { name: "Admin" }),
		).rejects.toEqual(
			expect.objectContaining({
				errorCode: "USER_NOT_FOUND",
				status: 404,
			}),
		);
		expect(updateCalled).toBe(false);
	});

	test("only delegates password and lifecycle actions after finding a regular target", async () => {
		const calls: string[] = [];
		const service = new AdminUserService(
			createRepository({
				setPassword: async () => {
					calls.push("password");
				},
				deactivate: async () => {
					calls.push("deactivate");
					return user({ banned: true });
				},
				reactivate: async () => {
					calls.push("reactivate");
					return user({ banned: false });
				},
			}),
			createAuth(),
			{ emailVerificationCallbackUrl: "https://app.example/verify-email" },
		);

		await service.setPassword("user-1", "password1");
		expect(
			(await service.deactivateUser("user-1")).toAdminUserDTO().status,
		).toBe("deactivated");
		expect(
			(await service.reactivateUser("user-1")).toAdminUserDTO().status,
		).toBe("active");
		expect(calls).toEqual(["password", "deactivate", "reactivate"]);
	});

	test("only resends verification for unverified regular users", async () => {
		const service = new AdminUserService(
			createRepository({
				findById: async () => user({ emailVerified: true }),
			}),
			createAuth(),
			{ emailVerificationCallbackUrl: "https://app.example/verify-email" },
		);

		await expect(service.resendVerificationEmail("user-1")).rejects.toEqual(
			expect.objectContaining({
				errorCode: "EMAIL_ALREADY_VERIFIED",
				status: 400,
			}),
		);
	});

	test("returns a delivery failure when an unverified user's resend cannot be sent", async () => {
		const service = new AdminUserService(
			createRepository(),
			createAuth({
				sendVerificationEmail: async () => {
					throw new Error("email provider unavailable");
				},
			}),
			{ emailVerificationCallbackUrl: "https://app.example/verify-email" },
		);

		await expect(service.resendVerificationEmail("user-1")).rejects.toEqual(
			expect.objectContaining({
				errorCode: "VERIFICATION_EMAIL_FAILED",
				status: 502,
			}),
		);
	});
});
