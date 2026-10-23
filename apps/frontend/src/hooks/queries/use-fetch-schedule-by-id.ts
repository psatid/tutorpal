import { useQuery } from "@tanstack/react-query";
import type { GetV1SchedulesById200 } from "@/api/generated/models/getV1SchedulesById200";
import { schedulesQueryKeys } from "@/constants/query-keys/schedules-query-keys";
import { apiClient } from "@/lib/api-client";
import type { BaseQuery } from "@/types/base-query";

type FetchScheduleByIdParams<T> = {
	scheduleId: string | null;
} & BaseQuery<T, GetV1SchedulesById200>;

export function useFetchScheduleById<T = GetV1SchedulesById200>({
	scheduleId,
	...options
}: FetchScheduleByIdParams<T>) {
	return useQuery({
		queryKey: schedulesQueryKeys.detail(scheduleId),
		queryFn: async () => (await apiClient.getV1SchedulesById(scheduleId!)).data,
		...options,
		enabled: Boolean(scheduleId) && (options.enabled ?? true),
	});
}
