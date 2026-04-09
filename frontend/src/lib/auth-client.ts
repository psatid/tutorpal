import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  basePath: "/v1/auth",
}) as ReturnType<typeof createAuthClient>;
