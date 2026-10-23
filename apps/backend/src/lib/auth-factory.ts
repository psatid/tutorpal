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

export function createTutorSocialAuthHooks(prisma: PrismaClient) {
	return {
		account: {
			create: {
				before: async (account: AuthAccount) => {
					if (!socialProviderIds.has(account.providerId)) {
						return;
					}

					if (!(await isTutorUser(prisma, account.userId))) {
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

					return (await isTutorUser(prisma, session.userId)) || false;
				},
			},
		},
	};
}

export function createAuth(config: AppConfig, prisma: PrismaClient) {
	const sendEmail = createResendEmailSender(config);

	return betterAuth({
		disabledPaths: [...disabledAdminPaths],
		baseURL: config.BETTER_AUTH_URL,
		secret: config.BETTER_AUTH_SECRET,
		database: prismaAdapter(prisma, {
			provider: "postgresql",
		}),
		databaseHooks: {
			...createTutorSocialAuthHooks(prisma),
			user: {
				create: {
					after: async (user) => {
						await prisma.tutor.upsert({
							where: { userId: user.id },
							update: {},
							create: { userId: user.id },
						});
					},
				},
			},
		},
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: true,
			disableSignUp: !config.PUBLIC_SIGNUP_ENABLED,
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
							disableSignUp: true,
						},
					}
				: {}),
			...(config.SOCIAL_LOGIN.line
				? {
						line: {
							clientId: config.LINE_LOGIN_CHANNEL_ID,
							clientSecret: config.LINE_LOGIN_CHANNEL_SECRET,
							disableSignUp: true,
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
