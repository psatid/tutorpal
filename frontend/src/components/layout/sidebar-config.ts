import { APP_ROUTES } from "@/constants/routes";
import {
  BookOpenIcon,
  CalendarCheck2Icon,
  HomeIcon,
  SchoolIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import { ReactNode } from "react";

export type SingleNavigationItem = {
  labelKey: string;
  href: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => ReactNode;
};

export type GroupedNavigationItem = {
  labelKey: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => ReactNode;
  items: SingleNavigationItem[];
};

export type NavigationItem = SingleNavigationItem | GroupedNavigationItem;

export const SIDE_BAR_CONFIG: readonly NavigationItem[] = [
  { labelKey: "navigation:home", href: APP_ROUTES.HOME, icon: HomeIcon },
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
    labelKey: "navigation:courses",
    href: APP_ROUTES.COURSES,
    icon: BookOpenIcon,
  },
  {
    labelKey: "navigation:students",
    href: APP_ROUTES.STUDENTS,
    icon: UsersIcon,
  },
  {
    labelKey: "navigation:settings",
    icon: SettingsIcon,
    items: [
      {
        labelKey: "navigation:settings",
        href: APP_ROUTES.SETTINGS,
        icon: SettingsIcon,
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
