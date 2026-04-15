import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { schedulesKeys } from "./query-keys";

export const useSchedules = () => {
  return useQuery({
    queryKey: schedulesKeys.lists(),
    queryFn: async () => {
      const response = await apiClient.getV1Schedules();
      return response.data;
    },
  });
};
