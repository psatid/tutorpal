import type { ClassHourAdditionListFilters } from "@/types/class-hour-addition-query";

export const classHourAdditionsQueryKeys = {
	all: ["class-hour-additions"] as const,
	lists: () => [...classHourAdditionsQueryKeys.all, "list"] as const,
	listsForClass: (classId: string) =>
		[...classHourAdditionsQueryKeys.lists(), classId] as const,
	list: (classId: string, filters?: ClassHourAdditionListFilters) =>
		[...classHourAdditionsQueryKeys.listsForClass(classId), filters] as const,
	infinites: () => [...classHourAdditionsQueryKeys.all, "infinite"] as const,
	infinite: (classId: string) =>
		[...classHourAdditionsQueryKeys.infinites(), classId] as const,
} as const;
