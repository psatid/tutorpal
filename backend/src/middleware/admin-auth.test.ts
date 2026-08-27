import { describe, expect, test } from "bun:test";
import type { Prisma, PrismaClient } from "@prisma/client";
import { IMPERSONATE_USER_PATH } from "../lib/auth-impersonation";
import {
	createAdminAuthTargetGuard,
	createAuthImpersonationGuard,
} from "./admin-auth";

const adminOrigin = "https://admin.example.com";

function createSession(role: string, impersonatedBy?: string) {
	return {
		user: { id: "actor-1", role },
		session: {
			id: "session-1",
			...(impersonatedBy ? { impersonatedBy } : {}),
		},
	};
}

function createImpersonationGuard(
	session: ReturnType<typeof createSession> | null = createSession("admin"),
) {
	let sessionReads = 0;
	const guard = createAuthImpersonationGuard({
		auth: {
			api: {
				getSession: async () => {
					sessionReads += 1;
					return session;
				},
			},
		} as never,
		prisma: {} as PrismaClient,
		adminOrigin,
	});

	return { guard, sessionReads: () => sessionReads };
}

function impersonationStartRequest(pathname: string, method: string) {
	return new Request(`https://api.example${pathname}`, { method });
}

describe("Better Auth admin target guard", () => {
	test("returns 404 when an administrator targets an admin through a direct auth path", async () => {
		const lookups: Prisma.UserFindFirstArgs[] = [];
		const guard = createAdminAuthTargetGuard({
			auth: {
				api: {
					getSession: async () => ({
						user: { id: "actor-1", role: "admin" },
						session: { id: "session-1" },
					}),
				},
			} as never,
			prisma: {
				user: {
					findFirst: async (args: Prisma.UserFindFirstArgs) => {
						lookups.push(args);
						return null;
					},
				},
			} as unknown as PrismaClient,
		});

		const response = await guard(
			new Request("https://api.example/api/auth/admin/ban-user", {
				method: "POST",
				body: JSON.stringify({ userId: "admin-1" }),
			}),
		);

		if (!response) throw new Error("Expected a target guard response");
		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({
			errorCode: "USER_NOT_FOUND",
			message: "User not found",
		});
		expect(lookups).toEqual([
			{ where: { id: "admin-1", role: "user" }, select: { id: true } },
		]);
	});

	test("allows regular targets and leaves unauthenticated or non-admin paths to Better Auth", async () => {
		let lookups = 0;
		const prisma = {
			user: {
				findFirst: async () => {
					lookups += 1;
					return { id: "user-1" };
				},
			},
		} as unknown as PrismaClient;
		const regularTargetGuard = createAdminAuthTargetGuard({
			auth: {
				api: {
					getSession: async () => ({
						user: { id: "actor-1", role: "admin" },
						session: { id: "session-1" },
					}),
				},
			} as never,
			prisma,
		});
		expect(
			await regularTargetGuard(
				new Request("https://api.example/api/auth/admin/get-user?id=user-1"),
			),
		).toBeUndefined();
		expect(lookups).toBe(1);

		const nonAdminGuard = createAdminAuthTargetGuard({
			auth: {
				api: { getSession: async () => null },
			} as never,
			prisma,
		});
		expect(
			await nonAdminGuard(
				new Request("https://api.example/api/auth/admin/get-user?id=admin-1"),
			),
		).toBeUndefined();
		expect(lookups).toBe(1);
	});
});

describe("Better Auth impersonation dispatch guards", () => {
	test("fails closed for every impersonation-start path variant before session lookup", async () => {
		const impersonationGuard = createImpersonationGuard();
		const startPaths = [
			IMPERSONATE_USER_PATH,
			`${IMPERSONATE_USER_PATH}/`,
			`${IMPERSONATE_USER_PATH}/unexpected`,
		];

		for (const pathname of startPaths) {
			for (const method of ["GET", "POST", "PUT"]) {
				const response = await impersonationGuard.guard(
					impersonationStartRequest(pathname, method),
				);
				if (!response) throw new Error("Expected a hidden start response");
				expect(response.status).toBe(404);
				expect(await response.json()).toEqual({
					errorCode: "USER_NOT_FOUND",
					message: "User not found",
				});
			}
		}

		expect(impersonationGuard.sessionReads()).toBe(0);
	});

	test("keeps the admin target guard fail closed for start variants and leaves native stop alone", async () => {
		let sessionReads = 0;
		let targetLookups = 0;
		const targetGuard = createAdminAuthTargetGuard({
			auth: {
				api: {
					getSession: async () => {
						sessionReads += 1;
						return createSession("admin");
					},
				},
			} as never,
			prisma: {
				user: {
					findFirst: async () => {
						targetLookups += 1;
						return { id: "target-1" };
					},
				},
			} as unknown as PrismaClient,
		});
		const startPaths = [
			IMPERSONATE_USER_PATH,
			`${IMPERSONATE_USER_PATH}/`,
			`${IMPERSONATE_USER_PATH}/unexpected`,
		];

		for (const pathname of startPaths) {
			for (const method of ["GET", "POST", "PUT"]) {
				const response = await targetGuard(
					impersonationStartRequest(pathname, method),
				);
				if (!response) throw new Error("Expected a hidden start response");
				expect(response.status).toBe(404);
				expect(await response.json()).toEqual({
					errorCode: "USER_NOT_FOUND",
					message: "User not found",
				});
			}
		}

		expect(sessionReads).toBe(0);
		expect(targetLookups).toBe(0);
		expect(
			await targetGuard(
				new Request("https://api.example/api/auth/admin/stop-impersonating", {
					method: "POST",
				}),
			),
		).toBeUndefined();
	});

	test("leaves native stop available and blocks only impersonated sign-out", async () => {
		const stopGuard = createImpersonationGuard();
		expect(
			await stopGuard.guard(
				new Request("https://api.example/api/auth/admin/stop-impersonating", {
					method: "POST",
				}),
			),
		).toBeUndefined();
		expect(stopGuard.sessionReads()).toBe(0);

		const impersonating = createImpersonationGuard(
			createSession("user", "admin-1"),
		);
		const blocked = await impersonating.guard(
			new Request("https://api.example/api/auth/sign-out", { method: "POST" }),
		);

		if (!blocked) {
			throw new Error("Expected an impersonation sign-out response");
		}
		expect(blocked.status).toBe(403);
		expect(await blocked.json()).toEqual({
			errorCode: "IMPERSONATION_STOP_REQUIRED",
			message: "Stop impersonation before signing out",
		});

		const normal = createImpersonationGuard(createSession("user"));
		expect(
			await normal.guard(
				new Request("https://api.example/api/auth/sign-out", {
					method: "POST",
				}),
			),
		).toBeUndefined();
	});
});
