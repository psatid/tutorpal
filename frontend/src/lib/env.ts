export const ENV = {
  IS_DEV: import.meta.env.DEV ?? true,
  API_URL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
} as const;
