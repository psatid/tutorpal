export const ENV = {
  PORT: process.env.PORT ?? "3000",
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:3001",
  DATABASE_URL:
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/tutorpal",
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? "secret",
  NODE_ENV: process.env.NODE_ENV ?? "development",
} as const;
