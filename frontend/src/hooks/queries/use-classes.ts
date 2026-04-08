import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { classesKeys } from "./query-keys";

export const useClasses = () => {
  return useQuery({
    queryKey: classesKeys.lists(),
    queryFn: async () => {
      const response = await apiClient.getV1Classes();
      return response.data;
    },
  });
};
