import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { schedulesKeys } from "./query-keys";

export const useGetSchedule = (scheduleId: string | null) => {
  return useQuery({
    queryKey: schedulesKeys.detail(scheduleId!),
    queryFn: async () => {
      const response = await apiClient.getV1SchedulesById(scheduleId!);
      return response.data;
    },
    enabled: !!scheduleId,
  });
};
