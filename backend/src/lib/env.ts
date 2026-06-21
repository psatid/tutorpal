export const ENV = {
	PORT: process.env.PORT ?? "3000",
	CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:3001",
	DATABASE_URL:
		process.env.DATABASE_URL ??
		"postgresql://postgres:postgres@localhost:5432/tutorpal",
	BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
	BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? "secret",
	NODE_ENV: process.env.NODE_ENV ?? "development",
	RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
	RESEND_FROM_EMAIL:
		process.env.RESEND_FROM_EMAIL ?? "TutorPal <no-reply@example.com>",
	LINE_LOGIN_CHANNEL_ID: process.env.LINE_LOGIN_CHANNEL_ID ?? "",
	LINE_LOGIN_CHANNEL_SECRET: process.env.LINE_LOGIN_CHANNEL_SECRET ?? "",
	LINE_MESSAGING_CHANNEL_ACCESS_TOKEN:
		process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN ?? "",
	LINE_LINK_REDIRECT_URL:
		process.env.LINE_LINK_REDIRECT_URL ??
		"http://localhost:3000/v1/line/callback",
	FRONTEND_URL: process.env.FRONTEND_URL ?? "http://localhost:3001",
	EMAIL_VERIFICATION_CALLBACK_URL:
		process.env.EMAIL_VERIFICATION_CALLBACK_URL ??
		"http://localhost:3001/verify-email",
} as const;
