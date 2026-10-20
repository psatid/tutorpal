import type { ScheduleListFilters } from "@/types/schedule-query";

export const schedulesQueryKeys = {
	all: ["schedules"] as const,
	lists: () => [...schedulesQueryKeys.all, "list"] as const,
	list: (filters?: ScheduleListFilters) =>
		[...schedulesQueryKeys.lists(), filters] as const,
	infinites: () => [...schedulesQueryKeys.all, "infinite"] as const,
	awaitingConfirmation: () =>
		[...schedulesQueryKeys.infinites(), "awaiting-confirmation"] as const,
	details: () => [...schedulesQueryKeys.all, "detail"] as const,
	detail: (id: string | null) => [...schedulesQueryKeys.details(), id] as const,
} as const;
