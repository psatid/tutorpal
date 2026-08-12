import type { PrismaClient } from "@prisma/client";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import type { AppConfig } from "./app-config";
import { sendResetPasswordEmail, sendVerificationEmail } from "./auth-email";
import { createResendEmailSender } from "./resend";

export function createAuth(config: AppConfig, prisma: PrismaClient) {
	const sendEmail = createResendEmailSender(config);

	return betterAuth({
		baseURL: config.BETTER_AUTH_URL,
		secret: config.BETTER_AUTH_SECRET,
		database: prismaAdapter(prisma, {
			provider: "postgresql",
		}),
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: true,
			disableSignUp: false,
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
		plugins: [admin()],
	});
}

export type Auth = ReturnType<typeof createAuth>;
