import { createAuthClient } from "better-auth/react";
import { ENV } from "./env";

export const authClient: ReturnType<typeof createAuthClient> = createAuthClient({
	baseURL: ENV.API_URL,
});

export function getEmailVerificationCallbackUrl(email?: string) {
	const url = new URL("/verify-email", ENV.USER_APP_URL);

	if (email) {
		url.searchParams.set("email", email);
	}

	return url.toString();
}
