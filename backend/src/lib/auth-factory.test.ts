import { describe, expect, test } from "bun:test";
import { createAppConfig } from "./app-config";
import { browserAdminRoles, createAuth } from "./auth-factory";

describe("Better Auth browser admin access control", () => {
	test("grants only non-destructive user-management permissions", () => {
		expect(
			browserAdminRoles.admin.authorize({ user: ["delete"] } as never).success,
		).toBe(false);
		expect(
			browserAdminRoles.admin.authorize({ user: ["create", "update", "ban"] })
				.success,
		).toBe(true);
		expect(
			browserAdminRoles.admin.authorize({ session: ["revoke"] } as never)
				.success,
		).toBe(false);
	});

	test("disables Better Auth's direct browser admin mutation paths", async () => {
		const auth = createAuth(
			createAppConfig({
				BETTER_AUTH_SECRET: "test-secret-with-at-least-thirty-two-characters",
				LOG_LEVEL: "silent",
				RESEND_API_KEY: "test-resend-key",
			}),
			{} as never,
		);
		const paths = [
			"/admin/list-users",
			"/admin/create-user",
			"/admin/update-user",
			"/admin/set-role",
			"/admin/ban-user",
			"/admin/unban-user",
			"/admin/remove-user",
			"/admin/set-user-password",
			"/delete-user",
		];

		for (const path of paths) {
			const response = await auth.handler(
				new Request(`http://localhost:5174/api/auth${path}`, {
					method: "POST",
				}),
			);
			expect(response.status).toBe(404);
		}
	});
});
