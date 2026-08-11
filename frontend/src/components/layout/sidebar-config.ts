import { APP_ROUTES } from "@/constants/routes";
import {
  BookOpenIcon,
  CalendarCheck2Icon,
  HomeIcon,
  SchoolIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";

export const SIDE_BAR_CONFIG = [
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
    labelKey: "navigation:settings",
    href: APP_ROUTES.SETTINGS,
    icon: SettingsIcon,
  },
  {
    labelKey: "navigation:students",
    href: APP_ROUTES.STUDENTS,
    icon: UsersIcon,
  },
] as const;
