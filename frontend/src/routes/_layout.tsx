import {
	createFileRoute,
	Outlet,
	useLocation,
	useNavigate,
} from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { TopAppBar } from "@/components/layout/top-app-bar";
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
		<div className="min-h-dvh lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
			<DesktopSidebar />
			<div className="flex min-h-dvh min-w-0 flex-col bg-accent">
				<TopAppBar />
				<main className="min-h-0 grow p-3 sm:p-4 lg:p-6">
					<Outlet />
				</main>
				<BottomNav />
			</div>
		</div>
	);
}
