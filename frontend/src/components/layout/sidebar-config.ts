import { APP_ROUTES } from "@/constants/routes";
import {
  BookOpen01Icon as BookOpenIconHugeIcon,
  Calendar03Icon as Calendar03IconIconHugeIcon,
  Home01Icon as HomeIconHugeIcon,
  Message01Icon as MessageCircleIconHugeIcon,
  BoardMathIcon as BoardMathIconHugeIcon,
  Settings01Icon as SettingsIconHugeIcon,
  UserGroupIcon as UsersIconHugeIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

export type SingleNavigationItem = {
  labelKey: string;
  href: string;
  icon: IconSvgElement;
};

export type GroupedNavigationItem = {
  labelKey: string;
  icon: IconSvgElement;
  items: SingleNavigationItem[];
};

export type NavigationItem = SingleNavigationItem | GroupedNavigationItem;

export const SIDE_BAR_CONFIG: readonly NavigationItem[] = [
  {
    labelKey: "navigation:home",
    href: APP_ROUTES.HOME,
    icon: HomeIconHugeIcon,
  },
  {
    labelKey: "navigation:classes",
    href: APP_ROUTES.CLASSES,
    icon: BoardMathIconHugeIcon,
  },
  {
    labelKey: "navigation:schedules",
    href: APP_ROUTES.SCHEDULES,
    icon: Calendar03IconIconHugeIcon,
  },
  {
    labelKey: "navigation:courses",
    href: APP_ROUTES.COURSES,
    icon: BookOpenIconHugeIcon,
  },
  {
    labelKey: "navigation:students",
    href: APP_ROUTES.STUDENTS,
    icon: UsersIconHugeIcon,
  },
  {
    labelKey: "navigation:settings",
    icon: SettingsIconHugeIcon,
    items: [
      {
        labelKey: "navigation:lineConnection",
        href: APP_ROUTES.LINE_SETTINGS,
        icon: MessageCircleIconHugeIcon,
      },
    ],
  },
] as const;

export function isNavigationItemActive(
  pathname: string,
  navigationItem: NavigationItem,
): boolean {
  if ("href" in navigationItem) {
    const { href } = navigationItem;
    return href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);
  }

  if ("items" in navigationItem) {
    return navigationItem.items.some((item) =>
      isNavigationItemActive(pathname, item),
    );
  }

  return false;
}
