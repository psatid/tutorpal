import { authClient } from "@/lib/auth-client";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface LoginCredentials {
  email: string;
  password: string;
}

interface UseLoginOptions {
  onSuccess?: () => void;
  onError?: () => void;
}

/**
 * Mutation hook for user login using better-auth email/password authentication.
 * Handles login, shows toast feedback, and navigates to the root on success.
 */
export const useLogin = (options?: UseLoginOptions) => {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const createLoginError = () => new Error(t("errors.loginFailed"));

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      try {
        const result = await authClient.signIn.email({
          email: credentials.email,
          password: credentials.password,
        });

        if (result.error) {
          throw createLoginError();
        }

        return result.data;
      } catch {
        throw createLoginError();
      }
    },
    onSuccess: () => {
      toast.success(t("login.success"));
      navigate({ to: "/" });
      options?.onSuccess?.();
    },
    onError: () => {
      if (options?.onError) {
        options.onError();
        return;
      }

      toast.error(t("login.invalid"));
    },
  });
};
