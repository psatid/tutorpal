export const ENV = {
  PORT: process.env.PORT ?? "3000",
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:3000",
} as const;
