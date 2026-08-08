import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { APP_ROUTES } from "@/constants/routes";
import { Link, useLocation } from "@tanstack/react-router";
import {
  ChevronsUpDown,
  HomeIcon,
  CalendarCheck2Icon,
  BookOpenIcon,
  UsersIcon,
  SchoolIcon,
  SettingsIcon,
} from "lucide-react";
import {
  RailCollapse,
  TriggerLeftSidebarCollapse,
  TriggerMobileSidebar,
} from "./triggers";
import UserSetting from "./user-settings";
import { useTranslation } from "react-i18next";
import { useSession } from "@/hooks/use-session";
import { isNavigationItemActive } from "./navigation-items";
import { cn } from "@/lib/utils";
import { triggerEdgeDrawer } from "tailwindcss-jun-layout";

const navigationItems = [
  { labelKey: "navigation:home", href: APP_ROUTES.HOME, icon: HomeIcon },
  {
    labelKey: "navigation:students",
    href: APP_ROUTES.STUDENTS,
    icon: UsersIcon,
  },
  {
    labelKey: "navigation:courses",
    href: APP_ROUTES.COURSES,
    icon: BookOpenIcon,
  },
  {
    labelKey: "navigation:classes",
    href: APP_ROUTES.CLASSES,
    icon: SchoolIcon,
  },
  {
    labelKey: "navigation:schedules",
    href: APP_ROUTES.SCHEDULES,
    icon: CalendarCheck2Icon,
  },
  {
    labelKey: "navigation:settings",
    href: APP_ROUTES.SETTINGS,
    icon: SettingsIcon,
  },
] as const;

export const AppSidebar = () => {
  const { t } = useTranslation(["navigation", "settings"]);
  const { session } = useSession();
  const location = useLocation();
  const currentNavigationItem = navigationItems.find((item) =>
    isNavigationItemActive(location.pathname, item.href),
  );
  const isSettingsRoute =
    location.pathname === APP_ROUTES.SETTINGS ||
    location.pathname.startsWith(`${APP_ROUTES.SETTINGS}/`);
  const pageTitle = currentNavigationItem
    ? t(currentNavigationItem.labelKey)
    : isSettingsRoute
      ? t("settings:title")
      : "";

  return (
    <>
      <div className="jun-header">
        <div className="container flex min-w-0 items-center gap-4 px-4">
          <TriggerMobileSidebar />
          <TriggerLeftSidebarCollapse />
          {pageTitle && (
            <h1 className="min-w-0 flex-1 truncate font-headline text-base font-bold text-on-surface md:text-lg">
              {pageTitle}
            </h1>
          )}
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
            <Link
              aria-label="TutorPal"
              className="jun-sidebarMenuButton jun-sidebarMenuButton-spacing-2 jun-sidebarMenuButton-shrink-spacing-0"
              to={APP_ROUTES.HOME}
              onClick={() => triggerEdgeDrawer()}
            >
              <img
                src="/app-icon.png"
                alt=""
                className="jun-sidebarIcon size-8"
              />
              <div className="jun-sidebarText text-left text-sm leading-tight flex items-center">
                <div className="flex-1">
                  <div className="truncate font-semibold">TutorPal</div>
                  <div className="truncate text-xs">
                    Hello, {session?.user?.name}
                  </div>
                </div>
              </div>
            </Link>
          </div>
          <div className="flex-1 min-h-0 overflow-auto">
            <nav className="jun-sidebarGroup" aria-label="Primary navigation">
              <ul className="jun-sidebarMenu">
                {navigationItems.map((item) => {
                  const active = isNavigationItemActive(
                    location.pathname,
                    item.href,
                  );
                  const label = t(item.labelKey);

                  return (
                    <li className="jun-sidebarMenuItem" key={item.href}>
                      <Link
                        aria-current={active ? "page" : undefined}
                        aria-label={label}
                        className={cn(
                          "jun-sidebarMenuButton jun-sidebarMenuButton-h-11 bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-sidebar-foreground",
                          active &&
                            "jun-sidebarMenuButton jun-sidebarMenuButton-h-11 bg-sidebar-primary/10 text-primary hover:bg-primary/10 hover:text-primary dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary dark:focus-visible:ring-primary-foreground",
                        )}
                        preload="intent"
                        to={item.href}
                        onClick={() => triggerEdgeDrawer()}
                      >
                        <item.icon className="jun-sidebarIcon size-4" />
                        <span className="jun-sidebarText">{label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
          <div className="p-2">
            <ul className="jun-sidebarMenu">
              <li className="jun-sidebarMenuItem">
                <UserSetting>
                  <button className="jun-sidebarMenuButton jun-sidebarMenuButton-spacing-2 jun-sidebarMenuButton-shrink-spacing-0">
                    <Avatar className="jun-sidebarIcon h-8 w-8">
                      <AvatarImage src="/unknow.png" alt="Unknown" />
                      <AvatarFallback>
                        {session?.user?.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="jun-sidebarText flex items-center flex-1 text-left text-sm leading-tight">
                      <div className="flex-1">
                        <div className="truncate font-semibold">
                          {session?.user?.name || "Unknown"}
                        </div>
                        <div className="truncate text-xs">
                          {session?.user?.email || "unknown@test.com"}
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
