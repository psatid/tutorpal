import { useMutation, useQueryClient } from "@tanstack/react-query";
import { showToast } from "@/components/ui/toast";
import { apiClient } from "@/lib/api-client";
import { schedulesKeys } from "@/hooks/queries/query-keys";

export const useCreateSchedule = (options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      classId: string;
      date: string;
      time: number;
      durationMinutes: number;
      notes?: string;
      status?: "SCHEDULED" | "COMPLETED" | "CANCELLED";
    }) => {
      const response = await apiClient.postV1Schedules(data);
      return response.data;
    },
    onSuccess: () => {
      showToast.success("Success", "Schedule created successfully.");
      queryClient.invalidateQueries({ queryKey: schedulesKeys.lists() });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      showToast.error(
        "Error",
        error.message || "Failed to create schedule. Please try again."
      );
    },
  });
};

export const useUpdateSchedule = (options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<{
      classId: string;
      date: string;
      time: number;
      durationMinutes: number;
      notes?: string;
      status?: "SCHEDULED" | "COMPLETED" | "CANCELLED";
    }> }) => {
      const response = await apiClient.putV1SchedulesById(id, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      showToast.success("Success", "Schedule updated successfully.");
      queryClient.invalidateQueries({ queryKey: schedulesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: schedulesKeys.detail(variables.id) });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      showToast.error(
        "Error",
        error.message || "Failed to update schedule. Please try again."
      );
    },
  });
};

export const useDeleteSchedule = (options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.deleteV1SchedulesById(id);
    },
    onSuccess: () => {
      showToast.success("Success", "Schedule deleted successfully.");
      queryClient.invalidateQueries({ queryKey: schedulesKeys.lists() });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      showToast.error(
        "Error",
        error.message || "Failed to delete schedule. Please try again."
      );
    },
  });
};
