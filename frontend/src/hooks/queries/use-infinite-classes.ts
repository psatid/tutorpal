import type { InfiniteData } from "@tanstack/react-query";
import type { GetV1Classes200 } from "@/api/generated/models/getV1Classes200";
import { Class } from "@/models/class";
import type { ClassList, InfiniteClassListFilters } from "@/types/class-query";
import { useFetchInfiniteClasses } from "./use-fetch-infinite-classes";

type InfiniteClassList = InfiniteData<ClassList>;

const selectInfiniteClasses = (
	data: InfiniteData<GetV1Classes200> | undefined,
): InfiniteClassList => ({
	pages:
		data?.pages.map((page) => ({
			classes: page.data.map(Class.fromListItem),
			pagination: page.pagination,
		})) ?? [],
	pageParams: data?.pageParams ?? [],
});

export const useInfiniteClasses = (filters?: InfiniteClassListFilters) =>
	useFetchInfiniteClasses({ filters, select: selectInfiniteClasses });
