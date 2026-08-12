import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { APP_ROUTES } from "@/constants/routes";
import { useSession } from "@/hooks/use-session";
import { getAppLanguage, setAppLanguage } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronDown, ChevronsUpDown, GlobeIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";
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
  const { t } = useTranslation(["common", "navigation", "settings"]);
  const { session } = useSession();
  const location = useLocation();
  const currentLanguage = getAppLanguage();
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
                <DropdownMenuLabel>{t("settings:language")}</DropdownMenuLabel>
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
              <div className="jun-sidebarText text-left text-sm leading-tight flex items-center">
                <div className="flex-1">
                  <div className="truncate font-semibold">
                    {t("common:appName")}
                  </div>
                  <div className="truncate text-xs">
                    {t("common:profile.greeting", {
                      name:
                        session?.user?.name ?? t("common:profile.unknownName"),
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-auto">
            <nav
              className="jun-sidebarGroup"
              aria-label={t("navigation:primaryNavigation")}
            >
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
                      <AvatarImage
                        src="/unknow.png"
                        alt={t("common:profile.avatarAlt")}
                      />
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
  const location = useLocation();
  const active = isNavigationItemActive(location.pathname, menu);
  const [open, setOpen] = useState(active);
  const contentId = useId();

  useEffect(() => {
    setOpen(active);
  }, [active]);

  return (
    <ul className="jun-sidebarMenu">
      <li className="jun-sidebarMenuItem">
        <button
          type="button"
          className="jun-sidebarMenuButton focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          aria-expanded={open}
          aria-controls={contentId}
          onClick={() => setOpen((current) => !current)}
        >
          <menu.icon className="jun-sidebarIcon" />
          <div className="jun-sidebarText flex items-center">
            <span className="min-w-0 flex-1">{t(menu.labelKey)}</span>
          </div>
          <ChevronDown
            className={cn(
              "absolute right-2 size-4 transition-transform",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>

        <div id={contentId} className="jun-sidebarGroupText" hidden={!open}>
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
