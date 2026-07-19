import { BookOpen01Icon, Settings01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link, useLocation } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { APP_ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { isNavigationItemActive, navigationItems } from "./navigation-items";

export function DesktopSidebar() {
	const { t } = useTranslation();
	const location = useLocation();

	return (
		<aside className="hidden min-h-dvh w-60 flex-col border-r border-sidebar-border bg-sidebar px-3 py-4 lg:flex">
			<Link
				aria-label="TutorPal home"
				className="flex h-12 items-center gap-3 px-3"
				to={APP_ROUTES.HOME}
			>
				<span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
					<HugeiconsIcon
						className="size-5"
						icon={BookOpen01Icon}
						strokeWidth={2}
					/>
				</span>
				<span className="text-lg font-extrabold tracking-tight text-sidebar-foreground">
					TutorPal
				</span>
			</Link>

			<nav aria-label="Primary navigation" className="mt-5 flex flex-col gap-1">
				{navigationItems.map((item) => {
					const active = isNavigationItemActive(location.pathname, item.href);
					return (
						<Link
							aria-current={active ? "page" : undefined}
							className={cn(
								"flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
								active && "bg-primary/10 text-primary",
							)}
							key={item.href}
							preload="intent"
							to={item.href}
						>
							<HugeiconsIcon
								className="size-5 shrink-0"
								icon={item.icon}
								strokeWidth={2}
							/>
							<span>{t(item.labelKey)}</span>
						</Link>
					);
				})}
			</nav>

			<div className="mt-auto border-t border-sidebar-border pt-3">
				<Link
					className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
					preload="intent"
					to={APP_ROUTES.SETTINGS}
				>
					<HugeiconsIcon
						className="size-5"
						icon={Settings01Icon}
						strokeWidth={2}
					/>
					<span>Settings</span>
				</Link>
			</div>
		</aside>
	);
}
