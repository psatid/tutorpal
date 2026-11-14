import type { PrismaClient } from "@prisma/client";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, createAccessControl } from "better-auth/plugins";
import type { AppConfig } from "./app-config";
import { sendResetPasswordEmail, sendVerificationEmail } from "./auth-email";
import { createResendEmailSender } from "./resend";

const adminAccessControl = createAccessControl({
	user: [
		"create",
		"list",
		"get",
		"update",
		"set-email",
		"set-password",
		"ban",
		"impersonate",
	],
	session: [],
} as const);

export const browserAdminRoles = {
	admin: adminAccessControl.newRole({
		user: [
			"create",
			"list",
			"get",
			"update",
			"set-email",
			"set-password",
			"ban",
			"impersonate",
		],
		session: [],
	}),
	user: adminAccessControl.newRole({ user: [], session: [] }),
};

const disabledAdminPaths = [
	"/admin/set-role",
	"/admin/get-user",
	"/admin/create-user",
	"/admin/update-user",
	"/admin/list-users",
	"/admin/list-user-sessions",
	"/admin/unban-user",
	"/admin/ban-user",
	"/admin/revoke-user-session",
	"/admin/revoke-user-sessions",
	"/admin/remove-user",
	"/admin/set-user-password",
	"/admin/has-permission",
	"/delete-user",
	"/delete-user/callback",
	"/link-social",
] as const;

const socialProviderIds = new Set(["google", "line"]);

type AuthDatabaseHookContext = {
	body?: { provider?: string };
	params?: { id?: string };
	path?: string;
	redirect?(url: string): unknown;
};

type AuthAccount = {
	accessToken?: string | null;
	accessTokenExpiresAt?: Date | null;
	idToken?: string | null;
	providerId: string;
	refreshToken?: string | null;
	refreshTokenExpiresAt?: Date | null;
	userId: string;
	[key: string]: unknown;
};

function createAuthPrismaClient(prisma: PrismaClient) {
	return prisma.$extends({
		query: {
			user: {
				create({ args, query }) {
					return query({
						...args,
						data: {
							...args.data,
							tutor: { create: {} },
						},
					});
				},
			},
		},
	});
}

async function isTutorUser(prisma: PrismaClient, userId: string) {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			role: true,
			banned: true,
			tutor: { select: { id: true } },
		},
	});

	return user?.role === "user" && user.banned !== true && user.tutor !== null;
}

function isSocialSignInContext(context: AuthDatabaseHookContext | null) {
	if (context?.path === "/callback/:id") {
		return socialProviderIds.has(context.params?.id ?? "");
	}

	return (
		context?.path === "/sign-in/social" &&
		socialProviderIds.has(context.body?.provider ?? "")
	);
}

function getSocialCallbackProvider(context: AuthDatabaseHookContext | null) {
	if (context?.path !== "/callback/:id") return undefined;
	const providerId = context.params?.id;
	return providerId === "google" || providerId === "line"
		? providerId
		: undefined;
}

export function createTutorSocialAuthHooks(
	prisma: PrismaClient,
	betaEnabled = true,
	emailVerificationCallbackUrl?: string,
) {
	const newSocialUserContexts = new WeakMap<
		object,
		{ consumed: boolean; providerId: "google" | "line" }
	>();

	return {
		user: {
			create: {
				before: async (
					user: Record<string, unknown>,
					context: AuthDatabaseHookContext | null,
				) => {
					const authContext = context;
					const providerId = betaEnabled
						? undefined
						: getSocialCallbackProvider(authContext);
					if (!providerId || !authContext) return;

					newSocialUserContexts.set(authContext, {
						providerId,
						consumed: false,
					});
					return {
						data: {
							...user,
							role: "user",
							banned: false,
							banReason: null,
							banExpires: null,
						},
					};
				},
			},
		},
		account: {
			create: {
				before: async (
					account: AuthAccount,
					context: AuthDatabaseHookContext | null,
				) => {
					if (!socialProviderIds.has(account.providerId)) {
						return;
					}

					const newUserMarker =
						context === null || context === undefined
							? undefined
							: newSocialUserContexts.get(context);
					const isNewSocialAccount =
						newUserMarker?.consumed === false &&
						newUserMarker.providerId === account.providerId;
					if (isNewSocialAccount) {
						newUserMarker.consumed = true;
					} else if (!(await isTutorUser(prisma, account.userId))) {
						return false;
					}

					return {
						data: {
							...account,
							accessToken: null,
							accessTokenExpiresAt: null,
							idToken: null,
							refreshToken: null,
							refreshTokenExpiresAt: null,
						},
					};
				},
			},
		},
		session: {
			create: {
				before: async (
					session: { userId: string },
					context: AuthDatabaseHookContext | null,
				) => {
					if (!isSocialSignInContext(context)) {
						return;
					}

					const user = await prisma.user.findUnique({
						where: { id: session.userId },
						select: {
							emailVerified: true,
							role: true,
							banned: true,
							tutor: { select: { id: true } },
						},
					});

					if (
						user?.role !== "user" ||
						user.banned === true ||
						user.tutor === null
					) {
						return false;
					}

					if (
						!betaEnabled &&
						user.emailVerified !== true &&
						context?.path === "/callback/:id" &&
						emailVerificationCallbackUrl !== undefined &&
						typeof context.redirect === "function"
					) {
						const callbackUrl = new URL(emailVerificationCallbackUrl);
						callbackUrl.searchParams.set("error", "EMAIL_NOT_VERIFIED");
						throw context.redirect(callbackUrl.toString());
					}

					return betaEnabled || user.emailVerified === true;
				},
			},
		},
	};
}

