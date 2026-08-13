import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/hooks/use-session";
import { getAppLanguage, setAppLanguage } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronsUpDown, GlobeIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { triggerEdgeDrawer } from "tailwindcss-jun-layout";
import {
	isNavigationItemActive,
	SIDE_BAR_CONFIG,
	type NavigationItem,
} from "./sidebar-config";
import {
	RailCollapse,
	TriggerLeftSidebarCollapse,
	TriggerMobileSidebar,
} from "./triggers";
import UserSetting from "./user-settings";

export const AppSidebar = () => {
	const { t } = useTranslation(["common", "navigation", "settings"]);
	const { session } = useSession();
	const location = useLocation();
	const currentLanguage = getAppLanguage();
	const currentNavigationItem = SIDE_BAR_CONFIG.find((item) =>
		isNavigationItemActive(location.pathname, item),
	);
	const pageTitle = currentNavigationItem
		? t(currentNavigationItem.labelKey)
		: "";

	return (
		<>
			<div className="jun-header">
				<div className="flex w-full items-center gap-4 px-4">
					<TriggerMobileSidebar />
					<TriggerLeftSidebarCollapse />
					{pageTitle && (
						<div className="min-w-0 flex-1 truncate font-headline text-base font-bold text-on-surface md:text-lg">
							{pageTitle}
						</div>
					)}
					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<Button
									aria-label={t("settings:language")}
									className="ml-auto min-w-11 shrink-0"
									size="md"
									type="button"
									variant="ghost"
								/>
							}
						>
							<GlobeIcon aria-hidden="true" />
							<span lang={currentLanguage}>
								{currentLanguage === "th" ? "ไทย" : "English"}
							</span>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							className="min-w-40"
							positionerClassName="z-[1000]"
							side="bottom"
							sideOffset={4}
						>
							<DropdownMenuGroup>
								<DropdownMenuLabel>
									{t("settings:language")}
								</DropdownMenuLabel>
								<DropdownMenuRadioGroup
									onValueChange={(language) => {
										void setAppLanguage(language as "en" | "th");
									}}
									value={currentLanguage}
								>
									<DropdownMenuRadioItem closeOnClick lang="en" value="en">
										English
									</DropdownMenuRadioItem>
									<DropdownMenuRadioItem closeOnClick lang="th" value="th">
										ไทย
									</DropdownMenuRadioItem>
								</DropdownMenuRadioGroup>
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<aside
				className="jun-edgeSidebar
					jun-edgeSidebar-drawer
					md:jun-edgeSidebar-permanent
					md:jun-edgeSidebar-w-[280px]
					md:jun-edgeSidebar-collapsed-w-[3rem]
					jun-edgeSidebar-permanent-autoCollapse-lg"
			>
				<div className="jun-edgeContent jun-sidebarContainer">
					<div className="flex flex-col p-2">
						<div
							aria-label={t("common:appName")}
							className="jun-sidebarMenuButton jun-sidebarMenuButton-spacing-2 jun-sidebarMenuButton-shrink-spacing-0"
						>
							<img
								src="/app-icon.png"
								alt=""
								className="jun-sidebarIcon size-8"
							/>
							<div className="jun-sidebarText flex items-center text-left text-sm leading-tight">
								<div className="flex-1">
									<div className="truncate font-semibold">
										{t("common:appName")}
									</div>
									<div className="truncate text-xs">
										{t("common:profile.greeting", {
											name:
												session?.user?.name ??
												t("common:profile.unknownName"),
										})}
									</div>
								</div>
							</div>
						</div>
					</div>
					<div className="min-h-0 flex-1 overflow-auto">
						<nav
							className="jun-sidebarGroup"
							aria-label={t("navigation:primaryNavigation")}
						>
							<ul className="jun-sidebarMenu">
								{SIDE_BAR_CONFIG.map((item) => (
									<NavigationLink key={item.href} navigationItem={item} />
								))}
							</ul>
						</nav>
					</div>
					<div className="p-2">
						<ul className="jun-sidebarMenu">
							<li className="jun-sidebarMenuItem">
								<UserSetting>
									<button className="jun-sidebarMenuButton jun-sidebarMenuButton-spacing-2 jun-sidebarMenuButton-shrink-spacing-0">
										<Avatar className="jun-sidebarIcon h-8 w-8">
											<AvatarFallback>
												{session?.user?.name
													?.split(" ")
													.map((name) => name[0])
													.join("")
													.toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<div className="flex flex-1 items-center text-left text-sm leading-tight jun-sidebarText">
											<div className="flex-1">
												<div className="truncate font-semibold">
													{session?.user?.name ||
														t("common:profile.unknownName")}
												</div>
												<div className="truncate text-xs">
													{session?.user?.email ||
														t("common:profile.unknownEmail")}
												</div>
											</div>
											<ChevronsUpDown className="ml-auto size-4" />
										</div>
									</button>
								</UserSetting>
							</li>
						</ul>
					</div>
				</div>
				<RailCollapse />
			</aside>
		</>
	);
};

const NavigationLink = ({
	navigationItem,
}: {
	navigationItem: NavigationItem;
}) => {
	const { t } = useTranslation("navigation");
	const location = useLocation();
	const active = isNavigationItemActive(location.pathname, navigationItem);
	const label = t(navigationItem.labelKey);

	return (
		<li className="jun-sidebarMenuItem">
			<Link
				aria-current={active ? "page" : undefined}
				aria-label={label}
				className={cn(
					"jun-sidebarMenuButton",
					active && "font-semibold text-primary hover:text-primary",
				)}
				preload="intent"
				to={navigationItem.href}
				onClick={() => triggerEdgeDrawer()}
			>
				<navigationItem.icon className="jun-sidebarIcon size-4" />
				<span className="jun-sidebarText">{label}</span>
			</Link>
		</li>
	);
};
