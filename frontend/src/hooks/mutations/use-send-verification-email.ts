import { useMutation } from "@tanstack/react-query";
import { authClient, getEmailVerificationCallbackUrl } from "@/lib/auth-client";
import { AuthFlowError } from "./use-signup";

export const useSendVerificationEmail = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      const result = await authClient.sendVerificationEmail({
        email,
        callbackURL: getEmailVerificationCallbackUrl(email),
      });

      if (result.error) {
        throw new AuthFlowError(
          result.error.message || "Failed to resend verification email",
          (result.error as { code?: string }).code,
        );
      }

      return result.data;
    },
  });
};
