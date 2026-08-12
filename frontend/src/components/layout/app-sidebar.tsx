import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { APP_ROUTES } from "@/constants/routes";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronsUpDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { triggerEdgeDrawer } from "tailwindcss-jun-layout";
import {
  GroupedNavigationItem,
  isNavigationItemActive,
  SIDE_BAR_CONFIG,
  SingleNavigationItem,
} from "./sidebar-config";
import {
  RailCollapse,
  TriggerLeftSidebarCollapse,
  TriggerMobileSidebar,
} from "./triggers";
import UserSetting from "./user-settings";

export const AppSidebar = () => {
  const { t } = useTranslation(["navigation", "settings"]);
  const { session } = useSession();
  const location = useLocation();
  const currentNavigationItem = SIDE_BAR_CONFIG.find((item) =>
    "href" in item
      ? isNavigationItemActive(location.pathname, item)
      : undefined,
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
            <div className="min-w-0 flex-1 truncate font-headline text-base font-bold text-on-surface md:text-lg">
              {pageTitle}
            </div>
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
                {SIDE_BAR_CONFIG.map((item) => {
                  if ("href" in item) {
                    return (
                      <NavigationLink key={item.href} navigationItem={item} />
                    );
                  }

                  if ("items" in item) {
                    return <CollapsibleMenu key={item.labelKey} menu={item} />;
                  }

                  return null;
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

const NavigationLink = ({
  navigationItem,
  variant = "default",
}: {
  navigationItem: SingleNavigationItem;
  variant?: "default" | "nested";
}) => {
  const { t } = useTranslation(["navigation", "settings"]);
  const location = useLocation();
  const active = isNavigationItemActive(location.pathname, navigationItem);
  const label = t(navigationItem.labelKey);
  return (
    <li className="jun-sidebarMenuItem" key={navigationItem.href}>
      <Link
        aria-current={active ? "page" : undefined}
        aria-label={label}
        className={cn(
          "jun-sidebarMenuButton",
          active && "text-primary hover:text-primary font-semibold",
        )}
        preload="intent"
        to={navigationItem.href}
        onClick={() => triggerEdgeDrawer()}
      >
        {variant !== "nested" && (
          <navigationItem.icon className="jun-sidebarIcon size-4" />
        )}
        <span className="jun-sidebarText">{label}</span>
      </Link>
    </li>
  );
};

const CollapsibleMenu = ({ menu }: { menu: GroupedNavigationItem }) => {
  const { t } = useTranslation(["navigation", "settings"]);

  return (
    <ul className="jun-sidebarMenu">
      <li className="jun-sidebarMenuItem">
        <label
          className="jun-sidebarMenuButton peer has-focus-visible:outline has-focus-visible:outline-blue-600"
          htmlFor="collapsible-menu-1"
        >
          <menu.icon className="jun-sidebarIcon" />
          <div className="jun-sidebarText flex items-center">
            <span className="min-w-0 flex-1">{t(menu.labelKey)}</span>
          </div>
          <ChevronUp className="size-4 has-[+_:checked]:rotate-180 absolute right-2 transition-transform" />
          <input
            type="checkbox"
            className="sr-only"
            id="collapsible-menu-1"
            defaultChecked={false}
          />
        </label>

        <div className="jun-sidebarGroupText peer-has-checked:jun-sidebarGroupText-hidden peer-has-checked:invisible peer-has-checked:opacity-0">
          <div>
            <ul className="jun-sidebarMenu jun-sidebarMenu-nested">
              {menu.items.map((item) => (
                <NavigationLink
                  key={item.href}
                  navigationItem={item}
                  variant="nested"
                />
              ))}
            </ul>
          </div>
        </div>
      </li>
    </ul>
  );
};
