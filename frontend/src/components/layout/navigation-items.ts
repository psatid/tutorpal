import {
	BookOpen01Icon,
	Calendar01Icon,
	Home01Icon,
	StudentIcon,
	UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { APP_ROUTES } from "@/constants/routes";

export const navigationItems = [
	{ labelKey: "navigation:home", href: APP_ROUTES.HOME, icon: Home01Icon },
	{
		labelKey: "navigation:students",
		href: APP_ROUTES.STUDENTS,
		icon: StudentIcon,
	},
	{
		labelKey: "navigation:courses",
		href: APP_ROUTES.COURSES,
		icon: BookOpen01Icon,
	},
	{
		labelKey: "navigation:classes",
		href: APP_ROUTES.CLASSES,
		icon: UserGroupIcon,
	},
	{
		labelKey: "navigation:schedules",
		href: APP_ROUTES.SCHEDULES,
		icon: Calendar01Icon,
	},
] as const;

export function isNavigationItemActive(pathname: string, href: string) {
	return href === "/"
		? pathname === "/"
		: pathname === href || pathname.startsWith(`${href}/`);
}
