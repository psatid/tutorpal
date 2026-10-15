import {
  UserGroupIcon as UsersRoundHugeIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

export type NavigationItem = {
	labelKey: string;
	href: string;
	icon: IconSvgElement;
};

export const SIDE_BAR_CONFIG = [
	{ labelKey: "navigation:userManagement", href: "/", icon: UsersRoundHugeIcon },
] as const satisfies readonly NavigationItem[];

export function isNavigationItemActive(
	pathname: string,
	navigationItem: NavigationItem,
): boolean {
	const { href } = navigationItem;
	return href === "/"
		? pathname === "/"
		: pathname === href || pathname.startsWith(href + "/");
}
