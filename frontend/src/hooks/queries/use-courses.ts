import { useQuery } from "@tanstack/react-query";
import type { GetV1CoursesParams } from "@/api/generated/models/getV1CoursesParams";
import { apiClient } from "@/lib/api-client";
import { coursesKeys } from "./query-keys";

export function useCourses(params?: GetV1CoursesParams) {
	return useQuery({
		queryKey: coursesKeys.list(params),
		queryFn: async () => (await apiClient.getV1Courses(params)).data,
	});
}
