import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { studentsKeys } from "./query-keys";

export const useGetStudent = (studentId: string | null) => {
  return useQuery({
    queryKey: studentsKeys.detail(studentId!),
    queryFn: async () => {
      const response = await apiClient.getV1StudentsById(studentId!);
      return response.data;
    },
    enabled: !!studentId,
  });
};
