import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { schedulesKeys } from "./query-keys";

export const useClassSchedules = (classId: string | null) => {
  return useQuery({
    queryKey: schedulesKeys.list({ classId }),
    queryFn: async () => {
      const response = await apiClient.getV1Schedules({ classId: classId! });
      return response.data;
    },
    enabled: !!classId,
  });
};
