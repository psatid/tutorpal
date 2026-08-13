import type { PrismaClient } from "@prisma/client";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, createAccessControl } from "better-auth/plugins";
import type { AppConfig } from "./app-config";
import { sendResetPasswordEmail, sendVerificationEmail } from "./auth-email";
import { createResendEmailSender } from "./resend";

const adminAccessControl = createAccessControl({
	user: ["create", "list", "get", "update", "set-email", "set-password", "ban"],
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
	"/admin/impersonate-user",
	"/admin/stop-impersonating",
	"/admin/revoke-user-session",
	"/admin/revoke-user-sessions",
	"/admin/remove-user",
	"/admin/set-user-password",
	"/admin/has-permission",
	"/delete-user",
	"/delete-user/callback",
] as const;

export function createAuth(config: AppConfig, prisma: PrismaClient) {
	const sendEmail = createResendEmailSender(config);

	return betterAuth({
		disabledPaths: [...disabledAdminPaths],
		baseURL: config.BETTER_AUTH_URL,
		secret: config.BETTER_AUTH_SECRET,
		database: prismaAdapter(prisma, {
			provider: "postgresql",
		}),
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
		trustedOrigins: [
			config.CORS_ORIGIN,
			config.FRONTEND_URL,
			config.ADMIN_FRONTEND_URL,
			config.BETTER_AUTH_URL,
			config.EMAIL_VERIFICATION_CALLBACK_URL,
		],
		databaseHooks: {
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
		plugins: [
			admin({
				defaultRole: "user",
				adminRoles: ["admin"],
				ac: adminAccessControl,
				roles: browserAdminRoles,
			}),
		],
	});
}

export type Auth = ReturnType<typeof createAuth>;
