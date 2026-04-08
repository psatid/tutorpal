import { useMutation, useQueryClient } from "@tanstack/react-query";
import { showToast } from "@/components/ui/toast";
import { apiClient } from "@/lib/api-client";
import { classesKeys } from "@/hooks/queries/query-keys";
import type { ClassFormData } from "@/types/class";

export const useCreateClass = (options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ClassFormData) => {
      const response = await apiClient.postV1Classes({
        name: data.name,
        totalHours: parseInt(data.totalHours, 10),
        studentIds: data.studentIds,
      });
      return response.data;
    },
    onSuccess: () => {
      showToast.success("Success", "Class created successfully.");
      queryClient.invalidateQueries({ queryKey: classesKeys.lists() });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      showToast.error(
        "Error",
        error.message || "Failed to create class. Please try again."
      );
    },
  });
};
