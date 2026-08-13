const LOG_LEVELS = [
	"trace",
	"debug",
	"info",
	"warn",
	"error",
	"fatal",
	"silent",
] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

export type AppConfigInput = {
	PORT?: string;
	CORS_ORIGIN?: string;
	ADMIN_FRONTEND_URL?: string;
	DATABASE_URL?: string;
	BETTER_AUTH_URL?: string;
	BETTER_AUTH_SECRET?: string;
	ENVIRONMENT?: string;
	LOG_LEVEL?: string;
	RESEND_API_KEY?: string;
	RESEND_FROM_EMAIL?: string;
	LINE_CREDENTIALS_ENCRYPTION_KEY?: string;
	LINE_LINK_REDIRECT_URL?: string;
	FRONTEND_URL?: string;
	EMAIL_VERIFICATION_CALLBACK_URL?: string;
	PUBLIC_SIGNUP_ENABLED?: string;
};

export type AppConfig = {
	PORT: string;
	CORS_ORIGIN: string;
	ADMIN_FRONTEND_URL: string;
	DATABASE_URL: string;
	BETTER_AUTH_URL: string;
	BETTER_AUTH_SECRET: string;
	ENVIRONMENT: string;
	LOG_LEVEL: LogLevel;
	RESEND_API_KEY: string;
	RESEND_FROM_EMAIL: string;
	LINE_CREDENTIALS_ENCRYPTION_KEY: string;
	LINE_LINK_REDIRECT_URL: string;
	FRONTEND_URL: string;
	EMAIL_VERIFICATION_CALLBACK_URL: string;
	PUBLIC_SIGNUP_ENABLED: boolean;
};

function getLogLevel(logLevel: string | undefined): LogLevel {
	if (!LOG_LEVELS.includes(logLevel as LogLevel)) {
		throw new Error(
			`Invalid LOG_LEVEL "${logLevel}". Expected one of: ${LOG_LEVELS.join(", ")}.`,
		);
	}

	return logLevel as LogLevel;
}

export function parseBooleanFlag(
	value: string | undefined,
	defaultValue = false,
): boolean {
	if (value === undefined || value === "") {
		return defaultValue;
	}

	if (value === "true") {
		return true;
	}

	if (value === "false") {
		return false;
	}

	throw new Error(
		`Invalid boolean flag "${value}". Expected "true" or "false".`,
	);
}

export function createAppConfig(input: AppConfigInput): AppConfig {
	return {
		PORT: input.PORT ?? "5174",
		CORS_ORIGIN: input.CORS_ORIGIN ?? "http://localhost:5173",
		ADMIN_FRONTEND_URL: input.ADMIN_FRONTEND_URL ?? "http://localhost:5175",
		DATABASE_URL:
			input.DATABASE_URL ??
			"postgresql://postgres:postgres@localhost:5432/tutorpal",
		BETTER_AUTH_URL: input.BETTER_AUTH_URL ?? "http://localhost:5174",
		BETTER_AUTH_SECRET: input.BETTER_AUTH_SECRET ?? "secret",
		ENVIRONMENT: input.ENVIRONMENT ?? "local",
		LOG_LEVEL: getLogLevel(input.LOG_LEVEL),
		RESEND_API_KEY: input.RESEND_API_KEY ?? "",
		RESEND_FROM_EMAIL:
			input.RESEND_FROM_EMAIL ?? "TutorPal <no-reply@example.com>",
		LINE_CREDENTIALS_ENCRYPTION_KEY:
			input.LINE_CREDENTIALS_ENCRYPTION_KEY ?? "",
		LINE_LINK_REDIRECT_URL:
			input.LINE_LINK_REDIRECT_URL ?? "http://localhost:5174/v1/line/callback",
		FRONTEND_URL: input.FRONTEND_URL ?? "http://localhost:5173",
		EMAIL_VERIFICATION_CALLBACK_URL:
			input.EMAIL_VERIFICATION_CALLBACK_URL ??
			"http://localhost:5173/verify-email",
		PUBLIC_SIGNUP_ENABLED: parseBooleanFlag(input.PUBLIC_SIGNUP_ENABLED),
	};
}
