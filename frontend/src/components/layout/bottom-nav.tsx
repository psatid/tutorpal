import { HugeiconsIcon } from "@hugeicons/react";
import { Link, useLocation } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { isNavigationItemActive, navigationItems } from "./navigation-items";

export function BottomNav() {
	const { t } = useTranslation();
	const location = useLocation();

	return (
		<nav className="sticky bottom-0 left-0 right-0 z-50 border-t border-border bg-card lg:hidden">
			<div
				className={cn(
					"mx-auto flex w-full max-w-4xl items-center px-2 pb-5 pt-2 sm:px-4",
				)}
			>
				{navigationItems.map((item) => {
					const isActive = isNavigationItemActive(location.pathname, item.href);

					return (
						<Link
							aria-current={isActive ? "page" : undefined}
							className={cn(
								"relative flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center px-0.5 py-1.5",
								"rounded-lg transition-colors duration-150",
								isActive ? "text-primary" : "text-slate-400 hover:text-primary",
							)}
							key={item.href}
							preload="intent"
							to={item.href}
						>
							{isActive ? (
								<span
									aria-hidden="true"
									className="absolute inset-x-1 inset-y-0 rounded-lg bg-primary/10"
								/>
							) : null}
							<div className="relative z-10 flex flex-col items-center">
								<HugeiconsIcon
									className="size-5"
									icon={item.icon}
									strokeWidth={2}
								/>
								<span className="mt-1 max-w-full truncate font-label text-[10px] font-semibold leading-none sm:text-xs">
									{t(item.labelKey)}
								</span>
							</div>
						</Link>
					);
				})}
			</div>
		</nav>
	);
}
