import { describe, expect, test } from "bun:test";
import { createAppConfig } from "./app-config";
import {
	browserAdminRoles,
	createAuth,
	createTutorSocialAuthHooks,
} from "./auth-factory";

type TutorStatus =
	| "banned"
	| "tutor"
	| "admin"
	| "student"
	| "unknown"
	| "missing";

function createPrismaWithTutorStatus(status: TutorStatus) {
	return {
		user: {
			findUnique: async () => {
				if (status === "missing") {
					return null;
				}

				return {
					role:
						status === "admin"
							? "admin"
							: status === "unknown"
								? "unknown"
								: "user",
					banned: status === "banned",
					tutor: status === "tutor" ? { id: "tutor-1" } : null,
				};
			},
		},
	} as never;
}

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

describe("Better Auth social login configuration", () => {
	test("disables the native social-account linking endpoint", async () => {
		const auth = createAuth(
			createAppConfig({
				BETTER_AUTH_SECRET: "test-secret-with-at-least-thirty-two-characters",
				LOG_LEVEL: "silent",
				RESEND_API_KEY: "test-resend-key",
				GOOGLE_CLIENT_ID: "google-client-id",
				GOOGLE_CLIENT_SECRET: "google-client-secret",
				LINE_LOGIN_CHANNEL_ID: "line-channel-id",
				LINE_LOGIN_CHANNEL_SECRET: "line-channel-secret",
			}),
			{} as never,
		);

		const response = await auth.handler(
			new Request("http://localhost:5174/api/auth/link-social", {
				method: "POST",
			}),
		);

		expect(response.status).toBe(404);
	});

	test("registers only configured providers with the restricted account policy", () => {
		const auth = createAuth(
			createAppConfig({
				BETTER_AUTH_SECRET: "test-secret-with-at-least-thirty-two-characters",
				LOG_LEVEL: "silent",
				RESEND_API_KEY: "test-resend-key",
				GOOGLE_CLIENT_ID: "google-client-id",
				GOOGLE_CLIENT_SECRET: "google-client-secret",
				LINE_LOGIN_CHANNEL_ID: "line-channel-id",
				LINE_LOGIN_CHANNEL_SECRET: "line-channel-secret",
			}),
			{} as never,
		);

		expect(auth.options.socialProviders).toEqual({
			google: {
				clientId: "google-client-id",
				clientSecret: "google-client-secret",
				disableSignUp: true,
			},
			line: {
				clientId: "line-channel-id",
				clientSecret: "line-channel-secret",
				disableSignUp: true,
			},
		});
		expect(auth.options.account).toMatchObject({
			encryptOAuthTokens: true,
			updateAccountOnSignIn: false,
			accountLinking: {
				allowDifferentEmails: false,
			},
		});
		expect(
			auth.options.account?.accountLinking?.trustedProviders,
		).toBeUndefined();
	});

	test("does not register social providers when credentials are absent", () => {
		const auth = createAuth(
			createAppConfig({
				BETTER_AUTH_SECRET: "test-secret-with-at-least-thirty-two-characters",
				LOG_LEVEL: "silent",
				RESEND_API_KEY: "test-resend-key",
			}),
			{} as never,
		);

		expect(auth.options.socialProviders).toEqual({});
	});

	test.each([
		[
			{
				GOOGLE_CLIENT_ID: "google-client-id",
				GOOGLE_CLIENT_SECRET: "google-client-secret",
			},
			["google"],
		],
		[
			{
				LINE_LOGIN_CHANNEL_ID: "line-channel-id",
				LINE_LOGIN_CHANNEL_SECRET: "line-channel-secret",
			},
			["line"],
		],
	] as const)("registers only the enabled provider", (credentials, providers) => {
		const auth = createAuth(
			createAppConfig({
				BETTER_AUTH_SECRET: "test-secret-with-at-least-thirty-two-characters",
				LOG_LEVEL: "silent",
				RESEND_API_KEY: "test-resend-key",
				...credentials,
			}),
			{} as never,
		);

		expect(Object.keys(auth.options.socialProviders)).toEqual(providers);
	});
});

