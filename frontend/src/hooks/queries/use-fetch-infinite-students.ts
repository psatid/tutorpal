import { useInfiniteQuery } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import type { GetV1Students200 } from "@/api/generated/models/getV1Students200";
import { studentsQueryKeys } from "@/constants/query-keys/students-query-keys";
import { apiClient } from "@/lib/api-client";
import type { BaseInfiniteQuery } from "@/types/base-query";
import type { InfiniteStudentListFilters } from "@/types/student-query";

const STUDENTS_PAGE_SIZE = 10;

type FetchInfiniteStudentsParams<T> = {
	filters?: InfiniteStudentListFilters;
} & BaseInfiniteQuery<T, GetV1Students200>;

export const useFetchInfiniteStudents = <T = InfiniteData<GetV1Students200>>({
	filters,
	...options
}: FetchInfiniteStudentsParams<T> = {}) =>
	useInfiniteQuery({
		queryKey: studentsQueryKeys.infinite(filters),
		queryFn: async ({ pageParam }) =>
			(
				await apiClient.getV1Students({
					...filters,
					page: pageParam as number,
					limit: STUDENTS_PAGE_SIZE,
				})
			).data,
		initialPageParam: 1,
		getNextPageParam: (lastPage) =>
			lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
		...options,
	});
