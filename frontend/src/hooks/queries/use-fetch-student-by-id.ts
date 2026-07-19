import { useQuery } from "@tanstack/react-query";
import type { GetV1StudentsById200 } from "@/api/generated/models/getV1StudentsById200";
import { studentsQueryKeys } from "@/constants/query-keys/students-query-keys";
import { apiClient } from "@/lib/api-client";
import type { BaseQuery } from "@/types/base-query";

type FetchStudentByIdParams<T> = {
	studentId: string | null;
} & BaseQuery<T, GetV1StudentsById200>;

export const useFetchStudentById = <T = GetV1StudentsById200>({
	studentId,
	...options
}: FetchStudentByIdParams<T>) =>
	useQuery({
		queryKey: studentsQueryKeys.detail(studentId ?? ""),
		queryFn: async () => (await apiClient.getV1StudentsById(studentId!)).data,
		...options,
		enabled: studentId !== null && (options.enabled ?? true),
	});
