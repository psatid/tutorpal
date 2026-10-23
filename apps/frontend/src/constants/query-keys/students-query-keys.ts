import type {
	InfiniteStudentListFilters,
	StudentListFilters,
} from "@/types/student-query";

export const studentsQueryKeys = {
	all: ["students"] as const,
	lists: () => [...studentsQueryKeys.all, "list"] as const,
	list: (filters?: StudentListFilters) =>
		[...studentsQueryKeys.lists(), filters] as const,
	infinites: () => [...studentsQueryKeys.all, "infinite"] as const,
	infinite: (filters?: InfiniteStudentListFilters) =>
		[...studentsQueryKeys.infinites(), filters] as const,
	details: () => [...studentsQueryKeys.all, "detail"] as const,
	detail: (id: string) => [...studentsQueryKeys.details(), id] as const,
};
