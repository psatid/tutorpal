import {
	authClient,
	getEmailVerificationCallbackUrl,
} from "@/lib/auth-client";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface LoginCredentials {
  email: string;
  password: string;
}

interface UseLoginOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
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
		callbackURL: getEmailVerificationCallbackUrl(credentials.email),
      });

      if (result.error) {
        throw new Error(
          result.error.message || t("errors.loginFailed"),
        );
      }

      return result.data;
    },
    onSuccess: () => {
      toast.success(t("login.success"));
      navigate({ to: "/" });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      if (options?.onError) {
        options.onError(error);
        return;
      }

      toast.error(
        error.message || t("login.invalid"),
      );
    },
  });
};
