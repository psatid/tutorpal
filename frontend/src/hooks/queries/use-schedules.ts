import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { schedulesKeys } from "./query-keys";
import type { GetV1SchedulesParams } from "@/api/generated/models/getV1SchedulesParams";

export const useSchedules = (params?: GetV1SchedulesParams) => {
  return useQuery({
    queryKey: schedulesKeys.list(params),
    queryFn: async () => {
      const response = await apiClient.getV1Schedules(params);
      return response.data;
    },
  });
};
