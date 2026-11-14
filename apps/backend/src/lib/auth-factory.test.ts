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

function createAuthPrismaStub(overrides: Record<string, unknown> = {}) {
	const prisma = {
		...overrides,
		$extends: () => prisma,
	};

	return prisma as never;
}

function createPrismaWithTutorStatus(status: TutorStatus) {
	return createAuthPrismaStub({
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
	});
}

function createPrismaWithSocialUser({
	emailVerified,
	status,
}: {
	emailVerified: boolean;
	status: TutorStatus;
}) {
	return createAuthPrismaStub({
		user: {
			findUnique: async () => {
				if (status === "missing") return null;

				return {
					emailVerified,
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
	});
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
			createAuthPrismaStub(),
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
			createAuthPrismaStub(),
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
			createAuthPrismaStub(),
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
		expect(auth.options.account?.accountLinking).not.toHaveProperty(
			"trustedProviders",
		);
	});

	test("opens email and configured social signup only outside beta", () => {
		const auth = createAuth(
			createAppConfig({
				BETTER_AUTH_SECRET: "test-secret-with-at-least-thirty-two-characters",
				BETA_ENABLED: "false",
				GOOGLE_CLIENT_ID: "google-client-id",
				GOOGLE_CLIENT_SECRET: "google-client-secret",
				LINE_LOGIN_CHANNEL_ID: "line-channel-id",
				LINE_LOGIN_CHANNEL_SECRET: "line-channel-secret",
				LOG_LEVEL: "silent",
				RESEND_API_KEY: "test-resend-key",
			}),
			createAuthPrismaStub(),
		);

		expect(auth.options.emailAndPassword?.disableSignUp).toBe(false);
		expect(auth.options.socialProviders).toMatchObject({
			google: { disableSignUp: false },
			line: { disableSignUp: false },
		});
	});

	test("does not make the marketing origin a Better Auth trusted origin", () => {
		const marketingOrigin = "https://marketing.example.com";
		const auth = createAuth(
			createAppConfig({
				BETTER_AUTH_SECRET: "test-secret-with-at-least-thirty-two-characters",
				LOG_LEVEL: "silent",
				MARKETING_ORIGIN: marketingOrigin,
				RESEND_API_KEY: "test-resend-key",
			}),
			createAuthPrismaStub(),
		);

		expect(auth.options.trustedOrigins).not.toContain(marketingOrigin);
	});

	test("does not register social providers when credentials are absent", () => {
		const auth = createAuth(
			createAppConfig({
				BETTER_AUTH_SECRET: "test-secret-with-at-least-thirty-two-characters",
				LOG_LEVEL: "silent",
				RESEND_API_KEY: "test-resend-key",
			}),
			createAuthPrismaStub(),
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
			createAuthPrismaStub(),
		);

		expect(Object.keys(auth.options.socialProviders)).toEqual([...providers]);
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

		const result = await before?.({
			id: "account-1",
			providerId,
			accountId: "provider-user-1",
			userId: "user-1",
			accessToken: "access-token",
			refreshToken: "refresh-token",
			idToken: "id-token",
			accessTokenExpiresAt: new Date("2030-01-01T00:00:00.000Z"),
			refreshTokenExpiresAt: new Date("2030-02-01T00:00:00.000Z"),
		});

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

	test("permits exactly one new matching social account from the same callback context", async () => {
		const hooks = createTutorSocialAuthHooks(
			createPrismaWithTutorStatus("student"),
			false,
		);
		const context = { path: "/callback/:id", params: { id: "google" } };
		const account = { providerId: "google", userId: "new-user" };

		expect(
			await hooks.user.create.before({ role: "admin", banned: true }, context),
		).toEqual({
			data: {
				role: "user",
				banned: false,
				banReason: null,
				banExpires: null,
			},
		});
		expect(await hooks.account.create.before(account, context)).toMatchObject({
			data: { providerId: "google", userId: "new-user" },
		});
		expect(await hooks.account.create.before(account, context)).toBe(false);
	});

	test("forces nested Tutor creation for every Better Auth user write", async () => {
		let userCreateExtension:
			| {
					args: { data: Record<string, unknown> };
					query(args: { data: Record<string, unknown> }): Promise<unknown>;
			  }
			| undefined;
		const prisma = createAuthPrismaStub();
		prisma.$extends = (extension: {
			query: { user: { create: typeof userCreateExtension } };
		}) => {
			userCreateExtension = extension.query.user.create;
			return prisma;
		};

		createAuth(
			createAppConfig({
				BETTER_AUTH_SECRET: "test-secret-with-at-least-thirty-two-characters",
				LOG_LEVEL: "silent",
				RESEND_API_KEY: "test-resend-key",
			}),
			prisma,
		);
		expect(userCreateExtension).toBeDefined();

		let received: Record<string, unknown> | undefined;
		await userCreateExtension?.({
			args: {
				data: { email: "admin@example.com", role: "admin", banned: true },
			},
			query: async ({ data }) => {
				received = data;
				return data;
			},
		});
		expect(received).toEqual({
			email: "admin@example.com",
			role: "admin",
			banned: true,
			tutor: { create: {} },
		});
	});

	test("uses the adapter transaction for atomic user, Tutor, and account provisioning", async () => {
		const state = {
			accounts: [] as Record<string, unknown>[],
			tutors: [] as Record<string, unknown>[],
			users: [] as Record<string, unknown>[],
		};
		let failAccountCreate = true;
		let failTutorCreate = true;
		let extension: {
			query: {
				user: {
					create(input: {
						args: { data: Record<string, unknown> };
						query(args: { data: Record<string, unknown> }): Promise<unknown>;
					}): Promise<unknown>;
				};
			};
		};
		const baseUserCreate = async ({
			data,
		}: {
			data: Record<string, unknown>;
		}) => {
			if (data.tutor !== undefined && failTutorCreate) {
				throw new Error("Tutor create failed");
			}
			state.users.push(data);
			if (data.tutor !== undefined) state.tutors.push({ userId: data.id });
			return data;
		};
		const prisma = {
			account: {
				create: async ({ data }: { data: Record<string, unknown> }) => {
					if (failAccountCreate) throw new Error("account create failed");
					state.accounts.push(data);
					return data;
				},
			},
			user: { create: baseUserCreate },
			$extends(value: typeof extension) {
				extension = value;
				return extendedPrisma;
			},
			async $transaction(
				callback: (transaction: typeof extendedPrisma) => Promise<unknown>,
			) {
				const snapshot = structuredClone(state);
				try {
					return await callback(extendedPrisma);
				} catch (error) {
					state.accounts = snapshot.accounts;
					state.tutors = snapshot.tutors;
					state.users = snapshot.users;
					throw error;
				}
			},
		};
		const extendedPrisma = {
			...prisma,
			user: {
				create: (args: { data: Record<string, unknown> }) =>
					extension.query.user.create({ args, query: baseUserCreate }),
			},
		};
		const auth = createAuth(
			createAppConfig({
				BETTER_AUTH_SECRET: "test-secret-with-at-least-thirty-two-characters",
				LOG_LEVEL: "silent",
				RESEND_API_KEY: "test-resend-key",
			}),
			prisma as never,
		);
		const adapter = (auth.options.database as never)(auth.options) as {
			transaction: (
				callback: (transaction: {
					create(args: {
						model: string;
						data: Record<string, unknown>;
					}): Promise<unknown>;
				}) => Promise<unknown>,
			) => Promise<unknown>;
		};
		const provision = () =>
			adapter.transaction(async (transaction) => {
				const user = (await transaction.create({
					model: "user",
					data: { email: "new@example.com", role: "user" },
				})) as { id: string };
				await transaction.create({
					model: "account",
					data: { providerId: "google", userId: user.id },
				});
			});

		await expect(provision()).rejects.toThrow("Tutor create failed");
		expect(state).toEqual({ accounts: [], tutors: [], users: [] });
		failTutorCreate = false;
		await expect(provision()).rejects.toThrow("account create failed");
		expect(state).toEqual({ accounts: [], tutors: [], users: [] });
		failAccountCreate = false;
		await expect(provision()).resolves.toBeUndefined();
		expect(state.users).toHaveLength(1);
		expect(state.tutors).toEqual([{ userId: state.users[0]?.id }]);
		expect(state.accounts).toHaveLength(1);
		expect(state.accounts[0]?.userId).toBe(state.users[0]?.id);
	});

	test("keeps callback markers isolated by context identity, provider, and concurrent use", async () => {
		const hooks = createTutorSocialAuthHooks(
			createPrismaWithTutorStatus("student"),
			false,
		);
		const googleContext = { path: "/callback/:id", params: { id: "google" } };
		const equivalentGoogleContext = {
			path: "/callback/:id",
			params: { id: "google" },
		};
		const lineContext = { path: "/callback/:id", params: { id: "line" } };

		await hooks.user.create.before({}, googleContext);
		expect(
			await hooks.account.create.before(
				{ providerId: "google", userId: "new-user" },
				equivalentGoogleContext,
			),
		).toBe(false);
		expect(
			await hooks.account.create.before(
				{ providerId: "line", userId: "new-user" },
				googleContext,
			),
		).toBe(false);
		expect(
			await hooks.account.create.before(
				{ providerId: "google", userId: "new-user" },
				googleContext,
			),
		).toMatchObject({ data: { providerId: "google" } });

		await hooks.user.create.before({}, lineContext);
		const concurrent = await Promise.all([
			hooks.account.create.before(
				{ providerId: "line", userId: "new-user" },
				lineContext,
			),
			hooks.account.create.before(
				{ providerId: "line", userId: "new-user" },
				lineContext,
			),
		]);
		expect(concurrent.filter((result) => result !== false)).toHaveLength(1);
		expect(concurrent.filter((result) => result === false)).toHaveLength(1);
	});

	test("does not mark non-callback contexts or force fields while beta remains enabled", async () => {
		const betaOff = createTutorSocialAuthHooks(
			createPrismaWithTutorStatus("student"),
			false,
		);
		const betaOn = createTutorSocialAuthHooks(
			createPrismaWithTutorStatus("student"),
			true,
		);

		expect(
			await betaOff.user.create.before(
				{ role: "admin" },
				{ path: "/sign-in/social", body: { provider: "google" } },
			),
		).toBeUndefined();
		expect(
			await betaOff.user.create.before({ role: "admin" }, null),
		).toBeUndefined();
		expect(
			await betaOn.user.create.before(
				{ role: "admin" },
				{ path: "/callback/:id", params: { id: "google" } },
			),
		).toBeUndefined();
	});

	test("redirects only an eligible unverified beta-off callback to the trusted verify-email URL", async () => {
		const redirect = {
			status: 302,
			statusText: "Found",
			location: "https://app.example.com/verify-email?error=EMAIL_NOT_VERIFIED",
		};
		const hooks = createTutorSocialAuthHooks(
			createPrismaWithSocialUser({ emailVerified: false, status: "tutor" }),
			false,
			"https://app.example.com/verify-email",
		);

		await expect(
			hooks.session.create.before(
				{ userId: "new-user" },
				{
					path: "/callback/:id",
					params: { id: "google" },
					redirect: (url) => {
						expect(url).toBe(redirect.location);
						return redirect;
					},
				},
			),
		).rejects.toBe(redirect);
	});

	test.each([
		["banned", "banned" as const],
		["non-tutor", "student" as const],
		["wrong role", "admin" as const],
	])("keeps an unverified %s callback generic", async (_description, status) => {
		let redirected = false;
		const hooks = createTutorSocialAuthHooks(
			createPrismaWithSocialUser({ emailVerified: false, status }),
			false,
			"https://app.example.com/verify-email",
		);

		expect(
			await hooks.session.create.before(
				{ userId: "ineligible-user" },
				{
					path: "/callback/:id",
					params: { id: "line" },
					redirect: () => {
						redirected = true;
						return { status: 302 };
					},
				},
			),
		).toBe(false);
		expect(redirected).toBe(false);
	});

	test("permits verified tutors outside beta and leaves non-social sessions untouched", async () => {
		const hooks = createTutorSocialAuthHooks(
			createPrismaWithSocialUser({ emailVerified: true, status: "tutor" }),
			false,
			"https://app.example.com/verify-email",
		);

		expect(
			await hooks.session.create.before(
				{ userId: "verified-tutor" },
				{ path: "/callback/:id", params: { id: "google" } },
			),
		).toBe(true);
		expect(
			await hooks.session.create.before(
				{ userId: "existing-session" },
				{ path: "/sign-in/email" },
			),
		).toBeUndefined();
	});
});
