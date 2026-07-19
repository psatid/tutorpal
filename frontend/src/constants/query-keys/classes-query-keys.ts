import type {
	ClassListFilters,
	InfiniteClassListFilters,
} from "@/types/class-query";

export const classesQueryKeys = {
	all: ["classes"] as const,
	lists: () => [...classesQueryKeys.all, "list"] as const,
	list: (filters?: ClassListFilters) =>
		[...classesQueryKeys.lists(), filters] as const,
	infinites: () => [...classesQueryKeys.all, "infinite"] as const,
	infinite: (filters?: InfiniteClassListFilters) =>
		[...classesQueryKeys.infinites(), filters] as const,
	details: () => [...classesQueryKeys.all, "detail"] as const,
	detail: (id: string) => [...classesQueryKeys.details(), id] as const,
};
