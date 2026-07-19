import type { GetV1Classes200 } from "@/api/generated/models/getV1Classes200";
import { Class } from "@/models/class";
import type { ClassList, ClassListFilters } from "@/types/class-query";
import { useFetchClasses } from "./use-fetch-classes";

const selectClassList = (data: GetV1Classes200 | undefined): ClassList => ({
	classes: data?.data.map(Class.fromListItem) ?? [],
	pagination: {
		total: data?.pagination.total ?? 0,
		page: data?.pagination.page ?? 1,
		limit: data?.pagination.limit ?? 0,
		totalPages: data?.pagination.totalPages ?? 0,
		hasNext: data?.pagination.hasNext ?? false,
		hasPrev: data?.pagination.hasPrev ?? false,
	},
});

export const useClasses = (filters?: ClassListFilters) =>
	useFetchClasses({ filters, select: selectClassList });
