import { useInfiniteQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { studentsKeys } from "./query-keys";
import type { GetV1StudentsParams } from "@/api/generated/models/getV1StudentsParams";

export const useInfiniteStudents = (params?: GetV1StudentsParams) => {
	return useInfiniteQuery({
		queryKey: studentsKeys.infinite(params),
		queryFn: async ({ pageParam = 1 }) => {
			const response = await apiClient.getV1Students({
				...params,
				page: pageParam,
				limit: 10, // Fixed page size of 10
			});
			return response.data;
		},
		initialPageParam: 1,
		getNextPageParam: (lastPage) => {
			// Use hasNext from API response to determine if more pages exist
			if (lastPage.pagination.hasNext) {
				return lastPage.pagination.page + 1;
			}
			return undefined; // No more pages
		},
	});
};
