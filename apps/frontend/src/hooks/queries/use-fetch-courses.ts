import { useQuery } from "@tanstack/react-query";
import type { GetV1Courses200 } from "@/api/generated/models/getV1Courses200";
import { coursesQueryKeys } from "@/constants/query-keys/courses-query-keys";
import { apiClient } from "@/lib/api-client";
import type { BaseQuery } from "@/types/base-query";
import type { CourseListFilters } from "@/types/course-query";

type FetchCoursesParams<T> = {
	filters?: CourseListFilters;
} & BaseQuery<T, GetV1Courses200>;

export const useFetchCourses = <T = GetV1Courses200>({
	filters,
	...options
}: FetchCoursesParams<T> = {}) =>
	useQuery({
		queryKey: coursesQueryKeys.list(filters),
		queryFn: async () => (await apiClient.getV1Courses(filters)).data,
		...options,
	});
