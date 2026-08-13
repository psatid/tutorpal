import type { AdminUserListParams } from "@/types/admin-user";

export const ADMIN_USER_PAGE_SIZE = 20;

export const adminUserQueryKeys = {
	all: ["admin-users"] as const,
	lists: () => [...adminUserQueryKeys.all, "list"] as const,
	list: (params: AdminUserListParams) =>
		[...adminUserQueryKeys.lists(), params] as const,
} as const;
