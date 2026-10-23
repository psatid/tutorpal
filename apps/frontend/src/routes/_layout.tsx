import { AppSidebar } from "@/components/layout/app-sidebar";
import { ImpersonationBanner } from "@/components/layout/impersonation-banner";
import { RouteError } from "@/components/route-fallback";
import { useAuth } from "@/contexts/auth-context";
import { useStopImpersonation } from "@/hooks/mutations/use-stop-impersonation";
import {
  getAdminImpersonationRecoveryUrl,
  hasImpersonationRecoveryMarker,
} from "@/lib/impersonation-recovery";
import {
  createFileRoute,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Loading03Icon as Loader2HugeIcon,
} from "@hugeicons/core-free-icons";
import { useEffect } from "react";
import { ContentReveal } from "@tutorpal/ui/animate-ui/components/base/content-reveal";

export const Route = createFileRoute("/_layout")({
  component: LayoutRoute,
  errorComponent: RouteError,
});

function LayoutRoute() {
  const { isAuthenticated, isLoading, isImpersonating, user } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const stopImpersonation = useStopImpersonation();

  const exitTutorView = () => {
    if (isImpersonating) {
      stopImpersonation.mutate();
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      if (hasImpersonationRecoveryMarker()) {
        window.location.assign(getAdminImpersonationRecoveryUrl());
        return;
      }

      void navigate({ to: "/login", replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading state while checking session
  if (isLoading) {
    return (
      <div className="min-h-dvh bg-surface flex items-center justify-center">
        <HugeiconsIcon icon={Loader2HugeIcon} strokeWidth={2} aria-hidden="true" className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="jun-layout jun-layout-safeArea min-h-dvh">
      <AppSidebar
        isExitingTutorView={stopImpersonation.isPending}
        isImpersonating={isImpersonating}
        onExitTutorView={exitTutorView}
      />
      <main className="jun-content min-w-0 bg-background">
        {isImpersonating ? (
          <ImpersonationBanner
            errorCategory={stopImpersonation.error?.category}
            isError={stopImpersonation.isError}
            isPending={stopImpersonation.isPending}
            onExit={exitTutorView}
            userName={user?.name}
          />
        ) : null}
        <ContentReveal key={pathname} className="block h-full min-h-0 min-w-0">
          <Outlet />
        </ContentReveal>
      </main>
    </div>
  );
}
