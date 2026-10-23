import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { ENV } from "./env";

type AdminClientPlugin = ReturnType<typeof adminClient<{}>>;

const authClientOptions: {
	baseURL: string;
	plugins: [AdminClientPlugin];
} = {
	baseURL: ENV.API_URL,
	plugins: [adminClient<{}>()],
};

export type AuthClient = ReturnType<
	typeof createAuthClient<typeof authClientOptions>
>;

export const authClient: AuthClient = createAuthClient(authClientOptions);

export function getEmailVerificationCallbackUrl(email?: string) {
	const url = new URL("/verify-email", ENV.USER_APP_URL);

	if (email) {
		url.searchParams.set("email", email);
	}

	return url.toString();
}
