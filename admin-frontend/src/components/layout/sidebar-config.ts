import { UsersRound, type LucideIcon } from "lucide-react";

export type NavigationItem = {
	labelKey: string;
	href: string;
	icon: LucideIcon;
};

export const SIDE_BAR_CONFIG = [
	{ labelKey: "navigation:userManagement", href: "/", icon: UsersRound },
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
