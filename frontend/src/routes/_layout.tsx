import {
	createFileRoute,
	Outlet,
	useLocation,
	useNavigate,
} from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { type CSSProperties, useEffect } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { TopAppBar } from "@/components/layout/top-app-bar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { APP_ROUTES } from "@/constants/routes";
import { useAuth } from "@/contexts/auth-context";

export const Route = createFileRoute("/_layout")({
	component: LayoutRoute,
});

function LayoutRoute() {
	const { isAuthenticated, isLoading } = useAuth();
	const location = useLocation();
	const navigate = useNavigate();
	const isSettingsFlow =
		location.pathname === APP_ROUTES.SETTINGS ||
		location.pathname.startsWith(`${APP_ROUTES.SETTINGS}/`);

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

	if (isSettingsFlow) {
		return (
			<main className="min-h-dvh bg-background px-4 py-5 sm:px-6 sm:py-8">
				<Outlet />
			</main>
		);
	}

	return (
		<SidebarProvider
			className="min-h-dvh"
			style={{ "--sidebar-width": "15rem" } as CSSProperties}
		>
			<div className="hidden lg:block">
				<AppSidebar />
			</div>
			<SidebarInset className="min-h-dvh min-w-0">
				<TopAppBar />
				<div className="min-h-0 grow bg-accent p-3 sm:p-4 lg:p-6">
					<Outlet />
				</div>
				<BottomNav />
			</SidebarInset>
		</SidebarProvider>
	);
}
