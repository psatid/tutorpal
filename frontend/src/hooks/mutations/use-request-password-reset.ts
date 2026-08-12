import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { authClient, getPasswordResetCallbackUrl } from "@/lib/auth-client";
import { AuthFlowError } from "./use-signup";

export const useRequestPasswordReset = () => {
	const { t } = useTranslation("auth");
	return useMutation({
		mutationFn: async (email: string) => {
			const result = await authClient.requestPasswordReset({
				email,
				redirectTo: getPasswordResetCallbackUrl(),
			});

			if (result.error) {
				throw new AuthFlowError(
					result.error.message || t("errors.passwordResetRequestFailed"),
					(result.error as { code?: string }).code,
				);
			}

			return result.data;
		},
	});
};
