import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminUserQueryKeys } from "@/constants/admin-user-query-keys";
import { getAdminUsers } from "@/lib/admin-users-api";
import type { AdminUserListParams } from "@/types/admin-user";

export function useAdminUsers(params: AdminUserListParams) {
	return useQuery({
		queryKey: adminUserQueryKeys.list(params),
		queryFn: () => getAdminUsers(params),
		placeholderData: keepPreviousData,
	});
}
