import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { TopAppBar } from "@/components/layout/top-app-bar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_layout")({
  component: LayoutRoute,
});

function LayoutRoute() {
  const { isAuthenticated, isLoading } = useAuth();

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
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <TopAppBar />
      <main className="p-4 grow shrink bg-accent">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
