import type { User } from "better-auth/types";
import { authClient } from "@/lib/auth-client";

interface SessionData {
  user: User;
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
  };
}

interface UseSessionReturn {
  session: SessionData | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Wrapper around better-auth's useSession hook.
 * Provides a consistent return shape for authentication state.
 */
export const useSession = (): UseSessionReturn => {
  const { data: session, isPending, error, refetch } = authClient.useSession();

  return {
    session: session,
    user: session?.user ?? null,
    isAuthenticated: !!session,
    isLoading: isPending,
    error: error ?? null,
    refetch,
  };
};
