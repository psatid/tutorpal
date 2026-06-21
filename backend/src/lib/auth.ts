import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { sendVerificationEmail } from "./auth-email";
import { prisma } from "./db";
import { ENV } from "./env";

export const auth = betterAuth({
  baseURL: ENV.BETTER_AUTH_URL,
  secret: ENV.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    disableSignUp: false,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: false,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({
        email: user.email,
        name: user.name,
        verificationUrl: url,
      });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  trustedOrigins: [
    ENV.CORS_ORIGIN,
    ENV.FRONTEND_URL,
    ENV.BETTER_AUTH_URL,
    ENV.EMAIL_VERIFICATION_CALLBACK_URL,
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
