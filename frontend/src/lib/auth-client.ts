import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: import.meta.env.VITE_API_URL || "http://localhost:5174",
}) as ReturnType<typeof createAuthClient>;

export function getEmailVerificationCallbackUrl(email?: string) {
	const url = new URL("/verify-email", window.location.origin);

	if (email) {
		url.searchParams.set("email", email);
	}

	return url.toString();
}

export function getPasswordResetCallbackUrl() {
	return new URL("/reset-password", window.location.origin).toString();
}
