import { describe, expect, test } from "bun:test";
import { createAppConfig } from "./app-config";
import { browserAdminRoles, createAuth } from "./auth-factory";

describe("Better Auth browser admin access control", () => {
	test("grants impersonation only to the exact browser admin role", () => {
		expect(
			browserAdminRoles.admin.authorize({ user: ["impersonate"] }).success,
		).toBe(true);
		expect(
			browserAdminRoles.user.authorize({ user: ["impersonate"] }).success,
		).toBe(false);
		expect(
			browserAdminRoles.admin.authorize({
				user: ["impersonate-admins"],
			} as never).success,
		).toBe(false);
	});

	test("retains the existing non-destructive user-management boundary", () => {
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

	test("enables only Better Auth's native impersonation routes", async () => {
		const auth = createAuth(
			createAppConfig({
				BETTER_AUTH_SECRET: "test-secret-with-at-least-thirty-two-characters",
				LOG_LEVEL: "silent",
				RESEND_API_KEY: "test-resend-key",
			}),
			{} as never,
		);

		const enabledPaths = [
			"/admin/impersonate-user",
			"/admin/stop-impersonating",
		];
		for (const path of enabledPaths) {
			const response = await auth.handler(
				new Request(`http://localhost:5174/api/auth${path}`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ userId: "target-1" }),
				}),
			);
			expect(response.status).toBe(401);
		}

		const disabledPaths = [
			"/admin/list-users",
			"/admin/create-user",
			"/admin/update-user",
			"/admin/set-role",
			"/admin/get-user",
			"/admin/list-user-sessions",
			"/admin/ban-user",
			"/admin/unban-user",
			"/admin/revoke-user-session",
			"/admin/revoke-user-sessions",
			"/admin/remove-user",
			"/admin/set-user-password",
			"/admin/has-permission",
			"/delete-user",
			"/delete-user/callback",
		];

		for (const path of disabledPaths) {
			const response = await auth.handler(
				new Request(`http://localhost:5174/api/auth${path}`, {
					method: "POST",
				}),
			);
			expect(response.status).toBe(404);
		}
	});
});
