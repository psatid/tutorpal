import { createContext, useContext } from "react";
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

interface AuthContextValue {
  session: SessionData | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { data: session, isPending, error, refetch } = authClient.useSession();

  const sessionData = session as SessionData | null;

  const value: AuthContextValue = {
    session: sessionData,
    user: sessionData?.user ?? null,
    isAuthenticated: !!session,
    isLoading: isPending,
    error: error ?? null,
    logout: async () => {
      await authClient.signOut();
    },
    refetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
