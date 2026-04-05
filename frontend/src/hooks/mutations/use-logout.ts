import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { showToast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth-client";

interface UseLogoutOptions {
  onSuccess?: () => void;
}

/**
 * Mutation hook for user logout using better-auth.
 * Handles logout, shows toast feedback, and redirects to login on success.
 */
export const useLogout = (options?: UseLogoutOptions) => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      await authClient.signOut();
    },
    onSuccess: () => {
      showToast.success("Success", "You have been logged out.");
      navigate({ to: "/login" });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      showToast.error(
        "Error",
        error.message || "Failed to log out. Please try again."
      );
    },
  });
};
