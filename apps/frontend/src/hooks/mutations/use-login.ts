import { authClient } from "@/lib/auth-client";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AuthFlowError } from "./use-signup";

interface LoginCredentials {
  email: string;
  password: string;
}

interface UseLoginOptions {
  onSuccess?: () => void;
  onError?: (error: AuthFlowError) => void;
}

/**
 * Mutation hook for user login using better-auth email/password authentication.
 * Handles login, shows toast feedback, and navigates to the root on success.
 */
export const useLogin = (options?: UseLoginOptions) => {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const result = await authClient.signIn.email({
        email: credentials.email,
        password: credentials.password,
      });

      if (result.error) {
        throw new AuthFlowError(
          result.error.message || t("errors.loginFailed"),
          (result.error as { code?: string }).code,
        );
      }

      return result.data;
    },
    onSuccess: () => {
      toast.success(t("login.success"));
      navigate({ to: "/" });
      options?.onSuccess?.();
    },
    onError: (error: AuthFlowError) => {
      if (options?.onError) {
        options.onError(error);
        return;
      }

      toast.error(error.message || t("login.invalid"));
    },
  });
};
