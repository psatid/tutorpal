import type { InfiniteData } from "@tanstack/react-query";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { GetV1ClassesByIdHourAdditions200 } from "@/api/generated/models/getV1ClassesByIdHourAdditions200";
import { classHourAdditionsQueryKeys } from "@/constants/query-keys/class-hour-additions-query-keys";
import { apiClient } from "@/lib/api-client";
import type { BaseInfiniteQuery } from "@/types/base-query";

const HOUR_ADDITIONS_PAGE_SIZE = 20;

type FetchInfiniteClassHourAdditionsParams<T> = {
	classId: string | null;
} & BaseInfiniteQuery<T, GetV1ClassesByIdHourAdditions200>;

export function useFetchInfiniteClassHourAdditions<
	T = InfiniteData<GetV1ClassesByIdHourAdditions200>,
>({ classId, ...options }: FetchInfiniteClassHourAdditionsParams<T>) {
	return useInfiniteQuery({
		queryKey: classHourAdditionsQueryKeys.infinite(classId ?? ""),
		queryFn: async ({ pageParam }) =>
			(
				await apiClient.getV1ClassesByIdHourAdditions(classId!, {
					page: pageParam as number,
					limit: HOUR_ADDITIONS_PAGE_SIZE,
				})
			).data,
		initialPageParam: 1,
		getNextPageParam: (lastPage) =>
			lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
		...options,
		enabled: classId !== null && (options.enabled ?? true),
	});
}
