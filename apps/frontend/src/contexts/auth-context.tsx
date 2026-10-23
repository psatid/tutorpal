import { createContext, useContext, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { markImpersonationRecovery } from "@/lib/impersonation-recovery";

type SessionData = typeof authClient.$Infer.Session;
type SessionUser = SessionData["user"];

interface AuthContextValue {
  session: SessionData | null;
  user: SessionUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isImpersonating: boolean;
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

  const sessionData = session;
  const isImpersonating = Boolean(sessionData?.session.impersonatedBy);

  useEffect(() => {
    if (isImpersonating) {
      markImpersonationRecovery();
    }
  }, [isImpersonating]);

  const value: AuthContextValue = {
    session: sessionData,
    user: sessionData?.user ?? null,
    isAuthenticated: !!session,
    isLoading: isPending,
    isImpersonating,
    error: error ?? null,
    logout: async () => {
      await authClient.signOut();
    },
    refetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
