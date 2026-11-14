export const ENV = {
  IS_DEV: import.meta.env.DEV ?? true,
  API_URL: import.meta.env.VITE_API_URL ?? "http://localhost:5174",
  ADMIN_APP_URL: import.meta.env.VITE_ADMIN_APP_URL ?? "http://localhost:5175",
  MARKETING_URL:
    import.meta.env.VITE_MARKETING_URL ??
    (import.meta.env.DEV ? "http://localhost:4321" : "https://tutorpal.io"),
} as const;
