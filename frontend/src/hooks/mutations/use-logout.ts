import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

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
      toast.success("You have been logged out.");
      navigate({ to: "/login" });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to log out. Please try again.");
    },
  });
};
