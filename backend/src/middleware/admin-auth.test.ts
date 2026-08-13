import { describe, expect, test } from "bun:test";
import type { Prisma, PrismaClient } from "@prisma/client";
import { createAdminAuthTargetGuard } from "./admin-auth";

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
