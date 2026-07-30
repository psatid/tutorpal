const LOG_LEVELS = [
  "trace",
  "debug",
  "info",
  "warn",
  "error",
  "fatal",
  "silent",
] as const;

type LogLevel = (typeof LOG_LEVELS)[number];

function getLogLevel(): LogLevel {
  const logLevel =
    process.env.LOG_LEVEL ??
    ((process.env.NODE_ENV ?? "development") === "development"
      ? "debug"
      : "info");

  if (!LOG_LEVELS.includes(logLevel as LogLevel)) {
    throw new Error(
      `Invalid LOG_LEVEL "${logLevel}". Expected one of: ${LOG_LEVELS.join(", ")}.`,
    );
  }

  return logLevel as LogLevel;
}

export const ENV = {
  PORT: process.env.PORT ?? "3000",
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:3001",
  DATABASE_URL:
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/tutorpal",
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? "secret",
  NODE_ENV: process.env.NODE_ENV ?? "development",
  ENVIRONMENT: process.env.ENVIRONMENT ?? "local",
  LOG_LEVEL: getLogLevel(),
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
  RESEND_FROM_EMAIL:
    process.env.RESEND_FROM_EMAIL ?? "TutorPal <no-reply@example.com>",
  LINE_CREDENTIALS_ENCRYPTION_KEY:
    process.env.LINE_CREDENTIALS_ENCRYPTION_KEY ?? "",
  LINE_LINK_REDIRECT_URL:
    process.env.LINE_LINK_REDIRECT_URL ??
    "http://localhost:3000/v1/line/callback",
  FRONTEND_URL: process.env.FRONTEND_URL ?? "http://localhost:3001",
  EMAIL_VERIFICATION_CALLBACK_URL:
    process.env.EMAIL_VERIFICATION_CALLBACK_URL ??
    "http://localhost:3001/verify-email",
} as const;
