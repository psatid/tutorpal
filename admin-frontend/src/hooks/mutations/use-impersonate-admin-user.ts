import { useMutation } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

export function useImpersonateAdminUser() {
	return useMutation({
		mutationFn: async (userId: string) => {
			const result = await authClient.admin.impersonateUser({ userId });

			if (result.error) {
				throw new Error("Unable to open tutor view.");
			}

			return result.data;
		},
	});
}
