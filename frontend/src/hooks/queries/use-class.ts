import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { classesKeys } from "./query-keys";

export const useClass = (id: string | null) => {
  return useQuery({
    queryKey: classesKeys.detail(id!),
    queryFn: async () => {
      const response = await apiClient.getV1ClassesById(id!);
      return response.data;
    },
    enabled: !!id,
  });
};
