import type { InfiniteData } from "@tanstack/react-query";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { GetV1Classes200 } from "@/api/generated/models/getV1Classes200";
import { classesQueryKeys } from "@/constants/query-keys/classes-query-keys";
import { apiClient } from "@/lib/api-client";
import type { BaseInfiniteQuery } from "@/types/base-query";
import type { InfiniteClassListFilters } from "@/types/class-query";

const CLASSES_PAGE_SIZE = 10;

type FetchInfiniteClassesParams<T> = {
	filters?: InfiniteClassListFilters;
} & BaseInfiniteQuery<T, GetV1Classes200>;

export const useFetchInfiniteClasses = <T = InfiniteData<GetV1Classes200>>({
	filters,
	...options
}: FetchInfiniteClassesParams<T> = {}) =>
	useInfiniteQuery({
		queryKey: classesQueryKeys.infinite(filters),
		queryFn: async ({ pageParam }) =>
			(
				await apiClient.getV1Classes({
					...filters,
					page: pageParam as number,
					limit: CLASSES_PAGE_SIZE,
				})
			).data,
		initialPageParam: 1,
		getNextPageParam: (lastPage) =>
			lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
		...options,
	});
