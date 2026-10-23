import { useQuery } from "@tanstack/react-query";
import type { GetV1Students200 } from "@/api/generated/models/getV1Students200";
import { studentsQueryKeys } from "@/constants/query-keys/students-query-keys";
import { apiClient } from "@/lib/api-client";
import type { BaseQuery } from "@/types/base-query";
import type { StudentListFilters } from "@/types/student-query";

type FetchStudentsParams<T> = {
	filters?: StudentListFilters;
} & BaseQuery<T, GetV1Students200>;

export const useFetchStudents = <T = GetV1Students200>({
	filters,
	...options
}: FetchStudentsParams<T> = {}) =>
	useQuery({
		queryKey: studentsQueryKeys.list(filters),
		queryFn: async () => (await apiClient.getV1Students(filters)).data,
		...options,
	});
