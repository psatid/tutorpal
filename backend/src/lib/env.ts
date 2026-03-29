export const ENV = {
	PORT: process.env.PORT ?? "3000",
	CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:3000",
	DATABASE_URL:
		process.env.DATABASE_URL ??
		"postgresql://postgres:postgres@localhost:5432/tutorpal",
} as const;
