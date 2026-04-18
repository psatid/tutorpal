import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

interface LoginCredentials {
  email: string;
  password: string;
}

interface UseLoginOptions {
  onSuccess?: () => void;
}

/**
 * Mutation hook for user login using better-auth email/password authentication.
 * Handles login, shows toast feedback, and navigates to the root on success.
 */
export const useLogin = (options?: UseLoginOptions) => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const result = await authClient.signIn.email({
        email: credentials.email,
        password: credentials.password,
      });

      if (result.error) {
        throw new Error(result.error.message || "Login failed");
      }

      return result.data;
    },
    onSuccess: () => {
      toast.success("Welcome back! You have been logged in.");
      navigate({ to: "/" });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(
        error.message || "Invalid email or password. Please try again."
      );
    },
  });
};
