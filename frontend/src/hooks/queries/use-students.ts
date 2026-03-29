import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { studentsKeys } from "./query-keys";

export const useStudents = () => {
  return useQuery({
    queryKey: studentsKeys.lists(),
    queryFn: async () => {
      const response = await apiClient.getV1Students();
      return response.data;
    },
  });
};
