import { useMutation } from "@tanstack/react-query";
import { authClient, getPasswordResetCallbackUrl } from "@/lib/auth-client";
import { AuthFlowError } from "./use-signup";

export const useRequestPasswordReset = () => {
	return useMutation({
		mutationFn: async (email: string) => {
			const result = await authClient.requestPasswordReset({
				email,
				redirectTo: getPasswordResetCallbackUrl(),
			});

			if (result.error) {
				throw new AuthFlowError(
					result.error.message || "Failed to request password reset",
					(result.error as { code?: string }).code,
				);
			}

			return result.data;
		},
	});
};
