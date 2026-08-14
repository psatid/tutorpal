import { useQuery } from "@tanstack/react-query";
import type { GetV1CoursesById200 } from "@/api/generated/models/getV1CoursesById200";
import { coursesQueryKeys } from "@/constants/query-keys/courses-query-keys";
import { apiClient } from "@/lib/api-client";
import type { BaseQuery } from "@/types/base-query";

type FetchCourseByIdParams<T> = {
	courseId: string | null;
} & BaseQuery<T, GetV1CoursesById200>;

export function useFetchCourseById<T = GetV1CoursesById200>({
	courseId,
	...options
}: FetchCourseByIdParams<T>) {
	return useQuery({
		queryKey: coursesQueryKeys.detail(courseId ?? ""),
		queryFn: async () => (await apiClient.getV1CoursesById(courseId!)).data,
		...options,
		enabled: courseId !== null && (options.enabled ?? true),
	});
}
