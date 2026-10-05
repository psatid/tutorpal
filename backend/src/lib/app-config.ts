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
	GOOGLE_CLIENT_ID?: string;
	GOOGLE_CLIENT_SECRET?: string;
	LINE_LOGIN_CHANNEL_ID?: string;
	LINE_LOGIN_CHANNEL_SECRET?: string;
};

export type SocialLoginConfig = {
	google: boolean;
	line: boolean;
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
	GOOGLE_CLIENT_ID: string;
	GOOGLE_CLIENT_SECRET: string;
	LINE_LOGIN_CHANNEL_ID: string;
	LINE_LOGIN_CHANNEL_SECRET: string;
	SOCIAL_LOGIN: SocialLoginConfig;
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

function getOptionalCredential(value: string | undefined): string {
	return value?.trim() ?? "";
}

function isSocialProviderConfigured(
	provider: string,
	clientId: string,
	clientSecret: string,
): boolean {
	if (clientId === "" && clientSecret === "") {
		return false;
	}

	if (clientId === "" || clientSecret === "") {
		throw new Error(
			`Incomplete ${provider} OAuth configuration: both client ID and client secret are required.`,
		);
	}

	return true;
}

export function createAppConfig(input: AppConfigInput): AppConfig {
	const googleClientId = getOptionalCredential(input.GOOGLE_CLIENT_ID);
	const googleClientSecret = getOptionalCredential(input.GOOGLE_CLIENT_SECRET);
	const lineLoginChannelId = getOptionalCredential(input.LINE_LOGIN_CHANNEL_ID);
	const lineLoginChannelSecret = getOptionalCredential(
		input.LINE_LOGIN_CHANNEL_SECRET,
	);

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
		GOOGLE_CLIENT_ID: googleClientId,
		GOOGLE_CLIENT_SECRET: googleClientSecret,
		LINE_LOGIN_CHANNEL_ID: lineLoginChannelId,
		LINE_LOGIN_CHANNEL_SECRET: lineLoginChannelSecret,
		SOCIAL_LOGIN: {
			google: isSocialProviderConfigured(
				"Google",
				googleClientId,
				googleClientSecret,
			),
			line: isSocialProviderConfigured(
				"LINE Login",
				lineLoginChannelId,
				lineLoginChannelSecret,
			),
		},
	};
}
