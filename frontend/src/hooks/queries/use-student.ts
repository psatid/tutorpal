import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { studentsKeys } from "./query-keys";

export const useStudent = (id: string | null) => {
  return useQuery({
    queryKey: studentsKeys.detail(id!),
    queryFn: async () => {
      const response = await apiClient.getV1StudentsById(id!);
      return response.data;
    },
    enabled: !!id,
  });
};