export function createAuth(config: AppConfig, prisma: PrismaClient) {
	const sendEmail = createResendEmailSender(config);
	const tutorSocialAuthHooks = createTutorSocialAuthHooks(
		prisma,
		config.BETA_ENABLED,
		config.EMAIL_VERIFICATION_CALLBACK_URL,
	);

	return betterAuth({
		disabledPaths: [...disabledAdminPaths],
		baseURL: config.BETTER_AUTH_URL,
		secret: config.BETTER_AUTH_SECRET,
		database: (options) =>
			prismaAdapter(createAuthPrismaClient(prisma), {
				provider: "postgresql",
				transaction: true,
			})(options),
		databaseHooks: {
			...tutorSocialAuthHooks,
		},
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: true,
			disableSignUp: config.BETA_ENABLED,
			customSyntheticUser: ({ coreFields, additionalFields, id }) => ({
				...coreFields,
				role: "user",
				banned: false,
				banReason: null,
				banExpires: null,
				...additionalFields,
				id,
			}),
			revokeSessionsOnPasswordReset: true,
			sendResetPassword: async ({ user, url }) => {
				await sendResetPasswordEmail(
					{
						email: user.email,
						name: user.name,
						resetUrl: url,
					},
					sendEmail,
				);
			},
		},
		emailVerification: {
			sendOnSignUp: true,
			sendOnSignIn: true,
			autoSignInAfterVerification: false,
			sendVerificationEmail: async ({ user, url }) => {
				await sendVerificationEmail(
					{
						email: user.email,
						name: user.name,
						verificationUrl: url,
					},
					sendEmail,
				);
			},
		},
		session: {
			expiresIn: 60 * 60 * 24 * 7,
			updateAge: 60 * 60 * 24,
		},
		account: {
			encryptOAuthTokens: true,
			updateAccountOnSignIn: false,
			accountLinking: {
				allowDifferentEmails: false,
			},
		},
		socialProviders: {
			...(config.SOCIAL_LOGIN.google
				? {
						google: {
							clientId: config.GOOGLE_CLIENT_ID,
							clientSecret: config.GOOGLE_CLIENT_SECRET,
							disableSignUp: config.BETA_ENABLED,
						},
					}
				: {}),
			...(config.SOCIAL_LOGIN.line
				? {
						line: {
							clientId: config.LINE_LOGIN_CHANNEL_ID,
							clientSecret: config.LINE_LOGIN_CHANNEL_SECRET,
							disableSignUp: config.BETA_ENABLED,
						},
					}
				: {}),
		},
		trustedOrigins: [
			config.CORS_ORIGIN,
			config.FRONTEND_URL,
			config.ADMIN_FRONTEND_URL,
			config.BETTER_AUTH_URL,
			config.EMAIL_VERIFICATION_CALLBACK_URL,
		],
		plugins: [
			admin({
				defaultRole: "user",
				adminRoles: ["admin"],
				impersonationSessionDuration: 3600,
				ac: adminAccessControl,
				roles: browserAdminRoles,
			}),
		],
	});
}

export type Auth = ReturnType<typeof createAuth>;
