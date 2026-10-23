import { authClient } from "@/lib/auth-client";

export function useAdminAccess() {
	const { data: session, isPending: isSessionPending } =
		authClient.useSession();
	const role = session?.user.role;

	return {
		isAuthenticated: Boolean(session),
		isLoading: isSessionPending,
		isImpersonating: Boolean(session?.session.impersonatedBy),
		canManageUsers: role === "admin",
	};
}
