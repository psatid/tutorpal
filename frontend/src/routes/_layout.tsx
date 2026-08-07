import { AppSidebar } from "@/components/layout/app-sidebar";
import { RouteError } from "@/components/route-fallback";
import { useAuth } from "@/contexts/auth-context";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/_layout")({
  component: LayoutRoute,
  errorComponent: RouteError,
});

function LayoutRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      void navigate({ to: "/login", replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading state while checking session
  if (isLoading) {
    return (
      <div className="min-h-dvh bg-surface flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="jun-layout jun-layout-safeArea min-h-dvh">
      <AppSidebar />
      <main className="jun-content min-w-0 bg-accent">
        <Outlet />
      </main>
    </div>
  );
}
