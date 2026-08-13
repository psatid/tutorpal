export const ENV = {
  IS_DEV: import.meta.env.DEV ?? true,
  API_URL: import.meta.env.VITE_API_URL ?? "http://localhost:5174",
  USER_APP_URL: import.meta.env.VITE_USER_APP_URL ?? "http://localhost:5173",
} as const;
