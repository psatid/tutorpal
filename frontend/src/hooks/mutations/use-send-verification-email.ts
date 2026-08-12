import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { authClient, getEmailVerificationCallbackUrl } from "@/lib/auth-client";
import { AuthFlowError } from "./use-signup";

export const useSendVerificationEmail = () => {
  const { t } = useTranslation("auth");
  return useMutation({
    mutationFn: async (email: string) => {
      const result = await authClient.sendVerificationEmail({
        email,
        callbackURL: getEmailVerificationCallbackUrl(email),
      });

      if (result.error) {
        throw new AuthFlowError(
          result.error.message || t("errors.resendVerificationFailed"),
          (result.error as { code?: string }).code,
        );
      }

      return result.data;
    },
  });
};
