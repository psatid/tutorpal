import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { GetV1AdminUsersParams } from "@/api/generated/models/getV1AdminUsersParams";
import { adminUserQueryKeys } from "@/constants/admin-user-query-keys";
import { apiClient } from "@/lib/api-client";
import type { AdminUserListParams } from "@/types/admin-user";

export function useAdminUsers(params: AdminUserListParams) {
	return useQuery({
		queryKey: adminUserQueryKeys.list(params),
		queryFn: async () =>
			(await apiClient.getV1AdminUsers(params satisfies GetV1AdminUsersParams))
				.data,
		placeholderData: keepPreviousData,
	});
}