describe("Better Auth tutor-only social hooks", () => {
	test.each([
		["google"],
		["line"],
	])("uses the same credential-scrubbing account hook for %s", async (providerId) => {
		const hooks = createTutorSocialAuthHooks(
			createPrismaWithTutorStatus("tutor"),
		);

		expect(
			await hooks.account.create.before({ providerId, userId: "user-1" }),
		).toMatchObject({
			data: {
				providerId,
				userId: "user-1",
				accessToken: null,
				refreshToken: null,
				idToken: null,
				accessTokenExpiresAt: null,
				refreshTokenExpiresAt: null,
			},
		});
	});

	test.each([
		["tutor", true],
		["banned", false],
		["admin", false],
		["student", false],
		["unknown", false],
		["missing", false],
	] as const)("allows social account creation only for a %s", async (status, allowed) => {
		const hooks = createTutorSocialAuthHooks(
			createPrismaWithTutorStatus(status),
		);

		const result = await hooks.account.create.before({
			providerId: "google",
			userId: "user-1",
		});
		if (allowed) {
			expect(result).toMatchObject({ data: { providerId: "google" } });
		} else {
			expect(result).toBe(false);
		}
	});

	test.each([
		"google",
		"line",
	])("removes OAuth credentials through the configured account create hook for %s", async (providerId) => {
		const auth = createAuth(
			createAppConfig({
				BETTER_AUTH_SECRET: "test-secret-with-at-least-thirty-two-characters",
				LOG_LEVEL: "silent",
				RESEND_API_KEY: "test-resend-key",
			}),
			createPrismaWithTutorStatus("tutor"),
		);
		const before = auth.options.databaseHooks?.account?.create?.before;
		expect(before).toBeDefined();

		const result = await before?.(
			{
				id: "account-1",
				providerId,
				accountId: "provider-user-1",
				userId: "user-1",
				accessToken: "access-token",
				refreshToken: "refresh-token",
				idToken: "id-token",
				accessTokenExpiresAt: new Date("2030-01-01T00:00:00.000Z"),
				refreshTokenExpiresAt: new Date("2030-02-01T00:00:00.000Z"),
			},
			null,
		);

		expect(result).toMatchObject({
			data: {
				id: "account-1",
				providerId,
				accountId: "provider-user-1",
				userId: "user-1",
				accessToken: null,
				refreshToken: null,
				idToken: null,
				accessTokenExpiresAt: null,
				refreshTokenExpiresAt: null,
			},
		});
	});

	test.each([
		["google"],
		["line"],
	])("uses the same callback hook for %s", async (providerId) => {
		const hooks = createTutorSocialAuthHooks(
			createPrismaWithTutorStatus("tutor"),
		);

		expect(
			await hooks.session.create.before(
				{ userId: "user-1" },
				{ path: "/callback/:id", params: { id: providerId } },
			),
		).toBe(true);
	});

	test.each([
		["tutor", true],
		["banned", false],
		["admin", false],
		["student", false],
		["unknown", false],
		["missing", false],
	] as const)("allows social callback sessions only for a %s", async (status, allowed) => {
		const hooks = createTutorSocialAuthHooks(
			createPrismaWithTutorStatus(status),
		);

		expect(
			await hooks.session.create.before(
				{ userId: "user-1" },
				{ path: "/callback/:id", params: { id: "google" } },
			),
		).toBe(allowed);
	});

	test("applies the same tutor gate to social sign-in without affecting password sessions", async () => {
		const hooks = createTutorSocialAuthHooks(
			createPrismaWithTutorStatus("admin"),
		);

		expect(
			await hooks.session.create.before(
				{ userId: "user-1" },
				{ path: "/sign-in/social", body: { provider: "line" } },
			),
		).toBe(false);
		expect(
			await hooks.session.create.before(
				{ userId: "user-1" },
				{ path: "/sign-in/email" },
			),
		).toBeUndefined();
		expect(
			await hooks.account.create.before({
				providerId: "credential",
				userId: "user-1",
			}),
		).toBeUndefined();
	});
});
