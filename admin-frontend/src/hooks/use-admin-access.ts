import { authClient } from "@/lib/auth-client";

export function useAdminAccess() {
	const { data: session, isPending: isSessionPending } =
		authClient.useSession();
	const role = (session?.user as { role?: string } | undefined)?.role;

	return {
		isAuthenticated: Boolean(session),
		isLoading: isSessionPending,
		canManageUsers: role === "admin",
	};
}
