import { useQuery } from "@tanstack/react-query";
import type { GetV1Schedules200Item } from "@/api/generated/models/getV1Schedules200Item";
import type { GetV1SchedulesParams } from "@/api/generated/models/getV1SchedulesParams";
import { schedulesQueryKeys } from "@/constants/query-keys/schedules-query-keys";
import { apiClient } from "@/lib/api-client";
import type { BaseQuery } from "@/types/base-query";
import type { ScheduleListFilters } from "@/types/schedule-query";

type FetchSchedulesParams<T> = {
	filters?: ScheduleListFilters;
} & BaseQuery<T, GetV1Schedules200Item[]>;

export function useFetchSchedules<T = GetV1Schedules200Item[]>({
	filters,
	...options
}: FetchSchedulesParams<T> = {}) {
	return useQuery({
		queryKey: schedulesQueryKeys.list(filters),
		queryFn: async () =>
			(await apiClient.getV1Schedules(filters as GetV1SchedulesParams)).data,
		...options,
	});
}
