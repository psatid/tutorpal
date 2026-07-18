import {
  createFileRoute,
  Outlet,
  Navigate,
  useLocation,
} from "@tanstack/react-router";
import { TopAppBar } from "@/components/layout/top-app-bar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { APP_ROUTES } from "@/constants/routes";
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_layout")({
  component: LayoutRoute,
});

function LayoutRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const isSettingsFlow =
    location.pathname === APP_ROUTES.SETTINGS ||
    location.pathname.startsWith(`${APP_ROUTES.SETTINGS}/`);

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

  if (isSettingsFlow) {
    return (
      <main className="min-h-dvh bg-background px-4 py-5 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    );
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
