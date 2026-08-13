import { AppSidebar } from "@/components/layout/app-sidebar";
import { RouteError } from "@/components/route-fallback";
import { useAdminAccess } from "@/hooks/use-admin-access";
import { authClient } from "@/lib/auth-client";
import { createFileRoute, Navigate, Outlet, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldAlert } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_layout")({
	component: AdminLayout,
	errorComponent: RouteError,
});

function AdminLayout() {
	const { isAuthenticated, isLoading, canManageUsers } = useAdminAccess();
	const navigate = useNavigate();

	useEffect(() => {
		if (!isLoading && !isAuthenticated) {
			void navigate({ to: "/login", replace: true });
		}
	}, [isAuthenticated, isLoading, navigate]);

	if (isLoading) {
		return (
			<div className="flex min-h-dvh items-center justify-center bg-surface">
				<Loader2 className="size-8 animate-spin text-primary" />
			</div>
		);
	}

	if (!isAuthenticated) {
		return <Navigate replace to="/login" />;
	}

	if (!canManageUsers) {
		return <AccessDenied />;
	}

	return (
		<div className="jun-layout jun-layout-safeArea min-h-dvh">
			<AppSidebar />
			<main className="jun-content min-w-0 bg-background">
				<Outlet />
			</main>
		</div>
	);
}

function AccessDenied() {
	const { t } = useTranslation("common");
	const navigate = useNavigate();

	const signOut = async () => {
		await authClient.signOut();
		await navigate({ to: "/login", replace: true });
	};

	return (
		<main className="flex min-h-dvh items-center justify-center bg-background px-6 py-12">
			<section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-transient-card">
				<div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
					<ShieldAlert aria-hidden="true" className="size-6" />
				</div>
				<h1 className="mt-6 text-2xl font-semibold tracking-tight">
					{t("accessDenied.title")}
				</h1>
				<p className="mt-3 text-sm leading-6 text-muted-foreground">
					{t("accessDenied.description")}
				</p>
				<Button className="mt-8" onClick={() => void signOut()}>
					{t("accessDenied.signOut")}
				</Button>
			</section>
		</main>
	);
}
