import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { studentsKeys } from "./query-keys";
import type { GetV1StudentsParams } from "@/api/generated/models/getV1StudentsParams";

export const useStudents = (params?: GetV1StudentsParams) => {
	return useQuery({
		queryKey: studentsKeys.list(params),
		queryFn: async () => {
			const response = await apiClient.getV1Students(params);
			return response.data;
		},
	});
};
