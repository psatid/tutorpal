import type { InfiniteData } from "@tanstack/react-query";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { GetV1SchedulesAwaitingConfirmation200 } from "@/api/generated/models/getV1SchedulesAwaitingConfirmation200";
import { schedulesQueryKeys } from "@/constants/query-keys/schedules-query-keys";
import { apiClient } from "@/lib/api-client";
import type { BaseInfiniteQuery } from "@/types/base-query";

const AWAITING_CONFIRMATION_PAGE_SIZE = 10;

type FetchInfiniteAwaitingConfirmationSchedulesParams<T> = BaseInfiniteQuery<
	T,
	GetV1SchedulesAwaitingConfirmation200
>;

export function useFetchInfiniteAwaitingConfirmationSchedules<
	T = InfiniteData<GetV1SchedulesAwaitingConfirmation200>,
>(
	options: FetchInfiniteAwaitingConfirmationSchedulesParams<T> = {},
) {
	return useInfiniteQuery({
		queryKey: schedulesQueryKeys.awaitingConfirmation(),
		queryFn: async ({ pageParam }) =>
			(
				await apiClient.getV1SchedulesAwaitingConfirmation({
					limit: AWAITING_CONFIRMATION_PAGE_SIZE,
					cursor: (pageParam as string | null) ?? undefined,
				})
			).data,
		initialPageParam: null as string | null,
		getNextPageParam: (lastPage) =>
			lastPage.pagination.hasNext
				? (lastPage.pagination.nextCursor ?? undefined)
				: undefined,
		...options,
	});
}
