import type { CourseListFilters } from "@/types/course-query";

export const coursesQueryKeys = {
	all: ["courses"] as const,
	lists: () => [...coursesQueryKeys.all, "list"] as const,
	list: (filters?: CourseListFilters) =>
		[...coursesQueryKeys.lists(), filters] as const,
	details: () => [...coursesQueryKeys.all, "detail"] as const,
	detail: (id: string) => [...coursesQueryKeys.details(), id] as const,
};
