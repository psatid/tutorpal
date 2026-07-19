import { useQuery } from "@tanstack/react-query";
import type { GetV1ClassesById200 } from "@/api/generated/models/getV1ClassesById200";
import { classesQueryKeys } from "@/constants/query-keys/classes-query-keys";
import { apiClient } from "@/lib/api-client";
import type { BaseQuery } from "@/types/base-query";

type FetchClassByIdParams<T> = {
	classId: string | null;
} & BaseQuery<T, GetV1ClassesById200>;

export const useFetchClassById = <T = GetV1ClassesById200>({
	classId,
	...options
}: FetchClassByIdParams<T>) =>
	useQuery({
		queryKey: classesQueryKeys.detail(classId ?? ""),
		queryFn: async () => (await apiClient.getV1ClassesById(classId!)).data,
		...options,
		enabled: classId !== null && (options.enabled ?? true),
	});
