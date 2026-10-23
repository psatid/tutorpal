import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { APP_ROUTES } from "@/constants/routes";
import { authClient } from "@/lib/auth-client";
import { AuthFlowError } from "./use-signup";

interface ResetPasswordPayload {
	token: string;
	newPassword: string;
}

export const useResetPassword = () => {
	const navigate = useNavigate();
	const { t } = useTranslation(["auth"]);

	return useMutation({
		mutationFn: async ({ token, newPassword }: ResetPasswordPayload) => {
			const result = await authClient.resetPassword({
				token,
				newPassword,
			});

			if (result.error) {
				throw new AuthFlowError(
					result.error.message || t("auth:errors.passwordResetFailed"),
					(result.error as { code?: string }).code,
				);
			}

			return result.data;
		},
		onSuccess: () => {
			toast.success(t("auth:resetPassword.success"));
			navigate({ to: APP_ROUTES.LOGIN });
		},
	});
};
