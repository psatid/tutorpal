import { useQuery } from "@tanstack/react-query";
import type { GetV1Classes200 } from "@/api/generated/models/getV1Classes200";
import { classesQueryKeys } from "@/constants/query-keys/classes-query-keys";
import { apiClient } from "@/lib/api-client";
import type { BaseQuery } from "@/types/base-query";
import type { ClassListFilters } from "@/types/class-query";

type FetchClassesParams<T> = {
	filters?: ClassListFilters;
} & BaseQuery<T, GetV1Classes200>;

export const useFetchClasses = <T = GetV1Classes200>({
	filters,
	...options
}: FetchClassesParams<T> = {}) =>
	useQuery({
		queryKey: classesQueryKeys.list(filters),
		queryFn: async () => (await apiClient.getV1Classes(filters)).data,
		...options,
	});
