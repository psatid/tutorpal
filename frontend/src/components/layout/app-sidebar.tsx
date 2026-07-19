import { BookOpen01Icon, Settings01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link, useLocation } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
	SidebarSeparator,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { APP_ROUTES } from "@/constants/routes";
import { isNavigationItemActive, navigationItems } from "./navigation-items";

export function AppSidebar() {
	const { t } = useTranslation(["navigation", "settings"]);
	const location = useLocation();

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<div className="flex h-12 items-center gap-2 group-data-[collapsible=icon]:justify-center">
					<Link
						aria-label="TutorPal home"
						className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden px-1 group-data-[collapsible=icon]:hidden"
						preload="intent"
						to={APP_ROUTES.HOME}
					>
						<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
							<HugeiconsIcon
								className="size-5"
								icon={BookOpen01Icon}
								strokeWidth={2}
							/>
						</span>
						<span className="truncate text-lg font-extrabold tracking-tight">
							TutorPal
						</span>
					</Link>
					<SidebarTrigger className="shrink-0" />
				</div>
			</SidebarHeader>

			<SidebarContent>
				<nav aria-label="Primary navigation">
					<SidebarGroup>
						<SidebarGroupContent>
							<SidebarMenu>
								{navigationItems.map((item) => {
									const active = isNavigationItemActive(
										location.pathname,
										item.href,
									);
									const label = t(item.labelKey);

									return (
										<SidebarMenuItem key={item.href}>
											<SidebarMenuButton
												isActive={active}
												render={
													<Link
														aria-current={active ? "page" : undefined}
														preload="intent"
														to={item.href}
													/>
												}
												tooltip={label}
												variant="navigation"
											>
												<HugeiconsIcon icon={item.icon} strokeWidth={2} />
												<span>{label}</span>
											</SidebarMenuButton>
										</SidebarMenuItem>
									);
								})}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</nav>
			</SidebarContent>

			<SidebarSeparator />
			<SidebarFooter>
				<nav aria-label="Application settings">
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton
								render={
									<Link preload="intent" to={APP_ROUTES.SETTINGS} />
								}
								tooltip={t("settings:title")}
								variant="navigation"
							>
								<HugeiconsIcon icon={Settings01Icon} strokeWidth={2} />
								<span>{t("settings:title")}</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</nav>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
