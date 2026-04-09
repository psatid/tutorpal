import { useMutation, useQueryClient } from "@tanstack/react-query";
import { showToast } from "@/components/ui/toast";
import { apiClient } from "@/lib/api-client";
import { classesKeys } from "@/hooks/queries/query-keys";
import type { ClassFormData } from "@/types/class";

export const useUpdateClass = (options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ClassFormData }) => {
      const response = await apiClient.putV1ClassesById(id, {
        name: data.name,
        totalHours: data.totalHours,
        studentIds: data.studentIds,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      showToast.success("Success", "Class updated successfully.");
      queryClient.invalidateQueries({ queryKey: classesKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: classesKeys.detail(variables.id),
      });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      showToast.error(
        "Error",
        error.message || "Failed to update class. Please try again."
      );
    },
  });
};
